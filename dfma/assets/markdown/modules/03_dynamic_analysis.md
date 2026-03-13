# Module 03: Dynamic Analysis

## Learning Objectives

By the end of this module, you will:
- Set up an isolated dynamic analysis environment on Ubuntu
- Monitor process behaviour using `strace`, `ltrace`, and `auditd`
- Capture and analyse network traffic with `tcpdump` and Wireshark
- Monitor file system and process activity in real time
- Interpret sandbox reports from ANY.RUN and Cuckoo
- Detect common evasion techniques during dynamic analysis
- Document behavioural evidence in a structured report

---

## 1. Why Dynamic Analysis

Static analysis tells you what a binary *could* do based on its structure. Dynamic analysis tells you what it *actually* does when it runs.

The gap between those two things is where most of the interesting work happens. A packed sample has almost no static IOCs — the strings are compressed, the imports are a stub loader. Run it in a sandbox and within thirty seconds you have C2 domains, dropped files, registry keys, and a process tree. Static analysis took you nowhere; dynamic analysis cracked it open in half a minute.

The tradeoff is risk. You are executing potentially malicious code. This module covers how to do that safely.

---

## 2. Lab Environment Setup

### The Isolation Rule

Dynamic analysis has one non-negotiable requirement: **the analysis machine must not be able to reach the internet or your real network.**

A misbehaving sample that reaches the internet can:
- Receive commands from a live C2 and execute them
- Exfiltrate data from your machine
- Propagate to other machines on your network
- Notify the malware author that their sample is being analysed (triggering remote kill switches)

On Ubuntu, network isolation is straightforward.

### Option A — Offline Analysis (Simplest)

Disconnect from the internet entirely during analysis. No network adapter, or set it to disabled:

```bash
# List network interfaces
ip link show

# Disable the primary interface (replace eth0 with your interface name)
sudo ip link set eth0 down

# Verify no internet
ping -c 2 8.8.8.8   # should fail

# Re-enable after analysis
sudo ip link set eth0 up
```

### Option B — Network Namespace Isolation (Recommended)

A network namespace gives the analysed process its own isolated network stack. It sees a loopback interface only. The rest of your system stays connected normally.

```bash
# Create an isolated namespace
sudo ip netns add analysis

# Run the target binary inside the namespace
sudo ip netns exec analysis ./toy_network_linux

# The process has loopback only - no internet, no LAN
# Your terminal outside the namespace keeps normal connectivity

# Delete the namespace when done
sudo ip netns del analysis
```

This is the cleanest approach for Ubuntu. No VM required. The target process is fully isolated but your system tools (Wireshark, strace, auditd) still have full visibility.

### Option C — VM Snapshot (Most Thorough)

For samples you genuinely suspect are dangerous, use a VM with a clean snapshot:

```bash
# VirtualBox: restore before every analysis session
VBoxManage snapshot "UbuntuAnalysis" restore "CleanBaseline"
VBoxManage startvm "UbuntuAnalysis"

# After analysis: revert to clean state, never save
VBoxManage controlvm "UbuntuAnalysis" poweroff
VBoxManage snapshot "UbuntuAnalysis" restore "CleanBaseline"
```

For this course, Option B (network namespace) is sufficient for the toy samples. Use Option C if you ever analyse real malware.

---

## 3. Tool Installation

```bash
sudo apt update
sudo apt install -y \
    strace \
    ltrace \
    auditd \
    audispd-plugins \
    tcpdump \
    wireshark \
    inotify-tools \
    procps \
    lsof \
    netstat-nat \
    sysdig \
    tshark

# Allow your user to capture packets without sudo
sudo usermod -aG wireshark $USER
sudo setcap cap_net_raw+eip $(which tcpdump)

# Reload group membership (or log out and back in)
newgrp wireshark
```

Verify:

```bash
strace --version
tcpdump --version
tshark --version
auditctl --version
```

---

## 4. Pre-Analysis Baseline

Before running anything suspicious, capture the system's clean state. This gives you a diff baseline — anything that changes during execution is attributable to the sample.

