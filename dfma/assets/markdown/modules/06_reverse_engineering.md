# Module 06: Reverse Engineering Basics

## Learning Objectives

By the end of this module, you will:
- Navigate and read disassembly in radare2 (command line) and Ghidra (GUI)
- Identify functions, loops, and conditionals in x86-64 assembly
- Reconstruct high-level logic from disassembly without source code
- Manually decode the XOR routine in `toy_app_linux`
- Recognise common malware code patterns: XOR loops, string construction, anti-debug checks
- Patch a binary to change its behaviour without recompiling

---

## 1. What Reverse Engineering Adds

Static analysis tells you what strings and imports a binary contains. Dynamic analysis tells you what it does when it runs. Reverse engineering tells you *how* it does it — the actual logic, the exact algorithm, the precise conditions under which each behaviour triggers.

You need reverse engineering when:

- The sample is packed and dynamic analysis alone does not give you the full picture
- You need to understand a novel encryption algorithm to decrypt captured C2 traffic
- You want to write a precise YARA rule based on a specific code pattern, not just strings
- The malware has a kill switch or self-destruct condition you need to understand before detonating it
- You are building a decryptor for ransomware victims

For this course, the goal is not to become a full reverse engineer — that takes years. The goal is to read enough disassembly to understand what a function does and to confirm or extend what static and dynamic analysis already found.

---

## 2. Tool Installation on Ubuntu

### radare2 — Command-Line Disassembler

```bash
sudo apt install -y radare2

# Verify
r2 -v

# Install Cutter (radare2 GUI frontend — optional but useful)
sudo apt install -y flatpak
flatpak install flathub re.rizin.Cutter
```

### Ghidra — Free NSA Decompiler

Ghidra is the most capable free tool for reverse engineering. It disassembles AND decompiles — turning assembly back into readable C-like pseudocode.

```bash
# Install Java (Ghidra requires JDK 17+)
sudo apt install -y openjdk-21-jdk

# Download Ghidra from the official release page
# https://github.com/NationalSecurityAgency/ghidra/releases
# Current stable: ghidra_11.x.x_PUBLIC

wget https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_11.1.2_build/ghidra_11.1.2_PUBLIC_20240709.zip \
    -O ~/ghidra.zip

unzip ~/ghidra.zip -d ~/tools/
ln -s ~/tools/ghidra_11.1.2_PUBLIC/ghidraRun ~/bin/ghidra

# Launch
ghidra
```

### objdump — Always Available

`objdump` ships with `binutils` which is installed on every Ubuntu system. It is less interactive than radare2 but requires no installation:

```bash
# Basic disassembly of the text section
objdump -d -M intel /bin/ls | head -60

# Disassemble with source interleaving (if binary has debug symbols)
objdump -d -S -M intel toy_app_linux | head -80

# Show all sections
objdump -x toy_app_linux
```

### GDB — Debugger for Dynamic RE

```bash
sudo apt install -y gdb gdb-peda

# PEDA (Python Exploit Development Assistance) makes GDB more readable
git clone https://github.com/longld/peda.git ~/peda
echo "source ~/peda/peda.py" >> ~/.gdbinit
```

---

## 3. radare2 Crash Course

radare2 uses a command-line REPL. Every command is a letter or sequence of letters. It is cryptic at first but faster than any GUI once you know it.

### Opening a Binary

```bash
# Open for analysis (read-only)
r2 samples/benign_toy_app/toy_app_linux

# Open with auto-analysis (slower but gives function names)
r2 -A samples/benign_toy_app/toy_app_linux
```

### Essential Commands

```
[0x00401060]> ?           # help
[0x00401060]> aaa         # analyse all (functions, xrefs, strings)
[0x00401060]> afl         # list all functions
[0x00401060]> afl | grep  main    # find main function
[0x00401060]> s main      # seek (jump) to main
[0x00401060]> pdf         # print disassembly of current function
[0x00401060]> pdc         # print decompiled C (rough pseudocode)
[0x00401060]> iz          # list strings in data sections
[0x00401060]> iE          # list exports (function symbols)
[0x00401060]> ii          # list imports
[0x00401060]> is          # list symbols
[0x00401060]> /           # search
[0x00401060]> / ANALYSIS  # search for string "ANALYSIS"
[0x00401060]> xrefs       # cross-references to current address
[0x00401060]> VV          # visual graph mode (function call graph)
[0x00401060]> V            # visual mode (scrollable disassembly)
[0x00401060]> q           # quit
```

