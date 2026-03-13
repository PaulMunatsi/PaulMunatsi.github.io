# Lab 03: Dynamic Analysis

## Objective

Execute the toy samples in an isolated environment and capture every observable behaviour: system calls, file operations, network traffic, and process activity. Produce a dynamic analysis report that confirms, extends, and occasionally contradicts the static findings.

## Prerequisites

- Module 03 (Dynamic Analysis) completed
- Labs 01 and 02 completed
- `strace`, `ltrace`, `inotify-tools`, `tcpdump`, `tshark` installed

## Time Required

90–120 minutes

## Tools Used

`strace`, `ltrace`, `inotifywait`, `tcpdump`, `tshark`, `nc`, `ss`, `lsof`, `gcore`

---

## Setup

```bash
sudo apt install -y strace ltrace inotify-tools tcpdump tshark netcat-openbsd

# Allow tcpdump without sudo
sudo setcap cap_net_raw+eip $(which tcpdump)

mkdir -p ~/labs/lab03/{samples,captures,reports}
cd ~/labs/lab03

SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

gcc -o samples/toy_app         ${SAMPLES}/toy_app.c
gcc -o samples/toy_network     ${SAMPLES}/toy_app_network.c
gcc -o samples/toy_persistence ${SAMPLES}/toy_app_persistence.c
gcc -o samples/toy_enum        ${SAMPLES}/toy_app_enumeration.c

echo "[+] Setup complete"
```

---

## Part 1: Pre-Run Baseline

Every dynamic analysis session starts with a snapshot of clean system state. Without a baseline you cannot distinguish between what the sample changed and what was already there.

```bash
cd ~/labs/lab03

mkdir -p baseline

echo "[*] Capturing baseline..."

# Running processes
ps aux > baseline/procs.txt

# Network connections and listening ports
ss -tnp > baseline/connections.txt
ss -tlnp > baseline/listening.txt

# Files in common drop locations
find /tmp /var/tmp /dev/shm $HOME/.config -type f 2>/dev/null \
    | sort > baseline/files.txt

# Crontab state
crontab -l 2>/dev/null > baseline/crontab.txt
ls /etc/cron.d/ >> baseline/crontab.txt 2>/dev/null

# Hash key system files
sha256sum /etc/passwd /etc/hosts /etc/crontab 2>/dev/null \
    > baseline/system_hashes.txt

echo "[+] Baseline saved in baseline/"
wc -l baseline/*.txt
```

---

## Part 2: strace — System Call Tracing

### 2.1 — Toy Enum: Process and File Enumeration

```bash
cd ~/labs/lab03

# Trace only file-related calls to reduce noise
strace -e trace=openat,read,getdents64 \
    -o captures/enum_file_trace.txt \
    samples/toy_enum 2>/dev/null

echo "=== Files opened by toy_enum ==="
grep "^openat" captures/enum_file_trace.txt \
    | grep -v "ENOENT\|/proc/self\|/lib\|/usr/lib" \
    | head -30

echo ""
echo "=== Sensitive paths accessed ==="
grep -E '(/etc/passwd|/proc/[0-9]+/comm|/proc/net)' \
    captures/enum_file_trace.txt | head -20
```

**Task 2.1:** How many unique `/proc/[pid]/comm` files did `toy_enum` open? This number equals the number of running processes it enumerated.

```bash
grep -oE '/proc/[0-9]+/comm' captures/enum_file_trace.txt | sort -u | wc -l
```

**Task 2.2:** Find the exact strace line where `toy_enum` reads `/etc/passwd`. What is the return value of the `read()` call? What does that number represent?

```bash
grep -A1 'openat.*passwd' captures/enum_file_trace.txt
```

### 2.2 — Toy Persistence: File Drop Tracing

```bash
# Trace only write-related calls
strace -e trace=openat,write,creat,close \
    -o captures/persist_write_trace.txt \
    samples/toy_persistence 2>/dev/null

echo "=== Files created by toy_persistence ==="
grep 'O_WRONLY\|O_CREAT\|openat.*creat' captures/persist_write_trace.txt \
    | grep -v "ENOENT\|/dev\|/proc" | head -15

echo ""
echo "=== What was written? ==="
grep "^write" captures/persist_write_trace.txt | head -10
```

**Task 2.3:** What two file paths did `toy_persistence` create? Record their full paths.

**Task 2.4:** The `write()` syscall shows the data written in the trace. What string did `toy_persistence` write to the cron demo file?

