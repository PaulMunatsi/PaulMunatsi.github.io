# Module 08: Case Study — Operation Hollow Reed

## Overview

This module applies every technique from Modules 00–07 to a single end-to-end investigation. No new tools are introduced. The goal is to work like an actual analyst: start with a vague report, triage unknown files, build a complete picture of what happened, and deliver an intelligence package.

Work through the phases in order. Each phase produces output that feeds the next. By the end you will have a complete analysis report, a STIX bundle, three YARA rules, and two Sigma rules — everything a SOC needs to hunt for and contain this threat.

---

## Scenario Brief

**Incident Reference:** IR-2026-0311  
**Classification:** TLP:AMBER  
**Reported By:** IT Operations, Harare Regional Office  
**Date Reported:** 2026-03-11  

> *"Something is behaving oddly on a developer workstation in the regional office. The user reports their machine is slower than usual and noticed some unfamiliar processes in `htop`. They also saw a brief terminal window open and close on its own last Tuesday. The machine has been online for 72 hours without a reboot. IT has quarantined it from the LAN but it still has internet access. We found four unknown files in `/tmp` and `~/.config/systemd/user/`. No AV alerts. We don't know if these are related."*

**Your brief:** Determine whether these files are malicious, characterise their behaviour, assess the scope of any compromise, and deliver an actionable intelligence package.

---

## The Evidence Files

In a real incident the files would come from forensic acquisition. Here, the four toy samples represent what IT found and sent to you for analysis:

```
File 1: /tmp/sysmonitor          → toy_app_linux
File 2: /tmp/.network_helper     → toy_network_linux
File 3: ~/.config/systemd/user/update-agent    → toy_persistence_linux
File 4: /tmp/.sysprobe           → toy_enum_linux
```

Set up the case environment:

```bash
mkdir -p ~/cases/IR-2026-0311/{evidence,analysis,reports,iocs,rules}
cd ~/cases/IR-2026-0311

SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

# Rename samples to match the incident filenames
cp ${SAMPLES}/toy_app_linux         evidence/sysmonitor
cp ${SAMPLES}/toy_network_linux     evidence/.network_helper
cp ${SAMPLES}/toy_persistence_linux evidence/update-agent
cp ${SAMPLES}/toy_enum_linux        evidence/.sysprobe

# Compile fresh copies for dynamic analysis
gcc -o analysis/sysmonitor       ${SAMPLES}/toy_app.c
gcc -o analysis/network_helper   ${SAMPLES}/toy_app_network.c
gcc -o analysis/update_agent     ${SAMPLES}/toy_app_persistence.c
gcc -o analysis/sysprobe         ${SAMPLES}/toy_app_enumeration.c

echo "[+] Case environment ready"
ls -la evidence/
```

> **Note on naming:** The real filenames (`sysmonitor`, `.network_helper`, `update-agent`, `.sysprobe`) are chosen to look legitimate. `sysmonitor` sounds like a monitoring daemon. The dot-prefixed files are hidden by default in `ls`. `update-agent` sitting in the systemd user directory looks like a legitimate service unit. This is exactly the kind of naming discipline real malware uses.

---

## Phase 1 — Triage

**Time budget: 15 minutes maximum**

Triage is the rapid first pass. The question is not "what does this do?" — that comes later. The question is "should I care about this file at all, and which one do I analyse first?"

### 1.1 — Hash Everything First

Before touching the files further:

```bash
cd ~/cases/IR-2026-0311

echo "=== Evidence Hashes ===" | tee reports/hashes.txt
for f in evidence/*; do
    echo "" | tee -a reports/hashes.txt
    echo "File: $(basename $f)" | tee -a reports/hashes.txt
    echo "  MD5:    $(md5sum $f | cut -d' ' -f1)" | tee -a reports/hashes.txt
    echo "  SHA-1:  $(sha1sum $f | cut -d' ' -f1)" | tee -a reports/hashes.txt
    echo "  SHA-256:$(sha256sum $f | cut -d' ' -f1)" | tee -a reports/hashes.txt
done

cat reports/hashes.txt
```

> **Why hash first?** Hashes are the chain of custody. Once you start analysing, the access timestamps on the files change. The hash proves the files were not modified during analysis. In a real investigation these hashes go into the incident ticket before anything else happens.

### 1.2 — File Type Identification

```bash
echo "=== File Types ===" | tee reports/triage.txt
for f in evidence/*; do
    echo "$(basename $f): $(file -b $f)" | tee -a reports/triage.txt
done
```

