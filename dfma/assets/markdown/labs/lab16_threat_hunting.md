# Lab 16 — Threat Hunting Practice

**Module:** 16 — Threat Hunting  
**Estimated time:** 90 minutes  
**Tools:** auditd, python3, bash  
**Flag:** `FLAG{threat_hunt_hypothesis_pivot_persistence_lolbin_memory_network}`

---

## Objectives

- State and execute four structured hunt hypotheses
- Run the persistence hunter and document every finding
- Detect a planted fileless cron persistence entry
- Execute the memory anomaly scanner across all running processes
- Produce a hunt report in standard playbook format

---

## Setup

```bash
sudo apt install -y auditd 2>/dev/null | tail -1

mkdir -p ~/labs/lab16/{scripts,reports,evidence}

# Ensure auditd lab rules are loaded
sudo tee /etc/audit/rules.d/lab16.rules << 'RULES'
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/python3 -k lab16_python
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/bash -k lab16_bash
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/base64 -k lab16_base64
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/curl -k lab16_curl
RULES
sudo service auditd restart 2>/dev/null
echo "[+] Setup complete"
```

---

## Part 1 — Plant the Evidence

Before hunting, plant some things to find. This simulates a partially-compromised system.

```bash
# Plant 1: Fileless cron persistence (base64-encoded one-liner)
PAYLOAD=$(echo 'python3 -c "import os; print(os.getcwd())"' | base64 -w0)
(crontab -l 2>/dev/null; echo "*/7 * * * * echo $PAYLOAD | base64 -d | bash") | crontab -
echo "[+] Cron persistence planted"

# Plant 2: Suspicious file in /dev/shm
echo '#!/bin/bash' > /dev/shm/.sys_cache
echo 'echo "process active"' >> /dev/shm/.sys_cache
chmod +x /dev/shm/.sys_cache
echo "[+] Suspicious /dev/shm file planted"

# Plant 3: Simulate a LOLBin execution (auditd will log it)
ENCODED=$(echo "print('audit_trail_test')" | base64 -w0)
echo "$ENCODED" | base64 -d | python3
echo "[+] LOLBin execution performed (auditd logged it)"

echo ""
echo "Evidence planted. Begin hunts."
```

---

## Part 2 — Hunt 1: Persistence Mechanisms

**Hypothesis:** If an attacker has foothold, they established persistence in one of: cron, systemd, authorized_keys, ld.so.preload, or shell configs.

```bash
cat > ~/labs/lab16/scripts/persistence_hunt.sh << 'EOF'
#!/bin/bash
echo "=== PERSISTENCE HUNT — $(date) ==="
echo "Host: $(hostname)"
echo ""

FINDINGS=0

check() {
    local label="$1"
    local result="$2"
    if [ -n "$result" ]; then
        echo "[ALERT] $label"
        echo "$result" | sed 's/^/  /'
        FINDINGS=$((FINDINGS+1))
    else
        echo "[clean] $label"
    fi
}

# Cron entries with LOLBin patterns
CRON_HITS=$(
  { crontab -l 2>/dev/null; cat /etc/cron* /var/spool/cron/crontabs/* 2>/dev/null; } | \
  grep -E "base64|curl|wget|python.*-c|perl -e|/dev/shm|bash -[ic]" 2>/dev/null
)
check "Cron LOLBin patterns" "$CRON_HITS"

# /dev/shm executables
SHM_EXEC=$(find /dev/shm -type f -executable 2>/dev/null)
check "/dev/shm executables" "$SHM_EXEC"

# /tmp executables newer than 24h
TMP_EXEC=$(find /tmp -type f -executable -newer /etc/passwd 2>/dev/null)
check "/tmp executables (recent)" "$TMP_EXEC"

# ld.so.preload
LDP=$(cat /etc/ld.so.preload 2>/dev/null)
check "/etc/ld.so.preload" "$LDP"

# authorized_keys with command= prefix
AUTH_CMD=$(grep -r "command=" /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null)
check "authorized_keys command=" "$AUTH_CMD"

# New systemd units
NEW_SYSTEMD=$(find /etc/systemd /usr/lib/systemd ~/.config/systemd 2>/dev/null \
  -name "*.service" -newer /etc/passwd -type f 2>/dev/null)
check "New systemd units" "$NEW_SYSTEMD"

# Shell config modifications
SHELL_MOD=$(find /etc/profile.d /home/*/.bashrc /root/.bashrc \
  /etc/environment 2>/dev/null -newer /etc/passwd -type f 2>/dev/null)
check "Modified shell configs" "$SHELL_MOD"

echo ""
echo "=== Total alerts: $FINDINGS ==="
EOF
chmod +x ~/labs/lab16/scripts/persistence_hunt.sh
bash ~/labs/lab16/scripts/persistence_hunt.sh | tee ~/labs/lab16/reports/hunt1_persistence.txt
```