```bash
mkdir -p ~/labs/module03/baseline

# Snapshot running processes
ps aux > ~/labs/module03/baseline/processes_before.txt

# Snapshot network connections
ss -tnp > ~/labs/module03/baseline/network_before.txt
netstat -tunp 2>/dev/null >> ~/labs/module03/baseline/network_before.txt

# Snapshot listening ports
ss -tlnp > ~/labs/module03/baseline/listening_ports_before.txt

# Snapshot /tmp and common drop locations
find /tmp /var/tmp /dev/shm -type f 2>/dev/null \
    | sort > ~/labs/module03/baseline/tmp_files_before.txt

# Snapshot crontabs
crontab -l 2>/dev/null > ~/labs/module03/baseline/cron_before.txt
ls /etc/cron.d/ >> ~/labs/module03/baseline/cron_before.txt

# Hash critical system files (detect tampering)
sha256sum /etc/passwd /etc/shadow /etc/hosts /etc/crontab \
    > ~/labs/module03/baseline/system_hashes_before.txt

echo "[+] Baseline captured"
```

After running the sample, collect the same data and diff:

```bash
# Collect post-run state
ps aux > ~/labs/module03/baseline/processes_after.txt
ss -tnp > ~/labs/module03/baseline/network_after.txt
find /tmp /var/tmp /dev/shm -type f 2>/dev/null \
    | sort > ~/labs/module03/baseline/tmp_files_after.txt
sha256sum /etc/passwd /etc/shadow /etc/hosts /etc/crontab \
    > ~/labs/module03/baseline/system_hashes_after.txt

# Diff everything
echo "=== NEW PROCESSES ===" && \
    diff baseline/processes_before.txt baseline/processes_after.txt | grep '^>'

echo "=== NEW NETWORK CONNECTIONS ===" && \
    diff baseline/network_before.txt baseline/network_after.txt | grep '^>'

echo "=== NEW FILES IN /tmp ===" && \
    diff baseline/tmp_files_before.txt baseline/tmp_files_after.txt | grep '^>'

echo "=== CHANGED SYSTEM FILES ===" && \
    diff baseline/system_hashes_before.txt baseline/system_hashes_after.txt
```

---

## 5. System Call Tracing with strace

`strace` intercepts every system call a process makes. On Linux, system calls are the only way a process can interact with the OS — open a file, connect a socket, spawn a child. Everything a sample does is visible here.

### Basic Usage

```bash
# Trace all syscalls
strace ./toy_app_linux

# Trace only file-related calls (much less noise)
strace -e trace=file ./toy_app_linux

# Trace file + network calls
strace -e trace=file,network ./toy_app_linux

# Save trace to file for later analysis
strace -o trace.txt ./toy_app_linux

# Show timestamps (microseconds)
strace -t ./toy_app_linux

# Show time spent in each call (useful for spotting sleep/beacon loops)
strace -T ./toy_app_linux

# Follow child processes (critical for droppers and launchers)
strace -f ./toy_app_linux
```

### Filtering the Noise

Raw `strace` output is overwhelming. These patterns cut straight to the interesting calls:

```bash
TARGET="./toy_enum_linux"

# File operations only - what does it open?
strace -e trace=openat,open,read,write,close "$TARGET" 2>&1 \
    | grep -v "^---\|^+++" \
    | grep -E '(openat|open)\(' \
    | head -30

# Network operations only
strace -e trace=socket,connect,bind,listen,accept,send,recv "$TARGET" 2>&1

# Process spawning - does it launch other processes?
strace -e trace=execve,fork,clone,wait4 "$TARGET" 2>&1

# Memory operations - injection patterns
strace -e trace=mmap,mprotect,madvise "$TARGET" 2>&1
```

### Reading strace Output

Each line follows this format:

```
syscall_name(arguments) = return_value
```

Real examples from the toy samples:

```
openat(AT_FDCWD, "/proc/self/comm", O_RDONLY) = 3
read(3, "toy_enum_linux\n", 4096) = 15
close(3) = 0
openat(AT_FDCWD, "/etc/passwd", O_RDONLY) = 3    ← user enumeration
read(3, "root:x:0:0:root:/root:/bin/bash\n"..., 4096) = 1735
connect(4, {sa_family=AF_INET, sin_port=htons(4444),
    sin_addr=inet_addr("127.0.0.1")}, 16) = -1
    ECONNREFUSED (Connection refused)              ← C2 beacon attempt, no listener
```

That third line tells you the binary attempted a TCP connection to `127.0.0.1:4444`. That is a concrete network IOC from strace alone, without Wireshark, without a live listener.

