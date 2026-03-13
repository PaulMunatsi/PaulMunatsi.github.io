# Module 16 — Threat Hunting

**Prerequisites:** Modules 05 (YARA & Sigma), 11 (Threat Actor Profiling), 14 (Fileless Malware)  
**Estimated time:** 3–4 hours  
**Tools:** auditd, sigma-cli, grep, awk, python3, Volatility3  
**Difficulty:** Advanced

---

## Overview

Detection rules fire on known bad. Threat hunting finds unknown bad — or known-technique bad that your rules haven't caught yet. It's the difference between waiting for the smoke alarm and periodically walking through the building looking for smouldering wires.

Every module in this course has built toward this one. You know how malware behaves (Modules 03–06). You know what threat actors do (Module 11). You know what fileless attacks look like (Module 14). Threat hunting is applying that knowledge proactively, before an alert fires, to answer the question: *are we already compromised?*

---

## 16.1 The Hunting Process

Threat hunting follows a four-step cycle:

```
1. HYPOTHESIS
   "Based on TTP X, if an actor was in our environment, we would expect to see Y"
   ↓
2. COLLECTION
   Gather the data that would confirm or deny Y (logs, memory, network, filesystem)
   ↓
3. ANALYSIS
   Search for Y. Pivot on anomalies. Follow the thread.
   ↓
4. OUTCOME
   A) Threat found — escalate to incident response
   B) Nothing found — refine hypothesis, improve detection coverage
```

The outcome is useful either way. Finding nothing with a well-constructed hunt means your coverage is good for that TTP. Finding something means you caught a threat before it triggered an alert.

---

## 16.2 Hypothesis Construction

A hypothesis links a threat actor's known TTPs to observable evidence in your environment. It is not "search for malware." It is specific and falsifiable.

**Weak hypothesis:** "Check if we have any malware."

**Strong hypothesis:** "Dark Caracal operators use Android stalkerware delivered via WhatsApp. If a defender's device in our network was targeted, we expect to see: (a) unusual APK installations from unknown sources, (b) new accessibility service bindings, (c) abnormal data usage patterns from communication apps."

### Hypothesis Sources

| Source | Example |
|---|---|
| Threat actor reports | "Charming Kitten uses Chrome extensions for credential theft" |
| ATT&CK technique analysis | "T1053.003: Cron — hunt for unusual cron entries" |
| Recent vulnerability disclosure | "SSH key injection in ld.so.preload hijacks" |
| Anomaly in existing logs | "Unusual outbound DNS volume at 03:00 daily" |
| Peer organisation incident | "Neighbouring NGO compromised via malicious PDF" |
| Your own previous analysis | "toy_network uses port 4444 — hunt for other port-4444 beacons" |

---

## 16.3 Hunting by TTP Category

### Hunt 1 — Persistence Mechanisms

**Hypothesis:** An attacker with foothold on our Linux systems will establish persistence. Hunt every known persistence location.

```bash
#!/bin/bash
# persistence_hunt.sh

echo "=== PERSISTENCE HUNT ==="
echo "Date: $(date)"
echo "Host: $(hostname)"
echo ""

# 1. Cron jobs with download/execute patterns
echo "--- Cron with LOLBin patterns ---"
for cron_loc in /etc/crontab /etc/cron.d/* /var/spool/cron/crontabs/*; do
    [ -f "$cron_loc" ] || continue
    matches=$(grep -E "curl|wget|python.*-c|base64|/dev/shm|bash -[ic]|nc " "$cron_loc" 2>/dev/null)
    [ -n "$matches" ] && echo "  $cron_loc: $matches"
done
# Also per-user crontabs
for user_home in /home/* /root; do
    crontab -u "$(basename $user_home)" -l 2>/dev/null | \
      grep -E "curl|wget|python.*-c|base64|/dev/shm" | \
      while read line; do echo "  user $(basename $user_home): $line"; done
done

# 2. Systemd units added recently
echo ""
echo "--- New systemd units (last 7 days) ---"
find /etc/systemd /usr/lib/systemd ~/.config/systemd 2>/dev/null \
  -name "*.service" -newer /etc/passwd -type f | \
  while read f; do
    echo "  $f"
    grep -E "ExecStart|User" "$f" | head -2
  done

# 3. SSH authorized_keys anomalies
echo ""
echo "--- authorized_keys with command= prefix ---"
grep -r "command=" /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null && \
  echo "  FOUND - investigate immediately" || echo "  (none)"

# 4. ld.so.preload
echo ""
echo "--- ld.so.preload ---"
[ -f /etc/ld.so.preload ] && echo "  EXISTS: $(cat /etc/ld.so.preload)" \
  || echo "  (not present — normal)"

# 5. SUID/SGID binaries added recently
echo ""
echo "--- New SUID/SGID binaries (last 7 days) ---"
find / -xdev \( -perm -4000 -o -perm -2000 \) -newer /etc/passwd -type f 2>/dev/null | \
  while read f; do echo "  $f ($(stat -c '%U %G %a' "$f"))"; done

# 6. Profile/bashrc modifications
echo ""
echo "--- Shell config changes (last 7 days) ---"
find /etc/profile.d /home/*/.bashrc /home/*/.bash_profile /root/.bashrc \
  /etc/environment 2>/dev/null \
  -newer /etc/passwd -type f | \
  while read f; do echo "  Modified: $f"; done

echo ""
echo "=== HUNT COMPLETE ==="
```