### Reading the Output

```
[0x00401200]> pdf
┌ 87: int main (int argc, char **argv);
│           ; var int64_t var_4h @ rbp-0x4
│           0x00401200      push rbp
│           0x00401201      mov rbp, rsp
│           0x00401204      sub rsp, 0x10
│           0x00401208      mov dword [rbp - 4], 0
│       ┌─> 0x0040120c      mov eax, dword [rbp - 4]    ; loop counter
│       ╎   0x0040120f      cmp eax, 0xb                ; compare to 11 (len-1)
│       └─< 0x00401212      jge 0x401230                ; exit loop if >= 11
│           0x00401214      mov eax, dword [rbp - 4]    ; i
│           0x00401217      cdqe
│           0x00401219      movzx eax, byte [rbp+rax-0x20]  ; encoded[i]
│           0x0040121e      xor eax, 0x41               ; XOR with key 0x41
│           0x00401221      mov edx, eax
│           0x00401223      mov eax, dword [rbp - 4]    ; i
│           0x00401226      cdqe
│           0x00401228      mov byte [rbp+rax-0x20], dl  ; write back
│           0x0040122c      add dword [rbp - 4], 1       ; i++
│           └─< 0x00401230  jmp 0x40120c                 ; back to loop top
```

You are reading the `xor_decode` function from `toy_app.c`. Without the source code, you can determine:
- There is a loop (`jge` at `0x401212` with a `jmp` back at `0x401230`)
- The loop counter runs from 0 to 10 (compare to `0xb` = 11)
- Each iteration reads a byte, XORs it with `0x41`, and writes it back
- This is a single-byte XOR decryption with key `0x41`

That conclusion matches exactly what the source code does. That is reverse engineering.

---

## 4. Reading Common Code Patterns

Learn to recognise these patterns on sight. They appear in almost every binary you will analyse.

### Pattern 1 — XOR Loop (Deobfuscation)

```nasm
; Canonical XOR decode loop — appears in thousands of malware samples
; Decodes a buffer of `len` bytes with single-byte key `key`

xor_loop:
    xor al, [key]           ; al = encoded_byte XOR key
    stosb                   ; store decoded byte, advance pointer
    dec ecx                 ; decrement counter
    jnz xor_loop            ; repeat until counter = 0
```

What to extract:
- The XOR key (the value in `[key]` or an immediate like `xor al, 0x41`)
- The length of the encoded buffer (the initial value loaded into `ecx`)
- The location of the encoded data (address loaded into `esi` or `edi` before the loop)

### Pattern 2 — String Construction (Anti-Static Analysis)

```nasm
; Malware builds strings at runtime to avoid appearing in strings output
; Example: constructing "cmd.exe" on the stack byte by byte

mov byte [rbp-8], 0x63    ; 'c'
mov byte [rbp-7], 0x6d    ; 'm'
mov byte [rbp-6], 0x64    ; 'd'
mov byte [rbp-5], 0x2e    ; '.'
mov byte [rbp-4], 0x65    ; 'e'
mov byte [rbp-3], 0x78    ; 'x'
mov byte [rbp-2], 0x65    ; 'e'
mov byte [rbp-1], 0x00    ; null terminator
lea rdi, [rbp-8]          ; rdi = pointer to "cmd.exe"
call execve
```

How to spot it: a sequence of `mov byte` instructions writing single bytes to consecutive stack offsets, followed by a function call using that stack region as an argument.

### Pattern 3 — Conditional API Call (Anti-Debug / Evasion)

```nasm
; Check if a debugger is present before executing payload
call IsDebuggerPresent     ; Windows API
test eax, eax             ; sets ZF if eax == 0
jnz exit_clean            ; if debugger found: exit without running payload
                          ; otherwise: fall through to payload
call payload_function
```

Linux equivalent (checking ptrace):

```nasm
; A process can only be ptraced by one parent at a time
; If ptrace(PTRACE_TRACEME) fails, something is already tracing us
mov eax, 101              ; syscall number for ptrace
mov edi, 0                ; PTRACE_TRACEME
xor esi, esi
xor edx, edx
xor r10d, r10d
syscall
cmp rax, 0                ; if ptrace returned error
jl  being_debugged        ; we are being traced
```

