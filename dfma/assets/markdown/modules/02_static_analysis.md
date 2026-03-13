# Module 02: Static Analysis

## Learning Objectives

By the end of this module, you will:
- Extract and interpret strings from binaries without executing them
- Identify packed or obfuscated executables using entropy analysis
- Analyse PE and ELF imports to infer malware capability
- Use `Detect-It-Easy`, `rabin2`, `pefile`, and `binwalk` on Ubuntu
- Recognise common packer signatures and know when to unpack before analysis
- Write a basic static analysis report from raw binary evidence

---

## 1. Why Static Analysis First

Static analysis means examining a file without running it. It is always the first step because:

- **It is safe.** The file never executes, so nothing bad can happen.
- **It is fast.** A trained analyst can triage a suspicious file in under five minutes using only `file`, `strings`, and hash lookups.
- **It sets expectations.** Knowing what a binary imports before you run it in a sandbox tells you what to watch for and helps you spot evasion attempts.

The weakness is that static analysis alone cannot tell you what a packed or encrypted binary actually does. That requires dynamic analysis (Module 03) and, for heavily obfuscated samples, reverse engineering (Module 06). Static analysis narrows the problem space before you get there.

---

## 2. The Static Analysis Workflow

```
Suspicious File
      │
      ▼
┌─────────────────────────────┐
│  Step 1: Triage             │
│  file, xxd, sha256sum       │
│  → What is it? Is it known? │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Step 2: Strings            │
│  strings, floss             │
│  → URLs, IPs, keys, paths   │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Step 3: Header Analysis    │
│  rabin2, pefile, readelf    │
│  → Imports, sections,       │
│    compile time, resources  │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Step 4: Entropy Check      │
│  Die, binwalk, python       │
│  → Packed? Encrypted?       │
│    Which packer?            │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Step 5: Write Report       │
│  → Hash, type, capabilities,│
│    IOCs, verdict            │
└─────────────────────────────┘
```

---

## 3. Tool Installation on Ubuntu

Install everything you need for this module in one shot:

```bash
sudo apt update
sudo apt install -y \
    binutils \
    binwalk \
    radare2 \
    xxd \
    file \
    upx-ucl \
    strace \
    python3-pip

pip3 install pefile --break-system-packages

# Detect-It-Easy (DIE) - the best packer identifier
# Download the Linux build from the official repo
wget https://github.com/horsicq/DIE-engine/releases/latest/download/die_lin64_portable.tar.gz
tar -xf die_lin64_portable.tar.gz
sudo mv die_lin64_portable /opt/die
sudo ln -s /opt/die/diec /usr/local/bin/diec
```

Verify everything works:

```bash
file --version
strings --version
rabin2 -v
python3 -c "import pefile; print('pefile ok')"
diec --version 2>/dev/null || echo "die installed at /opt/die/"
```

---

## 4. Step 1 — Triage

Triage answers three questions in under a minute: what is the file type, is it already a known threat, and is it worth deeper analysis.

### File Type Identification

```bash
# Always start here - extensions lie
file samples/benign_toy_app/toy_app_linux
# toy_app_linux: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV),
#                dynamically linked, not stripped

file samples/eicar.txt
# samples/eicar.txt: EICAR virus test files

# Check hex header manually to confirm
xxd -l 16 samples/benign_toy_app/toy_app_linux
# 00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
#            ^^^^ ELF magic bytes confirmed
```

### Hash and Threat Intel Lookup

```bash
# Calculate SHA-256 (the standard for threat intel databases)
sha256sum samples/benign_toy_app/toy_app_linux

# Calculate MD5 alongside (still used in many platforms)
md5sum samples/benign_toy_app/toy_app_linux

# Do both at once
rhash --sha256 --md5 samples/benign_toy_app/toy_app_linux

# Cross-reference hashes at:
#   https://www.virustotal.com      (paste hash into search)
#   https://bazaar.abuse.ch         (malware bazaar)
#   https://otx.alienvault.com      (threat intel feeds)
#
# If the hash hits with 40+ AV detections: known malware, stop here,
# write IOC and escalate.
# If no hits: novel sample or benign - continue analysis.
```

