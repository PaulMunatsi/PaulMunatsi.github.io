# Module 13 — Advanced Topics: Anti-Forensics, Ransomware & Lateral Movement

**Prerequisites:** Modules 01–08 (all core modules)  
**Estimated time:** 4–5 hours  
**Tools:** auditd, sleuthkit, Volatility3, strings, grep

---

## Overview

This module covers three advanced topics that appear together in real incidents: attackers who try to hide their tracks (anti-forensics), attackers who encrypt the entire system for ransom (ransomware), and attackers who move through a network after initial access (lateral movement). Understanding all three is required for competent incident response.

---

# PART A — Anti-Forensics Detection

## 13.1 What Is Anti-Forensics

Anti-forensics is any technique used to prevent, confuse or mislead forensic analysis. Attackers use it to:
- Destroy evidence before investigators arrive
- Make timeline reconstruction impossible
- Create plausible deniability
- Slow down analysis to buy operational time

The important insight: **anti-forensics leaves its own traces.** A skilled analyst can often detect that anti-forensics was performed even when the original evidence is gone. The absence of expected artefacts is itself evidence.

---

## 13.2 Timestomping

Timestomping modifies a file's MAC times (Modified, Accessed, Changed) to make it appear older or newer than it actually is.

### Detection

```bash
# MAC times in Linux are stored in the inode
# stat shows all three:
stat /suspicious/file

# Timestomping often produces inconsistencies:
# - Modification time BEFORE creation time (impossible legitimately)
# - ctime (inode change time) cannot be easily falsified from userspace
#   because the kernel updates it on any metadata change
# If mtime != ctime, timestomping is likely

# Find files where mtime is suspiciously inconsistent with ctime
find /home /tmp /var -type f -newer /var/log/syslog \
  ! -newer /proc/1/cmdline 2>/dev/null | head -20

# Compare mtime vs ctime for suspicious files
python3 << 'EOF'
import os, time

def check_timestamp_anomaly(path):
    st = os.stat(path)
    mtime = st.st_mtime
    ctime = st.st_ctime
    diff = abs(ctime - mtime)
    if diff > 86400:  # More than 1 day apart
        print(f"ANOMALY: {path}")
        print(f"  mtime: {time.ctime(mtime)}")
        print(f"  ctime: {time.ctime(ctime)}")
        print(f"  diff:  {diff/3600:.1f} hours")

import glob
for path in glob.glob("/tmp/**/*", recursive=True):
    try:
        check_timestamp_anomaly(path)
    except (PermissionError, FileNotFoundError):
        pass
EOF
```

### Creating a Timeline That Survives Timestomping

`ctime` (inode change time) is automatically updated by the kernel on any write — an attacker would need kernel-level access to falsify it. Use it as your anchor:

```bash
# Build timeline using ctime (not mtime) for reliability
find / -xdev -type f -printf "%C+ %p\n" 2>/dev/null | sort | \
  grep "^2026-03-1[0-2]" > /mnt/evidence/reliable_timeline.txt
```

---

## 13.3 Log Clearing

Attackers routinely clear system logs to remove evidence of their presence.

### What Gets Cleared

```bash
# Common log targets:
/var/log/auth.log       # SSH logins, sudo, authentication
/var/log/syslog         # General system events
/var/log/kern.log       # Kernel messages
~/.bash_history         # Command history
/var/log/wtmp           # Login records (binary)
/var/log/lastlog        # Last login per user (binary)
/var/run/utmp           # Currently logged in users
```

### Detecting Log Clearing

```bash
# 1. Log files that are suspiciously small or empty
find /var/log -name "*.log" -size 0 -newer /var/log/dpkg.log
find /var/log -name "auth.log" -size -100c  # Auth log under 100 bytes is suspicious

# 2. Gaps in timestamps inside log files
# A legitimate auth.log has continuous entries. A gap of hours is suspicious.
awk '{print $1, $2, $3}' /var/log/auth.log | \
  grep "Mar 1[0-2]" | head -5
# If last entry is 03:00 and next is 09:00, 6 hours are missing

# 3. wtmp tampering — binary log of logins
last -f /var/log/wtmp | head -20
# Unusual: no entries, or entries that don't match auth.log

# 4. auditd catches log clearing in real time
# If auditd is running:
sudo auditctl -w /var/log/auth.log -p wa -k log_tamper
sudo auditctl -w /var/log/syslog -p wa -k log_tamper
# Then check:
sudo ausearch -k log_tamper | head -30
```

### The Nuclear Option — shred