### Pattern 4 — Process/DLL Injection Triad (Windows PE)

```nasm
; Step 1: Open target process
push 0x1F0FFF             ; PROCESS_ALL_ACCESS
push 0                    ; bInheritHandle
push [target_pid]
call OpenProcess
mov [hProcess], eax

; Step 2: Allocate memory in target
push PAGE_EXECUTE_READWRITE   ; 0x40
push MEM_COMMIT               ; 0x1000
push [payload_size]
push 0                        ; lpAddress = any
push [hProcess]
call VirtualAllocEx
mov [remote_addr], eax

; Step 3: Write shellcode
push 0                        ; lpNumberOfBytesWritten
push [payload_size]
push [payload_ptr]
push [remote_addr]
push [hProcess]
call WriteProcessMemory

; Step 4: Execute
push 0 0 0 0 0
push [remote_addr]
push [hProcess]
call CreateRemoteThread
```

When you see `OpenProcess` → `VirtualAllocEx` → `WriteProcessMemory` → `CreateRemoteThread` in sequence in a call graph, that is the injection triad. Identical logic in different languages, different malware families, different packers — the underlying pattern is always the same.

---

## 5. Hands-On: Reversing the XOR Routine in toy_app

This is a guided exercise. You already know what the code does from reading the source. The goal is to find it independently using only the binary.

### Step 1 — Disassemble and List Functions

```bash
cd ~/labs/module06
gcc -o toy_app ~/course/samples/benign_toy_app/toy_app.c

# Open in radare2 with auto-analysis
r2 -A toy_app
```

Inside radare2:

```
[0x00401060]> afl
# Look for: main, xor_decode, write_log, do_calculations, print_system_info
# They will have addresses like 0x004011a0

[0x00401060]> afl | grep xor
# Should show: 0x004011XX   xor_decode
```

### Step 2 — Find the Encoded Buffer via Strings

```
[0x00401060]> iz
# Lists all strings in the binary
# Look for the log message "XOR decode completed"
# Its address gives you context for nearby code
```

### Step 3 — Disassemble xor_decode

```
[0x00401060]> s sym.xor_decode    # seek to the function
[0x004011XX]> pdf                  # disassemble it
```

What you are looking for:

```nasm
; The XOR key — should appear as an immediate value
xor byte [rdi + rax], 0x41    ; key is 0x41 = 65 = 'A'

; Or as a register-loaded value
mov al, byte [rbp - 1]        ; al = key
xor byte [rdi + rcx], al      ; key applied to each byte
```

Record: the key value, the loop structure, how the function is called from `main`.

### Step 4 — Find the Encoded Data

```
[0x00401060]> s main
[0x00401060]> pdf
# Find the call to xor_decode
# The arguments loaded before the call are:
#   rdi = pointer to encoded buffer
#   rsi = length of buffer
#   rdx = XOR key (0x41)
```

The encoded buffer is a static array in the binary. Find its address:

```
[0x00401060]> / \x09\x24\x2d\x2d\x2e\x70    # search for first 6 encoded bytes
# radare2 will show the address where they live
```

### Step 5 — Manually Decode

You now have:
- Encoded bytes: `09 24 2d 2d 2e 70 16 2e 33 2d 25 00`
- Key: `0x41`

Decode by hand or with Python:

```python
encoded = [0x09, 0x24, 0x2d, 0x2d, 0x2e, 0x70, 0x16, 0x2e, 0x33, 0x2d, 0x25]
key = 0x41
decoded = ''.join(chr(b ^ key) for b in encoded)
print(decoded)   # Hello1World
```

Cross-reference: run `toy_app` and confirm the printed decoded string matches.

---

## 6. Ghidra Workflow

Ghidra's decompiler is the most significant productivity multiplier in modern RE. It converts assembly to C-like pseudocode automatically. It is not always correct, but it is correct enough to understand logic in a fraction of the time raw disassembly takes.

### Loading a Binary

1. Launch Ghidra: `ghidra` or `~/tools/ghidra_11.x.x_PUBLIC/ghidraRun`
2. Create a new project: File → New Project → Non-Shared Project
3. Import binary: File → Import File → select `toy_app_linux`
4. Double-click the imported file to open the Code Browser
5. Click "Analyse Now" when prompted — use defaults
6. Wait for analysis to complete (10–60 seconds for small binaries)

