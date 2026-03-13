# Lab 13 — Anti-Forensics, Ransomware & Lateral Movement

**Module:** 13 — Advanced Topics  
**Estimated time:** 2–3 hours  
**Difficulty:** Advanced  
**Flag:** `FLAG{antiforensics_log_gap_found_timestomp_ctime_mismatch}`

---

## Objectives

- Detect timestamp manipulation using ctime vs mtime inconsistencies
- Identify log gaps indicating deliberate log clearing
- Perform ransomware triage: identify the encryption scheme and assess recoverability
- Find lateral movement indicators in authentication logs
- Set up auditd rules to catch these techniques in real time

---

## Setup

```bash
sudo apt install -y auditd sleuthkit
mkdir -p ~/labs/lab13/{challenge,memory,logs,reports}
cd ~/labs/lab13/challenge
```

**Build the challenge environment:**

```bash
python3 << 'EOF'
import datetime, os, time

# === 1. Tampered auth log with a 2-hour gap ===
log_lines = []
base = datetime.datetime(2026, 3, 10, 8, 0, 0)

# Normal morning activity
for i in range(8):
    t = base + datetime.timedelta(minutes=i*5)
    log_lines.append(
        f"{t.strftime('%b %d %H:%M:%S')} server sshd[1234]: "
        f"Accepted publickey for analyst from 192.168.1.10 port {54300+i}"
    )

# === THE GAP: 08:40 to 10:45 — attacker cleared these entries ===
# Normal services would have generated ~50 lines during this period

# Attacker's successful login appears after the gap
gap_base = datetime.datetime(2026, 3, 10, 10, 47, 0)
for i in range(4):
    t = gap_base + datetime.timedelta(minutes=i*3)
    log_lines.append(
        f"{t.strftime('%b %d %H:%M:%S')} server sshd[9999]: "
        f"Accepted publickey for root from 185.220.101.47 port 44444"
    )
    log_lines.append(
        f"{t.strftime('%b %d %H:%M:%S')} server sudo[{10000+i}]: "
        f"root : TTY=pts/1 ; PWD=/root ; USER=root ; COMMAND=/bin/bash"
    )

# Resume normal activity
resume_base = datetime.datetime(2026, 3, 10, 11, 0, 0)
for i in range(5):
    t = resume_base + datetime.timedelta(minutes=i*10)
    log_lines.append(
        f"{t.strftime('%b %d %H:%M:%S')} server sshd[1234]: "
        f"Accepted publickey for analyst from 192.168.1.10 port {54400+i}"
    )

with open('auth.log.tampered', 'w') as f:
    f.write('\n'.join(log_lines) + '\n')
print("[+] auth.log.tampered created")

# === 2. Timestomped binary ===
with open('suspicious_binary', 'wb') as f:
    # Write a small "binary" with the flag inside
    f.write(b'\x7fELF')  # fake ELF magic
    f.write(b'\x00' * 60)
    f.write(b'FLAG{antiforensics_log_gap_found_timestomp_ctime_mismatch}')
    f.write(b'\x00' * 60)

# Set mtime to 2020 (timestomping — makes file look old)
old_time = time.mktime(datetime.datetime(2020, 1, 1, 0, 0, 0).timetuple())
os.utime('suspicious_binary', (old_time, old_time))
print("[+] suspicious_binary created with timestomped mtime=2020-01-01")
print("    (ctime will show actual creation time — the inconsistency is your clue)")

# === 3. Ransom note ===
ransom_note = """YOUR FILES HAVE BEEN ENCRYPTED

All your important files have been encrypted using AES-256.
Without our decryption key, your files CANNOT be recovered.

To recover your files:
1. Send 0.05 BTC to: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
2. Email your transaction ID to: decrypt@proton-secure-mail.com
3. You will receive your decryption key within 24 hours

FILES AFFECTED: 847 files encrypted
ENCRYPTION ID: a7f3c9d2-4b81-11ec-81d3-0242ac130003
KEY ESCROW: https://decrypt.onion-service.com/key/a7f3c9d2

DO NOT:
- Rename encrypted files
- Use third-party decryption software
- Contact law enforcement (this will void your decryption key)

TIME REMAINING: 72:00:00
"""
with open('README_RESTORE_FILES.txt', 'w') as f:
    f.write(ransom_note)
print("[+] README_RESTORE_FILES.txt created")

# === 4. Simulated encrypted files (XOR, recoverable) ===
files_to_encrypt = {
    'report_q1.docx.locked': b'Quarterly report data placeholder ' * 10,
    'passwords.kdbx.locked': b'KeePass database placeholder content ' * 5,
    'backup_2026.tar.locked': b'Backup archive placeholder content ' * 20,
}
for filename, content in files_to_encrypt.items():
    encrypted = bytes(b ^ 0x37 for b in content)  # XOR key 0x37 — recoverable
    with open(filename, 'wb') as f:
        f.write(encrypted)
print(f"[+] {len(files_to_encrypt)} simulated encrypted files created (.locked)")
print("\nChallenge environment ready. Begin analysis.")
EOF
```