`shred` overwrites file content before deleting, making recovery harder:

```bash
# Detect shred traces
# shred leaves characteristic overwrite patterns in unallocated space
# Also: if a file was shredded, the directory entry may remain briefly

# Check for recently deleted files using debugfs (ext4 only)
sudo debugfs -R "ls -d /home/attacker" /dev/sdb1 2>/dev/null

# Deleted inodes in ext4
sudo debugfs -R "lsdel" /dev/sdb1 2>/dev/null | head -20
```

---

## 13.4 Rootkit Indicators

Rootkits hide processes, files and network connections from normal inspection tools. They work by hooking the system call table or replacing kernel modules.

### Syscall Table Integrity

```bash
# On a clean system, save the syscall table state
sudo cat /proc/kallsyms | grep "sys_call_table" > ~/baseline_syscall.txt

# If the addresses change between reboots without a kernel update: rootkit
# Compare:
diff ~/baseline_syscall.txt <(sudo cat /proc/kallsyms | grep "sys_call_table")
```

### Process Hiding Detection

```bash
# Compare processes visible to ps vs processes in /proc
# A rootkit may hide a PID from ps but leave the /proc entry (or vice versa)

python3 << 'EOF'
import os, subprocess

# Get PIDs from /proc
proc_pids = set()
for entry in os.listdir('/proc'):
    if entry.isdigit():
        proc_pids.add(int(entry))

# Get PIDs from ps
ps_output = subprocess.check_output(['ps', '-A', '-o', 'pid']).decode()
ps_pids = set(int(line.strip()) for line in ps_output.split('\n')[1:] if line.strip())

hidden = proc_pids - ps_pids
if hidden:
    print(f"POTENTIAL ROOTKIT: {len(hidden)} PIDs in /proc but not in ps:")
    for pid in sorted(hidden):
        try:
            cmdline = open(f'/proc/{pid}/cmdline').read().replace('\x00', ' ')
            print(f"  PID {pid}: {cmdline[:80]}")
        except:
            print(f"  PID {pid}: (unreadable)")
else:
    print("No hidden processes detected")
EOF
```

### Network Connection Hiding

```bash
# Compare ss/netstat output vs /proc/net/tcp
python3 << 'EOF'
# Read connections from /proc/net/tcp (cannot be hidden by userspace rootkit)
connections = []
with open('/proc/net/tcp') as f:
    for line in f.readlines()[1:]:
        parts = line.split()
        if len(parts) > 3:
            local_hex = parts[1]
            state = int(parts[3], 16)
            if state == 1:  # TCP_ESTABLISHED
                ip_hex, port_hex = local_hex.split(':')
                ip = '.'.join(str(int(ip_hex[i:i+2], 16))
                              for i in [6,4,2,0])
                port = int(port_hex, 16)
                connections.append(f"{ip}:{port}")

print("Connections visible in /proc/net/tcp (kernel level):")
for c in connections:
    print(f"  {c}")
print("\nIf 'ss -tnp' shows FEWER connections than above: rootkit suspected")
EOF
```

---

# PART B — Ransomware Analysis

## 13.5 Ransomware Architecture

Ransomware follows a consistent pattern regardless of family:

```
1. Delivery & Execution
   ↓
2. Persistence establishment (before encryption starts)
   ↓
3. Privilege escalation (optional — for shadow copy deletion)
   ↓
4. Reconnaissance (find valuable files, network shares)
   ↓
5. Key generation (symmetric key encrypted with attacker's public key)
   ↓
6. Encryption (files overwritten with encrypted content)
   ↓
7. Ransom note drop (README.txt / HOW_TO_DECRYPT.html in each directory)
   ↓
8. Shadow copy / backup deletion (vssadmin, wbadmin on Windows)
   ↓
9. C2 communication (key escrow, status reporting)
```

### The Encryption Architecture

Understanding the encryption scheme determines whether decryption is possible:

| Scheme | Description | Decryptable? |
|---|---|---|
| Symmetric only (AES key hardcoded or derived from ransom ID) | Same key encrypts all files | Sometimes — if key is in memory or derivable |
| Hybrid: AES per file, RSA-encrypted AES key stored in file | Attacker holds RSA private key | No — without attacker's private key |
| Hybrid: AES per session, RSA-encrypted session key in ransom note | One key for all files in session | Sometimes — if session key recoverable |
| XOR with static key | Weak, often seen in commodity ransomware | Yes — key often visible in strings |

---

## 13.6 Static Ransomware Analysis

### Building a Toy Ransomware Simulator