### The Ghidra Interface

```
┌─────────────────────────────────────────────────────┐
│  Program Trees  │      Listing (Disassembly)        │
│  (sections,     │                                   │
│   namespaces)   │  0040120c  MOV EAX, dword ptr     │
│                 │            [RBP + local_8]        │
├─────────────────│  0040120f  CMP EAX, 0xb           │
│  Symbol Tree    │  00401212  JGE  LAB_00401230      │
│  (functions,    │  00401214  MOV EAX, dword ptr     │
│   labels,       │            [RBP + local_8]        │
│   imports)      │                                   │
├─────────────────┼───────────────────────────────────┤
│  Data Type Mgr  │      Decompiler (C pseudocode)    │
│                 │                                   │
│                 │  void xor_decode(uchar *buf,      │
│                 │                  size_t len,      │
│                 │                  uchar key) {     │
│                 │    for (int i = 0; i < len; i++)  │
│                 │      buf[i] ^= key;               │
│                 │  }                                │
└─────────────────┴───────────────────────────────────┘
```

### Finding the XOR Function in Ghidra

1. Window → Symbol Tree → Functions → look for `xor_decode`
2. Double-click `xor_decode` — both the Listing and Decompiler panels update
3. In the Decompiler panel, read the pseudocode directly

The decompiler output for `xor_decode` from `toy_app.c` should look like:

```c
void xor_decode(byte *buf, size_t len, byte key)
{
    size_t i;
    for (i = 0; i < len; i++) {
        buf[i] = buf[i] ^ key;
    }
    return;
}
```

That is the source code, reconstructed from machine code with no prior knowledge.

### Renaming Variables and Functions

Ghidra uses generic names like `param_1`, `local_8`, `DAT_00404020`. Rename them as you understand the code:

- Right-click a variable → Rename Variable
- Right-click a function → Rename Function
- `L` key on a label → rename label

Build up a map: `param_1` → `buf`, `param_2` → `len`, `param_3` → `key`. After renaming, the decompiler output looks like your own commented code.

### Cross-References (XREFs)

The most powerful navigation feature in Ghidra:

```
Right-click a function name → References → Show References to
```

This shows every location in the binary that calls or references the function. For `xor_decode`, you will see exactly one call site — from `main`. Click it to jump there and see the arguments passed.

For a real malware sample, XREFs on suspicious functions like `VirtualAllocEx` immediately show every location that calls it — the injection sites.

---

## 7. Binary Patching

Patching means modifying the binary's bytes to change its behaviour. Common use cases:

- Remove an anti-debug check so you can run the sample in a debugger
- Skip a sleep call so dynamic analysis is not waiting an hour
- Force a conditional jump to always take the branch you want
- Neutralise a self-destruct or kill-switch

### Patching with radare2

```bash
# Open in WRITE mode
r2 -w toy_app

# Find the conditional jump after an anti-debug check
[0x00401060]> s sym.main
[0x00401060]> pdf
# Look for: jnz exit_label (jump if debugger found)
# Address example: 0x00401250

# Seek to the jump instruction
[0x00401060]> s 0x00401250

# View current bytes
[0x00401250]> px 4
# 75 20 = JNZ +0x20  (jump if not zero, i.e. if debugger present)

# Patch: replace JNZ (0x75) with two NOP instructions (0x90 0x90)
[0x00401250]> wx 9090

# Verify the patch
[0x00401250]> px 4
# 90 90 = NOP NOP  (no operation — effectively removed the jump)

# Save and quit
[0x00401250]> q
```

### Patching in Ghidra

Ghidra patches through the Instruction Patcher or direct byte editing:

1. Find the instruction to patch in the Listing view
2. Right-click → Patch Instruction
3. Type the replacement instruction (e.g. `NOP`)
4. File → Export Program → Original File (saves patched binary)

### What to Patch in the Toy Samples

`toy_app_enumeration.c` has this logic:

```c
if (flagged > 0) {
    printf("[!] Real malware would EXIT here\n");
    // Real malware would: exit(0);
    // This sample continues...
}
```

Exercise: find the `cmp` and conditional `jmp` in the disassembly that corresponds to the `if (flagged > 0)` check. Patch the jump to always skip the exit path (NOP the jump or replace with an unconditional jump past the exit block).

---

## 8. GDB Dynamic Reverse Engineering