**Expected findings:** cron LOLBin entry and /dev/shm executable — both planted above.

Document each finding:
- What was found?
- Where (which persistence location)?
- Is it the planted item or something pre-existing?
- Disposition: investigate further / confirm malicious / confirm benign?

---

## Part 3 — Hunt 2: LOLBin Execution Chain in auditd

**Hypothesis:** If a fileless payload was delivered via base64-pipe-interpreter, auditd captured the execve chain even with no file on disk.

```bash
# Query auditd for the LOLBin execution we performed in Part 1
echo "=== auditd query: base64 executions ==="
sudo ausearch -k lab16_base64 -i --start today 2>/dev/null | \
  grep -E "type=EXECVE|proctitle|a0=|a1=" | head -20

echo ""
echo "=== auditd query: python3 executions ==="
sudo ausearch -k lab16_python -i --start today 2>/dev/null | \
  grep -E "type=EXECVE|proctitle|a0=|a1=" | head -20

echo ""
echo "=== Timestamp correlation ==="
# Extract timestamps for both
echo "base64 events:"
sudo ausearch -k lab16_base64 --start today 2>/dev/null | \
  grep "^----" -A 2 | grep "msg=audit" | \
  sed 's/.*(\([0-9.]*\):.*/\1/' | head -5

echo "python3 events:"
sudo ausearch -k lab16_python --start today 2>/dev/null | \
  grep "^----" -A 2 | grep "msg=audit" | \
  sed 's/.*(\([0-9.]*\):.*/\1/' | head -5
```

**Questions to answer:**
1. What was the full command line argument to base64?
2. What was the full command line argument to python3?
3. Are their timestamps within 5 seconds of each other?
4. What is the parent process of each?

---

## Part 4 — Hunt 3: Memory Anomalies

**Hypothesis:** Process injection leaves RWX anonymous memory regions in process memory maps.

```bash
# Start toy_network in background to have something running
gcc -o /tmp/hunt_target \
  ~/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app/toy_app_network.c \
  2>/dev/null && /tmp/hunt_target &
TARGET_PID=$!
sleep 2

cat > ~/labs/lab16/scripts/memory_hunt.py << 'EOF'
#!/usr/bin/env python3
import os, glob

print("=== Memory Anomaly Hunt ===")
print(f"Scanning {len(glob.glob('/proc/*/maps'))} processes...\n")

findings = []
for maps_path in glob.glob('/proc/*/maps'):
    try:
        pid = maps_path.split('/')[2]
        cmdline = open(f'/proc/{pid}/cmdline').read().replace('\x00',' ').strip()[:50]
        with open(maps_path) as f:
            for line in f:
                parts = line.split()
                if len(parts) < 5: continue
                perms = parts[1]
                label = parts[5] if len(parts) > 5 else ''
                if ('rwx' in perms and not label and
                    '[stack]' not in line and '[heap]' not in line and
                    '[vsyscall]' not in line):
                    findings.append((pid, cmdline, parts[0], perms))
    except (PermissionError, FileNotFoundError):
        pass

if findings:
    print(f"[ALERT] {len(findings)} suspicious RWX anonymous region(s):")
    for pid, cmd, region, perms in findings:
        print(f"  PID {pid} | {cmd}")
        print(f"  Region: {region}  Perms: {perms}\n")
else:
    print("[clean] No RWX anonymous regions found across all accessible processes")

print("=== Hunt complete ===")
EOF
python3 ~/labs/lab16/scripts/memory_hunt.py | tee ~/labs/lab16/reports/hunt3_memory.txt

kill $TARGET_PID 2>/dev/null
```

Did you find any RWX regions? In which process? Is the toy_network sample expected to have them?

---

## Part 5 — Hunt 4: Network Baseline Deviation

**Hypothesis:** C2 beacon traffic appears as periodic outbound connections to IPs not in the system's normal baseline.

```bash
echo "=== Current established outbound connections ==="
ss -tnp | grep ESTAB

echo ""
echo "=== Non-standard ports (not 22, 80, 443, 53) ==="
ss -tnp | grep ESTAB | awk '{print $5}' | \
  grep -v ":80$\|:443$\|:22$\|:53$\|127\.0\|::1" | sort -u

echo ""
echo "=== Recent DNS queries via auditd (if network logging enabled) ==="
sudo ausearch -sc connect --start "1 hour ago" -i 2>/dev/null | \
  grep "addr=" | awk -F'addr=' '{print $2}' | cut -d' ' -f1 | \
  sort -u | grep -v "^0\." | head -20 || \
  echo "(Network syscall logging not enabled — enable with auditctl -a always,exit -F arch=b64 -S connect)"
```

---

## Part 6 — Write the Hunt Report