### 2.3 — Toy Network: Socket Tracing

```bash
# Trace network syscalls only
strace -e trace=socket,connect,send,recv,close \
    -o captures/network_socket_trace.txt \
    samples/toy_network 2>/dev/null

echo "=== Socket calls ==="
grep -E '^(socket|connect|send)' captures/network_socket_trace.txt

echo ""
echo "=== Connection target ==="
grep "connect" captures/network_socket_trace.txt | head -5
```

**Task 2.5:** What IP address and port did `toy_network` attempt to connect to? What was the return value of `connect()`? What does `ECONNREFUSED` mean in the context of this analysis?

**Task 2.6:** strace reports connection attempts even when no listener is running. Explain why this is useful for threat intelligence.

---

## Part 3: inotifywait — Real-Time File Monitoring

```bash
cd ~/labs/lab03

# Terminal 1: start monitoring BEFORE running the sample
inotifywait -m -r \
    --format '%T %e %w%f' \
    --timefmt '%H:%M:%S' \
    /tmp /var/tmp $HOME/.config 2>/dev/null \
    > captures/fs_events.txt &
INOTIFY_PID=$!

sleep 1

# Run persistence sample
echo "[*] Running toy_persistence..."
samples/toy_persistence

sleep 1

# Stop monitoring
kill $INOTIFY_PID 2>/dev/null
wait $INOTIFY_PID 2>/dev/null

echo "=== File system events ==="
cat captures/fs_events.txt
```

**Task 3.1:** How many CREATE events fired? List each file path and the timestamp.

**Task 3.2:** Run `toy_persistence --cleanup` while monitoring. What events appear this time?

```bash
inotifywait -m -r \
    --format '%T %e %w%f' \
    --timefmt '%H:%M:%S' \
    /tmp 2>/dev/null > captures/cleanup_events.txt &
INOTIFY_PID=$!

samples/toy_persistence --cleanup
kill $INOTIFY_PID 2>/dev/null

cat captures/cleanup_events.txt
```

**Task 3.3:** An attacker's malware runs a cleanup routine before exiting. Why does inotifywait still help you even in that case? (Think about what the CREATE events already told you before cleanup ran.)

---

## Part 4: Network Capture and Analysis

### 4.1 — Capture the Beacon

Run this in exactly this order — the listener and capture must be running before the sample starts.

```bash
cd ~/labs/lab03

# Step 1: Start listener in background
nc -lvp 4444 > captures/beacon_data.txt 2>/dev/null &
NC_PID=$!

# Step 2: Start packet capture on loopback
tcpdump -i lo port 4444 \
    -w captures/beacon_capture.pcap -q 2>/dev/null &
TCPDUMP_PID=$!

sleep 1

# Step 3: Run the sample
echo "[*] Running toy_network — 3 beacons at 5s interval..."
samples/toy_network

# Step 4: Stop captures
kill $NC_PID $TCPDUMP_PID 2>/dev/null
wait 2>/dev/null

echo ""
echo "=== Beacon content ==="
cat captures/beacon_data.txt

echo ""
echo "=== Capture file ==="
ls -lh captures/beacon_capture.pcap
```

### 4.2 — Analyse the Capture

```bash
cd ~/labs/lab03

# Summary of captured packets
tcpdump -r captures/beacon_capture.pcap 2>/dev/null | head -20

# Show application-layer data
tcpdump -r captures/beacon_capture.pcap -A 2>/dev/null \
    | grep -E '^[A-Z]' | head -20

# tshark field extraction
tshark -r captures/beacon_capture.pcap 2>/dev/null \
    -Y "tcp.len > 0" \
    -T fields \
    -e frame.number \
    -e frame.time_relative \
    -e ip.src \
    -e ip.dst \
    -e tcp.srcport \
    -e tcp.dstport \
    -e tcp.len \
    -E header=y
```

**Task 4.1:** How many TCP packets were captured in total?

**Task 4.2:** What is the decoded user-agent string in the beacon? Compare it to what `strings samples/toy_network` showed earlier. Explain the difference.

**Task 4.3:** The beacons are sent at 5-second intervals. Calculate the inter-beacon timing from the `frame.time_relative` column. Consistent timing is a behavioural IOC — it distinguishes beaconing from random traffic.

**Task 4.4:** Write the network IOC for this beacon in table format:

| Type | Value | Context | Confidence |
|---|---|---|---|
| IP:Port | | | |
| Protocol | | | |
| Beacon interval | | | |
| User-Agent | | | |
| Payload format | | | |

---

## Part 5: Post-Run Comparison

```bash
cd ~/labs/lab03

echo "=== Running all four samples for post-run comparison ==="
samples/toy_app > /dev/null 2>&1
samples/toy_persistence > /dev/null 2>&1

# Post-run snapshots
ps aux > baseline/procs_after.txt
find /tmp /var/tmp /dev/shm $HOME/.config -type f 2>/dev/null \
    | sort > baseline/files_after.txt
sha256sum /etc/passwd /etc/hosts /etc/crontab 2>/dev/null \
    > baseline/system_hashes_after.txt

echo ""
echo "=== NEW FILES CREATED ==="
diff baseline/files.txt baseline/files_after.txt | grep "^>"

echo ""
echo "=== CHANGED SYSTEM FILES ==="
diff baseline/system_hashes.txt baseline/system_hashes_after.txt

echo ""
echo "=== NEW PROCESSES (if any) ==="
diff <(awk '{print $11}' baseline/procs.txt | sort) \
     <(awk '{print $11}' baseline/procs_after.txt | sort) \
     | grep "^>"
```

**Task 5.1:** What new files appeared after running the samples? Are any in unexpected locations?

**Task 5.2:** Did any system files change? If `/etc/passwd` hash changed, what would that mean?

**Task 5.3:** Clean up the dropped files and verify cleanup was complete:

```bash
samples/toy_persistence --cleanup

# Verify
find /tmp -name "toy_*" -o -name "cron_demo" 2>/dev/null
echo "Exit code: $? (0 = no files found = clean)"
```

---

## Part 6: Dynamic Analysis Report

Complete a dynamic analysis report for `toy_network` using all findings from Parts 1–5.

```bash
cat > reports/toy_network_dynamic.md << 'EOF'
# Dynamic Analysis Report: toy_network

**Date:** $(date +%Y-%m-%d)  
**Analyst:** $USER  
**Environment:** Ubuntu $(lsb_release -sr), isolated network namespace  
**Tools:** strace, tcpdump, tshark, nc, inotifywait  

## Execution Summary

[Write 2–3 sentences: what happened when the sample ran, what was observed]

## System Call Findings

| Syscall | Args | Return | Significance |
|---|---|---|---|
| socket() | AF_INET, SOCK_STREAM | fd=4 | TCP socket created |
| connect() | 127.0.0.1:4444 | ECONNREFUSED | C2 connection attempt |
| | | | |

## Network Activity

| Event | Value |
|---|---|
| Destination | |
| Port | |
| Protocol | |
| Beacon count | |
| Beacon interval | |
| Payload format | |
| User-Agent (encoded) | |
| User-Agent (decoded) | |

## File Activity

| File | Operation | Significance |
|---|---|---|
| toy_network.log | write | Activity log |
| | | |

## Behavioural IOCs

| Type | Value | Confidence |
|---|---|---|
| | | |

## Verdict

**Malicious / Suspicious / Benign:** [choose one]  
**Confidence:** High / Medium / Low  
**Reasoning:** [one paragraph]
EOF
echo "[+] Template created at reports/toy_network_dynamic.md"
echo "[!] Fill in the bracketed sections using your findings"
```

---

## Completion Checklist

- [ ] Baseline captured before any sample ran
- [ ] strace traces saved for toy_enum, toy_persistence, toy_network
- [ ] Counted the number of /proc/[pid]/comm reads by toy_enum
- [ ] Identified both files created by toy_persistence via inotifywait
- [ ] Captured all three beacons from toy_network in a pcap
- [ ] Decoded the user-agent string from the live beacon
- [ ] Calculated the inter-beacon interval from tshark output
- [ ] Completed the post-run comparison and documented new files
- [ ] Completed the dynamic analysis report for toy_network

---

## Key Takeaways

The gap between static and dynamic findings is where the real story lives. Static analysis showed a format string `BEACON|%d|%s|%s|%s|%s` — dynamic analysis showed it filled in with real system data and sent over a live TCP connection. Static analysis showed an XOR-encoded buffer — dynamic analysis showed the decoded string arriving in the nc listener. Each method has blind spots. Used together, they close each other's gaps.

**Next:** [Lab 04 — Memory Forensics](lab04_memory_forensics.md)