### Tracing the Toy Samples

```bash
cd ~/labs/module03

# Enumeration sample - watch the /proc and /etc/passwd reads
strace -e trace=openat,read \
    ~/course/samples/benign_toy_app/toy_enum_linux 2>&1 \
    | grep -E '(openat|/proc|/etc/passwd)' \
    | head -30

# Persistence sample - watch the file drop
strace -e trace=openat,write,creat \
    ~/course/samples/benign_toy_app/toy_persistence_linux 2>&1 \
    | grep -E '(openat|write)'

# Network sample - watch the socket calls
strace -e trace=socket,connect,send,recv \
    ~/course/samples/benign_toy_app/toy_network_linux 2>&1
```

---

## 6. Library Call Tracing with ltrace

Where `strace` shows OS calls, `ltrace` shows library function calls — `printf`, `malloc`, `strcmp`, `fopen`. This is often more readable than strace because the function names match what you see in C source and disassembly.

```bash
# Basic ltrace
ltrace ./toy_app_linux 2>&1 | head -40

# Filter to just string operations (useful for finding decoded strings)
ltrace ./toy_app_linux 2>&1 | grep -E '(strcmp|strcpy|strcat|sprintf|printf)'

# Watch for fopen/fwrite - file dropper detection
ltrace ./toy_persistence_linux 2>&1 | grep -E '(fopen|fwrite|fclose)'

# Full output to file
ltrace -o ltrace_output.txt ./toy_enum_linux
```

`ltrace` is particularly useful for spotting:
- Strings being compared (password checks, sandbox detection keyword matching)
- Dynamic string construction (strcat chains building file paths or C2 URLs)
- Encryption library calls (OpenSSL, libsodium)

---

## 7. File System Monitoring with inotifywait

`inotifywait` watches directories and reports every create, modify, delete, and access event. Run it in a second terminal before launching the sample.

```bash
# Terminal 1: start watching before running the sample
inotifywait -m -r \
    --format '%T %e %w%f' \
    --timefmt '%H:%M:%S' \
    /tmp /var/tmp /home $HOME \
    2>/dev/null

# Terminal 2: run the sample
./toy_persistence_linux
```

Expected output from toy_persistence_linux:

```
08:15:32 CREATE /tmp/toy_dropped_payload.txt
08:15:32 OPEN   /tmp/toy_dropped_payload.txt
08:15:32 MODIFY /tmp/toy_dropped_payload.txt
08:15:32 CLOSE_WRITE /tmp/toy_dropped_payload.txt
08:15:32 CREATE /tmp/cron_demo
08:15:32 OPEN   /tmp/cron_demo
08:15:32 MODIFY /tmp/cron_demo
08:15:32 CLOSE_WRITE /tmp/cron_demo
```

Every file the sample creates appears within milliseconds. For a real dropper this is how you find the dropped payload path immediately, before reading a single line of code.

### Watching Specific Directories

```bash
# Watch only for new executables (file drop detection)
inotifywait -m -r \
    -e create,moved_to \
    --format '%w%f' \
    /tmp /var/tmp \
    2>/dev/null \
    | while read path; do
        if file "$path" | grep -qE '(executable|ELF|PE32)'; then
            echo "[!] EXECUTABLE DROPPED: $path"
            sha256sum "$path"
        fi
    done
```

---

## 8. Network Traffic Capture

### tcpdump — Command Line Packet Capture

```bash
# Capture all traffic on loopback (for toy_network_linux)
sudo tcpdump -i lo -w /tmp/capture.pcap &
TCPDUMP_PID=$!

# Run the sample
./toy_network_linux

# Stop capture
sudo kill $TCPDUMP_PID

# Read the capture
tcpdump -r /tmp/capture.pcap -A   # -A = ASCII output
```

### Setting Up a Listener to Receive Beacons

The most informative dynamic analysis of `toy_network_linux` requires a listener. The sample connects, sends the beacon, and waits for a response:

```bash
# Terminal 1: start listener
nc -lvp 4444

# Terminal 2: start packet capture
sudo tcpdump -i lo -w /tmp/beacon_capture.pcap port 4444 &

# Terminal 3: run the network sample
./toy_network_linux
```

In Terminal 1 you will see the raw beacon text arrive:

```
BEACON|1|your-hostname|yourusername|Linux|ToyBeacon/1.0 (Educational)
```