**Task 6.1** — Fill in the structured report for all four hunts:

```bash
cat > ~/labs/lab16/reports/hunt_report.md << 'REPORT'
# Threat Hunt Report
**Date:** $(date +%Y-%m-%d)
**Analyst:** [Your name]
**System:** $(hostname)
**Duration:** [X] minutes

---

## Hunt 1 — Persistence Mechanisms

**Hypothesis:** An attacker with foothold established cron, ld.so.preload, authorized_keys, or shell config persistence.

**Data searched:** crontab, /etc/cron.d, /dev/shm, /tmp, /etc/ld.so.preload, authorized_keys, systemd units, shell configs.

**Findings:**
- [Document findings from Part 2 here]

**Conclusion:** [CONFIRMED THREAT / CLEAN / REQUIRES FURTHER INVESTIGATION]

**Disposition:** [What action was taken or recommended]

---

## Hunt 2 — LOLBin Execution Chain

**Hypothesis:** Fileless payload was delivered via base64 decode piped to interpreter. Evidence in auditd execve records.

**Data searched:** auditd execve events for base64 and python3, timestamp correlation.

**Findings:**
- base64 execve at: [TIME], args: [ARGS]
- python3 execve at: [TIME], args: [ARGS]
- Same parent: [YES/NO], gap: [SECONDS]

**Conclusion:** [CONFIRMED THREAT / CLEAN]

---

## Hunt 3 — Memory Anomalies

**Hypothesis:** Process injection leaves RWX anonymous memory regions.

**Data searched:** /proc/*/maps for all running processes.

**Findings:**
- [Document any RWX anonymous regions found]
- Process count scanned: [N]

**Conclusion:** [CONFIRMED THREAT / CLEAN]

---

## Hunt 4 — Network Baseline Deviation

**Hypothesis:** C2 beaconing appears as periodic connections to unexpected IPs.

**Data searched:** ss -tnp established connections, non-standard port connections.

**Findings:**
- [Unexpected connections if any]

**Conclusion:** [CONFIRMED THREAT / CLEAN]

---

## Post-Hunt Cleanup

```bash
# Remove planted evidence
crontab -l 2>/dev/null | grep -v "base64" | crontab -
rm -f /dev/shm/.sys_cache
echo "[+] Planted evidence removed"
```

## Overall Assessment

- Hunts run: 4
- Threats confirmed: [N]
- False positives: [N]
- Detection gaps identified: [list any TTPs this system cannot currently detect]
- Recommended rule additions: [Sigma rules or auditd rules to cover gaps]
REPORT

# Expand variables in the template
sed -i "s/\$(date +%Y-%m-%d)/$(date +%Y-%m-%d)/g" ~/labs/lab16/reports/hunt_report.md
sed -i "s/\$(hostname)/$(hostname)/g" ~/labs/lab16/reports/hunt_report.md

echo "[+] Report template at ~/labs/lab16/reports/hunt_report.md"
echo "Fill in findings from Parts 2-5, then submit."
```

**Task 6.2** — Clean up the planted evidence:

```bash
crontab -l 2>/dev/null | grep -v "base64" | crontab -
rm -f /dev/shm/.sys_cache
echo "[+] Cleanup complete"
crontab -l 2>/dev/null | grep base64 && echo "WARNING: cron not cleaned" || echo "[+] Cron confirmed clean"
ls /dev/shm/.sys_cache 2>/dev/null && echo "WARNING: /dev/shm not cleaned" || echo "[+] /dev/shm confirmed clean"
```

---

## Flag

The flag is generated from completing all four hunts. Once your hunt report has findings documented for all four sections, run:

```bash
python3 -c "
hunts_complete = 4
persistence = True   # Set True when Hunt 1 found the planted cron entry
lolbin = True        # Set True when Hunt 2 found the auditd execve chain
memory = True        # Set True when Hunt 3 scan completed
network = True       # Set True when Hunt 4 completed

if all([persistence, lolbin, memory, network]) and hunts_complete == 4:
    print('FLAG{threat_hunt_hypothesis_pivot_persistence_lolbin_memory_network}')
else:
    print(f'Incomplete — {sum([persistence,lolbin,memory,network])}/4 hunts confirmed')
"
```

> **Flag:** `FLAG{threat_hunt_hypothesis_pivot_persistence_lolbin_memory_network}`

---

## Completion Checklist

- [ ] All four evidence items planted successfully
- [ ] Hunt 1: persistence_hunt.sh run, two planted items found
- [ ] Hunt 2: auditd base64 and python3 execve records found and correlated
- [ ] Hunt 3: memory scanner run across all processes
- [ ] Hunt 4: non-standard port connections checked
- [ ] Hunt report filled in with findings for all four hunts
- [ ] Planted evidence cleaned up (cron entry and /dev/shm file)
- [ ] Flag extracted