```bash
chmod +x persistence_hunt.sh
bash persistence_hunt.sh | tee ~/labs/lab16/persistence_hunt_$(date +%Y%m%d).txt
```

### Hunt 2 — LOLBin Execution Chains

**Hypothesis:** If an attacker used a fileless delivery (Module 14 patterns), auditd has the execve trail even if no file remains.

```bash
# Hunt in auditd logs for suspicious interpreter chains
# Requires auditd running with Module 14 rules

sudo ausearch -sc execve --start yesterday 2>/dev/null | \
python3 << 'EOF'
import sys, re
from collections import defaultdict

events = []
current = {}

for line in sys.stdin:
    line = line.strip()
    if line.startswith('----'):
        if current:
            events.append(current)
        current = {}
    elif 'type=EXECVE' in line:
        args = re.findall(r'a\d+="([^"]+)"', line)
        current['cmd'] = ' '.join(args)
        ts = re.search(r'msg=audit\(([0-9.]+)', line)
        if ts:
            current['time'] = float(ts.group(1).split(':')[0])
    elif 'type=PROCTITLE' in line:
        title = re.search(r'proctitle="([^"]+)"', line)
        if title:
            current.setdefault('cmd', title.group(1))

# Find suspicious patterns
suspicious_keywords = ['base64', 'python3 -c', 'perl -e', 'bash -i', 'curl', 'wget', '/dev/shm']
print("Suspicious execve events:")
print("-" * 60)
for event in events:
    cmd = event.get('cmd', '')
    if any(kw in cmd for kw in suspicious_keywords):
        print(f"  {cmd[:100]}")
EOF
```

### Hunt 3 — Memory Anomalies

**Hypothesis:** Process injection leaves RWX anonymous memory regions. Hunt every running process.

```bash
python3 << 'EOF'
import os, glob, subprocess

print("Memory anomaly hunt — RWX anonymous regions\n")
findings = []

for maps_path in glob.glob('/proc/*/maps'):
    try:
        pid = maps_path.split('/')[2]
        cmdline = open(f'/proc/{pid}/cmdline').read().replace('\x00',' ').strip()

        with open(maps_path) as f:
            for line in f:
                parts = line.split()
                if len(parts) < 5:
                    continue
                perms = parts[1]
                label = parts[5] if len(parts) > 5 else ''

                # RWX + anonymous (no file backing) + not stack/heap
                if ('rwx' in perms and
                    not label and
                    '[stack]' not in line and
                    '[heap]' not in line):
                    findings.append({
                        'pid': pid,
                        'cmd': cmdline[:60],
                        'region': parts[0],
                        'perms': perms
                    })
    except (PermissionError, FileNotFoundError):
        pass

if findings:
    print(f"ALERT: {len(findings)} suspicious regions found\n")
    for f in findings:
        print(f"  PID {f['pid']} ({f['cmd']})")
        print(f"  Region: {f['region']} Perms: {f['perms']}\n")
else:
    print("No suspicious RWX anonymous regions found.")
    print("(This is the expected result on a clean system)")
EOF
```

### Hunt 4 — Network Baseline Deviation

**Hypothesis:** C2 beacons appear as periodic connections to IPs our systems don't normally contact.

```bash
# Establish what "normal" looks like first
# In production: compare current connections against 30-day baseline
# In this lab: compare against expected connections

echo "=== Current outbound connections ==="
ss -tnp | grep ESTAB | awk '{print $5, $6}' | grep -v "127.0.0.1\|::1" | sort -u

echo ""
echo "=== Connections on non-standard ports (not 80, 443, 22, 53) ==="
ss -tnp | grep ESTAB | awk '{print $5}' | \
  grep -v ":80$\|:443$\|:22$\|:53$\|127.0\|::1" | sort -u

echo ""
echo "=== DNS queries in last hour (requires auditd or DNS logging) ==="
# If you have auditd network logging enabled:
sudo ausearch -sc connect --start "1 hour ago" -i 2>/dev/null | \
  grep -E "addr=" | awk -F'addr=' '{print $2}' | cut -d' ' -f1 | sort -u | head -20
```