Expected output — all four are ELF 64-bit executables. But note: in a real incident you might find a `.sh` script masquerading as a binary, or a Python script with no extension. The `file` command sees through extensions.

### 1.3 — Quick String Triage

```bash
echo "" >> reports/triage.txt
echo "=== String Triage ===" | tee -a reports/triage.txt

for f in evidence/*; do
    echo "" | tee -a reports/triage.txt
    echo "--- $(basename $f) ---" | tee -a reports/triage.txt

    # Red flag strings
    strings "$f" | grep -iE \
        '(socket|connect|beacon|cron|/tmp|/etc/passwd|/proc/|wireshark|ghidra|BEACON)' \
        | sort -u | tee -a reports/triage.txt
done
```

### 1.4 — Triage Prioritisation

Based on triage output, rank the files by risk:

| Priority | File | Red Flag Strings | Risk |
|---|---|---|---|
| 1 | `.sysprobe` | wireshark, ghidra, /etc/passwd, /proc/ | **HIGH** — sandbox evasion + recon |
| 2 | `.network_helper` | socket, connect, BEACON, send, recv | **HIGH** — C2 beacon |
| 3 | `update-agent` | /tmp, cron | **MEDIUM** — persistence |
| 4 | `sysmonitor` | toy_app.log, XOR pattern | **LOW** — unclear, investigate after others |

Prioritise `.sysprobe` and `.network_helper` for deep analysis.

---

## Phase 2 — Static Analysis

**Reference:** Module 02

Run static analysis on all four files. Work `.sysprobe` first, then `.network_helper`.

### 2.1 — Import Analysis

```bash
cd ~/cases/IR-2026-0311

for f in evidence/*; do
    echo "=== IMPORTS: $(basename $f) ==="
    rabin2 -i "$f" 2>/dev/null | grep -v "^[0-9]* $" | head -20
    echo ""
done | tee analysis/imports.txt
```

Record findings for each file:

**`.sysprobe` critical imports:**
- `opendir` / `readdir` — directory enumeration (walks `/proc`)
- `fopen` on `/etc/passwd` — user enumeration
- `getenv` — environment variable harvesting
- `strcmp` — keyword comparison (sandbox detection list)

**`.network_helper` critical imports:**
- `socket` / `connect` / `send` / `recv` — network communication
- `gethostname` / `getlogin` — system reconnaissance before beacon

**`update-agent` critical imports:**
- `fopen` / `fwrite` — file creation (dropper)
- `strncpy` / `strncat` — string construction (split path anti-analysis trick)

**`sysmonitor` critical imports:**
- `fopen` — log file write
- No network, no sensitive file reads → lowest risk

### 2.2 — Entropy Check

```bash
for f in evidence/*; do
    echo "$(basename $f): $(python3 -c "
import math, sys
d = open('$f','rb').read()
freq = [0]*256
for b in d: freq[b] += 1
n = len(d)
e = -sum((f/n)*math.log2(f/n) for f in freq if f > 0)
print(f'{e:.4f}')
")"
done
```

All four should come in under 5.0 — not packed, not encrypted at the file level. This means static analysis will yield useful strings. If any had scored above 7.0 you would deprioritise static analysis and focus on dynamic unpacking first.

### 2.3 — String Deep Dive

```bash
# Focus on the two high-priority files
for f in evidence/.sysprobe evidence/.network_helper; do
    echo "=== STRINGS: $(basename $f) ==="
    strings -n 6 "$f" | grep -vE '^(lib|/lib|_|GCC|GNU|GLIBC)' | sort -u
    echo ""
done | tee analysis/strings_deep.txt
```

**Key findings from `.sysprobe` strings:**

```
wireshark          ← sandbox detection keyword
ghidra             ← sandbox detection keyword
procmon            ← sandbox detection keyword
x64dbg             ← sandbox detection keyword
volatility         ← sandbox detection keyword
/proc/net/tcp      ← network connection enumeration
/proc/net/udp      ← network connection enumeration
/etc/passwd        ← user enumeration
CUCKOO             ← sandbox environment variable check
SANDBOX            ← sandbox environment variable check
Phase 1            ← internal phase markers
Phase 2
```

**Key findings from `.network_helper` strings:**

```
BEACON|%d|%s|%s|%s|%s    ← C2 beacon format string (exact)
127.0.0.1                  ← hardcoded destination (loopback in this sample)
4444                       ← hardcoded destination port
```

