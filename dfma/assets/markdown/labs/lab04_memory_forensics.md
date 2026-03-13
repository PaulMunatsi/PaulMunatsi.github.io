# Lab 04: Memory Forensics

## Objective

Capture and analyse process memory from live toy samples. Prove that runtime-decoded strings, live network connection details, and heap-allocated data are recoverable from memory when static analysis finds nothing.

## Prerequisites

- Module 04 (Memory Forensics) completed
- Lab 03 completed
- `gdb` installed (provides `gcore`)

## Time Required

60–90 minutes

## Tools Used

`gcore`, `strings`, `xxd`, `python3`, `/proc` filesystem, `readelf`, `objdump`

---

## Setup

```bash
sudo apt install -y gdb

mkdir -p ~/labs/lab04/{dumps,analysis,reports}
cd ~/labs/lab04

SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

gcc -o toy_network     ${SAMPLES}/toy_app_network.c
gcc -o toy_enum        ${SAMPLES}/toy_app_enumeration.c
gcc -o toy_persistence ${SAMPLES}/toy_app_persistence.c

echo "[+] Setup complete"
```

---

## Part 1: The /proc Filesystem — Live Memory Maps

Every running process on Linux exposes its memory through `/proc/[pid]/`. This is not a stored file — it is a live view of the kernel's data structures.

```bash
cd ~/labs/lab04

# Run toy_network in background (stays alive for ~15 seconds)
./toy_network &
TOY_PID=$!
echo "toy_network PID: $TOY_PID"

sleep 1   # let it initialise

# Read the memory map
echo "=== Memory map for toy_network (PID $TOY_PID) ==="
cat /proc/$TOY_PID/maps

echo ""
echo "=== Parsed: address ranges and labels ==="
awk '{printf "%-30s %s %s\n", $1, $5, $6}' /proc/$TOY_PID/maps
```

Understanding the columns:

```
address range          perms  offset device inode  pathname
55a1234000-55a1256000  r-xp   00000  08:01  12345  /home/user/toy_network
55a1456000-55a1457000  r--p   00000  08:01  12345  /home/user/toy_network
55a1457000-55a1458000  rw-p   00000  08:01  12345  /home/user/toy_network
7f3456000000-7f3457000 r-xp   00000  08:01  99999  /lib/x86_64-linux-gnu/libc.so.6
7ffe12340000-7ffe12360000 rw-p 00000  00:00  0     [stack]
[heap]                 rw-p   ...
```

**Permission flags:**
- `r` = readable
- `w` = writable  
- `x` = executable
- `p` = private (copy-on-write)
- `s` = shared

**Task 1.1:** Find the `[heap]` region. What are its start and end addresses? Calculate the heap size in bytes.

```bash
grep '\[heap\]' /proc/$TOY_PID/maps
```

**Task 1.2:** Find all regions marked executable (`--xp` or `r-xp`). List them. Which ones are from the binary itself versus shared libraries?

**Task 1.3:** Is there any region with `rwxp` (read + write + execute)? If yes, that is a serious red flag — it means code can be written and executed, the hallmark of shellcode staging. If no, note that legitimate binaries should not have this permission combination.

```bash
grep 'rwxp' /proc/$TOY_PID/maps && echo "RED FLAG: rwxp region found" \
    || echo "OK: No rwxp regions"
```

Wait for the process to finish or kill it:
```bash
wait $TOY_PID 2>/dev/null || kill $TOY_PID 2>/dev/null
```

---

## Part 2: Dumping Process Memory with gcore

`gcore` is the cleanest way to capture a full process memory image on Linux. It produces a core dump file that can be analysed with standard tools.

```bash
cd ~/labs/lab04

# Run toy_network — it lives for ~15 seconds, giving us time to dump
./toy_network &
TOY_PID=$!
echo "PID: $TOY_PID"

sleep 2   # let it run one beacon cycle and decode strings

# Capture memory
gcore -o dumps/toy_network_mem $TOY_PID
echo "Dump: dumps/toy_network_mem.$TOY_PID"

# Wait for sample to finish
wait $TOY_PID 2>/dev/null

ls -lh dumps/
```

---

## Part 3: The Core Finding — Decoded Strings in Memory

This is the most important experiment in the lab. The XOR-encoded user agent is invisible on disk. After the binary decodes it at runtime, it becomes visible in memory.