That is the exact decoded content of what was an XOR-encoded byte array in static analysis. Cross-referencing that decoded string with the static analysis findings from Module 02 is a core analysis skill.

### Wireshark — Full Protocol Analysis

```bash
# Capture on loopback and open in Wireshark
sudo wireshark -i lo -k &

# Run sample in another terminal
./toy_network_linux
```

Wireshark filters for the toy samples:

```
# Show only TCP port 4444 traffic
tcp.port == 4444

# Show the actual data payload
tcp.payload

# Follow the full TCP stream
# Right-click a packet → Follow → TCP Stream
```

For analysing saved captures:

```bash
# Open a saved pcap
wireshark /tmp/beacon_capture.pcap

# Or use tshark for command-line analysis
tshark -r /tmp/beacon_capture.pcap -Y "tcp.port==4444" -T fields \
    -e frame.time -e ip.src -e ip.dst -e tcp.dstport -e data.text
```

### FakeDNS and INetSim (For Malware Expecting Internet)

Real malware tries to connect to external domains. In an isolated lab the DNS query fails and the sample may abort. Two tools simulate internet responses:

```bash
# Install FakeDNS (Python, simple)
pip3 install fakedns --break-system-packages

# Start FakeDNS - responds to ALL DNS queries with 127.0.0.1
sudo python3 -m fakedns

# Now configure your isolated system to use it as DNS
sudo resolvectl dns lo 127.0.0.1

# Real malware DNS queries will resolve to 127.0.0.1
# Pair with nc -lvp 80 and nc -lvp 443 to catch the HTTP(S) connections
```

---

## 9. Audit Logging with auditd

`auditd` is the Linux kernel audit subsystem. It logs security-relevant events at the kernel level — harder to evade than userspace tools, and the logs persist even if the process tries to clean up after itself.

### Basic Setup

```bash
# Start auditd
sudo systemctl start auditd
sudo systemctl enable auditd

# Add rules for the toy samples
# Watch /tmp for all file operations
sudo auditctl -w /tmp -p rwxa -k toy_analysis

# Watch /etc/passwd for reads (user enumeration detection)
sudo auditctl -w /etc/passwd -p r -k toy_analysis

# Watch for execve (process execution)
sudo auditctl -a always,exit -F arch=b64 -S execve -k toy_analysis

# List active rules
sudo auditctl -l
```

### Running a Sample Under Audit

```bash
# Clear old logs first
sudo auditctl -D    # delete all rules
sudo service auditd restart

# Re-add rules
sudo auditctl -w /tmp -p rwxa -k toy_demo
sudo auditctl -w /etc/passwd -p r -k toy_demo

# Run the sample
./toy_enum_linux

# Query the audit log
sudo ausearch -k toy_demo --start today | head -60

# Human-readable format
sudo ausearch -k toy_demo --start today -i | head -60
```

Expected output from toy_enum_linux:

```
type=SYSCALL msg=audit(1234567890.123:456): arch=c000003e syscall=257
    success=yes exit=3 a0=ffffff9c a1=7ffd1234 a2=0 a3=0
    items=1 ppid=1234 pid=5678 auid=1000 uid=1000 gid=1000
    comm="toy_enum_linux" exe="/home/user/labs/toy_enum_linux"
type=PATH msg=audit(1234567890.123:456): item=0
    name="/etc/passwd" inode=12345 dev=08:01 mode=0100644
    nametype=NORMAL cap_fp=0 cap_fi=0 cap_fe=0 cap_fver=0
```

That record proves `/etc/passwd` was read by `toy_enum_linux`. In a forensic investigation this is court-admissible evidence of the activity.

---

## 10. Building a Dynamic Analysis Timeline

The most useful output from dynamic analysis is a timeline that sequences every observed behaviour. Build one automatically:

```bash
cat > ~/labs/module03/build_timeline.sh << 'EOF'
#!/bin/bash
# build_timeline.sh - Run a sample and build a behaviour timeline
# Usage: ./build_timeline.sh <binary>

BINARY="$1"
LABEL=$(basename "$BINARY")
OUTDIR="$HOME/labs/module03/results/$LABEL"
mkdir -p "$OUTDIR"

echo "[*] Starting analysis of: $BINARY"
echo "[*] Output directory: $OUTDIR"

# Set up auditd rules
sudo auditctl -D 2>/dev/null
sudo auditctl -w /tmp -p rwxa         -k dynamic_analysis 2>/dev/null
sudo auditctl -w /etc/passwd -p r     -k dynamic_analysis 2>/dev/null
sudo auditctl -a always,exit -F arch=b64 -S execve -k dynamic_analysis 2>/dev/null

# Pre-run baseline
ps aux > "$OUTDIR/procs_before.txt"
ss -tnp > "$OUTDIR/net_before.txt"
ls /tmp > "$OUTDIR/tmp_before.txt"

# Start inotifywait in background
inotifywait -m -r \
    --format '%T %e %w%f' --timefmt '%H:%M:%S' \
    /tmp /var/tmp $HOME \
    2>/dev/null > "$OUTDIR/fs_events.txt" &
INOTIFY_PID=$!

# Start tcpdump on loopback
sudo tcpdump -i lo -w "$OUTDIR/network.pcap" -q 2>/dev/null &
TCPDUMP_PID=$!

# Run sample under strace
echo "[*] Running sample..."
strace -f -T \
    -e trace=file,network,process \
    -o "$OUTDIR/strace.txt" \
    "$BINARY" > "$OUTDIR/stdout.txt" 2>&1

echo "[*] Sample finished"

# Stop background processes
kill $INOTIFY_PID 2>/dev/null
sudo kill $TCPDUMP_PID 2>/dev/null
sleep 1

# Post-run snapshot
ps aux > "$OUTDIR/procs_after.txt"
ss -tnp > "$OUTDIR/net_after.txt"
ls /tmp > "$OUTDIR/tmp_after.txt"

# Collect audit logs
sudo ausearch -k dynamic_analysis --start today \
    > "$OUTDIR/audit.txt" 2>/dev/null

# Build summary
{
    echo "=============================="
    echo " Dynamic Analysis Summary"
    echo " Sample: $BINARY"
    echo " Date: $(date)"
    echo "=============================="
    echo ""
    echo "--- STDOUT ---"
    cat "$OUTDIR/stdout.txt"
    echo ""
    echo "--- NEW FILES ---"
    diff "$OUTDIR/tmp_before.txt" "$OUTDIR/tmp_after.txt" | grep '^>'
    echo ""
    echo "--- FILE SYSTEM EVENTS (first 30) ---"
    head -30 "$OUTDIR/fs_events.txt"
    echo ""
    echo "--- NETWORK EVENTS (from strace) ---"
    grep -E '(connect|bind|send|recv)' "$OUTDIR/strace.txt" | head -20
    echo ""
    echo "--- SENSITIVE FILE ACCESSES ---"
    grep -E '(/etc/passwd|/etc/shadow|/proc)' "$OUTDIR/strace.txt" | head -20
} > "$OUTDIR/summary.txt"

echo "[+] Analysis complete. Summary: $OUTDIR/summary.txt"
EOF
chmod +x ~/labs/module03/build_timeline.sh
```

Run it against each toy sample:

```bash
~/labs/module03/build_timeline.sh ~/course/samples/benign_toy_app/toy_enum_linux
~/labs/module03/build_timeline.sh ~/course/samples/benign_toy_app/toy_persistence_linux
~/labs/module03/build_timeline.sh ~/course/samples/benign_toy_app/toy_network_linux
```

---

## 11. Online Sandboxes

For samples you cannot or should not run locally, online sandboxes execute the file in an isolated VM and return a full behaviour report.

### ANY.RUN (Interactive Sandbox)

ANY.RUN is unique in that it is interactive — you can click inside the running VM, respond to prompts, and guide the sample through its execution.

```
https://app.any.run
```

Steps:
1. Create a free account
2. Click "New Task"
3. Upload the file or provide a URL
4. Choose OS (Windows 10 / Ubuntu 20.04)
5. Watch live execution
6. Review the report: process tree, network connections, file operations, registry changes, MITRE ATT&CK mapping

What to look for in ANY.RUN reports:
- **Process tree**: did the sample spawn children? Inject into other processes?
- **Network tab**: C2 connections, DNS queries, HTTP requests with full headers
- **Files tab**: dropped files with hashes
- **Registry tab**: persistence keys written
- **ATT&CK tab**: automatically mapped techniques

### Cuckoo Sandbox (Self-Hosted)

