# Module 04: Memory Forensics

## Learning Objectives

By the end of this module, you will:
- Understand why memory forensics recovers evidence that disk analysis misses
- Acquire memory from a live Linux process using `/proc` and `gcore`
- Analyse process memory dumps using Python and `strings`
- Use Volatility 3 to investigate Windows and Linux memory images
- Identify injected code, hidden processes, and network artefacts in memory
- Recover decoded strings that were hidden from static analysis
- Apply memory forensics to the toy samples you built in earlier modules

---

## 1. Why Memory Forensics

Static analysis reads the file on disk. Dynamic analysis watches the process from outside. Memory forensics reads what is actually running inside the process at a given moment.

The gap matters. Consider:

- A packed malware sample has encrypted code on disk. In memory, after it unpacks itself, the real code is plaintext and fully readable.
- An injected payload has no file on disk at all. It exists only in another process's address space — invisible to filesystem forensics, visible to memory analysis.
- XOR-encoded strings are garbage in static analysis. After the decoder runs, the plaintext sits in the heap. Memory forensics finds it.
- Network IOCs that were obfuscated at rest are often stored decoded in memory buffers just before they are used.

Memory is the one place a process cannot easily lie. It has to decode, decrypt, and assemble its real behaviour there, and that is where you catch it.

---

## 2. Memory Concepts

### Virtual Address Space Layout

Every Linux process gets its own virtual address space:

```
High addresses
┌──────────────────────────────────────┐
│  Kernel space (inaccessible to user) │  0xFFFF800000000000 and above
├──────────────────────────────────────┤
│  Stack                               │  grows downward
│  (local variables, return addresses) │
├──────────────────────────────────────┤
│  [stack guard - unmapped]            │
├──────────────────────────────────────┤
│  mmap'd regions                      │  shared libraries, anonymous mmaps
│  (libc.so, injected shellcode, etc.) │
├──────────────────────────────────────┤
│  Heap                                │  grows upward
│  (malloc'd data, decoded strings)    │
├──────────────────────────────────────┤
│  BSS  (uninitialised globals)        │
│  Data (initialised globals)          │
│  Text (executable code)              │
Low addresses (0x400000 typical base)
```

When you run `strings` on a binary, you are reading the `.text` and `.rodata` sections from disk. When you read `/proc/[pid]/mem`, you are reading all regions — including the heap where decoded strings and decrypted payloads live.

### The /proc Filesystem — Your Built-in Debugger

Linux exposes every running process through `/proc`:

```
/proc/[pid]/
├── maps          # virtual memory map (address ranges, permissions, backing files)
├── mem           # raw process memory (read with file offset = virtual address)
├── status        # process state, UID, memory usage
├── cmdline       # full command line used to launch process
├── environ       # environment variables at launch time
├── fd/           # file descriptors currently open
├── net/tcp       # network connections
├── exe           # symlink to the executable on disk
└── maps          # which files/libs are mapped where
```

No special tools needed. `cat`, `python3`, and `strings` are sufficient for the core techniques in this module.

---

## 3. Tool Installation

```bash
sudo apt update
sudo apt install -y \
    gdb \
    python3-pip \
    binutils \
    xxd

# Volatility 3 — the core memory forensics framework
pip3 install volatility3 --break-system-packages

# Verify
vol --help 2>/dev/null | head -5
python3 -c "import volatility3; print('volatility3 installed')"
```

The `vol` command is added to your PATH by pip. If it is not found after install:

```bash
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

---

## 4. Live Process Memory Analysis with /proc

This technique works right now, on your Ubuntu machine, with no extra tools and no memory image file. You just need a running process.

### Step 1: Create a Long-Running Toy Process

The toy samples from earlier modules finish too quickly to analyse. Create a long-running version that keeps its interesting data in memory:

```bash
# Save as ~/labs/module04/toy_memory_target.c
cat > ~/labs/module04/toy_memory_target.c << 'EOF'
/*
 * toy_memory_target.c - Long-running process for memory forensics lab
 *
 * Keeps the following data live in memory for 120 seconds:
 *   - A decoded XOR string (simulates runtime string decoding)
 *   - A hardcoded C2 IP and port
 *   - A "stolen credential" buffer (safe demo string)
 *   - An encoded byte array (visible as garbage in static analysis)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

/* These look like garbage in static analysis and strings output */
static unsigned char enc_c2[] = {
    0x76, 0x6b, 0x72, 0x7e, 0x63, 0x7f, 0x76, 0x3e,
    0x70, 0x21, 0x3d, 0x7a, 0x7c, 0x00
};
/* Decoded with key 0x13: "example-c2.io" (fake domain) */