The user agent is NOT visible — it is XOR-encoded. That gap between "there should be a UA string" and "I cannot find it" is itself a finding: deliberate obfuscation of the user agent.

---

## Phase 3 — Dynamic Analysis

**Reference:** Module 03

### 3.1 — Baseline

```bash
mkdir -p ~/cases/IR-2026-0311/analysis/dynamic

# Capture pre-run state
ps aux > analysis/dynamic/procs_before.txt
ss -tnp > analysis/dynamic/net_before.txt
find /tmp /var/tmp ~/.config -type f 2>/dev/null | sort > analysis/dynamic/fs_before.txt
```

### 3.2 — Run `.sysprobe` Under strace

```bash
# Filesystem and network calls only — cut the noise
strace -e trace=openat,connect,socket,getenv \
    -o analysis/dynamic/sysprobe_strace.txt \
    analysis/sysprobe 2>/dev/null

echo "=== Key strace findings: .sysprobe ==="
grep -E '(passwd|/proc/[0-9]|CUCKOO|wireshark)' \
    analysis/dynamic/sysprobe_strace.txt | head -20
```

**Expected findings:**
- `openat(AT_FDCWD, "/etc/passwd", O_RDONLY)` — confirmed user enumeration
- Rapid sequence of `openat(AT_FDCWD, "/proc/NNN/comm", O_RDONLY)` — process enumeration
- `getenv("CUCKOO")` / `getenv("SANDBOX")` — environment variable checks

Each of these is a confirmed behavioural IOC. The strace output is evidence.

### 3.3 — Run `.network_helper` Under strace + tcpdump

```bash
# Terminal 1 — capture on loopback
sudo tcpdump -i lo port 4444 \
    -w analysis/dynamic/network_capture.pcap -q &
TCPDUMP_PID=$!

# Set up a listener
nc -lvp 4444 > analysis/dynamic/beacon_received.txt &
NC_PID=$!

# Run the sample under strace
strace -e trace=socket,connect,send,recv \
    -o analysis/dynamic/network_strace.txt \
    analysis/network_helper

# Stop captures
kill $NC_PID 2>/dev/null
sudo kill $TCPDUMP_PID 2>/dev/null
wait

echo "=== Beacon content received ==="
cat analysis/dynamic/beacon_received.txt

echo ""
echo "=== Network syscalls ==="
grep -E '(connect|send)' analysis/dynamic/network_strace.txt
```

**Expected beacon output:**

```
BEACON|1|<hostname>|<username>|Linux|ToyBeacon/1.0 (Educational)
BEACON|2|<hostname>|<username>|Linux|ToyBeacon/1.0 (Educational)
BEACON|3|<hostname>|<username>|Linux|ToyBeacon/1.0 (Educational)
```

The decoded user agent `ToyBeacon/1.0 (Educational)` now appears in the received beacon — confirming the XOR encoding suspected from static analysis.

### 3.4 — Run `update-agent` Under inotifywait

```bash
# Watch for file drops before running
inotifywait -m -r \
    --format '%T %e %w%f' --timefmt '%H:%M:%S' \
    /tmp /var/tmp ~/.config 2>/dev/null \
    > analysis/dynamic/fs_events.txt &
INOTIFY_PID=$!

sleep 1
analysis/update_agent 2>/dev/null
sleep 2
kill $INOTIFY_PID 2>/dev/null

echo "=== Files created by update-agent ==="
grep CREATE analysis/dynamic/fs_events.txt
```

**Expected findings:**
- `/tmp/cron_demo` created — simulated cron persistence entry
- `/tmp/toy_dropped_payload.txt` created — simulated dropped payload

### 3.5 — Dynamic Findings Summary

```
File: .sysprobe
  Confirmed: /etc/passwd read
  Confirmed: /proc/[pid]/comm enumeration for all running PIDs
  Confirmed: Sandbox env var checks (CUCKOO, SANDBOX, ANALYSIS)
  Confirmed: /proc/net/tcp parsing (live network connection enumeration)

File: .network_helper
  Confirmed: TCP connect to 127.0.0.1:4444
  Confirmed: 3 beacons at 5-second intervals
  Confirmed: Beacon payload: hostname, username, platform, user-agent
  Confirmed: XOR-encoded user agent decodes to "ToyBeacon/1.0 (Educational)"

File: update-agent
  Confirmed: /tmp/cron_demo created (persistence simulation)
  Confirmed: /tmp/toy_dropped_payload.txt created (payload drop simulation)
  Confirmed: String split anti-analysis technique (strncpy + strncat)

File: sysmonitor
  Confirmed: Writes to toy_app.log only
  Confirmed: XOR decode routine (key 0x41)
  No network activity, no sensitive file access
  Verdict: Lowest risk — likely a loader/utility component
```