Cuckoo is open-source and runs on your own infrastructure. Useful when you cannot upload samples to third-party services (legal or confidentiality constraints).

```bash
# Install Cuckoo (simplified - see full docs at cuckoosandbox.org)
pip3 install cuckoo --break-system-packages

# Initialise
cuckoo init

# Start (requires configured Windows analysis VM)
cuckoo

# Submit a sample
cuckoo submit samples/benign_toy_app/toy_app_linux

# View web interface
cuckoo web
# → open http://localhost:8000
```

### Reading a Sandbox Report

Every sandbox report has the same core sections. Here is what to extract:

| Section | What to Extract |
|---|---|
| **Process Tree** | Parent-child relationships, injected processes, unusual parents (e.g. Word spawning cmd.exe) |
| **Network** | All contacted IPs/domains (even failed connections), protocols, full request/response if HTTP |
| **File Operations** | Created, modified, deleted files with full paths and hashes |
| **Registry** (Windows) | Keys written, especially Run/RunOnce, Services, Scheduled Tasks |
| **Mutexes** | Named mutexes are often unique per malware family — excellent IOCs |
| **Signatures** | Sandbox's own detections — read these but verify manually |
| **MITRE ATT&CK** | Maps observed behaviours to the ATT&CK framework |

---

## 12. Common Evasion Techniques in Dynamic Analysis

Real malware tries to detect that it is being analysed and change its behaviour. Knowing these techniques helps you counter them.

### Sandbox Detection Techniques

```
1. Process enumeration (as in toy_enum_linux)
   Checks for analyst tools: Wireshark, Procmon, x64dbg, Ghidra
   Counter: Rename your tools before running the sample

2. Sleep bombing
   Calls sleep(3600) - waits an hour hoping sandbox times out
   Counter: Patch the binary to remove the sleep call, or use a sandbox
   with time acceleration

3. User interaction checks
   Detects no mouse movement or keyboard input (sandbox has none)
   Counter: Automate mouse movement, or use interactive sandbox (ANY.RUN)

4. VM/hypervisor detection
   Reads CPUID, checks for VMware/VirtualBox registry keys or processes
   Counter: Use bare-metal analysis, or configure VM to hide hypervisor

5. Timing attacks
   Measures how long sleep(1) actually takes - sandboxes speed up time
   Counter: Use bare-metal, or time-normalised sandboxes

6. Environment variable checks (as in toy_enum_linux)
   Looks for CUCKOO, SANDBOX, ANALYSIS environment variables
   Counter: Unset those variables before analysis

7. Minimum victim profiling
   Aborts if fewer than N processes running, no browser history, etc.
   Counter: Run in a realistic user environment
```

### Countering Evasion Locally

```bash
# Rename strace to avoid detection by process name checks
cp $(which strace) /tmp/legitimate_process
/tmp/legitimate_process -e trace=file ./suspicious_binary

# Unset sandbox indicator environment variables
env -i HOME=$HOME PATH=$PATH ./suspicious_binary

# Add fake "human" processes before running
cat > /tmp/fake_processes.sh << 'EOF'
#!/bin/bash
# Start a few benign-looking processes
sleep 9999 &
cat /dev/null &
tail -f /dev/null &
EOF
bash /tmp/fake_processes.sh
./suspicious_binary
kill $(jobs -p)
```

---

## Hands-On Labs

### Lab 3.1: strace Deep Dive

**Objective:** Use strace to fully characterise the behaviour of all four toy samples without reading the source code.

**Time estimate:** 45 minutes

**Setup:**

```bash
mkdir -p ~/labs/module03/lab31
cd ~/labs/module03/lab31

# Compile the toy samples if not already built
gcc -o toy_app         ~/course/samples/benign_toy_app/toy_app.c
gcc -o toy_persistence ~/course/samples/benign_toy_app/toy_app_persistence.c
gcc -o toy_network     ~/course/samples/benign_toy_app/toy_app_network.c
gcc -o toy_enum        ~/course/samples/benign_toy_app/toy_app_enumeration.c
```

**Tasks:**

1. Run `strace -e trace=openat` on `toy_enum`. List every file it opens. Which one is most suspicious and why?

2. Run `strace -e trace=network` on `toy_network`. What IP and port does it attempt to connect to? What is the return value of `connect()` and what does that mean?

3. Run `strace -e trace=openat,write` on `toy_persistence`. Identify the two files it creates and their full paths.