```bash
cd ~/labs/lab04

DUMP="dumps/toy_network_mem.$TOY_PID"

echo "=== DISK: is ToyBeacon visible in the binary? ==="
strings toy_network | grep -i "ToyBeacon"
# Expected: NO OUTPUT — it is encoded on disk

echo ""
echo "=== MEMORY DUMP: is ToyBeacon visible in the dump? ==="
strings "$DUMP" | grep -i "ToyBeacon"
# Expected: "ToyBeacon/1.0 (Educational)" — decoded at runtime

echo ""
echo "=== DISK: is the BEACON| format string visible? ==="
strings toy_network | grep "BEACON|"
# Expected: YES — format string is not encoded

echo ""
echo "=== MEMORY: full beacon payload ==="
strings "$DUMP" | grep "^BEACON|"
# Expected: BEACON|1|<hostname>|<user>|Linux|ToyBeacon/1.0 (Educational)
```

**Task 3.1:** Document the exact decoded user-agent string recovered from memory. Is it identical to what was received by the `nc` listener in Lab 03?

**Task 3.2:** Count how many copies of the ToyBeacon string appear in the dump. Why might there be more than one?

```bash
strings "$DUMP" | grep -c "ToyBeacon"
```

**Task 3.3:** Write a one-paragraph explanation of what this proves, as if presenting it to a security team who asked "why do we need memory forensics if we already ran strings on the binary?"

---

## Part 4: Extracting Specific Segments

The full memory dump is large and noisy. Extract targeted segments for focused analysis.

```bash
cd ~/labs/lab04

# Rerun toy_network for a fresh dump (previous one may have exited)
./toy_network &
TOY_PID=$!
sleep 2
gcore -o dumps/fresh_dump $TOY_PID 2>/dev/null
wait $TOY_PID 2>/dev/null
DUMP="dumps/fresh_dump.$TOY_PID"

echo "=== All IP addresses in memory ==="
strings "$DUMP" | grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}'

echo ""
echo "=== All port numbers mentioned ==="
strings "$DUMP" | grep -E '^\d{4,5}$' | sort -nu | head -10

echo ""
echo "=== Hostname found in memory ==="
strings "$DUMP" | grep "$(hostname)" | head -5

echo ""
echo "=== Username found in memory ==="
strings "$DUMP" | grep "^$(whoami)$" | head -3

echo ""
echo "=== Beacon payloads (structured format) ==="
strings "$DUMP" | grep -E '^BEACON\|[0-9]+\|'
```

**Task 4.1:** List every IP address found in the memory dump. Are all of them from the toy sample's C2 logic, or do some come from library code?

**Task 4.2:** The beacon payload contains the hostname and username. This data was assembled at runtime using `gethostname()` and `getlogin()`. Confirm that both pieces of data are visible in the dump.

---

## Part 5: Bash History Recovery

This technique is one of the most operationally valuable in incident response. Attackers routinely run `history -c` to cover their tracks — but the commands have already passed through bash's memory.

```bash
cd ~/labs/lab04

# Run some commands that would look suspicious in an investigation
# (These are completely safe — we are just demonstrating the technique)
ls /etc/passwd > /dev/null
cat /dev/null | grep "secret" 2>/dev/null || true
echo "simulated_c2_connect 192.168.1.100" | cat
cd /tmp && ls && cd ~/labs/lab04

# Now demonstrate that 'history -c' does not help the attacker
history -c 2>/dev/null

# Dump the current bash process memory
BASH_PID=$(pgrep -u $USER bash | tail -1)
echo "Bash PID: $BASH_PID"

gcore -o dumps/bash_memory $BASH_PID 2>/dev/null || \
    sudo gcore -o dumps/bash_memory $BASH_PID 2>/dev/null

echo ""
echo "=== Recovering commands from bash memory ==="
strings "dumps/bash_memory.$BASH_PID" 2>/dev/null \
    | grep -E '^(ls|cat|cd|echo|grep|curl|wget|ssh|nc|python|perl|bash)' \
    | grep -v '^ls$\|^cd$' \
    | head -20

echo ""
echo "=== Recovering any mention of IP addresses ==="
strings "dumps/bash_memory.$BASH_PID" 2>/dev/null \
    | grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -10
```

**Task 5.1:** Did `history -c` successfully erase the commands from memory? What commands are visible in the dump?

**Task 5.2:** The string `simulated_c2_connect 192.168.1.100` was typed in the shell. Does it appear in the memory dump?

