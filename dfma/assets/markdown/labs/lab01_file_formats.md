# Lab 01: File Formats and Header Analysis

## Objective

Identify file types from raw bytes, parse ELF and PE headers manually, and extract structural metadata that feeds static analysis. All tasks run on Ubuntu without a VM.

## Prerequisites

- Module 01 (Foundations) completed
- Ubuntu 22.04 or 24.04 LTS
- `binutils`, `file`, `xxd` installed (default on Ubuntu)
- Toy samples compiled (see setup below)

## Time Required

60–90 minutes

## Tools Used

`file`, `xxd`, `readelf`, `objdump`, `rabin2`, `python3`

---

## Setup

```bash
sudo apt install -y binutils radare2 xxd

mkdir -p ~/labs/lab01
cd ~/labs/lab01

SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

# Compile all toy samples
gcc -o toy_app         ${SAMPLES}/toy_app.c
gcc -o toy_network     ${SAMPLES}/toy_app_network.c
gcc -o toy_persistence ${SAMPLES}/toy_app_persistence.c
gcc -o toy_enum        ${SAMPLES}/toy_app_enumeration.c

# Create test files with misleading extensions
cp toy_app         disguised_document.pdf
cp toy_network     image_viewer.jpg
echo "#!/bin/bash\necho hello" > real_script.sh
echo "This is plain text" > plaintext.exe
cp /bin/ls         system_tool.dll

echo "[+] Lab setup complete"
ls -lh
```

---

## Part 1: The `file` Command — Never Trust Extensions

Extensions are a hint, not a fact. The `file` command reads the first bytes of each file and compares them against a database of known magic numbers.

```bash
cd ~/labs/lab01

echo "=== Extension says PDF, but file says... ==="
file disguised_document.pdf

echo ""
echo "=== Extension says JPG, but file says... ==="
file image_viewer.jpg

echo ""
echo "=== Extension says EXE, but file says... ==="
file plaintext.exe

echo ""
echo "=== Extension says DLL, but file says... ==="
file system_tool.dll

echo ""
echo "=== All files at once ==="
file *
```

**Expected:** Every copy of a toy sample reports as ELF regardless of extension. `plaintext.exe` reports as ASCII text. `system_tool.dll` reports as ELF (it is a copy of `/bin/ls`).

**Task 1.1:** Create a file called `not_malware.txt` that `file` identifies as an ELF executable. How? Document your method.

**Task 1.2:** Create a file with no extension that `file` correctly identifies as a shell script.

---

## Part 2: Magic Bytes — Reading the File Header

Every file format starts with a recognisable byte sequence. Learn the most common ones.

```bash
cd ~/labs/lab01

echo "=== ELF magic bytes (first 4) ==="
xxd -l 4 toy_app
# Expected: 7f 45 4c 46  = 0x7F + "ELF"

echo ""
echo "=== What do the next bytes mean? ==="
xxd -l 16 toy_app
```

The ELF header byte-by-byte:

```
Offset  Bytes          Meaning
0x00    7f 45 4c 46    Magic: 0x7F + "ELF"
0x04    02             Class: 02 = 64-bit (01 = 32-bit)
0x05    01             Data: 01 = little-endian (02 = big-endian)
0x06    01             ELF version: 1
0x07    00             OS/ABI: 0 = System V (Linux)
0x08-F  00 00 ...      Padding (8 bytes)
```

```bash
# Read class byte directly
python3 -c "
data = open('toy_app', 'rb').read(16)
print('Magic:       ', ' '.join(f'{b:02x}' for b in data[:4]))
print('Class:       ', '64-bit' if data[4] == 2 else '32-bit')
print('Endianness:  ', 'Little' if data[5] == 1 else 'Big')
print('ELF version: ', data[6])
print('OS/ABI:      ', hex(data[7]))
"
```

**Task 2.1:** Check the class and endianness of each toy sample. Are they all the same?

**Task 2.2:** The PE format (Windows executables) starts with `4D 5A` ("MZ"). Use `xxd` to check the first two bytes of `/mnt/user-data/uploads/` (if you have any Windows files) or explain what you would expect to see.

**Task 2.3:** Create a Python script that reads any file and prints whether it is ELF, PE, ZIP, PDF, or unknown based on magic bytes alone:

