# Module 01: Foundations of Digital Forensics

## Learning Objectives

By the end of this module, you will:
- Understand executable file formats (PE, ELF, Mach-O)
- Recognize file headers and magic bytes
- Understand Windows and Linux process architecture
- Know common file system artifacts
- Calculate and verify cryptographic hashes
- Understand basic assembly concepts (x86/x64)

---

## 1. File Formats Deep Dive

### Magic Bytes and File Signatures

Every file type has a unique signature in its first bytes:

| File Type | Magic Bytes (Hex) | ASCII |
|-----------|-------------------|-------|
| **EXE (PE)** | `4D 5A` | MZ |
| **ELF (Linux)** | `7F 45 4C 46` | .ELF |
| **PDF** | `25 50 44 46` | %PDF |
| **ZIP** | `50 4B 03 04` | PK.. |
| **JPEG** | `FF D8 FF` | ÿØÿ |
| **PNG** | `89 50 4E 47` | .PNG |
| **GIF** | `47 49 46 38` | GIF8 |

**Why this matters**: Attackers rename files to evade detection. `malware.jpg` might actually be an executable.

```bash
# Check real file type (ignores extension)
file suspicious.jpg
# Output: suspicious.jpg: PE32 executable (GUI) Intel 80386, for MS Windows

# View hex header
xxd -l 16 suspicious.jpg
# 00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ..............
```

### PE (Portable Executable) Format - Windows

Structure of a Windows executable:

```
┌─────────────────────────────┐
│ DOS Header (64 bytes)       │  ← "MZ" signature
│  - e_magic: 0x5A4D (MZ)    │
│  - e_lfanew: Offset to PE  │
├─────────────────────────────┤
│ DOS Stub (Variable)         │  ← "This program cannot be run..."
├─────────────────────────────┤
│ PE Signature (4 bytes)      │  ← "PE\0\0"
├─────────────────────────────┤
│ COFF File Header            │  ← Machine type, # sections
│  - Machine: 0x014C (x86)   │
│  - NumberOfSections        │
│  - TimeDateStamp           │
├─────────────────────────────┤
│ Optional Header             │  ← Entry point, image base
│  - Magic: 0x010B (32-bit)  │
│  - AddressOfEntryPoint     │
│  - ImageBase               │
│  - SizeOfImage             │
├─────────────────────────────┤
│ Section Headers             │
│  - .text (code)            │  ← Executable instructions
│  - .data (initialized)     │  ← Global variables
│  - .rdata (read-only)      │  ← Constants, imports
│  - .rsrc (resources)       │  ← Icons, dialogs
├─────────────────────────────┤
│ Section Data                │
│  - Actual code & data      │
├─────────────────────────────┤
│ Import Table                │  ← External DLLs/functions
│  - kernel32.dll            │
│  - CreateFileA             │
│  - WriteFile               │
├─────────────────────────────┤
│ Export Table (optional)     │  ← Functions this DLL exports
├─────────────────────────────┤
│ Resources                   │  ← Icons, version info, etc.
└─────────────────────────────┘
```

**Key PE characteristics**:
- **Entry Point**: Where execution begins
- **Imports**: External functions the program uses (useful for analysis!)
- **Sections**: Code vs. data vs. resources
- **Compile Timestamp**: When the file was built (can be forged)

```bash
# Analyze PE file
pefile malware.exe
# or
rabin2 -I malware.exe
```

### ELF (Executable and Linkable Format) - Linux

```
┌─────────────────────────────┐
│ ELF Header                  │  ← 0x7F "ELF"
│  - e_ident: ELF magic      │
│  - e_type: ET_EXEC/ET_DYN  │
│  - e_machine: EM_X86_64    │
│  - e_entry: Entry point    │
├─────────────────────────────┤
│ Program Headers             │  ← How to load into memory
│  - PT_LOAD (loadable)      │
│  - PT_DYNAMIC (dynamic)    │
├─────────────────────────────┤
│ Section Headers             │
│  - .text (code)            │
│  - .data (initialized)     │
│  - .bss (uninitialized)    │
│  - .rodata (read-only)     │
│  - .plt/.got (linking)     │
├─────────────────────────────┤
│ Sections                    │
│  - Actual code & data      │
└─────────────────────────────┘
```