---

## Phase 4 — Memory Analysis

**Reference:** Module 04

The incident report says the machine had been running for 72 hours. In a real scenario you would acquire a full memory image from the live system. Here, simulate that by capturing memory from the running network beacon.

```bash
# Run the beacon in the background
analysis/network_helper &
BEACON_PID=$!
sleep 2

# Capture process memory
gcore -o analysis/dynamic/beacon_memdump $BEACON_PID
wait $BEACON_PID 2>/dev/null

echo "=== Memory dump created ==="
ls -lh analysis/dynamic/beacon_memdump.*

echo ""
echo "=== Decoded strings in memory (not visible on disk) ==="
strings analysis/dynamic/beacon_memdump.$BEACON_PID \
    | grep -iE '(ToyBeacon|BEACON\|[0-9])'

echo ""
echo "=== All IPs in memory dump ==="
strings analysis/dynamic/beacon_memdump.$BEACON_PID \
    | grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}'
```

**Key memory finding:** `ToyBeacon/1.0 (Educational)` is readable in the memory dump. It is not present in `strings evidence/.network_helper` — the disk copy has it XOR-encoded. This is the definitive proof that the binary decodes strings at runtime and that memory analysis recovers data static analysis cannot.

---

## Phase 5 — Reverse Engineering

**Reference:** Module 06

Two functions are worth reversing fully: the XOR decode in `sysmonitor` and the sandbox detection list in `.sysprobe`.

### 5.1 — Confirm the XOR Algorithm

```bash
r2 -A analysis/sysmonitor 2>/dev/null << 'EOF'
afl
s sym.xor_decode
pdf
q
EOF
```

Extract the key and encoded buffer from the disassembly. Confirm:

```python
encoded = [0x09, 0x24, 0x2d, 0x2d, 0x2e, 0x70, 0x16, 0x2e, 0x33, 0x2d, 0x25]
key = 0x41
print(''.join(chr(b ^ key) for b in encoded))
# Hello1World
```

**RE finding:** `sysmonitor` contains a single-byte XOR deobfuscation routine with key `0x41`. The encoded payload decodes to `Hello1World` — a test or configuration string. This binary may be a template or utility component, not the primary attack payload.

### 5.2 — Extract the Full Keyword List from `.sysprobe`

```bash
# In radare2, find the keyword array
r2 -A analysis/sysprobe 2>/dev/null << 'EOF'
iz
q
EOF
```

Every sandbox keyword string will appear in the `iz` output because they are stored as static data. Document the complete list:

```
wireshark, procmon, x64dbg, ollydbg, ida, ghidra,
pestudio, processhacker, tcpdump, fiddler, burpsuite, volatility
```

**RE finding:** `.sysprobe` contains a hardcoded 12-entry keyword list for analyst tool detection. Any process name matching this list triggers evasion logic. This list is a high-value YARA string set.

---

## Phase 6 — IOC Development

**Reference:** Module 05 and 07

### 6.1 — YARA Rules

Write three rules: one for C2 beaconing, one for the recon/evasion suite, one for the persistence dropper.

```bash
mkdir -p ~/cases/IR-2026-0311/rules
```

```yara
// rules/hollow_reed_c2.yar

rule HollowReed_C2Beacon {
    meta:
        description  = "IR-2026-0311: C2 beacon component (.network_helper)"
        author       = "Course Analyst"
        date         = "2026-03-11"
        reference    = "IR-2026-0311"
        mitre_attack = "T1071.001"
        severity     = "critical"

    strings:
        // Exact beacon format string — very high confidence
        $beacon  = "BEACON|%d|%s|%s|%s|%s" ascii

        // Socket imports visible in ELF symbol table
        $sock1   = "socket"  fullword ascii
        $sock2   = "connect" fullword ascii
        $sock3   = "send"    fullword ascii

        // XOR-encoded user agent — first 8 bytes
        // Key 0x41: "ToyBeacon" → 01 3A 2C 17 30 34 36 3A
        $ua_enc  = { 01 3A 2C 17 30 34 36 3A }

    condition:
        uint32(0) == 0x464C457F and
        filesize < 500KB and
        ($beacon or ($ua_enc and all of ($sock*)))
}
```