```python
#!/usr/bin/env python3
# magic_id.py — identify file type from magic bytes

SIGNATURES = {
    b'\x7fELF':          'ELF Executable (Linux)',
    b'MZ':               'PE Executable (Windows)',
    b'PK\x03\x04':       'ZIP Archive (or Office doc)',
    b'PK\x05\x06':       'ZIP Archive (empty)',
    b'\x25PDF':          'PDF Document',
    b'\x89PNG\r\n':      'PNG Image',
    b'\xff\xd8\xff':     'JPEG Image',
    b'#!':               'Script (shebang)',
    b'\x1f\x8b':         'Gzip Compressed',
    b'BZh':              'Bzip2 Compressed',
    b'\xfd7zXZ':         'XZ Compressed',
    b'MSCF':             'Microsoft Cabinet (.cab)',
}

import sys

def identify(path):
    with open(path, 'rb') as f:
        header = f.read(16)
    for sig, label in SIGNATURES.items():
        if header[:len(sig)] == sig:
            return label
    return f'Unknown (first bytes: {header[:8].hex()})'

if __name__ == '__main__':
    for path in sys.argv[1:]:
        print(f'{path}: {identify(path)}')
```

```bash
# Save and test
python3 magic_id.py toy_app toy_network disguised_document.pdf \
        image_viewer.jpg plaintext.exe /bin/ls
```

---

## Part 3: ELF Structure Deep Dive

The ELF header is 64 bytes on a 64-bit system. `readelf` parses it for you.

```bash
cd ~/labs/lab01

# Full ELF header
readelf -h toy_app

# Section headers (the segments the linker created)
readelf -S toy_app

# Program headers (how the OS loads it into memory)
readelf -l toy_app

# Dynamic section (shared libraries and runtime info)
readelf -d toy_app

# Symbol table
readelf -s toy_app | head -30
```

**Key sections to know:**

| Section | Contains |
|---|---|
| `.text` | Executable code |
| `.data` | Initialised global variables |
| `.rodata` | Read-only data (string literals live here) |
| `.bss` | Uninitialised globals (zeroed at load) |
| `.plt` | Procedure Linkage Table (for shared library calls) |
| `.got` | Global Offset Table (resolved at runtime) |
| `.dynamic` | Dynamic linking info |
| `.symtab` | Symbol table (stripped in release builds) |
| `.debug_*` | Debug info (stripped in release builds) |

```bash
# Check if the binary is stripped
readelf -s toy_app | grep -c "FUNC"
# High number = has symbols (easier to reverse engineer)
# Zero or near-zero = stripped (harder)

# View only the .rodata section (where strings live)
readelf -p .rodata toy_app

# View .text section as hex
readelf -x .text toy_app | head -20
```

**Task 3.1:** What is the entry point address of `toy_app`? (Look in the ELF header output.)

**Task 3.2:** How many sections does `toy_app` have? Which section is the largest by size?

**Task 3.3:** Is `toy_app` statically or dynamically linked? How can you tell from `readelf -l` output?

**Task 3.4:** `toy_enum` performs sandbox detection. Confirm that the keyword strings (`wireshark`, `ghidra`, etc.) appear in the `.rodata` section:
```bash
readelf -p .rodata toy_enum | grep -iE '(wireshark|ghidra|volatility)'
```

---

## Part 4: rabin2 — Faster Binary Analysis

`rabin2` is the radare2 binary analysis tool. It covers the same ground as `readelf` but with a more consistent output format and better cross-platform support.

```bash
cd ~/labs/lab01

# Binary info summary
rabin2 -I toy_network

# Imports (shared library functions called)
rabin2 -i toy_network

# Exports (functions this binary provides)
rabin2 -E toy_network

# Strings (all printable sequences)
rabin2 -z toy_network | head -20

# Sections with entropy
rabin2 -S toy_network

# Libraries required
rabin2 -l toy_network
```

**Suspicious import patterns to recognise:**

```bash
# Check toy_enum imports — should show enumeration-related functions
rabin2 -i toy_enum | grep -E '(opendir|readdir|getenv|strcmp|fopen)'

# Check toy_network imports — should show socket functions
rabin2 -i toy_network | grep -E '(socket|connect|send|recv|gethostname)'

# Check toy_persistence imports — should show file I/O and string ops
rabin2 -i toy_persistence | grep -E '(fopen|fwrite|strncpy|strncat)'
```

**Task 4.1:** Run `rabin2 -I` on all four toy samples. What differs in the `bintype`, `class`, and `lang` fields?

**Task 4.2:** Which toy sample has the most imports? Which has the fewest?

**Task 4.3:** `rabin2 -S toy_network` shows per-section entropy. What is the entropy of the `.text` section? Is this consistent with unencrypted code?

---

## Part 5: Entropy Analysis

Entropy measures randomness. Legitimate code has entropy around 5–6. Encrypted or compressed data scores 7.5–8.0. Packed malware is detectable by entropy alone.