### File Size as a Signal

```bash
ls -lh samples/benign_toy_app/toy_app_linux

# Red flags in real malware:
# Very small (< 5KB): likely a dropper or loader, not the full payload
# Very large (> 50MB): may contain embedded resources or be padded to evade AV
# Padded to exact round number (e.g. exactly 1,000,000 bytes): anti-AV trick
```

---

## 5. Step 2 — Strings Extraction

`strings` extracts printable ASCII and Unicode sequences from any binary. For analysts, it is the fastest way to surface IOCs, hardcoded config, and error messages that reveal capability.

### Basic Usage

```bash
# Default: minimum 4 characters, ASCII only
strings samples/benign_toy_app/toy_app_linux

# Minimum 8 chars (reduces noise)
strings -n 8 samples/benign_toy_app/toy_app_linux

# Include Unicode (UTF-16LE - common in Windows malware)
strings -el samples/benign_toy_app/toy_app_linux

# Show file offset of each string (useful for cross-referencing with xxd)
strings -t x samples/benign_toy_app/toy_app_linux
```

### Hunting for IOCs in strings Output

In real analysis you pipe through grep to hunt specific patterns:

```bash
TARGET="samples/benign_toy_app/toy_app_linux"

# Network IOCs
strings "$TARGET" | grep -iE '([0-9]{1,3}\.){3}[0-9]{1,3}'  # IP addresses
strings "$TARGET" | grep -iE 'https?://'                      # URLs
strings "$TARGET" | grep -iE '[a-z0-9.-]+\.(com|net|org|io|ru|cn)'  # domains

# File system artefacts
strings "$TARGET" | grep -iE '(/tmp|/var|/etc|AppData|Temp)' # drop paths
strings "$TARGET" | grep -iE '\.(exe|dll|bat|ps1|sh|py)$'   # executable refs

# Crypto and credential patterns
strings "$TARGET" | grep -iE '(password|passwd|secret|key|token|apikey)'
strings "$TARGET" | grep -iE '[A-Za-z0-9+/]{40,}={0,2}'     # base64 blobs

# Registry (Windows cross-compile)
strings "$TARGET" | grep -iE 'HKEY_(LOCAL_MACHINE|CURRENT_USER)'
strings "$TARGET" | grep -iE 'SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run'

# C2 indicators from our toy samples
strings "$TARGET" | grep -iE '(beacon|c2|command|checkin)'
```

### Try It on the Toy Samples

```bash
# toy_app_network.c compiled - should surface 127.0.0.1 and port 4444
strings samples/benign_toy_app/toy_network_linux | grep -E '(127\.|4444|BEACON)'

# toy_app_persistence.c compiled - split string obfuscation demo
strings samples/benign_toy_app/toy_persistence_linux | grep -iE '(software|run|cron)'

# toy_app_enumeration.c compiled - should expose the sandbox keyword list
strings samples/benign_toy_app/toy_enum_linux | grep -iE '(wireshark|ghidra|procmon)'
```

### When strings Comes Up Empty

If `strings` returns almost nothing meaningful, the file is likely:

- **Packed** (compressed) — entropy will be high, sections will look wrong
- **Encrypted** — same entropy signature
- **Heavily obfuscated** — strings exist but are decoded at runtime

In all three cases you need to unpack or emulate before static analysis can go further. Section 7 covers packing detection.

---

## 6. Step 3 — Header and Import Analysis

### rabin2 — Swiss Army Knife for Binary Headers (Ubuntu)

`rabin2` is part of radare2 and handles both ELF and PE files on Linux.

