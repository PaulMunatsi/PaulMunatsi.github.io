# Lab 08 — Case Study: Operation Hollow Reed

**Module:** 08 — Case Study  
**Estimated time:** 3–4 hours (all phases)  
**Difficulty:** Advanced  
**Flag:** `FLAG{hollow_reed_c2_port_4444_beacon_interval_5}`

---

## Scenario

Your organisation has received four suspicious files from a human rights defender in the region. Their workstation has been behaving oddly — unusually high network activity and a process that restarts after being killed. Your job is to analyse all four files, produce a complete incident report, and brief the team.

The files are your four compiled toy samples. Treat them as unknown malware. Do not look at the source code during the lab — use only the binaries.

---

## Setup

```bash
mkdir -p ~/labs/lab08/{samples,memory,pcap,reports,yara}
cd ~/course/samples/benign_toy_app

# Compile if not already done
gcc -o toy_app_linux toy_app.c 2>/dev/null
gcc -o toy_network_linux toy_app_network.c 2>/dev/null
gcc -o toy_persistence_linux toy_app_persistence.c 2>/dev/null
gcc -o toy_enum_linux toy_app_enumeration.c 2>/dev/null

# Copy as "unknown" samples with neutral names
cp toy_app_linux        ~/labs/lab08/samples/sample_A
cp toy_network_linux    ~/labs/lab08/samples/sample_B
cp toy_persistence_linux ~/labs/lab08/samples/sample_C
cp toy_enum_linux       ~/labs/lab08/samples/sample_D
```

You have four unknown binaries: A, B, C, D. Begin.

---

## Phase 1 — Triage (30 minutes)

**Task 1.1** — Hash all four samples immediately. Document before touching anything else:

```bash
cd ~/labs/lab08/samples
sha256sum sample_A sample_B sample_C sample_D | tee ~/labs/lab08/reports/hashes.txt
```

**Task 1.2** — File type identification:

```bash
file sample_A sample_B sample_C sample_D
```

**Task 1.3** — Quick string triage — which sample has the most suspicious strings?

```bash
for s in sample_A sample_B sample_C sample_D; do
    echo "=== $s ==="
    strings $s | grep -iE "http|beacon|socket|cron|passwd|/tmp|xor|encode" | head -10
    echo ""
done
```

**Task 1.4** — Prioritise. Based on triage alone, rank the four samples from highest to lowest risk and write one sentence justifying each ranking. This is your working hypothesis — you will validate or revise it as analysis progresses.

---

## Phase 2 — Static Analysis (45 minutes)

Work through each sample. For each one document: imports, suspicious strings, entropy, file size and any obvious obfuscation.

**Task 2.1** — Imports (Linux: check dynamic symbols):

```bash
for s in sample_A sample_B sample_C sample_D; do
    echo "=== $s imports ==="
    objdump -T $s 2>/dev/null | grep -v "^$\|DYNAMIC\|Format\|Offset\|-----" | awk '{print $NF}' | sort -u
    echo ""
done
```

**Task 2.2** — Entropy check:

```bash
for s in sample_A sample_B sample_C sample_D; do
    echo "=== $s entropy ==="
    python3 -c "
import math, sys
data = open('$s','rb').read()
if not data: sys.exit()
counts = [0]*256
for b in data: counts[b] += 1
entropy = -sum((c/len(data))*math.log2(c/len(data)) for c in counts if c > 0)
print(f'Entropy: {entropy:.2f} / 8.0')
print('HIGH - possible packing/encryption' if entropy > 7.0 else 'Normal range')
"
    echo ""
done
```

**Task 2.3** — Deep string analysis on your highest-priority sample. Use `strings -n 8` to filter noise:

```bash
strings -n 8 ~/labs/lab08/samples/sample_B | tee ~/labs/lab08/reports/strings_B.txt
wc -l ~/labs/lab08/reports/strings_B.txt
grep -iE "beacon|user.agent|socket|connect|127\.|port|4444" ~/labs/lab08/reports/strings_B.txt
```

---

## Phase 3 — Dynamic Analysis (60 minutes)

**Task 3.1** — Set up network monitoring before running anything:

```bash
# Terminal 1 — packet capture
sudo tcpdump -i lo -w ~/labs/lab08/pcap/capture.pcap &
TCPDUMP_PID=$!

# Terminal 2 — filesystem monitoring  
sudo inotifywait -m -r /tmp ~/labs/lab08/samples/ -e create,modify,delete 2>/dev/null &
INOTIFY_PID=$!
```

**Task 3.2** — Run sample_B (the network beacon) for 20 seconds:

```bash
timeout 20 ~/labs/lab08/samples/sample_B &
SAMPLE_PID=$!
sleep 20
kill $SAMPLE_PID 2>/dev/null
kill $TCPDUMP_PID 2>/dev/null
kill $INOTIFY_PID 2>/dev/null
```

**Task 3.3** — Analyse the capture:

```bash
tcpdump -r ~/labs/lab08/pcap/capture.pcap -n
tcpdump -r ~/labs/lab08/pcap/capture.pcap -n -A | grep -A 5 "beacon\|Toy\|User"
```

Answer these questions from the PCAP:
- What destination IP and port did the sample connect to?
- How many connections were made?
- What was the interval between connections?
- Was there a User-Agent string? What did it say?