---

## Part 1 — Timestomp Detection

**Task 1.1** — Check the MAC times on `suspicious_binary`:

```bash
stat ~/labs/lab13/challenge/suspicious_binary
```

You will see three timestamps. Write them down:
- `Access` (atime)
- `Modify` (mtime) — what attackers set with `touch -t`
- `Change` (ctime) — kernel-controlled, cannot be set from userspace without root

**Task 1.2** — Identify the inconsistency:

```python
python3 << 'EOF'
import os, time

path = os.path.expanduser("~/labs/lab13/challenge/suspicious_binary")
st = os.stat(path)

mtime = st.st_mtime
ctime = st.st_ctime

print(f"mtime (user-settable): {time.ctime(mtime)}")
print(f"ctime (kernel-set):    {time.ctime(ctime)}")
print(f"Difference:            {abs(ctime - mtime) / 86400:.1f} days")

if abs(ctime - mtime) > 86400:
    print("\n[!] ANOMALY: mtime and ctime differ by more than 24 hours")
    print("    This is a strong indicator of timestomping")
    print("    The ctime reflects the REAL creation/modification time")
else:
    print("\n[OK] No significant timestamp anomaly")
EOF
```

**Task 1.3** — Find the flag hidden in the binary using strings:

```bash
strings ~/labs/lab13/challenge/suspicious_binary
```

> **CTFd Flag:** The flag is in the binary output above.

**Task 1.4** — Scan the entire challenge directory for timestomped files:

```bash
python3 << 'EOF'
import os, time, glob

challenge_dir = os.path.expanduser("~/labs/lab13/challenge")
print("Files with mtime/ctime discrepancy > 1 day:\n")

for fpath in glob.glob(f"{challenge_dir}/**/*", recursive=True):
    if not os.path.isfile(fpath):
        continue
    try:
        st = os.stat(fpath)
        diff = abs(st.st_ctime - st.st_mtime)
        if diff > 86400:
            print(f"  {os.path.basename(fpath)}")
            print(f"    mtime: {time.ctime(st.st_mtime)}")
            print(f"    ctime: {time.ctime(st.st_ctime)}")
            print(f"    gap:   {diff/86400:.1f} days\n")
    except:
        pass
EOF
```

---

## Part 2 — Log Gap Analysis

**Task 2.1** — Read the tampered log and identify timestamps:

```bash
cat ~/labs/lab13/challenge/auth.log.tampered
```

**Task 2.2** — Extract all timestamps and find the gap:

```bash
grep -oE "[0-9]{2}:[0-9]{2}:[0-9]{2}" \
  ~/labs/lab13/challenge/auth.log.tampered | head -30
```

**Task 2.3** — Write a script to find gaps larger than 30 minutes:

```python
python3 << 'EOF'
import re
from datetime import datetime

log_path = os.path.expanduser("~/labs/lab13/challenge/auth.log.tampered")
import os

timestamps = []
with open(log_path) as f:
    for line in f:
        m = re.match(r'(\w+ \d+ \d+:\d+:\d+)', line)
        if m:
            try:
                ts = datetime.strptime(f"2026 {m.group(1)}", "%Y %b %d %H:%M:%S")
                timestamps.append((ts, line.strip()))
            except:
                pass

print(f"Total log entries: {len(timestamps)}")
print(f"First entry: {timestamps[0][0]}")
print(f"Last entry:  {timestamps[-1][0]}\n")

print("Gaps > 10 minutes:")
for i in range(1, len(timestamps)):
    gap = (timestamps[i][0] - timestamps[i-1][0]).total_seconds() / 60
    if gap > 10:
        print(f"\n  [GAP DETECTED: {gap:.0f} minutes]")
        print(f"  Last before gap: {timestamps[i-1][0].strftime('%H:%M:%S')} — {timestamps[i-1][1][:80]}")
        print(f"  First after gap: {timestamps[i][0].strftime('%H:%M:%S')} — {timestamps[i][1][:80]}")
EOF
```