When static analysis alone does not answer a question, use a debugger to run the binary and observe values at specific points.

```bash
# Load binary in GDB
gdb ./toy_app

# Set a breakpoint at xor_decode
(gdb) break xor_decode
(gdb) run

# When breakpoint hits, inspect arguments
(gdb) info registers rdi rsi rdx
# rdi = pointer to encoded buffer
# rsi = length (11)
# rdx = key (0x41)

# View the encoded bytes before decoding
(gdb) x/12bx $rdi
# 0x404040: 0x09 0x24 0x2d 0x2d 0x2e 0x70 0x16 0x2e 0x33 0x2d 0x25 0x00

# Step through the decode loop
(gdb) next
(gdb) next
# After each step, check the buffer
(gdb) x/12bx $rdi
# Bytes are being decoded one at a time

# Let the function complete
(gdb) finish

# View decoded buffer
(gdb) x/s <address of buffer>
# Output: "Hello1World"
```

### GDB Commands Reference

```
break <function>        Set breakpoint at function entry
break *0xADDRESS       Set breakpoint at specific address
run                    Start execution
continue (c)           Resume after breakpoint
next (n)               Step over (execute current line)
step (s)               Step into (enter function calls)
finish                 Run until current function returns
info registers         Show all register values
x/16bx $rsp            Examine 16 bytes at stack pointer (hex)
x/s $rdi               Examine string at rdi
x/i $rip               Show instruction at current position
disassemble            Disassemble current function
set $rax = 0           Override register value (bypasses checks)
info breakpoints       List all breakpoints
delete 1               Delete breakpoint 1
quit (q)               Exit GDB
```

---

## 9. RE Workflow Summary

Apply this sequence to any unknown binary:

```
1. strings -n 8 binary
   → Surface obvious IOCs, identify if packed

2. rabin2 -I binary  /  readelf -h binary
   → Architecture, entry point, compiler version

3. rabin2 -i binary  /  readelf -d binary | grep NEEDED
   → Import table — infer capabilities

4. r2 -A binary → afl
   → List all identified functions
   → Look for suspicious names: decrypt, decode, inject, persist

5. r2 -A binary → s main → pdf
   → Read main: what does the program do at startup?
   → Follow calls to interesting functions

6. For each interesting function:
   a. pdf   → read disassembly
   b. pdc   → read rough pseudocode
   c. iz    → find strings referenced from this function
   d. xrefs → find every call site

7. Ghidra decompiler
   → For complex functions, use Ghidra's decompiler
   → Rename variables as you understand them
   → Export annotated project for documentation

8. GDB for dynamic confirmation
   → Set breakpoint at key function
   → Confirm argument values at runtime
   → Observe decoded data in memory

9. Document findings
   → Key functions and their purpose
   → Decoded strings / algorithms
   → IOCs extracted
   → YARA rule candidates
```

---

## Hands-On Labs

### Lab 6.1: Finding and Decoding the XOR Routine

**Objective:** Reverse engineer `toy_app_linux` without reading its source code to find and manually decode the XOR-encoded string.

**Time estimate:** 45 minutes

**Setup:**

```bash
mkdir -p ~/labs/module06
cd ~/labs/module06
gcc -o toy_app ~/course/samples/benign_toy_app/toy_app.c
```

**Tasks:**

1. Open `toy_app` in radare2 with auto-analysis:
   ```bash
   r2 -A toy_app
   ```

2. List all functions. How many did radare2 identify? Which names suggest interesting logic?
   ```
   [0x...]> afl
   ```

3. Seek to `sym.xor_decode` and disassemble it:
   ```
   [0x...]> s sym.xor_decode
   [0x...]> pdf
   ```
   Identify: (a) the XOR key, (b) the loop bounds, (c) whether it operates in-place or output to a new buffer.

4. Seek to `main` and find the call to `xor_decode`. What three arguments are passed?
   ```
   [0x...]> s main
   [0x...]> pdf
   ```
   Look for the `call sym.xor_decode` and the `mov`/`lea` instructions immediately before it.

5. Find the encoded buffer. Search for its first bytes:
   ```
   [0x...]> / \x09\x24\x2d
   ```
   Note the address. Examine 12 bytes from that address:
   ```
   [0x...]> s <address>
   [0x...]> px 12
   ```