```bash
# Analyze ELF
readelf -h suspicious_binary
readelf -l suspicious_binary  # Program headers
readelf -S suspicious_binary  # Section headers
readelf -s suspicious_binary  # Symbol table

# Quick check
file suspicious_binary
# Output: ELF 64-bit LSB executable, x86-64, dynamically linked
```

---

## 2. Cryptographic Hashes

### Why Hashes Matter

Hashes provide unique fingerprints for files:
- **Identify known malware**: Check against threat intel databases
- **Verify integrity**: Detect modifications
- **Track samples**: Reference files across organizations

### Hash Algorithms

| Algorithm | Output Size | Status | Use Case |
|-----------|-------------|--------|----------|
| **MD5** | 128 bits (32 hex) | ⚠️ Deprecated | Legacy, still common |
| **SHA-1** | 160 bits (40 hex) | ⚠️ Deprecated | Phasing out |
| **SHA-256** | 256 bits (64 hex) | ✅ Current | Standard |
| **SHA-512** | 512 bits (128 hex) | ✅ Current | High security |
| **SSDEEP** | Variable | ✅ Fuzzy hash | Similarity matching |

```bash
# Calculate hashes (Linux/Mac)
md5sum malware.exe
sha1sum malware.exe
sha256sum malware.exe

# Windows (PowerShell)
Get-FileHash malware.exe -Algorithm SHA256

# Multiple hashes at once
rhash --md5 --sha1 --sha256 malware.exe

# Fuzzy hash (detect similar files)
ssdeep malware.exe
```

### Fuzzy Hashing with SSDEEP

SSDEEP detects similar (but not identical) files:

```bash
# Hash two files
ssdeep malware_v1.exe > hash1.txt
ssdeep malware_v2.exe > hash2.txt

# Compare
ssdeep -d hash1.txt malware_v2.exe
# Output: malware_v2.exe matches hash1.txt:malware_v1.exe (95%)
```

**Use cases**:
- Detect malware variants
- Find packed vs. unpacked versions
- Identify code reuse across samples

---

## 3. Windows Process Architecture

### Process Components

```
┌──────────────────────────────────────┐
│           PROCESS                    │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Virtual Address Space        │ │
│  │                                │ │
│  │  ┌──────────────────────────┐ │ │
│  │  │  Executable Image        │ │ │
│  │  │  (.exe loaded here)      │ │ │
│  │  └──────────────────────────┘ │ │
│  │  ┌──────────────────────────┐ │ │
│  │  │  DLLs (libraries)        │ │ │
│  │  │  - kernel32.dll          │ │ │
│  │  │  - ntdll.dll             │ │ │
│  │  │  - user32.dll            │ │ │
│  │  └──────────────────────────┘ │ │
│  │  ┌──────────────────────────┐ │ │
│  │  │  Heap                    │ │ │
│  │  │  (dynamic memory)        │ │ │
│  │  └──────────────────────────┘ │ │
│  │  ┌──────────────────────────┐ │ │
│  │  │  Stack                   │ │ │
│  │  │  (function calls)        │ │ │
│  │  └──────────────────────────┘ │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Threads (execution)          │ │
│  │   - Thread 1 (main)            │ │
│  │   - Thread 2                   │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Handles (resources)          │ │
│  │   - File handles               │ │
│  │   - Registry keys              │ │
│  │   - Network sockets            │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Critical Windows APIs (for malware analysis)

| API Function | Purpose | Malware Use |
|--------------|---------|-------------|
| `CreateProcess` | Start new process | Launch payload |
| `VirtualAlloc` | Allocate memory | Store decrypted code |
| `WriteProcessMemory` | Write to process | Code injection |
| `CreateRemoteThread` | Execute in other process | Injection technique |
| `RegSetValue` | Modify registry | Persistence |
| `CreateFile` | Open file | Read/write/encrypt |
| `InternetOpen` | HTTP connection | C2 communication |
| `CryptEncrypt` | Encrypt data | Ransomware |

---

## 4. File System Artifacts

### Windows Forensic Artifacts

```
C:\
├── $MFT                           # Master File Table (all file metadata)
├── $LogFile                       # NTFS transaction log
├── $UsnJrnl                       # Change journal
├── Windows\
│   ├── Prefetch\                  # .pf files (execution history)
│   ├── System32\
│   │   └── winevt\Logs\           # Event logs (.evtx)
│   └── Tasks\                     # Scheduled tasks
├── Users\<username>\
│   ├── NTUSER.DAT                 # User registry hive
│   ├── AppData\
│   │   ├── Local\Temp\            # Temporary files
│   │   ├── Roaming\               # Application data
│   │   └── LocalLow\              # IE/Edge cache
│   ├── Recent\                    # Recent documents (LNK files)
│   └── Downloads\                 # Downloaded files
└── Program Files\                 # Installed applications
```

### Linux Forensic Artifacts

```
/
├── /var/log/                      # System logs
│   ├── auth.log                   # Authentication
│   ├── syslog                     # System messages
│   └── kern.log                   # Kernel messages
├── /etc/
│   ├── passwd                     # User accounts
│   ├── shadow                     # Password hashes
│   └── crontab                    # Scheduled tasks
├── /home/<user>/
│   ├── .bash_history              # Command history
│   ├── .ssh/                      # SSH keys, known_hosts
│   └── .config/                   # Application configs
├── /tmp/                          # Temporary files (cleared on reboot)
└── /proc/                         # Running processes (virtual FS)
    └── <pid>/
        ├── cmdline                # Command line arguments
        ├── environ                # Environment variables
        └── exe                    # Symlink to executable