**Task 2.4** — Identify the attacker's IP and the account they used:

```bash
grep -E "185\.|root@|root :" ~/labs/lab13/challenge/auth.log.tampered
```

Answer:
- What IP did the attacker connect from?
- Which account did they gain access as?
- What command did they run after login?
- Why is port 44444 suspicious for an SSH connection?

---

## Part 3 — Ransomware Analysis

**Task 3.1** — Read the ransom note and extract all IOCs:

```bash
cat ~/labs/lab13/challenge/README_RESTORE_FILES.txt
```

Extract and document:
- Bitcoin wallet address
- Contact email
- C2/decryptor URL
- Encryption ID (often used as victim identifier)
- Encryption algorithm claimed

**Task 3.2** — Examine the encrypted files:

```bash
ls -la ~/labs/lab13/challenge/*.locked
file ~/labs/lab13/challenge/*.locked
xxd ~/labs/lab13/challenge/report_q1.docx.locked | head -5
```

**Task 3.3** — Determine the encryption scheme. Check entropy:

```python
python3 << 'EOF'
import math, os, glob

for fpath in glob.glob(os.path.expanduser("~/labs/lab13/challenge/*.locked")):
    data = open(fpath, 'rb').read()
    if not data:
        continue
    counts = [0]*256
    for b in data:
        counts[b] += 1
    entropy = -sum((c/len(data))*math.log2(c/len(data)) for c in counts if c)
    print(f"{os.path.basename(fpath)}: entropy={entropy:.2f}/8.0", end="")
    if entropy > 7.2:
        print(" [HIGH — strong encryption or compression]")
    elif entropy > 5.5:
        print(" [MEDIUM — XOR or weak encryption]")
    else:
        print(" [LOW — minimal obfuscation]")
EOF
```

Is the entropy consistent with the AES-256 claimed in the ransom note? What does the actual entropy suggest?

**Task 3.4** — Attempt decryption. The encryption key is recoverable:

```python
python3 << 'EOF'
import glob, os

# Try common single-byte XOR keys
for fpath in glob.glob(os.path.expanduser("~/labs/lab13/challenge/*.locked")):
    data = open(fpath, 'rb').read()
    for key in range(0x01, 0xFF):
        decrypted = bytes(b ^ key for b in data)
        # Check if decryption looks like printable ASCII (simple heuristic)
        printable = sum(1 for b in decrypted if 0x20 <= b <= 0x7e or b in [0x09, 0x0a, 0x0d])
        ratio = printable / len(decrypted)
        if ratio > 0.85:
            print(f"{os.path.basename(fpath)}: key=0x{key:02x}, printable={ratio:.1%}")
            print(f"  Preview: {decrypted[:60].decode('utf-8', errors='replace')}")
            break
EOF
```

**Task 3.5** — What would your next steps be if this were a real incident?

Write answers to:
1. The ransom note claims AES-256. Your entropy analysis suggests otherwise. How does this change your response?
2. The encryption ID `a7f3c9d2-...` is in the ransom note. What database would you check this against?
3. If decryption is not possible, what recovery options exist on a Linux system?
4. The attacker's Bitcoin address is known. Can this be used for attribution?

---

## Part 4 — Lateral Movement Detection

**Task 4.1** — Set up auditd rules to catch lateral movement in real time:

```bash
sudo tee /etc/audit/rules.d/lab13.rules << 'EOF'
# SSH key manipulation
-w /root/.ssh -p wa -k ssh_root_key
-w /home -p wa -k ssh_home_key

# Privilege escalation
-w /usr/bin/sudo -p x -k sudo_exec
-w /bin/su -p x -k su_exec

# Network reconnaissance tools
-w /usr/bin/ssh -p x -k ssh_exec
-w /usr/bin/nmap -p x -k nmap_exec
-w /usr/bin/nc -p x -k nc_exec

# /tmp execution
-a always,exit -F dir=/tmp -F perm=x -k tmp_exec

# Log file access (attacker may read logs to understand what's recorded)
-w /var/log/auth.log -p r -k log_read
EOF

sudo service auditd restart
echo "auditd rules loaded"
sudo auditctl -l | head -20
```