**Task 5.3:** In a real incident where an attacker cleared bash history before you acquired the machine, what would you need to have done to capture this evidence? (Think about timing.)

---

## Part 6: Memory Map Anomaly Detection

In a real investigation you check for memory regions that should not exist — regions that are executable but not backed by any file on disk.

```bash
cd ~/labs/lab04

# Run toy_enum (the most complex sample)
./toy_enum &
ENUM_PID=$!
sleep 2

echo "=== Memory map anomaly check ==="
echo "Looking for executable regions NOT backed by a file..."

cat /proc/$ENUM_PID/maps | awk '
/x/ {
    # Executable region
    split($6, path, "/")
    if ($6 == "" || $6 ~ /^\[/) {
        print "ANONYMOUS EXEC: " $1 " " $5 " " $6
    } else {
        print "FILE-BACKED:    " $1 " " $6
    }
}
'

echo ""
echo "=== Heap contents — keyword list in memory ==="
# Find heap range
HEAP=$(grep '\[heap\]' /proc/$ENUM_PID/maps | head -1)
START=0x$(echo $HEAP | cut -d- -f1)
END=0x$(echo $HEAP | cut -d'-' -f2 | cut -d' ' -f1)
SIZE=$((END - START))

echo "Heap: $START to $END ($SIZE bytes)"

# Dump heap
sudo dd if=/proc/$ENUM_PID/mem \
    bs=1 skip=$START count=$SIZE \
    of=dumps/heap_dump.bin 2>/dev/null || \
    dd if=/proc/$ENUM_PID/mem \
    bs=1 skip=$START count=$SIZE \
    of=dumps/heap_dump.bin 2>/dev/null

echo ""
echo "=== Sandbox keywords loaded into heap ==="
strings dumps/heap_dump.bin 2>/dev/null \
    | grep -iE '(wireshark|ghidra|procmon|volatility)' | head -10

kill $ENUM_PID 2>/dev/null
wait $ENUM_PID 2>/dev/null
```

**Task 6.1:** Are there any anonymous executable regions in `toy_enum`'s memory map? If yes, would that be suspicious? (For our benign toy sample, the answer should be no.)

**Task 6.2:** The sandbox keywords from the static analysis (Module 02) and dynamic analysis (Module 03) should appear in the heap dump. Confirm they are there. This proves the keyword array is loaded into the heap at startup, before any enumeration begins.

---

## Part 7: Write a Memory Forensics Summary

For each sample you analysed, complete a row in this table:

```markdown
## Memory Forensics Findings

| Sample | Dump method | Key finding in memory | Visible on disk? |
|---|---|---|---|
| toy_network | gcore | ToyBeacon/1.0 user-agent decoded | No (XOR encoded) |
| toy_network | gcore | Full beacon payloads with hostname | No (assembled at runtime) |
| bash | gcore | Commands run before history -c | No (cleared) |
| toy_enum | /proc/heap | Sandbox keyword array | Yes (in .rodata) |
```

**Task 7.1:** For `toy_network`, which findings were only possible through memory analysis and not through static or dynamic analysis alone?

**Task 7.2:** Memory evidence is volatile. List three actions that would destroy the memory evidence from this lab:
1.
2.
3.

**Task 7.3:** In a real incident, a system has been powered off before you arrived. The disk is intact. What memory-based evidence have you permanently lost? What disk-based evidence might compensate?

---

## Completion Checklist

- [ ] Read and interpreted the `/proc/[pid]/maps` output for toy_network
- [ ] Identified heap, stack, text, and library regions by permissions
- [ ] Confirmed no `rwxp` anonymous regions exist in toy sample memory maps
- [ ] Dumped toy_network memory with gcore
- [ ] Proved ToyBeacon string is absent from disk but present in memory dump
- [ ] Recovered full beacon payload strings from the dump
- [ ] Demonstrated bash history recovery after `history -c`
- [ ] Confirmed sandbox keyword array is present in toy_enum heap
- [ ] Completed the memory forensics findings table

---

## Key Takeaways

Memory is where secrets live. Everything a running process decoded, decrypted, received, or assembled exists in RAM until the process exits or the page is reclaimed. Disk is the crime scene after the fact. Memory is the crime scene during the act. For malware that decodes payloads, receives commands, or uses fileless techniques, memory forensics is not optional — it is the only way to see what actually happened.

**Next:** [Lab 05 — YARA Rules](lab05_yara.md)