```

### Timestamps (MAC Times)

- **M**odified: Content changed
- **A**ccessed: File read
- **C**hanged: Metadata changed (permissions, ownership)
- **B**orn/Created: File created (NTFS only)

```bash
# Linux: View all timestamps
stat suspicious.sh
# Output:
#   File: suspicious.sh
#   Size: 1234    	Blocks: 8          IO Block: 4096   regular file
# Device: 801h/2049d	Inode: 12345      Links: 1
# Access: 2025-10-01 10:30:00.000000000 +0000
# Modify: 2025-10-01 10:29:55.000000000 +0000
# Change: 2025-10-01 10:29:55.000000000 +0000

# Windows (PowerShell)
Get-Item malware.exe | Select-Object *Time*
```

**Timestomping**: Attackers often modify timestamps to avoid detection or blend in.

---

## 5. Assembly Basics (x86/x64)

### Why Learn Assembly?

- Understand what disassemblers show you
- Identify malicious code patterns
- Recognize obfuscation techniques
- Debug and patch binaries

### Key Concepts

**Registers** (x86/x64):
```
General Purpose:
  EAX/RAX - Accumulator (return values, arithmetic)
  EBX/RBX - Base (addressing)
  ECX/RCX - Counter (loops)
  EDX/RDX - Data

Pointer/Index:
  ESI/RSI - Source index
  EDI/RDI - Destination index
  ESP/RSP - Stack pointer
  EBP/RBP - Base pointer (stack frame)

Special:
  EIP/RIP - Instruction pointer (current instruction)
  EFLAGS/RFLAGS - Flags (zero, carry, overflow, etc.)
```

### Common Instructions

```nasm
; Data Movement
mov eax, 0x1234      ; eax = 0x1234
mov [ebx], eax       ; Write eax to memory at address in ebx
lea eax, [ebx+8]     ; Load effective address (eax = ebx + 8)
push eax             ; Push eax onto stack
pop ebx              ; Pop from stack into ebx

; Arithmetic
add eax, 5           ; eax += 5
sub eax, ebx         ; eax -= ebx
inc ecx              ; ecx++
dec ecx              ; ecx--
imul eax, 2          ; eax *= 2

; Logic
and eax, 0xFF        ; eax &= 0xFF
or eax, ebx          ; eax |= ebx
xor eax, eax         ; eax ^= eax (common way to zero register)
not eax              ; eax = ~eax

; Control Flow
cmp eax, ebx         ; Compare (sets flags)
jmp label            ; Unconditional jump
je label             ; Jump if equal (ZF=1)
jne label            ; Jump if not equal (ZF=0)
jg label             ; Jump if greater
jl label             ; Jump if less
call function        ; Call function (push return address, jump)
ret                  ; Return (pop address, jump)