**Task 4.2** — Simulate a lateral movement action and catch it:

```bash
# This simulates the type of action an attacker would perform
# after gaining access
echo "test" | sudo tee /tmp/test_exec_$(date +%s) > /dev/null
chmod +x /tmp/test_exec_*
/tmp/test_exec_* 2>/dev/null || true

# Check auditd caught it
sleep 1
sudo ausearch -k tmp_exec -i 2>/dev/null | tail -15
```

**Task 4.3** — Parse the auth log for geographic anomalies:

```bash
# The attacker's IP 185.220.101.47 is a known Tor exit node
# In a real environment, check against threat intel
python3 << 'EOF'
import re

# Known Tor exit node ranges (simplified for lab)
TOR_RANGES = ["185.220.", "199.87.", "51.75.", "62.102."]

with open(os.path.expanduser("~/labs/lab13/challenge/auth.log.tampered")) as f:
    import os
    for line in f:
        if "Accepted" in line:
            m = re.search(r'from (\d+\.\d+\.\d+\.\d+)', line)
            if m:
                ip = m.group(1)
                is_tor = any(ip.startswith(r) for r in TOR_RANGES)
                flag = "[TOR EXIT NODE - HIGH RISK]" if is_tor else "[internal/known]"
                print(f"  {ip} {flag}")
EOF
```

---

## Part 5 — Full Incident Timeline

**Task 5.1** — Reconstruct the full attack timeline from all evidence gathered:

```markdown
# Incident Timeline — Lab13 Challenge

| Time (approx) | Event | Evidence Source | Confidence |
|---|---|---|---|
| 08:00–08:35 | Normal analyst SSH activity | auth.log | High |
| 08:40–10:45 | **LOG GAP — 2h5m of records deleted** | auth.log (gap analysis) | High |
| (unknown) | Timestomped binary placed on system | ctime/mtime inconsistency | High |
| 10:47 | Root login from 185.220.101.47 (Tor) | auth.log | High |
| 10:47–11:00 | Attacker activity (no logs — cleared) | Log gap | High |
| (unknown) | 847 files encrypted with XOR key 0x37 | .locked files, entropy analysis | High |
| (unknown) | Ransom note dropped | README_RESTORE_FILES.txt | High |
| 11:00+ | Normal activity resumes | auth.log | High |
```

**Task 5.2** — Complete the triage report:

```bash
cat > ~/labs/lab13/reports/triage_report.md << 'EOF'
# Triage Report — Lab 13 Challenge

**Analyst:** [Your name]
**Date:** 2026-03-12
**Classification:** TLP:GREEN

## Executive Summary
[Write 2-3 sentences for a non-technical manager]

## Anti-Forensics Evidence
- Timestomping: [filename, mtime vs ctime gap]
- Log clearing: [gap duration, lines affected estimate]

## Attacker IOCs
- IP: 185.220.101.47 (Tor exit node)
- Port: 44444 (non-standard SSH)
- Account compromised: root

## Ransomware Assessment
- Claimed algorithm: AES-256
- Actual encryption: [what you found]
- Recoverable: [Yes/No, why]
- Files affected: 3 in lab (847 claimed in ransom note)

## Recommendations
1. [Immediate action]
2. [Short-term action]
3. [Long-term hardening]
EOF
echo "Report template created — fill in your findings"
```

---

## Completion Checklist

- [ ] Timestomping detected on `suspicious_binary` via ctime/mtime comparison
- [ ] Flag extracted from `suspicious_binary` using strings
- [ ] Log gap identified: start time, end time, duration
- [ ] Attacker IP, account and command identified from auth log
- [ ] Entropy analysis run on all `.locked` files
- [ ] XOR key found and files decrypted
- [ ] Inconsistency between claimed AES-256 and actual encryption documented
- [ ] auditd rules deployed and tested
- [ ] Tor exit node IP flagged by automated check
- [ ] Full attack timeline reconstructed
- [ ] Triage report written

> **Flag:** `FLAG{antiforensics_log_gap_found_timestomp_ctime_mismatch}`