static void xor_decode(unsigned char *buf, size_t len, unsigned char key) {
    for (size_t i = 0; i < len; i++) buf[i] ^= key;
}

int main(void) {
    /* Allocate heap buffers that persist in memory */
    char *decoded_domain = malloc(64);
    char *credential_buf = malloc(128);
    char *config_buf     = malloc(256);

    /* Decode C2 domain at runtime */
    memcpy(decoded_domain, enc_c2, sizeof(enc_c2));
    xor_decode((unsigned char *)decoded_domain, sizeof(enc_c2) - 1, 0x13);

    /* Build a config string that will sit in the heap */
    snprintf(config_buf, 256,
        "C2_HOST=%s C2_PORT=4444 CAMPAIGN=ANALYSIS_DEMO KEY=0x13",
        decoded_domain);

    /* Simulate a harvested credential (completely fake) */
    snprintf(credential_buf, 128,
        "USER=demo_victim PASSWORD=hunter2_ANALYSIS_DEMO");

    printf("PID: %d\n", getpid());
    printf("Sensitive data is in memory. Dump and find it.\n");
    printf("Sleeping 120 seconds...\n");
    fflush(stdout);

    /* Keep data alive in heap for 120 seconds */
    sleep(120);

    free(decoded_domain);
    free(credential_buf);
    free(config_buf);
    return 0;
}
EOF

mkdir -p ~/labs/module04
gcc -o ~/labs/module04/toy_memory_target \
    ~/labs/module04/toy_memory_target.c
```

### Step 2: Launch and Read the Memory Map

```bash
# Terminal 1 — run the target
~/labs/module04/toy_memory_target &
TARGET_PID=$!
echo "Target PID: $TARGET_PID"

# Read its memory map
cat /proc/$TARGET_PID/maps
```

The maps output tells you exactly what lives where:

```
555555554000-555555555000 r--p 00000000 08:01 123456  /home/user/toy_memory_target
555555555000-555555556000 r-xp 00001000 08:01 123456  /home/user/toy_memory_target  ← code
555555556000-555555557000 r--p 00002000 08:01 123456  /home/user/toy_memory_target  ← read-only data
555555557000-555555558000 rw-p 00003000 08:01 123456  /home/user/toy_memory_target  ← writable data
555555558000-555555579000 rw-p 00000000 00:00 0       [heap]                        ← heap
7ffff7c00000-7ffff7c28000 r--p 00000000 08:01 999     /usr/lib/x86_64-linux-gnu/libc.so.6
...
7ffffffde000-7ffffffff000 rw-p 00000000 00:00 0       [stack]                       ← stack
```

The `[heap]` region is where `malloc()` allocations live — including your decoded domain and config buffer.

### Step 3: Extract Strings from Process Memory

```bash
# Save as ~/labs/module04/memdump_strings.py
cat > ~/labs/module04/memdump_strings.py << 'PYEOF'
#!/usr/bin/env python3
"""
memdump_strings.py - Extract strings from a live process via /proc

Usage: python3 memdump_strings.py <PID> [min_length] [keyword_filter]

Examples:
  python3 memdump_strings.py 1234
  python3 memdump_strings.py 1234 8 "C2|password|ANALYSIS"
"""

import re
import sys
import os