6. Decode manually with Python:
   ```python
   encoded = [0x09, 0x24, 0x2d, 0x2d, 0x2e, 0x70,
              0x16, 0x2e, 0x33, 0x2d, 0x25]
   print(''.join(chr(b ^ 0x41) for b in encoded))
   ```

7. Confirm by running `./toy_app` and checking the printed decoded string matches.

8. Write a one-paragraph RE note documenting your findings — as if explaining to a colleague what this function does and why it matters.

---

### Lab 6.2: Mapping the Persistence Sample

**Objective:** Map the function call graph of `toy_persistence_linux` and identify the drop and persistence functions without reading source code.

**Time estimate:** 30 minutes

```bash
gcc -o toy_persistence ~/course/samples/benign_toy_app/toy_app_persistence.c
r2 -A toy_persistence
```

**Tasks:**

1. List all functions. Which ones sound like they involve file operations or persistence?

2. Disassemble `sym.drop_file`. What path does it construct? How does it call `fopen`?

3. Find the constant strings associated with the drop path. Use `iz` to list strings, then find which function references them using XREFs.

4. Disassemble `sym.simulate_cron_persistence`. What is the final string written to `/tmp/cron_demo`?

5. Identify the two `strncpy`/`strncat` calls that build the registry key path string from parts. This is the split-string anti-static-analysis technique from Module 02. In disassembly, what does this look like?

6. Draw a simple call graph (pen and paper or text diagram):
   ```
   main
   ├── print_persistence_theory
   ├── drop_file
   │   └── fopen → fwrite → fclose
   └── simulate_cron_persistence
       ├── strncpy  (build path)
       ├── strncat  (append second part)
       └── fopen → fwrite → fclose
   ```

---

### Lab 6.3: Ghidra Decompiler Exercise

**Objective:** Use Ghidra's decompiler to reconstruct the `enumerate_processes` function from `toy_enum_linux`.

**Time estimate:** 45 minutes

```bash
gcc -o toy_enum ~/course/samples/benign_toy_app/toy_app_enumeration.c
```

**Tasks:**

1. Load `toy_enum` in Ghidra. Let it auto-analyse.

2. In the Symbol Tree, find `enumerate_processes` (or the function at the address `main` calls first).

3. Read the decompiler output. Rename the variables:
   - The `DIR *` variable (return value of `opendir`) → `proc_dir`
   - The `struct dirent *` variable → `entry`
   - The counter variable → `proc_count`

4. Find the `check_sandbox_keyword` function. In the decompiler output, what does the comparison loop look like? Can you identify the keyword array from the decompiled code?

5. Find the XOR between the `pslist`/`psscan` concept and what you see here: the function uses `readdir` to walk `/proc`. Is this different from what `pslist` does in Volatility? How?

6. Export the Ghidra project (File → Archive Current Project). This is how you preserve annotated RE work.

---

### Lab 6.4: Patch the Anti-Analysis Check

**Objective:** Patch `toy_enum_linux` to remove the "analysis tool detected → would exit" branch.

**Time estimate:** 20 minutes

In `toy_app_enumeration.c`, the real code says:

```c
if (flagged > 0) {
    printf("[!] Real malware would EXIT here to evade analysis\n");
    // We continue instead — but real malware exits here
}
```

In disassembly, this is a `cmp` + conditional `jmp`. Find it and NOP out the jump.

```bash
# Open in write mode
r2 -w toy_enum

# Find the relevant code
[0x...]> s sym.enumerate_processes
[0x...]> pdf
# Scan for: cmp followed by je/jne/jg/jle
# The one after the flagged counter check is your target

# Note the address of the conditional jump
# Example: 0x00401234   jg 0x00401250

# Seek to it and patch with NOPs
[0x...]> s 0x00401234
[0x...]> wa nop       # radare2 assembler — writes correct NOP
[0x...]> wa nop       # second NOP if instruction was 2 bytes
[0x...]> pdf          # verify the patch
[0x...]> q

# Run the patched binary with analyst tools "present"
# (Simulate by running it — in a real scenario you'd have wireshark open)
./toy_enum
# The "would EXIT" message should now be absent
```

---

## Knowledge Check