```yara
// rules/hollow_reed_recon.yar

rule HollowReed_ReconEvasion {
    meta:
        description  = "IR-2026-0311: Recon/evasion component (.sysprobe)"
        author       = "Course Analyst"
        date         = "2026-03-11"
        reference    = "IR-2026-0311"
        mitre_attack = "T1497.001, T1057, T1087.001"
        severity     = "high"

    strings:
        // Sandbox detection keywords — 4+ in one binary = deliberate evasion
        $k1  = "wireshark"      nocase fullword
        $k2  = "ghidra"         nocase fullword
        $k3  = "procmon"        nocase fullword
        $k4  = "x64dbg"         nocase fullword
        $k5  = "volatility"     nocase fullword
        $k6  = "processhacker"  nocase fullword

        // Sensitive file access patterns
        $r1  = "/etc/passwd"    nocase
        $r2  = "/proc/net/tcp"  nocase

        // Sandbox env var names
        $e1  = "CUCKOO"         fullword
        $e2  = "SANDBOX"        fullword
        $e3  = "ANALYSIS"       fullword

    condition:
        uint32(0) == 0x464C457F and
        filesize < 2MB and
        (
            4 of ($k*) or
            (any of ($r*) and any of ($e*)) or
            (3 of ($k*) and any of ($r*))
        )
}
```

```yara
// rules/hollow_reed_persistence.yar

rule HollowReed_PersistenceDrop {
    meta:
        description  = "IR-2026-0311: Persistence/dropper component (update-agent)"
        author       = "Course Analyst"
        date         = "2026-03-11"
        reference    = "IR-2026-0311"
        mitre_attack = "T1053.003, T1105"
        severity     = "high"

    strings:
        // Internal label from persistence component
        $id   = "ANALYSIS_DEMO_PERSISTENCE" ascii

        // Cron path patterns
        $c1   = "cron_demo"    ascii
        $c2   = "/etc/cron"    nocase

        // Drop paths
        $d1   = "/tmp/"        nocase
        $d2   = "/var/tmp/"    nocase
        $d3   = "/dev/shm/"    nocase

        // Payload content written to dropped file
        $p1   = "payload"      nocase

    condition:
        uint32(0) == 0x464C457F and
        filesize < 1MB and
        ($id or
         (any of ($c*) and any of ($d*)) or
         ($p1 and any of ($d*)))
}
```

Save and test:

```bash
# Save rules
cat > ~/cases/IR-2026-0311/rules/hollow_reed_c2.yar << 'YARARULE'
rule HollowReed_C2Beacon {
    meta:
        description = "IR-2026-0311: C2 beacon component"
        severity    = "critical"
    strings:
        $beacon = "BEACON|%d|%s|%s|%s|%s" ascii
        $sock1  = "socket"  fullword ascii
        $sock2  = "connect" fullword ascii
        $ua_enc = { 01 3A 2C 17 30 34 36 3A }
    condition:
        uint32(0) == 0x464C457F and filesize < 500KB and
        ($beacon or ($ua_enc and $sock1 and $sock2))
}
YARARULE

# Test via Python yara bindings
python3 << 'EOF'
import yara
rules = yara.compile('rules/hollow_reed_c2.yar')
hit = rules.match('evidence/.network_helper')
print(f"C2 rule vs .network_helper: {'HIT ✓' if hit else 'MISS ✗'}")
clean = rules.match('/bin/ls')
print(f"C2 rule vs /bin/ls:         {'FALSE POSITIVE ✗' if clean else 'Clean ✓'}")
EOF
```

### 6.2 — Sigma Rules

```yaml
# rules/hollow_reed_proc_enum.yml

title: HollowReed — Process Enumeration via /proc
id: a1b2c3d4-0311-2026-abcd-hollow-reed-01
status: stable
description: >
  Detects rapid sequential reads of /proc/[PID]/comm — the pattern
  used by the .sysprobe component to enumerate running processes
  for sandbox/analyst tool detection.
author: Course Analyst
date: 2026/03/11
references:
  - IR-2026-0311
tags:
  - attack.discovery
  - attack.t1057
  - attack.defense_evasion
  - attack.t1497.001
logsource:
  product: linux
  category: file_access
detection:
  selection:
    TargetFilename|startswith: '/proc/'
    TargetFilename|endswith: '/comm'
    AccessCount|gte: 10
  filter_legitimate:
    Image|startswith:
      - '/usr/bin/ps'
      - '/usr/bin/top'
      - '/usr/bin/htop'
      - '/bin/systemd'
  condition: selection and not filter_legitimate
falsepositives:
  - Monitoring agents
  - Custom process management scripts
level: medium
```