def get_maps(pid):
    regions = []
    try:
        with open(f'/proc/{pid}/maps') as f:
            for line in f:
                parts = line.split()
                if len(parts) < 2: continue
                if 'r' not in parts[1]: continue   # skip non-readable

                addrs = parts[0].split('-')
                start = int(addrs[0], 16)
                end   = int(addrs[1], 16)
                size  = end - start
                label = parts[5] if len(parts) > 5 else '[anonymous]'

                # Skip huge regions to keep it fast
                if size > 20 * 1024 * 1024: continue

                regions.append((start, end, parts[1], label))
    except PermissionError:
        print(f"[!] Permission denied reading /proc/{pid}/maps")
        print(f"    Try: sudo python3 {sys.argv[0]} {pid}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"[!] Process {pid} not found")
        sys.exit(1)
    return regions

def extract_strings(pid, min_len=6, keyword=None):
    regions = get_maps(pid)
    print(f"[*] Process {pid} — {len(regions)} readable regions")
    print(f"[*] Min string length: {min_len}")
    if keyword:
        print(f"[*] Keyword filter: {keyword}")
    print()

    pattern = re.compile(b'[ -~]{' + str(min_len).encode() + b',}')
    if keyword:
        kw_pattern = re.compile(keyword.encode('utf-8', errors='ignore'),
                                re.IGNORECASE)

    try:
        with open(f'/proc/{pid}/mem', 'rb') as mem:
            for start, end, perms, label in regions:
                size = end - start
                try:
                    mem.seek(start)
                    data = mem.read(size)
                except (OSError, ValueError):
                    continue

                for match in pattern.finditer(data):
                    s = match.group()
                    if keyword and not kw_pattern.search(s):
                        continue
                    offset = start + match.start()
                    decoded = s.decode('ascii', errors='replace')
                    print(f"  0x{offset:016x}  [{label.split('/')[-1]:<20}]  {decoded}")

    except PermissionError:
        print(f"[!] Permission denied reading /proc/{pid}/mem")
        print(f"    Try: sudo python3 {sys.argv[0]} {pid}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    pid     = int(sys.argv[1])
    min_len = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    keyword = sys.argv[3]      if len(sys.argv) > 3 else None

    extract_strings(pid, min_len, keyword)
PYEOF

chmod +x ~/labs/module04/memdump_strings.py
```

Run it against the toy target:

```bash
# All strings (lots of output)
python3 ~/labs/module04/memdump_strings.py $TARGET_PID

# Filter to IOC-relevant strings
python3 ~/labs/module04/memdump_strings.py $TARGET_PID 6 \
    "C2|password|ANALYSIS|127\.|example|4444"
```

Expected output:

```
0x000055d4a1e8e2a0  [heap]                  C2_HOST=example-c2.io C2_PORT=4444 CAMPAIGN=ANALYSIS_DEMO KEY=0x13
0x000055d4a1e8e2e0  [heap]                  USER=demo_victim PASSWORD=hunter2_ANALYSIS_DEMO
0x00007ffd3e8a1b40  [stack]                 example-c2.io
```

That decoded domain was an XOR-encrypted byte array in static analysis. It is plaintext in the heap.

### Step 4: Create a Full Process Dump

```bash
# Save as ~/labs/module04/dump_process.py
cat > ~/labs/module04/dump_process.py << 'PYEOF'
#!/usr/bin/env python3
"""
dump_process.py - Dump all readable memory regions from a live process

Usage: python3 dump_process.py <PID> [output_file]

Output is a flat binary dump of all readable regions concatenated.
Analyse with: strings, hexdump, Volatility (with appropriate plugin)
"""

import sys
import os

def dump_process(pid, outfile):
    maps_path = f'/proc/{pid}/maps'
    mem_path  = f'/proc/{pid}/mem'

    try:
        with open(maps_path) as f:
            maps = f.readlines()
    except FileNotFoundError:
        print(f"[!] PID {pid} not found")
        sys.exit(1)

    total_bytes  = 0
    region_count = 0

    with open(outfile, 'wb') as out:
        with open(mem_path, 'rb') as mem:
            for line in maps:
                parts = line.split()
                if len(parts) < 2: continue
                if 'r' not in parts[1]: continue

                addrs = parts[0].split('-')
                start = int(addrs[0], 16)
                end   = int(addrs[1], 16)
                size  = end - start

                if size > 50 * 1024 * 1024:
                    print(f"  Skipping large region: {parts[0]} ({size // 1024 // 1024}MB)")
                    continue

                try:
                    mem.seek(start)
                    data = mem.read(size)
                    out.write(data)
                    total_bytes  += len(data)
                    region_count += 1
                    label = parts[5] if len(parts) > 5 else '[anon]'
                    print(f"  Dumped {parts[0]}  {size:>10} bytes  {label}")
                except (OSError, ValueError) as e:
                    print(f"  Skip {parts[0]}: {e}")

    print(f"\n[+] Dump complete: {outfile}")
    print(f"    {region_count} regions, {total_bytes / 1024 / 1024:.2f} MB")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    pid     = int(sys.argv[1])
    outfile = sys.argv[2] if len(sys.argv) > 2 else f'/tmp/proc_{pid}_dump.bin'

    dump_process(pid, outfile)
PYEOF

chmod +x ~/labs/module04/dump_process.py

# Dump the toy target
python3 ~/labs/module04/dump_process.py $TARGET_PID \
    ~/labs/module04/toy_target_dump.bin

# Analyse the dump
strings ~/labs/module04/toy_target_dump.bin \
    | grep -E '(C2_HOST|PASSWORD|ANALYSIS|example-c2)'
```

---

## 5. Volatility 3 — Structured Memory Analysis

`/proc` analysis is powerful but manual. Volatility 3 provides structured plugins that parse kernel data structures, reconstruct process trees, extract network connections, and detect common injection patterns — automatically.

### Volatility 3 Basics

```bash
# The command is just 'vol'
vol --help | head -20

# Syntax
vol -f <memory_image> <plugin>

# Key flags
vol -f memory.img windows.info.Info          # OS info
vol -f memory.img linux.pslist.PsList        # process list
vol -f memory.img -q <plugin>                # quiet (no progress bar)
vol -f memory.img -o /tmp/output <plugin>    # write output files to dir
```

### Getting a Memory Image for Practice

Volatility needs a full system memory image, not just a process dump. Three sources for practice images:

**Option 1 — MemLabs (Free, educational)**

MemLabs is a CTF-style memory forensics challenge series with Linux and Windows images:

```bash
# Images are hosted on Google Drive (links on the GitHub)
# https://github.com/stuxnet999/MemLabs
#
# Download Lab 1 (Windows, ~500MB):
# https://mega.nz/file/6l4BhKIb#l8ATZoliB_ULlvlkESwkPRSJnSgs5l9xmv9xRZBEEeY
wget -O ~/labs/module04/memlabs_lab1.zip "<url from MemLabs GitHub>"
unzip ~/labs/module04/memlabs_lab1.zip -d ~/labs/module04/
```

**Option 2 — Volatility Sample Images**

```bash
# Volatility3 test images (small, for plugin testing)
# https://github.com/volatilityfoundation/volatility3/tree/develop/test/data
wget https://github.com/volatilityfoundation/volatility3/raw/develop/test/volatility-data-sample.tar.gz
tar -xf volatility-data-sample.tar.gz
```

**Option 3 — Create Your Own Linux Memory Image**

LiME (Linux Memory Extractor) captures a full system image. For a student lab VM:

```bash
# Install kernel headers (required to build LiME)
sudo apt install linux-headers-$(uname -r) build-essential

# Clone and build LiME
git clone https://github.com/504ensicsLabs/LiME.git
cd LiME/src
make

# Load the module and write memory to file
# WARNING: This captures your entire VM's RAM — do in an analysis VM
sudo insmod lime-$(uname -r).ko "path=/tmp/memory.lime format=lime"

# The image is now at /tmp/memory.lime
ls -lh /tmp/memory.lime
```

### Essential Volatility 3 Plugins

#### Linux Plugins

```bash
IMG="~/labs/module04/linux_memory.lime"

# Process list (like ps)
vol -f $IMG linux.pslist.PsList

# Process tree (parent-child relationships)
vol -f $IMG linux.pstree.PsTree

# Network connections (like ss -tnp)
vol -f $IMG linux.netstat.Netstat

# Open files per process
vol -f $IMG linux.lsof.Lsof

# Loaded kernel modules (rootkit detection)
vol -f $IMG linux.lsmod.Lsmod

# Bash command history from memory
vol -f $IMG linux.bash.Bash

# Find processes with executable anonymous mappings (injection indicator)
vol -f $IMG linux.malfind.Malfind

# Environment variables per process
vol -f $IMG linux.envars.Envars

# List all ELF files mapped in memory
vol -f $IMG linux.elfs.Elfs

# Check for hidden kernel modules (rootkit detection)
vol -f $IMG linux.hidden_modules.Hidden_modules

# Check syscall table for hooks (rootkit detection)
vol -f $IMG linux.check_syscall.Check_syscall
```

#### Windows Plugins

```bash
IMG="~/labs/module04/windows_memory.raw"

# OS and kernel info
vol -f $IMG windows.info.Info

# Process list
vol -f $IMG windows.pslist.PsList

# Process list using pool scanning (finds hidden processes)
vol -f $IMG windows.psscan.PsScan

# Process tree
vol -f $IMG windows.pstree.PsTree

# Command line arguments per process
vol -f $IMG windows.cmdline.CmdLine

# DLLs loaded per process
vol -f $IMG windows.dlllist.DllList

# Network connections
vol -f $IMG windows.netstat.NetStat

# Handles (files, keys, mutexes per process)
vol -f $IMG windows.handles.Handles

# Find injected memory regions (VAD anomalies)
vol -f $IMG windows.malfind.Malfind

# Registry hives
vol -f $IMG windows.registry.hivelist.HiveList

# Read a registry key
vol -f $IMG windows.registry.printkey.PrintKey \
    --key "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Dump a suspicious process to disk
vol -f $IMG -o /tmp/dumps windows.dumpfiles.DumpFiles \
    --pid 1234
```

### Reading pslist Output

```
PID    PPID   NAME            OFFSET    THREADS  HANDLES
4      0      System          0x8...    100      1000
392    4      smss.exe        0x8...    3        30
480    392    csrss.exe       0x8...    10       400
504    392    wininit.exe     0x8...    3        80
512    504    services.exe    0x8...    10       200    ← parent of all services
520    504    lsass.exe       0x8...    7        600    ← credential store
1234   512    svchost.exe     0x8...    15       400
2048   1234   malware.exe     0x8...    3        50     ← suspicious parent
```

**Red flags in the process list:**

| Observation | Significance |
|---|---|
| `svchost.exe` not parented by `services.exe` | Almost certainly malware |
| `explorer.exe` parented by anything other than `userinit.exe` | Injection indicator |
| Two instances of `lsass.exe` | Credential harvester mimicking lsass |
| Process with random-looking name and no description | Malware dropping executables |
| PsTree shows process that PsList doesn't | Hidden process (rootkit) |

### Malfind — Finding Injected Code

`malfind` scans memory for regions that are:
- Executable
- Not backed by a file on disk (anonymous)
- Contain code-like content (MZ header, shellcode patterns)

```bash
# Windows
vol -f $IMG windows.malfind.Malfind

# Linux
vol -f $IMG linux.malfind.Malfind

# Dump flagged regions to files for further analysis
vol -f $IMG -o ~/labs/module04/malfind_output \
    windows.malfind.Malfind
```

Typical malfind output:

```
PID  Process       Start          End            Tag  Protection
1234 explorer.exe  0x00400000     0x00401000     VAD  PAGE_EXECUTE_READWRITE

MZ header found at 0x00400000:
4d 5a 90 00 03 00 00 00  04 00 00 00 ff ff 00 00   MZ..............
b8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00   ........@.......
```

`PAGE_EXECUTE_READWRITE` is the injection signature — memory that is both writable and executable. Legitimate code is either writable (data) or executable (code), not both at once.

---

## 6. Recovering Decoded Strings from Memory

This technique — finding decoded strings in heap/stack memory — is one of the highest-value moves in memory forensics. It bypasses all static obfuscation.

### The Toy Target Demo

With `toy_memory_target` still running:

```bash
# Find decoded C2 domain in the heap (was XOR-encoded on disk)
python3 ~/labs/module04/memdump_strings.py $TARGET_PID 8 \
    "C2_HOST|example-c2|hunter2|ANALYSIS_DEMO"
```

Then compare with what `strings` shows on the binary on disk:

```bash
# This shows the encrypted bytes - garbage
strings ~/labs/module04/toy_memory_target \
    | grep -E "(example|c2|hunter)"

# Nothing meaningful - the domain is encoded

# But in memory after runtime decode:
# C2_HOST=example-c2.io C2_PORT=4444 CAMPAIGN=ANALYSIS_DEMO
```

That is the core lesson. The binary hides it. Memory reveals it.

### Hexdump for Targeted Inspection

When you know an address from memdump output, examine it in context:

```bash
# Python: read and hexdump 256 bytes at a specific address
python3 << 'PYEOF'
pid = TARGET_PID_HERE   # replace with actual PID
addr = 0x555555558000   # replace with heap address from memdump output

with open(f'/proc/{pid}/mem', 'rb') as mem:
    mem.seek(addr)
    data = mem.read(256)

# Hexdump
for i in range(0, len(data), 16):
    chunk = data[i:i+16]
    hex_part = ' '.join(f'{b:02x}' for b in chunk)
    asc_part = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
    print(f"  {addr+i:016x}  {hex_part:<48}  {asc_part}")
PYEOF
```

---

## 7. Memory Forensics for Specific Malware Techniques

### Detecting Process Injection

Process injection leaves a specific memory signature:

```bash
# Windows: look for executable anonymous VADs
vol -f $IMG windows.malfind.Malfind 2>/dev/null \
    | grep -i "PAGE_EXECUTE"

# Check for DLL not appearing in the module list (manual injection)
vol -f $IMG windows.ldrmodules.LdrModules 2>/dev/null \
    | grep -v "True   True   True"
# LdrModules shows three columns: InLoad InInit InMem
# A legitimate DLL has all three True
# Manually injected code often has InLoad=False
```

### Detecting Hollowing (Process Replacement)

```bash
# Windows: compare PEB image path to actual mapped image
vol -f $IMG windows.hollowprocesses.HollowProcesses

# Look for processes where the on-disk image doesn't match memory
vol -f $IMG windows.malware.hollowprocesses.HollowProcesses
```

### Extracting Network IOCs from Memory

```bash
# Windows: active and recently closed connections
vol -f $IMG windows.netstat.NetStat

# Linux: network state
vol -f $IMG linux.netstat.Netstat

# For our toy samples, live approach:
# While toy_network_linux is attempting beacons:
grep -a "127.0.0.1" /proc/$NETWORK_PID/net/tcp
```

### Recovering Bash Command History

```bash
# Bash keeps history in memory between sessions
# Volatility can recover commands run in shells
vol -f $IMG linux.bash.Bash

# Manual approach on a live system
# bash history lives in a heap allocation
python3 ~/labs/module04/memdump_strings.py $BASH_PID 8 "sudo\|rm\|wget\|curl\|python"
```

---

## 8. Memory Analysis Workflow

```
Memory Image / Live Process
         │
         ▼
┌──────────────────────────────┐
│  1. Profile / Identify OS    │
│  vol windows.info or         │
│  /proc/$PID/status           │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  2. Process Enumeration      │
│  vol pslist + psscan         │
│  Compare: hidden processes?  │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  3. Network Connections      │
│  vol netstat                 │
│  Extract IPs, ports          │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  4. Suspicious Process Deep  │
│  Dive: cmdline, dlls,        │
│  handles, malfind            │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  5. String Recovery          │
│  memdump_strings.py          │
│  or vol yarascan             │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  6. Dump and Re-Analyse      │
│  vol dumpfiles               │
│  Static analysis on dump     │
└──────────────────────────────┘
```

---

## Hands-On Labs

### Lab 4.1: Live Process Memory Analysis

**Objective:** Recover runtime-decoded strings from the toy memory target that are invisible to static analysis.

**Time estimate:** 30 minutes

**Setup:**

```bash
mkdir -p ~/labs/module04
cd ~/labs/module04

# Compile the memory target
gcc -o toy_memory_target toy_memory_target.c

# Launch it
./toy_memory_target &
TARGET_PID=$!
echo "Target PID: $TARGET_PID"
```

**Tasks:**

1. Read the memory map:
   ```bash
   cat /proc/$TARGET_PID/maps
   ```
   Identify the heap region address range. What permissions does it have?

2. Run `strings` on the binary on disk. Can you find the C2 domain?
   ```bash
   strings toy_memory_target | grep -iE '(example|c2|hunter|domain)'
   ```

3. Run the memory string extractor against the live process:
   ```bash
   python3 memdump_strings.py $TARGET_PID 8 "C2|example|hunter|ANALYSIS"
   ```
   Record every IOC you find and which memory region it came from.

4. Create a full process dump:
   ```bash
   python3 dump_process.py $TARGET_PID toy_dump.bin
   ```

5. Run `strings` on the dump file:
   ```bash
   strings toy_dump.bin | grep -iE '(C2_HOST|PASSWORD|ANALYSIS_DEMO|example-c2)'
   ```
   These strings exist in the dump but not on the original disk binary. Explain why.

6. Kill the process:
   ```bash
   kill $TARGET_PID
   ```
   Now try to run `strings toy_dump.bin` again and find the same strings. This works — you captured them before process termination. This is why memory acquisition timing matters in incident response.

---

### Lab 4.2: /proc Forensics — Process Enumeration

**Objective:** Use only `/proc` to enumerate processes, open files, and network state — the way memory forensics tools work internally.

**Time estimate:** 25 minutes

**Setup:** Run all four toy samples in the background:

```bash
cd ~/labs/module04

# Compile if needed
for s in toy_app toy_persistence toy_network toy_enum; do
    gcc -o $s ~/course/samples/benign_toy_app/${s#toy_}_*.c 2>/dev/null \
        || gcc -o $s ~/course/samples/benign_toy_app/*.c 2>/dev/null
done

# Simpler: just use the already-compiled ones
ls ~/labs/module03/lab31/
```

**Tasks:**

1. Write a script that replicates `ps aux` using only `/proc`:

   ```bash
   cat > proc_ps.sh << 'EOF'
   #!/bin/bash
   echo "PID     PPID    STATE  NAME"
   echo "------- ------- ------ --------------------"
   for pid_dir in /proc/[0-9]*/; do
       pid=$(basename "$pid_dir")
       status="$pid_dir/status"
       [ -f "$status" ] || continue
       name=$(grep '^Name:' "$status" | awk '{print $2}')
       ppid=$(grep '^PPid:' "$status" | awk '{print $2}')
       state=$(grep '^State:' "$status" | awk '{print $2}')
       printf "%-7s %-7s %-6s %s\n" "$pid" "$ppid" "$state" "$name"
   done
   EOF
   chmod +x proc_ps.sh
   ./proc_ps.sh | head -30
   ```

2. For each toy sample's PID, check its open file descriptors:
   ```bash
   ls -la /proc/$PID/fd/
   ```
   Which file descriptors do you see? What does fd/0, fd/1, fd/2 always represent?

3. Check the executable path of each toy process:
   ```bash
   readlink /proc/$PID/exe
   ```

4. Read the environment of a running toy process:
   ```bash
   cat /proc/$PID/environ | tr '\0' '\n' | head -10
   ```
   What environment variables does it inherit?

---

### Lab 4.3: Volatility 3 with MemLabs

**Objective:** Run a structured Volatility investigation against a CTF memory image.

**Time estimate:** 60 minutes (download time varies)

**Setup:**

```bash
mkdir -p ~/labs/module04/memlabs
cd ~/labs/module04/memlabs

# Download MemLabs Lab 1 from:
# https://github.com/stuxnet999/MemLabs
# Follow the download links in the README

# Once downloaded:
ls -lh MemLabs-Lab1.raw
```

**Tasks:**

Run the following plugins in order and record your findings:

```bash
IMG=~/labs/module04/memlabs/MemLabs-Lab1.raw

# 1. Identify the OS
vol -f $IMG windows.info.Info

# 2. List all processes
vol -f $IMG windows.pslist.PsList > pslist.txt
cat pslist.txt

# 3. Find the process tree
vol -f $IMG windows.pstree.PsTree

# 4. Check command lines - what was run?
vol -f $IMG windows.cmdline.CmdLine

# 5. Look for network connections
vol -f $IMG windows.netstat.NetStat

# 6. Check for injection
vol -f $IMG windows.malfind.Malfind > malfind.txt
cat malfind.txt

# 7. Look at DLLs for a suspicious process
# Replace 1234 with a PID from step 2 that looks suspicious
vol -f $IMG windows.dlllist.DllList --pid 1234

# 8. Dump a suspicious process
mkdir -p ~/labs/module04/memlabs/dumps
vol -f $IMG -o ~/labs/module04/memlabs/dumps \
    windows.dumpfiles.DumpFiles --pid 1234

# 9. Analyse the dumped binary with static tools
ls ~/labs/module04/memlabs/dumps/
strings ~/labs/module04/memlabs/dumps/*.exe | grep -iE '(http|password|cmd|flag)'
```

Fill in a memory forensics report for the MemLabs image:

```markdown
## Memory Forensics Report — MemLabs Lab 1

**OS Identified:**
**Memory Acquisition Date:**

### Process Analysis
| Suspicious PID | Name | Parent | Reason for Suspicion |
|---|---|---|---|

### Network Connections
| PID | Process | Local | Remote | State |
|---|---|---|---|---|

### Injection Findings (Malfind)
| PID | Address | Protection | MZ Header? |
|---|---|---|---|

### Strings Recovered from Dumps
[list notable strings]

### IOCs
| Type | Value | Source |
|---|---|---|
```

---

## Knowledge Check

1. **A packed binary shows almost no useful strings output. You run it in a sandbox and memory forensics on the running process recovers a full C2 URL. Why?**

   <details>
   <summary>Answer</summary>
   The packer decompresses the real code into memory at runtime. The C2 URL exists in plaintext in the heap or stack while the process is running even though it was encrypted/compressed in the on-disk binary. Memory forensics reads the live address space, not the packed file.
   </details>

2. **`vol windows.psscan.PsScan` shows a process that `vol windows.pslist.PsList` does not. What does this indicate?**

   <details>
   <summary>Answer</summary>
   A hidden process, likely a rootkit. PsList walks the doubly-linked list of EPROCESS structures — a rootkit unlinks its process from this list to hide it. PsScan scans physical memory for EPROCESS pool tags, finding the hidden structure regardless of list manipulation.
   </details>

3. **Malfind flags a region in `explorer.exe` with `PAGE_EXECUTE_READWRITE` protection and an MZ header at the start. What does this mean?**

   <details>
   <summary>Answer</summary>
   A PE file (executable) has been injected into explorer.exe's address space. The MZ header confirms it is a Windows executable. PAGE_EXECUTE_READWRITE means the region is both writable and executable, which is the injection signature — legitimate code loaded by Windows is execute-only after loading.
   </details>

4. **Why does the `/proc/PID/mem` technique for live process analysis require the target process to still be running?**

   <details>
   <summary>Answer</summary>
   /proc/PID/mem is a virtual file that the kernel serves by reading the process's live page tables. When the process exits, the kernel frees its address space and removes the /proc entry. A process dump saved to disk before termination preserves the data — this is why timing matters in incident response.
   </details>

5. **You run `vol linux.check_syscall.Check_syscall` and see entries marked HOOKED. What does this mean and what tool is likely responsible?**

   <details>
   <summary>Answer</summary>
   The syscall table has been modified — the kernel's dispatch table for system calls points to non-standard addresses. A kernel-mode rootkit (LKM rootkit) has replaced legitimate syscall handlers with its own code to intercept or hide certain operations. This is a strong indicator of a serious, persistent compromise.
   </details>

---

## Summary

In this module you covered:
- ✅ Why memory forensics recovers evidence that disk and dynamic analysis miss
- ✅ Linux process memory layout and the `/proc` virtual filesystem
- ✅ Live process memory string extraction with `memdump_strings.py`
- ✅ Full process memory dumps via `/proc/PID/mem`
- ✅ Volatility 3 installation and core Linux and Windows plugins
- ✅ Reading pslist, pstree, netstat, malfind, and dlllist output
- ✅ Detecting injection, hollowing, and rootkit indicators
- ✅ Recovering runtime-decoded strings that bypass static analysis

**Key rule:** The process cannot lie to you in memory. Whatever it decrypts, decodes, or reconstructs at runtime ends up in heap or stack — and that is where you find the real IOCs.

**Next Module:** [Module 05 — YARA and Sigma](05_yara_sigma.md) — write detection rules that find what you discovered in this module.

---

## Suggested Reading

- *The Art of Memory Forensics* — Ligh, Case, Levy, Walters (the definitive reference)
- [Volatility 3 Documentation](https://volatility3.readthedocs.io/)
- [MemLabs — CTF-style memory forensics challenges](https://github.com/stuxnet999/MemLabs)
- [LiME — Linux Memory Extractor](https://github.com/504ensicsLabs/LiME)
- [Volatility Foundation Sample Images](https://github.com/volatilityfoundation/volatility3)

---

*Module complete. Continue to [Module 05 — YARA and Sigma](05_yara_sigma.md)*