1. **You see this in disassembly:**
   ```nasm
   xor eax, eax
   ```
   **Is this XOR decryption? What is it actually doing?**

   <details>
   <summary>Answer</summary>
   No. XORing a register with itself always produces zero regardless of the original value. This is the standard way to zero a register in x86 — it is two bytes shorter than `mov eax, 0` and compiles to a single clock cycle. You will see this constantly. It is not obfuscation; it is a compiler optimisation.
   </details>

2. **A function's disassembly shows a loop that calls `GetProcAddress` with different string arguments on each iteration. What is this pattern?**

   <details>
   <summary>Answer</summary>
   Dynamic API resolution — the malware avoids having function names in its import table (which would appear in static analysis) by looking them up at runtime using GetProcAddress. The import table for this binary may show nothing suspicious, but it is actually calling VirtualAllocEx, WriteProcessMemory, etc. You need to find the string arguments being passed to GetProcAddress to discover the real API usage.
   </details>

3. **The Ghidra decompiler shows a function that takes a `char *` argument and returns an `int`. Inside, there is a comparison against a list of strings using `strcmp`. What should you do to understand this function?**

   <details>
   <summary>Answer</summary>
   Find the string list it compares against — these are the keywords being checked. Use XREFs to find every call site and examine what string is passed as the argument. Rename the function to reflect what it checks (e.g. `is_sandbox_process`). This is likely sandbox/analyst detection. Document the full keyword list as static IOCs and write a YARA rule targeting the list.
   </details>

4. **You want to bypass an `IsDebuggerPresent` check in a Windows PE. The instruction sequence is:**
   ```nasm
   call IsDebuggerPresent
   test eax, eax
   jnz  0x00401500    ; jump to exit if debugger found
   ```
   **What is the minimum change needed to bypass this?**

   <details>
   <summary>Answer</summary>
   Two options: (1) NOP out the `jnz` instruction (replace its bytes with 0x90 0x90), so the check runs but the jump never happens regardless of the result. (2) Replace `jnz` with `jz` — now the code only jumps to exit if there is NO debugger, which is never true when you are debugging. Option 1 is cleaner. The `call IsDebuggerPresent` and `test eax, eax` can stay — they do nothing without the jump.
   </details>

5. **Why is the Ghidra decompiler output not always perfectly accurate, and how should you treat it?**

   <details>
   <summary>Answer</summary>
   Decompilation is a lossy reverse process. The compiler discarded variable names, type information, and sometimes restructured code for optimisation. Ghidra reconstructs this based on heuristics that are sometimes wrong — misidentified types, missed function boundaries, incorrect loop structures. Treat decompiler output as a starting point and hypothesis, not ground truth. Always cross-check suspicious decompiler output against the raw disassembly. The disassembly is always authoritative.
   </details>

---

## Summary

In this module you covered:
- ✅ radare2 command-line disassembly: navigation, function listing, string search
- ✅ Reading x86-64 disassembly: loops, conditionals, function calls
- ✅ Common malware code patterns: XOR loops, stack string construction, API call sequences
- ✅ Manually decoding the toy_app XOR routine from disassembly alone
- ✅ Ghidra decompiler: loading, analysis, variable renaming, XREFs
- ✅ Binary patching: NOP-ing unwanted branches in radare2 and Ghidra
- ✅ GDB for dynamic confirmation of RE findings
- ✅ A repeatable RE workflow applicable to any unknown binary

**Key mindset:** You are not trying to understand every single instruction. You are looking for the interesting functions — the ones that decode, inject, communicate, persist. Find them, understand their logic, document what they do. Everything else is noise.

**Next Module:** [Module 07 — Reporting and IOCs](07_reporting_iocs.md) — turn every finding from Modules 02–06 into actionable intelligence: formal reports, STIX bundles, and structured IOC sharing.

---

## Suggested Reading

- *Practical Malware Analysis* — Sikorski & Honig, Chapters 4–6 (assembly, static tools, RE)
- [Ghidra Course by NSA](https://ghidra.re/courses/GhidraClass/) — free official training
- [radare2 Book](https://book.rada.re/) — comprehensive reference
- [x86-64 Assembly Reference](https://www.felixcloutier.com/x86/) — every instruction explained
- [OpenSecurityTraining2 — Architecture 1001](https://ost2.fyi/) — free x86 RE course
- [Malware Unicorn RE Workshops](https://malwareunicorn.org/#/workshops) — free hands-on RE labs

---

*Module complete. Continue to [Module 07 — Reporting and IOCs](07_reporting_iocs.md)*