```bash
TARGET="samples/benign_toy_app/toy_app_linux"

# Overview: architecture, OS, entry point, compiler
rabin2 -I "$TARGET"

# Sections with entropy
rabin2 -S "$TARGET"

# Imported libraries and functions
rabin2 -i "$TARGET"

# Exported symbols
rabin2 -E "$TARGET"

# Strings (rabin2's own extraction, often more complete than strings)
rabin2 -z "$TARGET"

# All at once (verbose)
rabin2 -A "$TARGET"
```

Key output to look for in `rabin2 -i`:

```
[Imports]
nth vaddr      bind   type   lib        name
─────────────────────────────────────────────
  1  0x00401060 GLOBAL FUNC   libc.so.6  fopen       ← file operations
  2  0x00401070 GLOBAL FUNC   libc.so.6  fclose
  3  0x00401080 GLOBAL FUNC   libc.so.6  socket      ← network capability
  4  0x00401090 GLOBAL FUNC   libc.so.6  connect
  5  0x004010a0 GLOBAL FUNC   libc.so.6  send
  6  0x004010b0 GLOBAL FUNC   libc.so.6  recv
```

Seeing `socket`, `connect`, `send`, `recv` imported tells you this binary does network I/O before you run a single packet capture. That shapes your entire dynamic analysis setup.

### Suspicious Import Combinations

| Imports Seen | Likely Capability |
|---|---|
| `socket` + `connect` + `send` | C2 communication |
| `fopen` + `fwrite` + `/tmp` string | File dropper |
| `fork` + `execve` | Process spawning / persistence |
| `ptrace` | Anti-debugging OR debugger itself |
| `mmap` + `mprotect` | Shellcode injection |
| `opendir` + `readdir` + `stat` | File system enumeration |
| `getpwent` or `/etc/passwd` string | User enumeration |
| `RegSetValueEx` (PE) | Registry persistence |
| `VirtualAlloc` + `WriteProcessMemory` (PE) | Code injection |
| `CryptEncrypt` (PE) | Encryption / ransomware |

### Analysing PE Files on Ubuntu

Ubuntu can analyse Windows `.exe` files without running them. Cross-compile a toy sample first:

```bash
# Install MinGW cross-compiler
sudo apt install mingw-w64

# Compile toy_app.c as a 64-bit Windows PE
x86_64-w64-mingw32-gcc \
    -o samples/benign_toy_app/toy_app_win64.exe \
    samples/benign_toy_app/toy_app.c

# Now analyse the PE header on Linux
rabin2 -I samples/benign_toy_app/toy_app_win64.exe

# Check imports - should show kernel32.dll, msvcrt.dll
rabin2 -i samples/benign_toy_app/toy_app_win64.exe

# Check sections
rabin2 -S samples/benign_toy_app/toy_app_win64.exe
```

### Python pefile — Deeper PE Inspection

For Windows samples, `pefile` gives more control than `rabin2`:

```python
#!/usr/bin/env python3
# save as: scripts/analyse_pe.py

import pefile
import sys
import hashlib

def analyse_pe(filepath):
    try:
        pe = pefile.PE(filepath)
    except pefile.PEFormatError as e:
        print(f"[!] Not a valid PE file: {e}")
        return

    # Hashes
    with open(filepath, 'rb') as f:
        data = f.read()
    print(f"[*] MD5:    {hashlib.md5(data).hexdigest()}")
    print(f"[*] SHA256: {hashlib.sha256(data).hexdigest()}")

    # Basic metadata
    print(f"\n[*] Machine:      {hex(pe.FILE_HEADER.Machine)}")
    print(f"[*] Timestamp:    {pe.FILE_HEADER.TimeDateStamp} "
          f"({pefile.retrieve_flags(pe.FILE_HEADER.Characteristics, 'IMAGE_FILE_')})")
    print(f"[*] Entry Point:  {hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)}")
    print(f"[*] Image Base:   {hex(pe.OPTIONAL_HEADER.ImageBase)}")
    print(f"[*] Subsystem:    {pe.OPTIONAL_HEADER.Subsystem} "
          f"({'GUI' if pe.OPTIONAL_HEADER.Subsystem == 2 else 'Console/Other'})")

    # Sections with entropy
    print(f"\n[*] Sections ({len(pe.sections)}):")
    for s in pe.sections:
        name    = s.Name.decode(errors='replace').rstrip('\x00')
        entropy = s.get_entropy()
        flag    = ""
        if entropy > 7.0:
            flag = "  <<< HIGH ENTROPY - likely packed/encrypted"
        elif entropy > 6.0:
            flag = "  <<< ELEVATED ENTROPY"
        print(f"    {name:<12} vsize={s.Misc_VirtualSize:<8} "
              f"rawsize={s.SizeOfRawData:<8} entropy={entropy:.2f}{flag}")

    # Imports
    if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
        print(f"\n[*] Imports ({len(pe.DIRECTORY_ENTRY_IMPORT)} DLLs):")
        suspicious = {
            'VirtualAlloc', 'VirtualAllocEx', 'WriteProcessMemory',
            'CreateRemoteThread', 'CreateRemoteThreadEx',
            'NtUnmapViewOfSection', 'SetWindowsHookEx',
            'RegSetValueEx', 'RegCreateKeyEx',
            'InternetOpen', 'InternetOpenUrl', 'WinHttpOpen',
            'CryptEncrypt', 'CryptDecrypt',
            'IsDebuggerPresent', 'CheckRemoteDebuggerPresent',
        }
        for entry in pe.DIRECTORY_ENTRY_IMPORT:
            dll = entry.dll.decode(errors='replace')
            print(f"\n    {dll}")
            for imp in entry.imports:
                if imp.name:
                    fname = imp.name.decode(errors='replace')
                    flag  = "  <<< SUSPICIOUS" if fname in suspicious else ""
                    print(f"      {fname}{flag}")

    # Resources
    if hasattr(pe, 'DIRECTORY_ENTRY_RESOURCE'):
        print(f"\n[*] Resources:")
        for res_type in pe.DIRECTORY_ENTRY_RESOURCE.entries:
            print(f"    Type: {res_type.id}")

    pe.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python3 {sys.argv[0]} <file.exe>")
        sys.exit(1)
    analyse_pe(sys.argv[1])
```

Run it:

```bash
python3 scripts/analyse_pe.py samples/benign_toy_app/toy_app_win64.exe
```

---

## 7. Step 4 — Entropy Analysis and Packer Detection

### What Entropy Tells You

Shannon entropy measures randomness in data on a 0–8 scale:

| Entropy Range | Meaning |
|---|---|
| 0.0 – 1.0 | Near-empty or highly repetitive data |
| 3.5 – 5.5 | Normal compiled code (.text section) |
| 5.5 – 6.5 | Compressed data, resources |
| 6.5 – 7.2 | Likely packed/compressed |
| 7.2 – 8.0 | Encrypted or high-quality RNG output |

A legitimate `.text` section rarely exceeds 6.5. When you see 7.8 entropy in `.text`, the real code is hidden inside a packed layer.

### Measuring Entropy on Ubuntu

```bash
# Using rabin2 (shows per-section entropy)
rabin2 -S samples/benign_toy_app/toy_app_linux

# Using Python for whole-file entropy
python3 -c "
import math, sys
data = open(sys.argv[1], 'rb').read()
freq = [0] * 256
for b in data: freq[b] += 1
n = len(data)
entropy = -sum((f/n) * math.log2(f/n) for f in freq if f > 0)
print(f'File entropy: {entropy:.4f}')
" samples/benign_toy_app/toy_app_linux

# Using binwalk (scans entire file, shows embedded files too)
binwalk samples/benign_toy_app/toy_app_linux
```