```yaml
# rules/hollow_reed_env_check.yml

title: HollowReed — Sandbox Environment Variable Enumeration
id: b2c3d4e5-0311-2026-bcde-hollow-reed-02
status: stable
description: >
  Detects getenv() calls for known sandbox indicator environment variables.
  The .sysprobe component checks for CUCKOO, SANDBOX, ANALYSIS, and INETSIM
  before executing its primary payload.
author: Course Analyst
date: 2026/03/11
references:
  - IR-2026-0311
tags:
  - attack.defense_evasion
  - attack.t1497.001
logsource:
  product: linux
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - 'CUCKOO'
      - 'SANDBOX'
      - 'INETSIM'
  condition: selection
falsepositives:
  - Sandbox administrators checking own environment
level: high
```

---

## Phase 7 — STIX Bundle

**Reference:** Module 07, Section 8

```bash
cd ~/cases/IR-2026-0311

python3 << 'EOF'
import json, uuid, datetime

def nid(t): return f"{t}--{uuid.uuid4()}"
def ts():   return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

# Identity
analyst = {
    "type": "identity", "spec_version": "2.1", "id": nid("identity"),
    "created": ts(), "modified": ts(),
    "name": "IR-2026-0311 Analyst", "identity_class": "individual"
}

# Four malware components
components = [
    ("HollowReed.Sysmonitor",   "Utility component with XOR decode routine",         ["trojan"]),
    ("HollowReed.C2Beacon",     "C2 beacon transmitting system recon data",           ["backdoor", "trojan"]),
    ("HollowReed.Persistence",  "Persistence installer and payload dropper",          ["drojan", "dropper"]),
    ("HollowReed.Recon",        "System recon and analyst tool detection component",  ["reconnaissance-ware", "trojan"]),
]

malware_objects = []
for name, desc, types in components:
    malware_objects.append({
        "type": "malware", "spec_version": "2.1", "id": nid("malware"),
        "created": ts(), "modified": ts(),
        "name": name, "description": desc,
        "malware_types": types, "is_family": False,
        "created_by_ref": analyst["id"]
    })

# Hash indicators for each component
sample_files = [
    "evidence/sysmonitor", "evidence/.network_helper",
    "evidence/update-agent", "evidence/.sysprobe"
]

import subprocess
indicators = []
for i, f in enumerate(sample_files):
    try:
        result = subprocess.run(
            ["sha256sum", f], capture_output=True, text=True
        )
        sha256 = result.stdout.split()[0] if result.returncode == 0 else "HASH_UNAVAILABLE"
    except:
        sha256 = "HASH_UNAVAILABLE"

    indicators.append({
        "type": "indicator", "spec_version": "2.1", "id": nid("indicator"),
        "created": ts(), "modified": ts(),
        "name": f"SHA-256: {sample_files[i].split('/')[-1]}",
        "indicator_types": ["malicious-activity"],
        "pattern": f"[file:hashes.'SHA-256' = '{sha256}']",
        "pattern_type": "stix",
        "valid_from": ts(),
        "created_by_ref": analyst["id"]
    })

# Network indicator
net_indicator = {
    "type": "indicator", "spec_version": "2.1", "id": nid("indicator"),
    "created": ts(), "modified": ts(),
    "name": "C2 Beacon: TCP/4444 with BEACON| payload",
    "description": "Outbound TCP connection to port 4444 with structured BEACON| format payload",
    "indicator_types": ["malicious-activity"],
    "pattern": "[network-traffic:dst_port = 4444 AND network-traffic:protocols[*] = 'tcp']",
    "pattern_type": "stix",
    "valid_from": ts(),
    "created_by_ref": analyst["id"]
}

# ATT&CK patterns
techniques = [
    ("T1071.001", "Application Layer Protocol: Web Protocols",
     "https://attack.mitre.org/techniques/T1071/001"),
    ("T1497.001", "Virtualization/Sandbox Evasion: System Checks",
     "https://attack.mitre.org/techniques/T1497/001"),
    ("T1057",     "Process Discovery",
     "https://attack.mitre.org/techniques/T1057"),
    ("T1053.003", "Scheduled Task/Job: Cron",
     "https://attack.mitre.org/techniques/T1053/003"),
    ("T1027",     "Obfuscated Files or Information",
     "https://attack.mitre.org/techniques/T1027"),
]

attack_patterns = []
for tid, name, url in techniques:
    attack_patterns.append({
        "type": "attack-pattern", "spec_version": "2.1", "id": nid("attack-pattern"),
        "created": ts(), "modified": ts(), "name": name,
        "external_references": [{"source_name": "mitre-attack",
                                  "url": url, "external_id": tid}]
    })

# Relationships: each malware indicates via its hash
relationships = []
for i, ind in enumerate(indicators):
    relationships.append({
        "type": "relationship", "spec_version": "2.1", "id": nid("relationship"),
        "created": ts(), "modified": ts(),
        "relationship_type": "indicates",
        "source_ref": ind["id"],
        "target_ref": malware_objects[i]["id"]
    })

# C2 beacon indicator → HollowReed.C2Beacon malware
relationships.append({
    "type": "relationship", "spec_version": "2.1", "id": nid("relationship"),
    "created": ts(), "modified": ts(),
    "relationship_type": "indicates",
    "source_ref": net_indicator["id"],
    "target_ref": malware_objects[1]["id"]   # C2Beacon
})

# C2Beacon uses T1071.001
relationships.append({
    "type": "relationship", "spec_version": "2.1", "id": nid("relationship"),
    "created": ts(), "modified": ts(),
    "relationship_type": "uses",
    "source_ref": malware_objects[1]["id"],
    "target_ref": attack_patterns[0]["id"]
})

# Recon uses T1497.001, T1057
for ap in attack_patterns[1:3]:
    relationships.append({
        "type": "relationship", "spec_version": "2.1", "id": nid("relationship"),
        "created": ts(), "modified": ts(),
        "relationship_type": "uses",
        "source_ref": malware_objects[3]["id"],   # Recon
        "target_ref": ap["id"]
    })

# Persistence uses T1053.003
relationships.append({
    "type": "relationship", "spec_version": "2.1", "id": nid("relationship"),
    "created": ts(), "modified": ts(),
    "relationship_type": "uses",
    "source_ref": malware_objects[2]["id"],
    "target_ref": attack_patterns[3]["id"]
})

all_objects = ([analyst] + malware_objects + indicators +
               [net_indicator] + attack_patterns + relationships)

bundle = {
    "type": "bundle",
    "id": nid("bundle"),
    "objects": all_objects
}

outfile = "iocs/IR-2026-0311.stix2"
with open(outfile, "w") as f:
    json.dump(bundle, f, indent=2)

print(f"[+] STIX bundle: {outfile}")
print(f"[+] Total objects: {len(all_objects)}")
print()
for o in all_objects:
    label = o.get('name', o.get('relationship_type', ''))
    print(f"  {o['type']:20s} {label}")
EOF
```