```c
/* toy_ransomware_sim.c — For analysis practice ONLY
 * This encrypts files in a SPECIFIED SAFE DIRECTORY only.
 * NEVER run outside the designated test directory.
 * Uses XOR (recoverable) not AES — so damage is always reversible.
 */
```

Rather than build an actual encryptor, we analyse the patterns:

```bash
# Strings that indicate ransomware capability
strings suspicious_binary | grep -iE \
  "encrypt\|aes\|rsa\|cbc\|gcm\|vssadmin\|shadow\|backup\|ransom\|bitcoin\|wallet\|README\|DECRYPT\|\.locked\|\.enc\b"

# File extension targeting lists (ransomware hardcodes extensions to encrypt)
strings suspicious_binary | grep -E "^\.(doc|xls|pdf|jpg|mp4|sql|zip|7z|tar|bak|key|pem)"

# Network IOC patterns (C2, key escrow server, onion addresses)
strings suspicious_binary | grep -E "\.onion|tor2web|http.*decrypt|key.*server"

# Import/library patterns on Linux ransomware
objdump -T suspicious | grep -iE "openssl|libcrypt|EVP_\|AES_\|RSA_"
```

### Identifying the Encryption Scheme

```bash
# Check for OpenSSL API calls — indicates proper crypto
objdump -T suspicious | grep "EVP_EncryptInit\|AES_set_encrypt\|RSA_public_encrypt"

# Check for custom/weak crypto (XOR loops)
objdump -d suspicious | grep -B2 -A2 "xor" | grep -v "xor.*eax.*eax\|xor.*rax.*rax"
# Note: xor reg,reg is a zero idiom — ignore those
# xor byte [ptr], reg is actual XOR encryption

# Entropy of encrypted output vs original
# After encryption, entropy should be near 8.0 (random)
# If entropy is ~4-5, weak/no encryption
```

### Key Storage Detection

Where does the ransomware store the encryption key?

```bash
# Key in the encrypted file (common pattern: key appended to file)
# Check if encrypted files end in a recognisable structure
xxd encrypted_file.locked | tail -4

# Key in a manifest file (check for files created alongside encrypted files)
find /tmp -name "*.key" -o -name "key.txt" -o -name "manifest.json" 2>/dev/null

# Key in memory (most recoverable)
# If ransomware process is still running:
gcore -o /tmp/ransom_dump $RANSOMWARE_PID
strings /tmp/ransom_dump.* | grep -E "^[A-Fa-f0-9]{64}$"  # SHA256-length hex
strings /tmp/ransom_dump.* | grep -E "^[A-Za-z0-9+/]{43}=$"  # Base64-encoded 256-bit key
```

---

## 13.7 Ransomware Incident Response

### Immediate Actions (First 15 Minutes)

```bash
# 1. DO NOT turn off the machine — key may be in RAM
# 2. Isolate from network immediately
sudo iptables -I OUTPUT -j DROP
sudo iptables -I INPUT -j DROP

# 3. Identify the ransomware process
ps auxf | grep -v grep | grep -iE "encrypt\|lock\|crypt\|ransom"
lsof +D /home 2>/dev/null | grep "(deleted)\|\.locked\|\.enc"

# 4. Dump memory BEFORE killing the process
RANSOM_PID=$(ps aux | grep suspicious | grep -v grep | awk '{print $2}')
gcore -o /mnt/usb/ransom_memory_dump $RANSOM_PID

# 5. NOW kill the process (stops further encryption)
kill -9 $RANSOM_PID

# 6. Document what's encrypted vs what's not
find /home -name "*.locked" -o -name "*.enc" 2>/dev/null | wc -l
find /home -name "*.locked" -o -name "*.enc" 2>/dev/null | head -20
```

### Recovery Assessment

```bash
# Check for shadow copies (Linux — LVM snapshots)
sudo lvs 2>/dev/null
sudo vgs 2>/dev/null

# Check for backup files
find / -name "*.bak" -newer /etc/passwd 2>/dev/null | head -10

# Check filesystem-level snapshots (btrfs, zfs)
sudo btrfs subvolume list / 2>/dev/null
sudo zfs list -t snapshot 2>/dev/null

# Analyse the ransom note for decryptor availability
# Many families have public decryptors from NoMoreRansom project
cat README_TO_RESTORE_FILES.txt 2>/dev/null || \
cat HOW_TO_DECRYPT.html 2>/dev/null || \
find / -name "*.txt" -newer /etc/passwd -size -10k 2>/dev/null | head -5
```

---

# PART C — Lateral Movement Indicators