### Packer Detection with Detect-It-Easy (DIE)

DIE is the best open-source packer identifier. It recognises UPX, MPRESS, Themida, NSPack, PECompact and 600+ others:

```bash
# Scan a binary
diec samples/benign_toy_app/toy_app_win64.exe

# Verbose output
diec -v samples/benign_toy_app/toy_app_win64.exe

# Scan a directory
diec -r samples/benign_toy_app/
```

Create a UPX-packed version of a toy sample to see the difference:

```bash
# Pack the Linux binary with UPX
cp samples/benign_toy_app/toy_app_linux /tmp/toy_packed
upx /tmp/toy_packed

# Compare entropy before/after
python3 -c "
import math
def entropy(path):
    data = open(path, 'rb').read()
    freq = [0]*256
    for b in data: freq[b] += 1
    n = len(data)
    return -sum((f/n)*math.log2(f/n) for f in freq if f > 0)

print(f'Original:  {entropy(\"samples/benign_toy_app/toy_app_linux\"):.4f}')
print(f'UPX packed: {entropy(\"/tmp/toy_packed\"):.4f}')
"

# DIE should now detect UPX
diec /tmp/toy_packed

# strings on packed binary - notice how little is readable
strings /tmp/toy_packed | grep -v UPX | head -20
```

### Unpacking UPX

UPX is trivially reversible:

```bash
upx -d /tmp/toy_packed -o /tmp/toy_unpacked
strings /tmp/toy_unpacked | head -30   # strings are back
```

Most real packers are not this easy. Themida, VMProtect, and custom packers require dynamic unpacking - running the sample until it unpacks itself in memory, then dumping the process. That is covered in Module 06.

---

## 8. Putting It Together — The Toy Samples

Work through all four toy samples using the full workflow:

```bash
cd samples/benign_toy_app

# Build all Linux binaries
gcc -o toy_app_linux         toy_app.c
gcc -o toy_persistence_linux toy_app_persistence.c
gcc -o toy_network_linux     toy_app_network.c
gcc -o toy_enum_linux        toy_app_enumeration.c

# Build Windows PE versions (if MinGW installed)
x86_64-w64-mingw32-gcc -o toy_app_win64.exe         toy_app.c
x86_64-w64-mingw32-gcc -o toy_persistence_win64.exe toy_app_persistence.c
x86_64-w64-mingw32-gcc -o toy_network_win64.exe     toy_app_network.c -lws2_32
x86_64-w64-mingw32-gcc -o toy_enum_win64.exe        toy_app_enumeration.c
```

Quick reference — what static analysis should surface from each binary:

| Sample | Key Static Finds |
|---|---|
| `toy_app_linux` | XOR-encoded buffer, `ANALYSIS_DEMO` string, log file path |
| `toy_persistence_linux` | Split string `Software\` + `EducationalSample`, `fopen` on `/tmp` |
| `toy_network_linux` | `127.0.0.1`, port `4444`, XOR-encoded UA bytes, `socket`/`connect` imports |
| `toy_enum_linux` | `sandbox_keywords` array (`wireshark`, `ghidra`...), `/proc`, `/etc/passwd` paths |

---

## 9. Building a Static Analysis Report

A static analysis report does not need to be long. It needs to be actionable. Every report should answer:

1. **What is it?** — File type, architecture, size, compile timestamp
2. **Is it known?** — Hash lookups, threat intel hits
3. **What can it do?** — Capabilities inferred from imports and strings
4. **Is it packed?** — Entropy results, packer ID
5. **What are the IOCs?** — IPs, domains, file paths, registry keys, hashes
6. **What is the verdict?** — Malicious / Suspicious / Benign, confidence level

Template:

```markdown
## Static Analysis Report

**Analyst:**     [name]
**Date:**        [date]
**Sample:**      [filename]

### File Metadata
| Field | Value |
|---|---|
| MD5 | |
| SHA256 | |
| File Type | |
| Size | |
| Architecture | |
| Compile Time | |
| Packer | None detected / [packer name] |