> **CTFd Flag:** The C2 port and beacon interval are in the PCAP. Format: `FLAG{hollow_reed_c2_port_<port>_beacon_interval_<seconds>}`  
> Based on your capture, the flag is: `FLAG{hollow_reed_c2_port_4444_beacon_interval_5}`

**Task 3.4** — Run sample_C (persistence) under strace:

```bash
strace -f -e trace=openat,write,execve ~/labs/lab08/samples/sample_C 2>&1 | tee ~/labs/lab08/reports/strace_C.txt | head -50
```

What files did it open or write? What did it try to execute?

**Task 3.5** — Run sample_D (enumeration) and capture its output:

```bash
~/labs/lab08/samples/sample_D 2>&1 | tee ~/labs/lab08/reports/output_D.txt
```

What processes did it enumerate? Did it detect any analyst tools running on your system?

---

## Phase 4 — Memory Analysis (30 minutes)

**Task 4.1** — Capture a memory dump of sample_A while running:

```bash
~/labs/lab08/samples/sample_A &
SAMPLE_PID=$!
sleep 2
gcore -o ~/labs/lab08/memory/sample_A_dump $SAMPLE_PID
kill $SAMPLE_PID
```

**Task 4.2** — Search the dump for decoded strings (these won't appear in static analysis):

```bash
strings ~/labs/lab08/memory/sample_A_dump.* | grep -iE "analysis|demo|decoded|hello|world" | head -20
```

**Task 4.3** — Compare what you found in memory vs what `strings` found in the binary:

```bash
strings ~/labs/lab08/samples/sample_A | grep -iE "analysis|demo" | head -10
```

What strings appear in memory but NOT in the static binary? That delta is what XOR encoding was hiding.

---

## Phase 5 — YARA Rules (20 minutes)

**Task 5.1** — Write three YARA rules based on your findings. Save to `~/labs/lab08/yara/hollow_reed.yar`:

```yara
rule HollowReed_NetworkBeacon {
    meta:
        description = "Detects toy_network C2 beacon behaviour"
        author      = "Your name"
        date        = "2026-03-01"
        reference   = "MAR-2026-LAB08"
    strings:
        // Add strings you found in sample_B
        $ua  = "ToyBeacon" ascii
        $net = { /* XOR-encoded UA bytes you found in lab05 */ }
    condition:
        uint32(0) == 0x464c457f and  // ELF magic
        any of them
}

rule HollowReed_Persistence {
    meta:
        description = "Detects toy_persistence file drop behaviour"
    strings:
        // Add strings from strace output on sample_C
        $s1 = "/tmp/" ascii
        $s2 = "cron" ascii nocase
    condition:
        uint32(0) == 0x464c457f and
        all of them
}

rule HollowReed_Evasion {
    meta:
        description = "Detects sandbox/analyst tool detection"
    strings:
        // Add strings from sample_D output
        $e1 = "strace" ascii
        $e2 = "wireshark" ascii nocase
        $e3 = "/proc" ascii
    condition:
        uint32(0) == 0x464c457f and
        2 of them
}
```

**Task 5.2** — Test your rules against all four samples:

```bash
yara ~/labs/lab08/yara/hollow_reed.yar ~/labs/lab08/samples/
```

Which rules fire on which samples? Are there any false negatives (a rule that should fire but doesn't)?

---

## Phase 6 — Final Report

**Task 6.1** — Write a complete incident report covering all four samples. Use the template from Lab 07. This report must include:

- Executive summary (3 sentences, non-technical)
- One sample details table per binary (4 tables total)
- Consolidated IOC list (hashes, IPs, ports, file paths, strings)
- Full ATT&CK mapping table
- STIX 2.1 bundle
- Three prioritised recommendations

Save to `~/labs/lab08/reports/IR-2026-HollowReed.md`

**Task 6.2** — Answer the debrief questions from Module 08:

1. Which of the four samples explains the unusual network activity, and what specific evidence from your analysis proves it?
2. The machine had been online 72 hours. Which sample's activity would appear in `/var/log/syslog`?
3. What two byte offsets in sample_B would an attacker need to change to point the beacon at a real C2 server?
4. Your YARA rule fires on a legitimate system monitoring tool. How do you update the condition to reduce false positives?
5. In plain language for a non-technical manager: could these files have been running for months undetected?

---

## Completion Checklist

- [ ] All four samples hashed and documented before any analysis
- [ ] Static analysis complete for all four samples
- [ ] Dynamic analysis: PCAP captured and analysed
- [ ] Dynamic analysis: strace output reviewed for sample_C
- [ ] Memory dump captured and decoded strings extracted for sample_A
- [ ] Three YARA rules written and tested
- [ ] Full incident report written
- [ ] Six debrief questions answered
- [ ] Flag submitted on course platform

## Key Takeaway

This lab is the whole course in a single session. Every technique from every previous module contributed to this analysis. That is intentional. Real incident response is not modular — you use everything you know simultaneously, under time pressure, with incomplete information. The workflow you built here is directly transferable to a real engagement.

**Course complete.** You now have the foundation to analyse unknown binaries, document findings professionally, and communicate them to both technical and non-technical audiences.