## 13.8 What Is Lateral Movement

After initial access, attackers move through a network to reach higher-value targets — domain controllers, sensitive file servers, backup systems. On Linux environments (common in civil society organisations running Ubuntu servers), lateral movement typically uses:

- SSH with stolen credentials or keys
- Exploitation of services running on internal hosts
- Credential reuse from memory dumps
- Abuse of trust relationships between systems

---

## 13.9 SSH-Based Lateral Movement

### Indicators in Auth Logs

```bash
# Failed logins (brute force / credential spray)
grep "Failed password" /var/log/auth.log | \
  awk '{print $11}' | sort | uniq -c | sort -rn | head -10

# Successful logins from unusual IPs
grep "Accepted" /var/log/auth.log | \
  grep -v "127.0.0.1\|192.168.1\." | head -20

# Logins at unusual hours (e.g. 2-4am local time)
grep "Accepted" /var/log/auth.log | \
  awk '{print $3}' | cut -d: -f1 | sort | uniq -c | sort -rn

# Multiple successful logins in short succession (lateral spread)
grep "Accepted" /var/log/auth.log | \
  awk '{print $1, $2, $3, $9, $11}' | sort -k4 | head -30
```

### SSH Key Theft and Reuse

```bash
# Check for new/modified authorized_keys files (attacker added their key)
find /home /root -name "authorized_keys" \
  -newer /etc/passwd 2>/dev/null

# Show all authorized keys
for user_home in /home/* /root; do
    key_file="$user_home/.ssh/authorized_keys"
    if [ -f "$key_file" ]; then
        echo "=== $key_file ==="
        cat "$key_file"
        echo ""
    fi
done

# SSH private keys in unusual locations
find / -name "id_rsa" -o -name "id_ed25519" -o -name "*.pem" 2>/dev/null | \
  grep -v ".ssh\|/etc/ssl" | head -20
```

### Known-Hosts as a Lateral Movement Map

```bash
# known_hosts reveals which systems this host has connected to
# An attacker who compromised this machine can use this as a target list

for user_home in /home/* /root; do
    kh="$user_home/.ssh/known_hosts"
    if [ -f "$kh" ]; then
        echo "=== $kh ==="
        # Hash format — decode with ssh-keygen
        ssh-keygen -F localhost -f "$kh" 2>/dev/null || cat "$kh"
        echo ""
    fi
done
```

---

## 13.10 Credential Harvesting in Memory

On a compromised Linux system, attackers dump credentials from memory:

```bash
# Find processes that may hold credentials in memory
# sudo/su sessions, SSH agents, password managers
ps aux | grep -E "sudo|su -|ssh-agent|gpg-agent|keepass|pass"

# SSH agent key extraction (if agent socket accessible)
ls -la /tmp/ssh-*/agent.* 2>/dev/null
SSH_AUTH_SOCK=/tmp/ssh-XXXXX/agent.NNNN ssh-add -l 2>/dev/null

# Using Volatility3 on a memory dump to find credentials
# vol3 -f memory.lime linux.bash  # bash command history from memory
# vol3 -f memory.lime linux.pslist # process list
# vol3 -f memory.lime linux.netstat # network connections from memory
```

---

## 13.11 Detecting Lateral Movement with auditd

`auditd` is the Linux Audit Framework — it logs security-relevant events at the kernel level. Unlike syslog, audit records cannot be cleared by an attacker without kernel-level access.

```bash
sudo apt install -y auditd

# Configure rules to catch lateral movement patterns
sudo tee /etc/audit/rules.d/lateral_movement.rules << 'EOF'
# Monitor SSH key file modifications
-w /root/.ssh/authorized_keys -p wa -k ssh_key_change
-w /home -p wa -k home_ssh_change

# Monitor privilege escalation
-w /usr/bin/sudo -p x -k sudo_exec
-w /bin/su -p x -k su_exec

# Monitor network tool usage (common in lateral movement)
-w /usr/bin/ssh -p x -k ssh_use
-w /usr/bin/scp -p x -k scp_use
-w /usr/bin/nc -p x -k nc_use
-w /usr/bin/ncat -p x -k nc_use
-w /usr/bin/netcat -p x -k nc_use

# Monitor cron modifications (persistence)
-w /var/spool/cron -p wa -k cron_change
-w /etc/cron.d -p wa -k cron_change

# Monitor /tmp execution (common staging area)
-a always,exit -F dir=/tmp -F perm=x -k tmp_exec
EOF

sudo service auditd restart

# Search audit log for lateral movement indicators
sudo ausearch -k ssh_key_change -i | tail -20
sudo ausearch -k sudo_exec -i | tail -20
sudo ausearch -k tmp_exec -i | tail -20
```