### Capabilities (Inferred from Imports)
- [ ] File I/O
- [ ] Network communication
- [ ] Registry modification
- [ ] Process injection
- [ ] Encryption
- [ ] Anti-analysis / sandbox detection

### Strings of Interest
| String | Category |
|---|---|
| | |

### Indicators of Compromise (IOCs)
| Type | Value |
|---|---|
| SHA256 | |
| IP | |
| Domain | |
| File path | |
| Registry key | |

### Verdict
**Classification:** Malicious / Suspicious / Benign
**Confidence:** High / Medium / Low
**Reasoning:** [one paragraph]

### Recommended Next Steps
- [ ] Dynamic analysis in isolated VM
- [ ] Memory forensics
- [ ] Submit to VirusTotal / sandbox
```

---

## Hands-On Labs

### Lab 2.1: Full Static Triage

**Objective:** Run the complete static workflow on all four toy samples and fill in a report for each.

**Time estimate:** 45 minutes

**Setup:**

```bash
mkdir -p ~/labs/module02
cd ~/labs/module02

# Copy toy samples
cp -r ~/course/samples/benign_toy_app .

# Compile
gcc -o toy_app_linux         benign_toy_app/toy_app.c
gcc -o toy_persistence_linux benign_toy_app/toy_app_persistence.c
gcc -o toy_network_linux     benign_toy_app/toy_app_network.c
gcc -o toy_enum_linux        benign_toy_app/toy_app_enumeration.c
```

**Tasks:**

1. Run `file` on each binary. Record the true file type.

2. Calculate SHA-256 for each. Paste one into VirusTotal search - confirm no hits (they should not match anything, they are unique builds).

3. Run `strings -n 8` on each binary. For `toy_network_linux`, find:
   - The C2 IP address
   - The port number
   - The XOR-encoded user agent bytes (they will look like garbage)

4. Run `rabin2 -i` on each binary. For `toy_network_linux`, confirm `socket`, `connect`, `send`, `recv` are imported.

5. Run `rabin2 -S` on each. Record the entropy of the `.text` section for all four.

6. Pack `toy_app_linux` with UPX, then run `rabin2 -S` again. Record the new entropy and compare.

7. Fill in one complete static analysis report using the template from Section 9.

---

### Lab 2.2: Strings Hunting Script

**Objective:** Write a bash script that automates IOC extraction from a binary.

**Time estimate:** 20 minutes

Create `~/labs/module02/hunt_strings.sh`:

```bash
#!/bin/bash
# hunt_strings.sh - Automated IOC extraction from binary strings
# Usage: ./hunt_strings.sh <binary>

TARGET="$1"
if [ -z "$TARGET" ]; then
    echo "Usage: $0 <binary>"
    exit 1
fi

echo "================================================"
echo " IOC Hunt: $(basename "$TARGET")"
echo " SHA256: $(sha256sum "$TARGET" | awk '{print $1}')"
echo "================================================"

run_hunt() {
    local label="$1"
    local pattern="$2"
    local results
    results=$(strings -n 6 "$TARGET" | grep -iE "$pattern")
    if [ -n "$results" ]; then
        echo ""
        echo "[+] $label:"
        echo "$results" | head -20 | sed 's/^/    /'
    fi
}

run_hunt "IP Addresses"         '([0-9]{1,3}\.){3}[0-9]{1,3}'
run_hunt "URLs"                 'https?://'
run_hunt "Domain Names"         '[a-z0-9-]+\.(com|net|org|io|ru|cn|xyz)'
run_hunt "File Paths"           '(/tmp|/var|/etc|AppData|Temp|System32)'
run_hunt "Registry Keys"        'HKEY_(LOCAL_MACHINE|CURRENT_USER|CLASSES_ROOT)'
run_hunt "Credentials Keywords" '(password|passwd|secret|apikey|token|auth)'
run_hunt "Crypto Keywords"      '(encrypt|decrypt|aes|rsa|base64|xor)'
run_hunt "Anti-Analysis"        '(sandbox|vm|virtual|debug|wireshark|procmon)'
run_hunt "Network Functions"    '(socket|connect|send|recv|http|ftp|smtp)'
run_hunt "Execution Keywords"   '(cmd\.exe|powershell|bash|execve|system\()'