```bash
# Entropy of the whole binary
python3 -c "
import math, sys

def entropy(data):
    freq = [0] * 256
    for b in data:
        freq[b] += 1
    n = len(data)
    return -sum((f/n) * math.log2(f/n) for f in freq if f > 0)

path = sys.argv[1]
data = open(path, 'rb').read()
e = entropy(data)
print(f'{path}: {e:.4f} bits/byte', end=' — ')
if e < 4.0:   print('Very low (text/sparse data)')
elif e < 6.0: print('Normal (code/data)')
elif e < 7.5: print('Elevated (compressed or mixed)')
else:         print('HIGH — likely encrypted or packed')
" "$1"

# Run on all toy samples
for f in toy_app toy_network toy_persistence toy_enum; do
    python3 -c "
import math
data = open('$f','rb').read()
freq = [0]*256
for b in data: freq[b]+=1
n = len(data)
e = -sum((f/n)*math.log2(f/n) for f in freq if f>0)
print(f'$f: {e:.4f}')
"
done

# Compare against a deliberately high-entropy file (random data)
python3 -c "import os; open('random_data.bin','wb').write(os.urandom(20000))"
python3 -c "
import math
data = open('random_data.bin','rb').read()
freq = [0]*256
for b in data: freq[b]+=1
n = len(data)
e = -sum((f/n)*math.log2(f/n) for f in freq if f>0)
print(f'random_data.bin: {e:.4f} (theoretical max ~8.0)')
"
```

**Task 5.1:** Pack `toy_app` with UPX and compare entropy before and after:
```bash
sudo apt install -y upx-ucl

cp toy_app toy_app_packed
upx toy_app_packed

python3 -c "
import math
for path in ['toy_app', 'toy_app_packed']:
    data = open(path,'rb').read()
    freq=[0]*256
    for b in data: freq[b]+=1
    n=len(data)
    e=-sum((f/n)*math.log2(f/n) for f in freq if f>0)
    print(f'{path}: {e:.4f}')
"
```

What changed? What happened to the binary size?

**Task 5.2:** Unpack it and verify it still runs:
```bash
upx -d toy_app_packed -o toy_app_unpacked
./toy_app_unpacked
```

---

## Part 6: Cross-Reference Exercise

Tie together everything from this lab. Given an unknown binary, produce a complete file format summary in under 5 minutes.

```bash
# mystery binary — it is one of the toy samples renamed
cp toy_enum mystery_binary.dat

echo "=== 5-minute triage template ==="
echo ""

echo "1. File type:"
file mystery_binary.dat

echo ""
echo "2. Magic bytes:"
xxd -l 4 mystery_binary.dat

echo ""
echo "3. Architecture:"
readelf -h mystery_binary.dat | grep -E '(Class|Data|Machine|Entry)'

echo ""
echo "4. Sections:"
readelf -S mystery_binary.dat | grep -E '\.(text|data|rodata|bss)' | awk '{print $2, $6}'

echo ""
echo "5. Imports (top 10):"
rabin2 -i mystery_binary.dat | head -10

echo ""
echo "6. Suspicious strings:"
strings -n 8 mystery_binary.dat \
    | grep -iE '(socket|connect|cron|passwd|beacon|wireshark|ghidra|/tmp)' \
    | sort -u

echo ""
echo "7. Entropy:"
python3 -c "
import math
data = open('mystery_binary.dat','rb').read()
freq=[0]*256
for b in data: freq[b]+=1
n=len(data)
e=-sum((f/n)*math.log2(f/n) for f in freq if f>0)
print(f'{e:.4f} bits/byte')
"
```

**Task 6.1:** Without running the binary, identify which toy sample `mystery_binary.dat` is based on the triage output alone. Justify your answer in 2–3 sentences.

**Task 6.2:** Repeat the exercise with a different renamed toy sample. This time, document the finding as a row in the triage table format from Module 02.

---

## Completion Checklist

- [ ] Explained why file extensions cannot be trusted and demonstrated with `file`
- [ ] Read and interpreted the first 16 bytes of an ELF header manually
- [ ] Written `magic_id.py` and successfully identified all test files
- [ ] Listed all ELF sections for `toy_app` and identified the largest
- [ ] Used `rabin2 -i` to extract imports for all four toy samples
- [ ] Calculated and compared entropy across all toy samples and the UPX-packed version
- [ ] Identified a mystery binary from triage output alone without running it

---

## Key Takeaways

File format analysis is the mandatory first step before any other analysis. It tells you: is this worth my time, what platform does it target, is it packed, and what might it do. A binary with no suspicious imports and low entropy is very different from one with socket functions and entropy above 7. That five-minute triage shapes everything that follows.

**Next:** [Lab 02 — Static Analysis](lab02_static_analysis.md)