### Hunt 5 — Scheduled Task Anomalies

**Hypothesis:** Attacker-installed cron jobs run at unusual hours or use unusual frequencies.

```python
#!/usr/bin/env python3
# cron_anomaly_hunter.py

import subprocess, re

def parse_cron_time(schedule):
    """Return (minute, hour, dom, month, dow) from cron schedule string."""
    parts = schedule.split()[:5]
    return parts if len(parts) == 5 else None

def is_suspicious(parts):
    reasons = []
    if parts is None:
        return []

    minute, hour, dom, month, dow = parts

    # Running every minute
    if minute == '*' and hour == '*':
        reasons.append("runs every minute")

    # 2-4am execution (attacker preferred window)
    if hour in ['2','3','4'] and minute == '0':
        reasons.append(f"executes at {hour}:00am")

    # Odd minute intervals (e.g. */3 -- uncommon in legitimate cron)
    if re.match(r'\*/[3-9]$', minute) or re.match(r'\*/[1-9][0-9]$', minute):
        reasons.append(f"unusual minute interval: {minute}")

    return reasons

# Get all crontabs
cron_sources = []
result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
if result.returncode == 0:
    for line in result.stdout.split('\n'):
        line = line.strip()
        if line and not line.startswith('#'):
            cron_sources.append(('current user', line))

# /etc/cron.d
try:
    import os, glob
    for f in glob.glob('/etc/cron.d/*') + ['/etc/crontab']:
        if os.path.isfile(f):
            with open(f) as fh:
                for line in fh:
                    line = line.strip()
                    if line and not line.startswith('#') and len(line.split()) >= 6:
                        cron_sources.append((f, line))
except PermissionError:
    pass

print(f"{'Source':<30} {'Schedule':<25} {'Command':<30} {'Flags'}")
print("-" * 100)
for source, line in cron_sources:
    parts_all = line.split()
    if len(parts_all) < 6:
        continue
    schedule = parts_all[:5]
    command = ' '.join(parts_all[5:])
    reasons = is_suspicious(schedule)
    flags = ', '.join(reasons) if reasons else ''
    print(f"{source:<30} {' '.join(schedule):<25} {command[:30]:<30} {flags}")
```

---

## 16.4 Pivoting on Evidence

When you find an anomaly, you pivot — use that finding to look for related indicators.

**Example pivot chain:**

```
Finding: Unusual cron entry running base64 decode
  ↓
Pivot 1: What process created this cron entry?
  → auditd: ausearch -f /var/spool/cron/crontabs/root
  ↓
Pivot 2: What network connections did that process make?
  → auditd: correlate PID with connect syscalls
  ↓
Pivot 3: What IP did it connect to?
  → Network logs / PCAP
  ↓
Pivot 4: Has that IP been contacted by any other host?
  → Check all hosts if you have centralised logging
  ↓
Pivot 5: What certificate does that IP serve?
  → curl -k -v https://ip 2>&1 | grep -A 5 "subject\|issuer"
  ↓
Pivot 6: What other domains share that certificate?
  → crt.sh / Censys / Shodan
  ↓
New IOCs: Additional C2 infrastructure discovered
```

Each pivot either deepens the confirmed compromise or helps rule it out. Document every step.

---

## 16.5 Building a Hunt Playbook

A playbook is a documented, repeatable hunt that your team can run on a schedule or in response to a threat report.

```markdown
# Hunt Playbook: LOLBin Fileless Delivery

**Trigger:** New threat report involving base64-decode-to-interpreter delivery,
             OR routine scheduled hunt

**Hypothesis:** Attacker delivered payload via base64-piped interpreter execution.
                Evidence: auditd execve records, /tmp or /dev/shm file creation,
                unusual outbound network connections.

**Data sources required:**
- auditd logs (execve, connect syscalls)
- /proc filesystem (running process inspection)
- Network flow data or PCAP

**Hunt steps:**
1. Query auditd for base64 execve within 10s of python3/bash/perl execve
   Command: [see Hunt 2 above]
2. Scan all running processes for RWX anonymous memory regions
   Command: [see Hunt 3 above]
3. Check /dev/shm and /tmp for recently created executables
   Command: find /dev/shm /tmp -type f -executable -newer /etc/passwd
4. Check outbound connections from interpreter processes
   Command: lsof -i -n -P | grep -E "python|bash|perl"

**Positive indicator:** Execve chain with encoded argument, followed by outbound connection
**False positive sources:** CI/CD pipelines, package installation scripts
**Escalation path:** If confirmed, isolate host, capture memory, contact IR team

**Frequency:** Run weekly; run immediately after any threat report mentioning LOLBins
**Owner:** [Analyst name]
**Last run:** [Date]
**Result:** [Clean / Found — link to IR ticket]
```

---

## 16.6 Lab