---

## 13.12 Lab

See [Lab 13 — Anti-Forensics, Ransomware and Lateral Movement](../labs/lab13_advanced.md)

---

## 13.13 Challenge

**The Covered Tracks**

A server has been compromised. The attacker attempted to cover their tracks. Three artefacts remain:

```bash
# Set up challenge
mkdir -p ~/labs/lab13/challenge
cd ~/labs/lab13/challenge

# Simulated tampered auth log (gap in timestamps)
python3 -c "
import datetime
lines = []
base = datetime.datetime(2026, 3, 10, 8, 0, 0)
for i in range(5):
    t = base + datetime.timedelta(minutes=i*5)
    lines.append(f'{t.strftime(\"%b %d %H:%M:%S\")} server sshd[1234]: Accepted publickey for analyst from 192.168.1.10 port 54321')
# Gap — attacker deleted 2 hours of logs
base2 = datetime.datetime(2026, 3, 10, 10, 15, 0)
for i in range(3):
    t = base2 + datetime.timedelta(minutes=i*5)
    lines.append(f'{t.strftime(\"%b %d %H:%M:%S\")} server sshd[1234]: Accepted publickey for root from 192.168.1.99 port 44444')
with open('auth.log.tampered', 'w') as f:
    f.write('\n'.join(lines))
print('auth.log.tampered created')
"

# Timestomped file
touch -t 202001010000 suspicious_binary
echo "FLAG{antiforensics_log_gap_found_timestomp_ctime_mismatch}" > suspicious_binary

# Create a ransom note
echo "YOUR FILES HAVE BEEN ENCRYPTED. Send 0.05 BTC to bc1qXXXXXX" > README.RESTORE.txt
```

Tasks:
1. Identify the time gap in `auth.log.tampered` — what hours are missing?
2. Identify the timestomping on `suspicious_binary` — what inconsistency reveals it?
3. Find and read the hidden flag in `suspicious_binary`
4. From the auth log, identify the attacker's IP and which account they escalated to

**Flag:** `FLAG{antiforensics_log_gap_found_timestomp_ctime_mismatch}`

---

## Knowledge Check

1. **An attacker used `touch -t 202001010000 malware.elf` to set the mtime to January 2020. What single command line exposes this deception?**

   <details>
   <summary>Answer</summary>
   `stat malware.elf` — the output shows three timestamps: Access, Modify (mtime — what the attacker set) and Change (ctime — set by the kernel when any metadata changes). The attacker set mtime to 2020 but the kernel automatically updated ctime to the actual current time when `touch` ran. A file created in 2020 that was never subsequently modified would have mtime and ctime within seconds of each other. A gap of years between mtime and ctime is impossible through normal usage — it proves the timestamp was deliberately falsified.
   </details>

2. **auth.log shows entries at 08:00 and then jumps to 10:30 with a successful root login from a Tor exit node. What happened in the gap?**

   <details>
   <summary>Answer</summary>
   The gap indicates deliberate log clearing — the attacker deleted or truncated auth.log between 08:00 and 10:30 to remove evidence of their entry and lateral movement. The root login at 10:30 from a Tor exit node is what they left after the cleanup (or failed to fully clean). The 2.5-hour absence of log entries on an active system is itself evidence of tampering — Linux systems with normal activity produce continuous syslog entries. Recovery options: check `/var/log/auth.log.1` or `.gz` archives for earlier entries, check auditd logs (which the attacker may not have cleared), check `journald` (separate logging path), check `/var/log/wtmp` binary login records.
   </details>

3. **You identify ransomware that claims to use AES-256 in its ransom note, but entropy analysis of the encrypted files shows 4.8/8.0. What does this tell you?**

   <details>
   <summary>Answer</summary>
   4.8 entropy is far too low for AES-256 output, which should be indistinguishable from random (entropy 7.9–8.0). This means: (1) The actual encryption is weak — likely XOR with a short key, or ROT-based, or Caesar cipher; (2) The "AES-256" claim in the ransom note is false — either to intimidate victims or because the actor copied a ransom note template; (3) The files may be recoverable without paying — try single-byte XOR key brute force (255 attempts), check if the first few bytes of encrypted files suggest a known file format (PDF, ZIP, DOCX) after XOR with candidate keys; (4) Cross-reference with public decryptor databases (NoMoreRansom project) — weak-crypto ransomware families often have published decryptors.
   </details>