4. Run `strace -c toy_app` to get a syscall count summary. Which syscall is called most often?

5. Run `ltrace toy_app 2>&1 | grep -E '(strcmp|strcat|sprintf)'`. What string operations does it perform?

**Expected findings:**

| Sample | Key strace finding |
|---|---|
| `toy_enum` | Opens `/etc/passwd` and all entries under `/proc/` |
| `toy_network` | `connect()` to `127.0.0.1:4444` returns `ECONNREFUSED` |
| `toy_persistence` | Creates `/tmp/toy_dropped_payload.txt` and `/tmp/cron_demo` |
| `toy_app` | Opens `toy_app.log` for writing, no network, no sensitive paths |

---

### Lab 3.2: Network Traffic Analysis

**Objective:** Capture and decode the beacon from `toy_network_linux` using tcpdump and Wireshark.

**Time estimate:** 30 minutes

**Setup:**

```bash
mkdir -p ~/labs/module03/lab32
cd ~/labs/module03/lab32
gcc -o toy_network ~/course/samples/benign_toy_app/toy_app_network.c
```

**Tasks:**

1. In Terminal 1, start a listener: `nc -lvp 4444`

2. In Terminal 2, start a packet capture:
   ```bash
   sudo tcpdump -i lo port 4444 -w beacon_capture.pcap
   ```

3. In Terminal 3, run the sample: `./toy_network`

4. After all three beacons are sent, stop tcpdump (Ctrl+C).

5. Analyse the capture with tshark:
   ```bash
   tshark -r beacon_capture.pcap -Y "tcp.port==4444" \
       -T fields -e frame.time -e ip.src -e ip.dst \
       -e tcp.srcport -e tcp.dstport -e tcp.len
   ```

6. Extract the raw beacon payload:
   ```bash
   tshark -r beacon_capture.pcap \
       -Y "tcp.port==4444 && tcp.len > 0" \
       -T fields -e data.text 2>/dev/null || \
   tcpdump -r beacon_capture.pcap -A 2>/dev/null | grep "BEACON"
   ```

7. Open in Wireshark and follow the TCP stream for beacon #1. Identify:
   - Hostname in the beacon
   - Username in the beacon
   - User-agent string (should match what you decoded in static analysis)

8. Compare the decoded user-agent string to the XOR-encoded bytes from Module 02 Lab 2.1. Confirm they match.

---

### Lab 3.3: inotifywait File Monitoring

**Objective:** Catch every file the persistence sample creates before it even finishes running.

**Time estimate:** 20 minutes

```bash
mkdir -p ~/labs/module03/lab33
cd ~/labs/module03/lab33
gcc -o toy_persistence ~/course/samples/benign_toy_app/toy_app_persistence.c
```

**Tasks:**

1. Open two terminals side by side.

2. Terminal 1 — start watching before the sample runs:
   ```bash
   inotifywait -m -r \
       --format '%T %e %w%f' --timefmt '%H:%M:%S' \
       /tmp /var/tmp $HOME/labs 2>/dev/null
   ```

3. Terminal 2 — run the sample:
   ```bash
   ./toy_persistence
   ```

4. In Terminal 1, you should see at least two file events within one second of the sample starting. Record:
   - The exact timestamp each file was created
   - The full path of each created file
   - The inotify event type (CREATE, OPEN, MODIFY, CLOSE_WRITE)

5. Run `./toy_persistence --cleanup` and watch the DELETE events appear.

6. Write a one-paragraph summary: if this were real malware, what persistence mechanism did it install, where, and how would you remediate it?

---

### Lab 3.4: Full Dynamic Analysis Report

**Objective:** Run the automated timeline script against all four toy samples and produce a structured dynamic analysis report.

**Time estimate:** 1 hour

```bash
# Run all four samples through the timeline script
for sample in toy_app toy_persistence toy_network toy_enum; do
    echo "[*] Analysing $sample..."
    ~/labs/module03/build_timeline.sh \
        ~/labs/module03/lab31/$sample
    echo ""
done
```

For each sample, produce a report using this template:

```markdown
## Dynamic Analysis Report

**Sample:** [name]
**Date:** [date]
**Analysis Method:** strace + inotifywait + tcpdump

### Execution Summary
[What happened when the sample ran - one paragraph]

### Process Behaviour
- Spawned child processes: Yes / No
- Injected into other processes: Yes / No
- Anti-analysis checks observed: Yes / No

### File System Activity
| Action | Path | Significance |
|---|---|---|
| | | |

### Network Activity
| Protocol | Destination | Port | Data Sent |
|---|---|---|---|
| | | | |

### Sensitive Resource Access
| Resource | Access Type | Significance |
|---|---|---|
| | | |

### Indicators of Compromise (Behavioural)
| Type | Value |
|---|---|
| File created | |
| Connection attempted | |
| Sensitive file read | |

### Verdict
**Classification:** Malicious / Suspicious / Benign
**Confidence:** High / Medium / Low
```

---

## Knowledge Check

1. **Why must the analysis machine be isolated from the internet before running any suspicious binary?**

   <details>
   <summary>Answer</summary>
   A live malware sample can receive commands from a real C2 server and execute them on your machine, exfiltrate data, propagate to other network hosts, or signal the malware author that it is being analysed, triggering remote kill switches or behaviour changes.
   </details>

2. **`strace` shows `connect(3, {sa_family=AF_INET, sin_port=htons(443), sin_addr=inet_addr("192.168.1.1")}, 16) = -1 ENETUNREACH`. What does this tell you?**

   <details>
   <summary>Answer</summary>
   The sample attempted a TCP connection to 192.168.1.1:443 (HTTPS port). It failed because the network is unreachable — your isolation is working correctly. The IP address and port are confirmed network IOCs even though the connection did not succeed.
   </details>

3. **You run a sample and strace shows hundreds of `openat("/proc/[pid]/comm")` calls in rapid succession. What is this behaviour and why is it significant?**

   <details>
   <summary>Answer</summary>
   Process enumeration — the sample is walking /proc and reading the name of every running process. This is a sandbox/analyst detection technique. The sample likely has a hardcoded list of tool names it is checking against. Find the keyword list in static analysis (strings) and document it as an IOC.
   </details>

4. **A sample sleeps for 3,600 seconds on startup before doing anything. What technique is this and how do you counter it?**

   <details>
   <summary>Answer</summary>
   Sleep bombing — the sample waits for the sandbox timeout (typically 2–5 minutes) hoping the analysis ends before it runs its payload. Counter: patch the sleep call in a hex editor or with a binary patch, use a sandbox with time acceleration, or set a breakpoint on the sleep syscall in a debugger and skip past it.
   </details>

5. **What is the advantage of auditd over strace for forensic evidence collection?**

   <details>
   <summary>Answer</summary>
   auditd logs at the kernel level and its records are tamper-evident (the kernel writes them, not the process being traced). strace can be detected and evaded by userspace malware. auditd logs persist after the process exits and can be used as forensic evidence in legal proceedings. strace is better for real-time interactive analysis; auditd is better for post-incident forensics.
   </details>

---

## Summary

In this module you covered:
- ✅ Three isolation strategies for safe dynamic analysis on Ubuntu
- ✅ Pre/post execution baseline diffing
- ✅ System call tracing with strace and library tracing with ltrace
- ✅ File system monitoring with inotifywait
- ✅ Network capture with tcpdump and Wireshark
- ✅ Kernel-level audit logging with auditd
- ✅ Using online sandboxes (ANY.RUN, Cuckoo)
- ✅ Recognising and countering common evasion techniques
- ✅ Building a structured dynamic analysis report

**Key rule:** Static analysis tells you what the binary *could* do. Dynamic analysis tells you what it *actually* does. You need both.

**Next Module:** [Module 04 — Memory Forensics](04_memory_forensics.md) — analysing what a process looks like in RAM during and after execution.

---

## Suggested Reading

- *The Art of Memory Forensics* — Ligh, Case, Levy, Walters (Chapter 1 for context)
- *Practical Malware Analysis* — Sikorski & Honig, Chapters 8–9 (dynamic analysis)
- [strace man page](https://man7.org/linux/man-pages/man1/strace.1.html)
- [auditd documentation](https://linux.die.net/man/8/auditd)
- [ANY.RUN Learning Resources](https://any.run/cybersecurity-blog/)
- [Cuckoo Sandbox Documentation](https://cuckoo.readthedocs.io/)

---

*Module complete. Continue to [Module 04 — Memory Forensics](04_memory_forensics.md)*