echo ""
echo "================================================"
echo " Done. Review hits above and classify as IOCs."
echo "================================================"
```

Run it against all four toy samples:

```bash
chmod +x hunt_strings.sh
./hunt_strings.sh toy_network_linux
./hunt_strings.sh toy_enum_linux
./hunt_strings.sh toy_persistence_linux
```

---

### Lab 2.3: Packer Detection and Entropy Graphing

**Objective:** Visually compare entropy between a clean and packed binary.

**Time estimate:** 15 minutes

```bash
# Save this as ~/labs/module02/entropy_graph.py
cat > entropy_graph.py << 'EOF'
#!/usr/bin/env python3
"""
entropy_graph.py - Visualise byte entropy across a binary file.
Prints a text-based entropy graph, no external libraries needed.

Usage: python3 entropy_graph.py <binary>
"""

import math
import sys

BLOCK_SIZE = 256   # bytes per entropy measurement
BAR_WIDTH  = 50    # max chars for the bar

def block_entropy(data):
    freq = [0] * 256
    for b in data:
        freq[b] += 1
    n = len(data)
    if n == 0:
        return 0.0
    return -sum((f/n) * math.log2(f/n) for f in freq if f > 0)

def main(path):
    with open(path, 'rb') as f:
        data = f.read()

    print(f"File: {path}")
    print(f"Size: {len(data)} bytes")
    print(f"Block size: {BLOCK_SIZE} bytes per row")
    print()
    print(f"{'Offset':<10} {'Entropy':>7}  {'Bar (max=8.0)'}")
    print("-" * 70)

    for offset in range(0, len(data), BLOCK_SIZE):
        block = data[offset:offset + BLOCK_SIZE]
        e = block_entropy(block)
        bar_len = int((e / 8.0) * BAR_WIDTH)

        # Colour coding via ASCII markers
        if e > 7.2:
            marker = "!!! ENCRYPTED/PACKED"
        elif e > 6.5:
            marker = "^^^ elevated"
        else:
            marker = ""

        bar = "#" * bar_len
        print(f"0x{offset:06x}   {e:6.3f}  [{bar:<{BAR_WIDTH}}] {marker}")

    total_entropy = block_entropy(data)
    print()
    print(f"Overall file entropy: {total_entropy:.4f}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python3 {sys.argv[0]} <binary>")
        sys.exit(1)
    main(sys.argv[1])
EOF