---

## Phase 8 — Final Report

This is where everything comes together. Fill in the template from Module 07 using all findings above.

```bash
cat > reports/IR-2026-0311_technical_report.md << 'HEADER'
# Malware Analysis Report
**IR-2026-0311 — Operation Hollow Reed**  
**TLP:AMBER — Share within incident response team only**

---

## Executive Summary

Four ELF binaries were recovered from a quarantined developer workstation.
Analysis confirms they form a coordinated toolset with four distinct roles:
reconnaissance and sandbox evasion (.sysprobe), C2 communication
(.network_helper), persistence installation (update-agent), and a utility
component (sysmonitor).

The toolset performs local user and process enumeration, checks for the
presence of 12 analyst/sandbox tools before executing its primary logic,
establishes a structured TCP beacon to a configurable host and port,
installs a simulated cron persistence entry, and drops a payload file to
/tmp. No evidence of lateral movement was observed in the available
evidence.

**Recommended immediate actions:** Block outbound TCP on non-standard
ports from developer workstations. Deploy the three YARA rules in
rules/ to endpoint detection. Audit all ~/.config/systemd/user/ entries
across the fleet.

HEADER

echo "[+] Report header written to reports/IR-2026-0311_technical_report.md"
echo "[+] Complete the remaining sections using findings from Phases 1-7"
```

---

## Phase 9 — Deliverables Checklist

Before closing the incident:

```bash
echo "=== IR-2026-0311 Deliverables Check ==="

check_file() {
    if [ -f "$1" ]; then
        echo "  [✓] $1"
    else
        echo "  [✗] MISSING: $1"
    fi
}

check_file "reports/hashes.txt"
check_file "reports/triage.txt"
check_file "analysis/imports.txt"
check_file "analysis/strings_deep.txt"
check_file "analysis/dynamic/sysprobe_strace.txt"
check_file "analysis/dynamic/network_strace.txt"
check_file "analysis/dynamic/beacon_received.txt"
check_file "analysis/dynamic/network_capture.pcap"
check_file "analysis/dynamic/fs_events.txt"
check_file "analysis/dynamic/beacon_memdump."*
check_file "rules/hollow_reed_c2.yar"
check_file "iocs/IR-2026-0311.stix2"
check_file "reports/IR-2026-0311_technical_report.md"

echo ""
echo "=== Case directory structure ==="
find ~/cases/IR-2026-0311 -type f | sort
```

---

## Final Challenge

**Objective:** Complete everything above independently, then answer these questions in writing. These are the kinds of questions a senior analyst or incident commander will ask in a debrief.

**Time estimate:** 3–4 hours total (all phases combined)

**Questions:**

1. The incident report said "something is behaving oddly." Which of the four files explains the slowdown, and why? Cite specific evidence from your analysis.

2. The machine had been online 72 hours. Which component's activity would appear in `/var/log/syslog` or `journalctl` output, and what would the log entry look like?

3. `update-agent` is located in `~/.config/systemd/user/`. In a real systemd environment, what file would also need to exist in that directory to make this persistent across reboots? What would its contents look like?

4. An attacker controlling `.network_helper` on a production machine would replace `127.0.0.1:4444` with their real C2. What two places in the binary would need to change? How would you find those exact byte offsets using `rabin2` or `strings -t x`?

5. Your YARA rule `HollowReed_ReconEvasion` fires on a legitimate system monitoring tool that also checks for analyst software. How do you update the rule to reduce false positives without losing detection capability? Write the updated condition block.

6. The executive at the incident debrief asks: "Could these files have been there for months without detection?" Answer in plain language, without technical jargon, and base your answer on what the analysis actually found.

---

## Summary

This case study covered:
- ✅ Triage workflow: hash first, file type, quick string scan, prioritise
- ✅ Static analysis: imports, entropy, string deep dive
- ✅ Dynamic analysis: strace, inotifywait, tcpdump, live beacon capture
- ✅ Memory analysis: gcore dump, decoded string recovery
- ✅ Reverse engineering: XOR confirmation, keyword list extraction
- ✅ Three YARA rules tied to specific incident evidence
- ✅ Two Sigma rules from dynamic analysis findings
- ✅ Complete STIX 2.1 bundle with 4 malware components and 5 ATT&CK mappings
- ✅ Full case directory structure and deliverables checklist

The four toy samples were designed to look legitimate at a glance — `sysmonitor`, `update-agent`, hidden dot-files in `/tmp`. A real analyst who skipped triage and went straight to the one file with an obvious name would miss the more dangerous components entirely. Systematic methodology matters more than instinct.

**Course complete.** Return to any module to deepen specific skills. The analysis pipeline — triage → static → dynamic → memory → RE → report — applies to every sample you will ever encounter.

---

## Appendix A — Command Reference for This Case

```bash
# All commands used, in order of execution

# Phase 1: Triage
md5sum sha1sum sha256sum file strings rabin2 -i

# Phase 2: Static
rabin2 -i rabin2 -z strings -n python3 (entropy)

# Phase 3: Dynamic
strace tcpdump nc inotifywait

# Phase 4: Memory
gcore strings grep

# Phase 5: RE
r2 -A python3 (XOR decode)

# Phase 6: IOC
yara python3 (yara-python)

# Phase 7: STIX
python3 json uuid datetime subprocess

# Phase 8: Report
cat tee find
```

## Appendix B — ATT&CK Coverage Map

| Component | Tactic | Technique | Sub-technique |
|---|---|---|---|
| .sysprobe | Discovery | T1057 | — |
| .sysprobe | Discovery | T1087 | .001 Local |
| .sysprobe | Discovery | T1083 | — |
| .sysprobe | Discovery | T1082 | — |
| .sysprobe | Defense Evasion | T1497 | .001 System Checks |
| .network_helper | C2 | T1071 | .001 Web Protocols |
| .network_helper | C2 | T1132 | .001 Standard Encoding |
| .network_helper | Defense Evasion | T1027 | — |
| update-agent | Persistence | T1053 | .003 Cron |
| update-agent | Execution | T1059 | — |
| update-agent | C2 | T1105 | — |
| sysmonitor | Defense Evasion | T1027 | — |

---

*End of course content. For continued learning see the Suggested Reading sections in each module.*
