# Lab 06 — Reverse Engineering

**Module:** 06 — Reverse Engineering  
**Estimated time:** 90–120 minutes  
**Difficulty:** Intermediate–Advanced  
**Flag:** `FLAG{re_xor_key_0x41_decoded_ANALYSIS_DEMO}`

---

## Objectives

By the end of this lab you will:
- Disassemble a Linux ELF binary using `objdump` and `radare2`
- Identify XOR encoding routines in disassembly
- Extract and decode obfuscated strings without running the binary
- Patch a binary to bypass a conditional check
- Confirm findings using the Ghidra decompiler

---

## Prerequisites

```bash
sudo apt install -y radare2 gdb binutils
pip3 install capstone --break-system-packages
```

Compile the target binary:

```bash
cd ~/course/samples/benign_toy_app
gcc -o toy_app_linux toy_app.c
cp toy_app_linux ~/labs/lab06/
mkdir -p ~/labs/lab06
cp toy_app_linux ~/labs/lab06/target
```

---

## Part 1 — Initial Recon (Static, No Execution)

**Task 1.1** — Check basic binary properties:

```bash
cd ~/labs/lab06
file target
checksec --file=target 2>/dev/null || readelf -l target | grep -E "GNU_STACK|RELRO"
```

Note whether the stack is executable and whether PIE is enabled. Both affect how you approach debugging.

**Task 1.2** — Find all functions:

```bash
objdump -d target | grep "^[0-9a-f]* <" | head -30
```

List every function you see. Which ones look custom vs standard library?

**Task 1.3** — Find the XOR routine. Real malware rarely labels its decryption function helpfully. Search for XOR instructions:

```bash
objdump -d target | grep -A 2 -B 2 "xor"
```

Count how many XOR operations appear. Note the instruction addresses.

---

## Part 2 — Tracing the XOR Loop

**Task 2.1** — Disassemble the full `main` function:

```bash
objdump -d target | awk '/^[0-9a-f]* <main>/,/^[0-9a-f]* <[^>]*>/' | head -80
```

**Task 2.2** — Find the loop structure. Look for a `cmp` followed by a conditional jump (`jle`, `jne`, `jl`) within 20 instructions of an `xor`. That pattern is the XOR decode loop. Write down:
- The address of the XOR instruction
- The register holding the key
- The register holding the loop counter
- The jump-back address (bottom of the loop)

**Task 2.3** — Using `radare2`, confirm the loop bounds:

```bash
r2 target
> aaa
> pdf @ main
```

Look for the `xor` inside a loop. The key value will appear as an immediate operand. What is it?

<details>
<summary>Hint — what to look for</summary>

The key appears as a hex immediate in an instruction like `xor byte [rbp + rax], 0x41`. The value `0x41` is the XOR key.

</details>

---

## Part 3 — Extracting the Encoded String

**Task 3.1** — Find where the encoded byte array lives. Search the data section:

```bash
objdump -s -j .rodata target | head -40
objdump -s -j .data target | head -40
```

**Task 3.2** — The encoded string is a sequence of bytes that produce readable ASCII when XORed with the key you found. Write a Python decoder:

```python
#!/usr/bin/env python3
# Save as ~/labs/lab06/decode.py

encoded = [
    # paste the hex bytes from the .rodata or .data section here
    # example: 0x48, 0x34, 0x2d, ...
]

key = 0x41  # replace with key you found

decoded = ''.join(chr(b ^ key) for b in encoded)
print(f"Decoded: {decoded}")
```

**Task 3.3** — Run the decoder. The output should be a recognisable string. What does it say?

**Task 3.4** — Verify by running the binary and comparing output:

```bash
./target
```

Does the runtime output match your static decode? If yes, your key extraction was correct.

> **CTFd Flag:** The decoded string contains the answer. Format it as: `FLAG{re_xor_key_0x41_decoded_ANALYSIS_DEMO}`  
> Submit this flag on the course platform to complete Part 3.

---

## Part 4 — Binary Patching

The binary has a conditional check — if a counter variable exceeds zero, it prints a warning and exits early. Your goal: patch the binary so it always skips that exit path.

**Task 4.1** — Find the conditional jump. In `radare2`:

```bash
r2 target
> aaa
> pdf @ main
```

Look for a `cmp` followed by `jg` or `jne` near the string `Analysis complete`. Note the address of the jump instruction.

**Task 4.2** — Patch the jump to a NOP (no operation). In `radare2` write mode:

```bash
r2 -w target
> aaa
> wa nop @ <address_of_jump>
> wa nop @ <address_of_jump+1>
> q
```

**Task 4.3** — Run the patched binary. Does it behave differently? Document what changed.

**Task 4.4** — Restore the original:

```bash
cp ~/course/samples/benign_toy_app/toy_app_linux ~/labs/lab06/target
```

---

## Part 5 — Debugging with GDB

**Task 5.1** — Set a breakpoint at the XOR loop and inspect the key at runtime:

```bash
gdb ./target
(gdb) break main
(gdb) run
(gdb) disassemble main
```

Find the XOR instruction address from the disassembly. Set a breakpoint on it:

```bash
(gdb) break *0x<address>
(gdb) continue
(gdb) info registers
```

What value is in the register used as the XOR key? Does it match what you found statically?

**Task 5.2** — Watch the decode loop execute. After hitting the XOR breakpoint:

```bash
(gdb) display/c $al
(gdb) continue
```

Press `c` repeatedly to step through the loop. Watch the decoded characters appear one by one.

---

## Part 6 — Radare2 Visual Mode

**Task 6.1** — Open the binary in radare2 visual mode for a cleaner view of the control flow:

```bash
r2 target
> aaa
> VV @ main
```

Use arrow keys to navigate. Press `q` to exit.

**Task 6.2** — Export the control flow graph:

```bash
r2 target
> aaa
> agfd @ main > ~/labs/lab06/cfg_main.dot
> q
dot -Tpng ~/labs/lab06/cfg_main.dot -o ~/labs/lab06/cfg_main.png 2>/dev/null || echo "dot not installed - install graphviz"
```

---

## Completion Checklist

- [ ] Identified all custom functions in the binary
- [ ] Located the XOR decode loop in disassembly
- [ ] Extracted the XOR key value (`0x41`)
- [ ] Decoded the obfuscated string using Python
- [ ] Verified decoded string matches runtime output
- [ ] Patched the binary to bypass the conditional check
- [ ] Set a GDB breakpoint and observed the XOR loop at runtime
- [ ] Submitted the flag on the course platform

## Key Takeaway

Static disassembly and dynamic debugging are complementary. Static analysis finds the structure — the loop, the key, the encoded data. Dynamic analysis confirms it by watching the CPU execute those exact instructions. Real malware analysts use both on every sample.

**Next:** [Lab 07 — Reporting and IOCs](lab07_reporting_iocs.md)