See [Lab 16 — Threat Hunting Practice](../labs/lab16_threat_hunting.md)

---

## 16.7 Challenge

**Hunt the Hypothetical**

You receive intelligence that a threat actor targeting Southern African civil society is using the following TTPs:

- Delivery via malicious WhatsApp link to APK
- Persistence via cron one-liner using base64-encoded curl
- C2 beaconing on port 8443 with 60-second interval and ±15% jitter
- Anti-forensics: timestomping newly placed files

Build and execute a hunt for each TTP on your lab system:

1. Run `persistence_hunt.sh` and document every finding (expected: clean)
2. Run the cron anomaly hunter — any non-standard schedules?
3. Run the memory hunt — any RWX anonymous regions?
4. Run `beacon_detector.py` against any available PCAP — any beacons found?
5. Run the timestamp anomaly check from Module 13 — any mtime/ctime gaps > 1 day?

For each hunt: state your hypothesis, what you searched, what you found, and whether you confirm or deny the presence of that TTP.

**Flag:** `FLAG{threat_hunt_hypothesis_pivot_persistence_lolbin_memory_network}`

---

## Knowledge Check

1. **What is the difference between threat detection and threat hunting? Give a concrete example of each.**

   <details>
   <summary>Answer</summary>
   Detection is reactive: a rule fires when a known-bad indicator or behaviour is observed. Example: a YARA rule alerts when a file matching the ToyBeacon XOR pattern appears on disk. Hunting is proactive: an analyst forms a hypothesis and searches for evidence of compromise that existing rules haven't caught. Example: knowing Dark Caracal uses accessibility services, you query all enrolled mobile devices for apps with BIND_ACCESSIBILITY_SERVICE and no launcher activity — finding the stalkerware before it triggers any detection rule.
   </details>

2. **A hunt finds nothing. Is this a good or bad outcome? Explain.**

   <details>
   <summary>Answer</summary>
   It depends entirely on the quality of the hypothesis and the data. A well-constructed hunt against comprehensive data that finds nothing is a genuinely good outcome — it reduces the probability of that specific TTP being present. It also validates your detection coverage for that technique, which is itself intelligence. A poorly-constructed hunt (wrong data source, incomplete query, weak hypothesis) that finds nothing is meaningless — absence of evidence is not evidence of absence if you weren't looking in the right place. Always document what data you searched, what query you used, and the date, so the hunt result is reproducible.
   </details>

3. **`persistence_hunt.sh` flags a cron entry: `*/5 * * * * /usr/local/bin/monitoring_agent`. How do you determine if this is legitimate or malicious?**

   <details>
   <summary>Answer</summary>
   Triage steps: (1) File the binary: `file /usr/local/bin/monitoring_agent` — is it what it claims? (2) Hash it: `sha256sum` and check against VirusTotal and your internal known-good inventory. (3) Check when it was installed: `stat /usr/local/bin/monitoring_agent` — does the timestamp match a known software deployment? (4) Check who owns it and its permissions: `ls -la /usr/local/bin/monitoring_agent`. (5) Run strings and check imports — does it look like a monitoring agent or something else? (6) Check what network connections it makes: `lsof -i -p $(pgrep monitoring_agent)`. (7) Cross-reference with change management records — was this installed intentionally?
   </details>

4. **You identify a pivot chain: unusual cron → curl download → python3 execution → outbound connection to 185.220.x.x. What are your next three actions?**

   <details>
   <summary>Answer</summary>
   (1) Isolate the host immediately — disconnect from network (not power off, to preserve memory evidence). The 185.220.x.x range is Tor exit nodes; an active C2 connection means the attacker may have real-time access. (2) Capture memory before doing anything else: `avml /mnt/usb/memory_$(date +%s).lime` — the Python process and any decoded payload are in RAM and will be lost on shutdown. (3) Hash and preserve all artefacts in place (cron file, any dropped files, the curl URL from auditd logs, the Python script content from memory) and open an incident response ticket. Do not yet kill processes, clear cron, or wipe — that destroys evidence needed for the full investigation.
   </details>

5. **How does threat hunting change after you complete Module 11 (Threat Actor Profiling) compared to before?**

   <details>
   <summary>Answer</summary>
   Before actor profiling, hunting is generic — "look for unusual processes, unusual network connections, unusual persistence." After profiling, hunting is targeted and efficient. If you know a specific actor likely targeting your organisation (e.g. Dark Caracal targeting an HRD NGO in Southern Africa), you hunt specifically for their documented TTPs: accessibility service bindings on mobile devices, HTTPS C2 with specific certificate patterns, fake "secure messaging" APKs. You prioritise the techniques that actor actually uses rather than hunting the entire ATT&CK matrix. The threat profile tells you where to look first, which dramatically increases the signal-to-noise ratio of your hunts.
   </details>