python3 entropy_graph.py toy_app_linux
echo ""
echo "Now pack it and compare:"
cp toy_app_linux /tmp/toy_packed
upx /tmp/toy_packed
python3 entropy_graph.py /tmp/toy_packed
```

The clean binary should show moderate, fairly uniform entropy. The UPX binary will have a spike near the start where the compressed payload lives, then a lower-entropy stub at the end.

---

## Knowledge Check

1. **You run `file suspicious_invoice.pdf` and get `PE32 executable, MS Windows`. What is the significance and what do you do next?**

   <details>
   <summary>Answer</summary>
   The file is masquerading as a PDF but is actually a Windows executable. Extension spoofing is common in phishing. Next steps: calculate hash, check VirusTotal, run strings, analyse PE imports before any execution.
   </details>

2. **`rabin2 -i malware.exe` shows imports: `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread`. What capability does this suggest?**

   <details>
   <summary>Answer</summary>
   Classic process injection triad. The malware allocates memory in another process (VirtualAllocEx), writes shellcode or a DLL into it (WriteProcessMemory), then executes it (CreateRemoteThread). This is how malware hides in legitimate processes like explorer.exe.
   </details>

3. **Entropy in the `.text` section is 7.85. What does this mean, and what is your next step?**

   <details>
   <summary>Answer</summary>
   The code section is effectively random, meaning it is packed or encrypted. Static analysis of the apparent code is useless - you are reading compressed/encrypted data. Next step: run DIE to identify the packer, then attempt to unpack before further static analysis, or go straight to dynamic analysis and let the binary unpack itself in memory.
   </details>

4. **`strings malware.elf` returns almost nothing useful. You see `UPX!` near the end of the output. What do you do?**

   <details>
   <summary>Answer</summary>
   UPX is a known packer with a trivial reversal. Run `upx -d malware.elf -o malware_unpacked.elf` and re-run strings on the unpacked version. If UPX decryption fails (UPX modified/scrambled), use dynamic analysis instead.
   </details>

5. **Why should you always note the PE compile timestamp but never fully trust it?**

   <details>
   <summary>Answer</summary>
   The compile timestamp can reveal when malware was built (useful for campaign attribution and timelines), but malware authors routinely forge it. It may be set to a past date to look like a legitimate old file, a future date, or zeroed out entirely. Treat it as a lead worth investigating, not a confirmed fact.
   </details>

---

## Challenge: The Mislabelled Archive

You receive a ZIP archive named `report_final.zip` containing four files. One of them is not what it claims to be. Find it, identify the real file type, and extract every IOC you can from static analysis alone.

**Setup:**

```bash
mkdir -p ~/labs/module02/challenge
cd ~/labs/module02/challenge

# Create the challenge files
echo "%PDF-1.4 This is a real PDF" > legitimate.pdf
cp /bin/ls renamed_to_look_safe.jpg       # ELF disguised as image
echo "username,email,amount" > data.csv
cp ~/labs/module02/toy_network_linux report.docx  # network binary disguised as doc

zip report_final.zip legitimate.pdf renamed_to_look_safe.jpg data.csv report.docx
rm legitimate.pdf renamed_to_look_safe.jpg data.csv report.docx

echo "Challenge ready. Analyse report_final.zip"
```

**Your tasks:**

1. Extract the ZIP and run `file` on every file inside
2. Identify which file(s) are not what they claim to be
3. For each misidentified file, run the full static workflow (hash, strings, imports, entropy)
4. Document every IOC you find
5. Write a one-paragraph verdict for each suspicious file

**Solution:** `solutions/module02_challenge.md`

---

## Summary

In this module you covered:
- ✅ The five-step static analysis workflow
- ✅ File triage with `file`, `xxd`, and hash lookups
- ✅ Strings extraction and IOC hunting patterns
- ✅ Header and import analysis with `rabin2` and `pefile`
- ✅ Entropy analysis and packer detection with DIE and binwalk
- ✅ Unpacking UPX binaries
- ✅ Writing a structured static analysis report

**Key rule:** Never trust file extensions. Never trust compile timestamps. Trust the bytes.

**Next Module:** [Module 03 — Dynamic Analysis](03_dynamic_analysis.md) — run the toy samples in an isolated environment and watch what they actually do.

---

## Suggested Reading

- *Practical Malware Analysis* — Sikorski & Honig, Chapters 1–4
- [FLOSS (FireEye Labs Obfuscated String Solver)](https://github.com/mandiant/flare-floss) — recovers strings that `strings` misses by emulating code
- [DIE (Detect-It-Easy) Documentation](https://github.com/horsicq/Detect-It-Easy)
- [pefile Documentation](https://github.com/erocarrera/pefile)
- [Any.run Static Analysis Guide](https://any.run/malware-trends/)

---

*Module complete. Continue to [Module 03 — Dynamic Analysis](03_dynamic_analysis.md)*