; String Operations
rep movsb            ; Repeat move string byte (memory copy)
```

### Example: Simple Function

```nasm
; Function: Add two numbers
; int add(int a, int b) {
;     return a + b;
; }

add_function:
    push ebp              ; Save old base pointer
    mov ebp, esp          ; Set up stack frame
    
    mov eax, [ebp+8]      ; Load first parameter (a)
    add eax, [ebp+12]     ; Add second parameter (b)
    
    pop ebp               ; Restore base pointer
    ret                   ; Return (result in eax)
```

### Calling Conventions

**Windows (stdcall)**:
- Arguments pushed right-to-left on stack
- Callee cleans up stack
- Return value in EAX

**Linux (cdecl)**:
- Arguments pushed right-to-left on stack
- Caller cleans up stack
- Return value in EAX/RAX

**x64 (both OS)**:
- First 4 args in registers: RCX, RDX, R8, R9 (Windows) or RDI, RSI, RDX, RCX (Linux)
- Additional args on stack
- Return value in RAX

---

## Hands-On Labs

### Lab 1.1: File Format Identification

**Objective**: Identify file types by analyzing headers, regardless of extension.

**Prerequisites**: Linux/REMnux VM

**Files**: Use samples from `samples/` directory

**Steps**:

1. **Download samples**
   ```bash
   cd ~/labs/module01
   # Samples should be in your cloned repo
   ls ../../samples/benign_toy_app/
   
   # Create test files with wrong extensions
   cp ../../samples/eicar.txt ./test1.jpg
   cp /bin/ls ./test2.pdf
   echo "Just text" > test3.exe
   ```

2. **Use file command**
   ```bash
   file test1.jpg
   # Expected: test1.jpg: EICAR virus test files
   
   file test2.pdf
   # Expected: test2.pdf: ELF 64-bit LSB executable
   
   file test3.exe
   # Expected: test3.exe: ASCII text
   ```

3. **Examine hex headers**
   ```bash
   # View first 16 bytes
   xxd -l 16 test1.jpg
   # Look for: X5O!P%@AP[4\PZX5 (EICAR)
   
   xxd -l 16 test2.pdf
   # Look for: 7F 45 4C 46 (.ELF)
   
   xxd -l 16 test3.exe
   # Look for: 4A 75 73 74 (Just)
   ```

4. **Extract magic bytes**
   ```bash
   # Create script to check magic bytes
   cat > check_magic.sh << 'EOF'
#!/bin/bash
echo "File: $1"
MAGIC=$(xxd -l 4 -p "$1")
echo "Magic bytes: $MAGIC"

case "$MAGIC" in
    7f454c46) echo "Type: ELF executable" ;;
    4d5a9000|4d5a5000) echo "Type: PE executable (Windows)" ;;
    25504446) echo "Type: PDF document" ;;
    504b0304) echo "Type: ZIP archive" ;;
    ffd8ffe0|ffd8ffe1) echo "Type: JPEG image" ;;
    89504e47) echo "Type: PNG image" ;;
    *) echo "Type: Unknown or text" ;;
esac
EOF
   chmod +x check_magic.sh
   
   ./check_magic.sh test1.jpg
   ./check_magic.sh test2.pdf
   ./check_magic.sh test3.exe
   ```

5. **Bulk analysis**
   ```bash
   # Check all files in a directory
   for f in test*; do
       echo "=== $f ==="
       file "$f"
       echo ""
   done
   ```

**Expected Results**:
- `file` command ignores extensions and identifies true types
- Hex dumps reveal actual file signatures
- Script correctly identifies common file types

**Key Takeaway**: Never trust file extensions. Always verify with `file` and hex analysis.

---

### Lab 1.2: Hash Calculation and Verification

**Objective**: Calculate hashes, verify file integrity, and use fuzzy hashing.

**Prerequisites**: REMnux VM or Linux with ssdeep installed

**Steps**:

1. **Calculate basic hashes**
   ```bash
   cd ~/labs/module01
   
   # EICAR test file
   echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.com
   
   # Calculate all hashes
   md5sum eicar.com
   sha1sum eicar.com
   sha256sum eicar.com
   
   # Expected MD5: 44d88612fea8a8f36de82e1278abb02f
   # Expected SHA256: 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f
   ```

2. **Create hash database**
   ```bash
   # Hash all files in samples directory
   find ../../samples -type f -exec sha256sum {} \; > sample_hashes.txt
   
   cat sample_hashes.txt
   ```

3. **Verify integrity**
   ```bash
   # Modify a file slightly
   echo "modified" >> eicar.com
   
   # Recalculate
   sha256sum eicar.com
   # Hash will be completely different!
   
   # Restore original
   echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.com
   ```

4. **Fuzzy hashing with ssdeep**
   ```bash
   # Install if needed
   sudo apt install ssdeep
   
   # Hash EICAR
   ssdeep eicar.com > eicar_hash.txt
   cat eicar_hash.txt
   
   # Create similar file (90% same)
   echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*MODIFIED' > eicar_variant.com
   
   # Compare
   ssdeep -d eicar_hash.txt eicar_variant.com
   # Will show high similarity percentage
   
   # Compare with totally different file
   echo "completely different content" > different.txt
   ssdeep -d eicar_hash.txt different.txt
   # Will show 0% or very low similarity
   ```

5. **Batch fuzzy hashing**
   ```bash
   # Hash all samples
   ssdeep -r ../../samples/ > all_samples_fuzzy.txt
   
   # Find similar files
   ssdeep -d all_samples_fuzzy.txt ../../samples/benign_toy_app/*
   ```

**Expected Results**:
- Cryptographic hashes change completely with minor modifications
- ssdeep detects similarity even with changes
- Hash databases enable quick file identification

**Security Note**: Always hash files before and after analysis to detect tampering.

---

### Lab 1.3: PE File Analysis

**Objective**: Analyze Windows PE file structure and extract metadata.

**Prerequisites**: Windows FLARE-VM or Linux with pefile/rabin2

**Steps**:

1. **Get analysis tools**
   ```bash
   # Linux/REMnux
   sudo apt install radare2
   pip install pefile
   
   # Or use existing tools
   which rabin2
   ```

2. **Analyze PE headers**
   ```bash
   # Using rabin2 (works on Linux for Windows .exe)
   rabin2 -I ../../samples/benign_toy_app/toy_app.exe
   
   # Expected output includes:
   # arch     x86
   # bits     32/64
   # os       windows
   # endian   little
   # machine  i386/AMD64
   ```

3. **Extract imports (functions used)**
   ```bash
   rabin2 -i ../../samples/benign_toy_app/toy_app.exe
   
   # Look for suspicious imports:
   # - VirtualAlloc (memory allocation)
   # - WriteProcessMemory (code injection?)
   # - CreateRemoteThread (process injection?)
   # - InternetOpen (network communication)
   # - CryptEncrypt (encryption)
   ```

4. **View sections**
   ```bash
   rabin2 -S ../../samples/benign_toy_app/toy_app.exe
   
   # Typical sections:
   # .text   - Executable code
   # .data   - Initialized data
   # .rdata  - Read-only data (strings, imports)
   # .rsrc   - Resources (icons, dialogs)
   
   # Suspicious indicators:
   # - High entropy in .text (packed/encrypted)
   # - Executable .data section (self-modifying code)
   # - Unusual section names (.upx, .aspack, etc.)
   ```

5. **Calculate section entropy**
   ```bash
   rabin2 -S ../../samples/benign_toy_app/toy_app.exe | grep -E "perm|entropy"
   
   # Entropy scale: 0-8
   # 0-3: Normal text/code
   # 6-7: Compressed
   # 7-8: Encrypted or packed (suspicious!)
   ```

6. **Python script for detailed analysis**
   ```python
   #!/usr/bin/env python3
   import pefile
   import sys
   
   def analyze_pe(filepath):
       try:
           pe = pefile.PE(filepath)
           
           print(f"[*] Analyzing: {filepath}\n")
           
           # Basic info
           print(f"Machine: {hex(pe.FILE_HEADER.Machine)}")
           print(f"Timestamp: {pe.FILE_HEADER.TimeDateStamp}")
           print(f"Entry Point: {hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)}")
           print(f"Image Base: {hex(pe.OPTIONAL_HEADER.ImageBase)}")
           
           # Sections
           print("\n[*] Sections:")
           for section in pe.sections:
               print(f"  {section.Name.decode().rstrip(chr(0))}")
               print(f"    Virtual Size: {section.Misc_VirtualSize}")
               print(f"    Raw Size: {section.SizeOfRawData}")
               print(f"    Entropy: {section.get_entropy():.2f}")
           
           # Imports
           print("\n[*] Imported DLLs:")
           if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
               for entry in pe.DIRECTORY_ENTRY_IMPORT:
                   print(f"  {entry.dll.decode()}")
                   for imp in entry.imports[:5]:  # First 5
                       if imp.name:
                           print(f"    - {imp.name.decode()}")
           
           pe.close()
           
       except Exception as e:
           print(f"Error: {e}")
   
   if __name__ == "__main__":
       if len(sys.argv) != 2:
           print("Usage: python3 analyze_pe.py <file.exe>")
           sys.exit(1)
       analyze_pe(sys.argv[1])
   ```
   
   Save as `analyze_pe.py` and run:
   ```bash
   python3 analyze_pe.py ../../samples/benign_toy_app/toy_app.exe
   ```

**Expected Results**:
- Successfully extract PE metadata
- Identify imported functions
- Detect high entropy sections (potential packing)

**Red Flags to Watch For**:
- Unusual section names
- High entropy (>7.0)
- Suspicious API imports
- Compile timestamps in the future
- Mismatched sections (virtual vs raw size)

---

### Lab 1.4: ELF Analysis

**Objective**: Analyze Linux ELF binaries.

**Prerequisites**: Linux/REMnux VM

**Steps**:

1. **Basic ELF inspection**
   ```bash
   cd ~/labs/module01
   
   # Copy a system binary for analysis
   cp /bin/ls ./sample_elf
   
   # File type
   file sample_elf
   # Output: ELF 64-bit LSB pie executable, x86-64, dynamically linked
   ```

2. **ELF header analysis**
   ```bash
   # Detailed header
   readelf -h sample_elf
   
   # Key fields:
   # Class: ELF32 or ELF64
   # Data: Little/big endian
   # Type: EXEC (executable), DYN (shared), REL (relocatable)
   # Machine: x86-64, ARM, etc.
   # Entry point address: Where execution starts
   ```

3. **Section analysis**
   ```bash
   # List all sections
   readelf -S sample_elf
   
   # Important sections:
   # .text    - Code
   # .rodata  - Read-only data (strings)
   # .data    - Initialized writable data
   # .bss     - Uninitialized data
   # .plt     - Procedure linkage table
   # .got     - Global offset table
   ```

4. **Symbol table**
   ```bash
   # View symbols (functions, variables)
   readelf -s sample_elf
   
   # Filter to functions
   readelf -s sample_elf | grep FUNC
   ```

5. **Dynamic dependencies**
   ```bash
   # Show linked libraries
   ldd sample_elf
   # Output: 
   #   linux-vdso.so.1
   #   libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
   
   # Or with readelf
   readelf -d sample_elf | grep NEEDED
   ```

6. **Extract strings from .rodata**
   ```bash
   # All strings
   strings sample_elf
   
   # Only from .rodata section
   readelf -p .rodata sample_elf
   ```

7. **Quick malware check script**
   ```bash
   cat > check_elf.sh << 'EOF'
#!/bin/bash
FILE=$1

echo "[*] Analyzing ELF: $FILE"
echo ""

# Check if ELF
file "$FILE" | grep -q "ELF" || { echo "Not an ELF file"; exit 1; }

# Basic info
echo "[+] Architecture:"
readelf -h "$FILE" | grep -E "Class|Machine"

# Check for stripping
echo ""
echo "[+] Stripped?"
readelf -s "$FILE" | grep -q "Symbol table" && echo "No (has symbols)" || echo "Yes (stripped)"

# Suspicious strings
echo ""
echo "[+] Suspicious strings:"
strings "$FILE" | grep -iE "(password|hack|exploit|shell|/tmp/|download)" | head -n 5

# Network capabilities
echo ""
echo "[+] Network functions:"
readelf -s "$FILE" | grep -E "socket|connect|bind|listen" | head -n 3

echo ""
echo "[*] Analysis complete"
EOF
   chmod +x check_elf.sh
   
   ./check_elf.sh sample_elf
   ```

**Expected Results**:
- Successfully parse ELF structure
- Extract symbols and dependencies
- Identify potential capabilities

---

## Knowledge Check

### Quiz Questions

1. **What is the PE file signature?**
   - a) 7F 45 4C 46
   - b) 4D 5A
   - c) 50 4B 03 04
   - d) 25 50 44 46

   <details>
   <summary>Answer</summary>
   b) 4D 5A ("MZ" in ASCII) - Found in the DOS header of PE files
   </details>

2. **Which hash should you use for new projects?**
   - a) MD5
   - b) SHA-1
   - c) SHA-256
   - d) CRC32

   <details>
   <summary>Answer</summary>
   c) SHA-256 - Current standard, collision-resistant
   </details>

3. **What does high entropy (>7.5) in a .text section typically indicate?**
   - a) Normal compiled code
   - b) Packed or encrypted code
   - c) Debug symbols present
   - d) Unicode strings

   <details>
   <summary>Answer</summary>
   b) Packed or encrypted code - High randomness indicates compression/encryption
   </details>

4. **What x86 register holds function return values?**
   - a) EBX
   - b) ECX
   - c) EAX
   - d) EDX

   <details>
   <summary>Answer</summary>
   c) EAX (or RAX in x64)
   </details>

5. **Which Windows API is commonly used for code injection?**
   - a) CreateFile
   - b) WriteProcessMemory
   - c) RegSetValue
   - d) CreateDirectory

   <details>
   <summary>Answer</summary>
   b) WriteProcessMemory - Writes to another process's memory space
   </details>

---

## Practical Exercise

### Challenge: Identify the Imposter

You've been given 5 files. One is actually a Windows executable disguised with a wrong extension. Find it!

**Files** (create these):
```bash
cd ~/labs/module01/challenge

# File 1: Real image
wget https://via.placeholder.com/150 -O file1.jpg

# File 2: Real PDF (create dummy)
echo "%PDF-1.4" > file2.pdf

# File 3: Real text
echo "This is a text file" > file3.txt

# File 4: Copy of /bin/ls renamed (the imposter!)
cp /bin/ls file4.jpg

# File 5: ZIP archive
echo "test" | zip file5.zip -
```

**Your Tasks**:
1. Use `file` command to identify types
2. Check magic bytes with `xxd`
3. Find the imposter
4. Determine its real type
5. Extract any strings that might indicate its purpose

**Solution in**: `solutions/module01_challenge.md`

---

## Summary

In this module, you learned:
- ✅ File formats (PE, ELF, magic bytes)
- ✅ Cryptographic hashing (MD5, SHA-256, ssdeep)
- ✅ Windows and Linux process architecture
- ✅ File system artifacts and timestamps
- ✅ Assembly language basics (x86/x64)
- ✅ How to analyze executable headers

**Key Takeaways**:
- Never trust file extensions
- Always verify file types with signatures
- Hashes provide unique fingerprints
- Understanding PE/ELF structure is essential
- Basic assembly knowledge helps in analysis

**Next Module**: [Module 02 - Static Analysis](02_static-analysis.md) - Deep dive into analyzing files without execution.

---

## Suggested Reading

### Books
- *Practical Malware Analysis* - Sikorski & Honig (Chapters 1-3)
- *The Art of Assembly Language* - Randall Hyde
- *Windows Internals* - Russinovich & Solomon

### Online Resources
- [PE Format Specification](https://docs.microsoft.com/en-us/windows/win32/debug/pe-format)
- [ELF Format Specification](https://refspecs.linuxfoundation.org/elf/elf.pdf)
- [Intel x86 Instruction Set Reference](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Microsoft Windows API Documentation](https://docs.microsoft.com/en-us/windows/win32/api/)

### Tools Documentation
- [pefile Python library](https://github.com/erocarrera/pefile)
- [radare2 Book](https://book.rada.re/)
- [ssdeep Guide](https://ssdeep-project.github.io/ssdeep/index.html)

---

*Module completed. Continue to [Module 02 - Static Analysis](02_static-analysis.md)*
