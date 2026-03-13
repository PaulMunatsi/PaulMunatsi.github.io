# Lab 14 — Fileless Malware Detection

**Module:** 14 — Fileless Malware & Living-off-the-Land  
**Estimated time:** 90 minutes  
**Difficulty:** Advanced  
**Flag:** `FLAG{lolbin_base64_pipe_python3_no_file_on_disk}`

---

## Objectives

- Execute a payload that never touches disk and confirm it leaves no file artefact
- Detect the execution using auditd behavioural logging
- Find a running process with suspicious memory permissions
- Identify fileless persistence mechanisms in a simulated compromised environment
- Write a Sigma rule capturing the LOLBin execution chain

---

## Setup

```bash
sudo apt install -y auditd
mkdir -p ~/labs/lab14/{payloads,captures,sigma}

# Deploy LOLBin detection rules
sudo tee /etc/audit/rules.d/lab14.rules << 'EOF'
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/python3 -k lab14_python
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/bash -k lab14_bash
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/base64 -k lab14_base64
-a always,exit -F arch=b64 -S execve -F exe=/usr/bin/curl -k lab14_curl
-a always,exit -F arch=b64 -S execve -F dir=/tmp -k lab14_tmp
-a always,exit -F arch=b64 -S execve -F dir=/dev/shm -k lab14_shm
EOF
sudo service auditd restart
echo "[+] auditd rules loaded"
```

---

## Part 1 — Execute a Fileless Payload

**Task 1.1** — Confirm no payload file exists before execution:

```bash
ls /tmp/safe_payload.py 2>/dev/null && echo "FILE EXISTS" || echo "No file — correct"
find / -name "safe_payload.py" 2>/dev/null | head -5
```

**Task 1.2** — Build, encode and immediately delete the payload:

```bash
# Write the payload
cat > /tmp/safe_payload.py << 'PAYLOAD'
import os, socket, hashlib
print(f"[fileless] PID: {os.getpid()}")
print(f"[fileless] No .py file exists during this execution")
print(f"[fileless] hostname: {socket.gethostname()}")
secret = "lolbin_base64_pipe_python3_no_file_on_disk"
print(f"[fileless] FLAG{{lolbin_base64_pipe_python3_no_file_on_disk}}")
PAYLOAD

# Encode immediately
ENCODED=$(base64 -w0 /tmp/safe_payload.py)

# Delete before execution
rm /tmp/safe_payload.py
echo "[+] Payload encoded. File deleted."
ls /tmp/safe_payload.py 2>/dev/null && echo "STILL EXISTS (error)" || echo "[+] Confirmed: file gone"

# Execute — no file touches disk during execution
echo "$ENCODED" | base64 -d | python3
```

> **CTFd Flag:** Read the output above. The flag is printed by the in-memory payload.

**Task 1.3** — Confirm no trace in the filesystem after execution:

```bash
find / -name "*.py" -newer /etc/passwd 2>/dev/null | grep -v "site-packages\|dist-packages"
find /tmp /dev/shm -type f 2>/dev/null
echo "If empty: payload left no file on disk"
```

---

## Part 2 — Catch It in auditd

The file left no trace. The audit log did.

**Task 2.1** — Query what auditd captured:

```bash
sudo ausearch -k lab14_base64 -i --start today | tail -30
```

Note the full command line, timestamp and parent process.

**Task 2.2** — Query the Python execution immediately after:

```bash
sudo ausearch -k lab14_python -i --start today | tail -30
```

**Task 2.3** — Find the parent-child relationship. Both executions should share the same parent shell PID. Fill in:

```
base64 executed at:     [TIME]     parent PID: [PID]
python3 executed at:    [TIME]     parent PID: [PID]
Gap between executions: [SECONDS]
Same parent?            [YES/NO]
```

This is the detection pivot: `base64 -d` → `python3` from the same parent within 2 seconds = LOLBin execution chain.

**Task 2.4** — Generate an auditd summary report:

```bash
sudo aureport --executable --summary --start today 2>/dev/null | head -20
```

Which executables ran most frequently today? Anything unexpected in the list?

---

## Part 3 — Memory Region Analysis

**Task 3.1** — Start a long-running process and inspect its memory regions:

```bash
# Run toy_app in background
~/course/samples/benign_toy_app/toy_app_linux &
TOY_PID=$!
sleep 1

# Show its memory map
cat /proc/$TOY_PID/maps
```

**Task 3.2** — Identify each region type:

```bash
python3 << PYEOF
with open(f'/proc/$TOY_PID/maps') as f:
    for line in f:
        parts = line.strip().split()
        if len(parts) < 5:
            continue
        addr, perms = parts[0], parts[1]
        label = parts[5] if len(parts) > 5 else '[anonymous]'
        suspicious = 'rwx' in perms and '[stack]' not in label
        flag = ' <-- SUSPICIOUS (rwx anonymous)' if suspicious else ''
        print(f"{perms}  {addr}  {label}{flag}")
PYEOF
```

**Task 3.3** — Run the full RWX scanner across all processes:

```bash
python3 << 'EOF'
import os, glob

print("Scanning all processes for RWX anonymous regions...\n")
found = 0
for maps_path in glob.glob('/proc/*/maps'):
    try:
        pid = maps_path.split('/')[2]
        cmdline = open(f'/proc/{pid}/cmdline').read().replace('\x00',' ').strip()[:50]
        with open(maps_path) as f:
            for line in f:
                if 'rwx' in line.split()[1]:
                    parts = line.split()
                    label = parts[5] if len(parts) > 5 else '[anonymous]'
                    if '[stack]' not in label and '[vsyscall]' not in label:
                        print(f"PID {pid} ({cmdline})")
                        print(f"  {line.strip()}")
                        found += 1
    except (PermissionError, FileNotFoundError, IndexError):
        pass
print(f"\nTotal suspicious regions found: {found}")
EOF

kill $TOY_PID 2>/dev/null
```

How many processes have RWX anonymous regions? Are any unexpected?

---

## Part 4 — Fileless Persistence Hunt

**Task 4.1** — Check every persistence location for LOLBin-style entries:

```bash
echo "=== /etc/ld.so.preload ==="
cat /etc/ld.so.preload 2>/dev/null || echo "(file does not exist — normal)"

echo ""
echo "=== authorized_keys with command= prefix ==="
grep -r "command=" /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null \
  || echo "(none found)"

echo ""
echo "=== cron entries with download/exec patterns ==="
(crontab -l 2>/dev/null; cat /etc/cron* /var/spool/cron/crontabs/* 2>/dev/null) | \
  grep -E "curl|wget|python.*-c|base64|/dev/shm|bash -[ic]|perl -e" \
  || echo "(none found)"

echo ""
echo "=== PROMPT_COMMAND / BASH_ENV / LD_PRELOAD in shell configs ==="
grep -r "PROMPT_COMMAND\|BASH_ENV\|LD_PRELOAD" \
  /etc/profile /etc/bash.bashrc /etc/environment \
  /home/*/.bashrc /home/*/.bash_profile /root/.bashrc 2>/dev/null \
  || echo "(none found)"
```

**Task 4.2** — Plant and detect a simulated fileless cron persistence entry:

```bash
# Add a "malicious" cron (safe — just echoes)
(crontab -l 2>/dev/null; echo "* * * * * echo dGVzdA== | base64 -d | bash") | crontab -

echo "[+] Fileless cron entry planted"
crontab -l | grep base64

# Now detect it
echo ""
echo "Detection:"
crontab -l | grep -E "base64|curl|wget|python.*-c|/dev/shm"

# Clean up
crontab -l 2>/dev/null | grep -v "dGVzdA==" | crontab -
echo "[+] Cron entry removed"
```

**Task 4.3** — Check ptrace scope:

```bash
cat /proc/sys/kernel/yama/ptrace_scope
```

What value did you get? Research what each value means:

| Value | Meaning | Attacker implication |
|---|---|---|
| 0 | Any process can ptrace any other (same UID) | Easy injection |
| 1 | Only parent processes can ptrace children | Requires process hierarchy |
| 2 | Only root can ptrace | Requires privilege escalation first |
| 3 | No ptrace at all | Injection via ptrace blocked completely |

Ubuntu defaults to 1. What does your system show?

---

## Part 5 — Write the Sigma Rule

**Task 5.1** — Write a Sigma rule detecting the LOLBin chain from Part 1:

```bash
cat > ~/labs/lab14/sigma/lolbin_b64_pipe_python.yml << 'EOF'
title: Base64 Decode Piped to Python Interpreter
id: b7f2a3c4-9e5d-4a8b-c7d6-2f3e6g9h0i1j
status: experimental
description: >
    Detects base64 decode execution immediately followed by python3 interpreter
    from the same parent process — a common fileless payload delivery pattern.
    Seen in: commodity RAT deployment, HRD-targeted spyware delivery.
author: [Your name]
date: 2026-03-12
references:
    - https://attack.mitre.org/techniques/T1059/006/
    - https://attack.mitre.org/techniques/T1027/
logsource:
    category: process_creation
    product: linux
detection:
    # Step 1: base64 decode
    base64_decode:
        Image|endswith: '/base64'
        CommandLine|contains: '-d'
    # Step 2: python3 execution from same parent, shortly after
    python_exec:
        Image|endswith:
            - '/python3'
            - '/python'
        ParentImage|endswith: '/bash'
    # Require both to fire — add time correlation in your SIEM
    condition: base64_decode and python_exec
falsepositives:
    - Legitimate decode-then-process workflows in CI/CD pipelines
    - Package installation scripts
level: high
tags:
    - attack.execution
    - attack.t1059.006
    - attack.t1027
    - attack.defense_evasion
fields:
    - Image
    - CommandLine
    - ParentImage
    - ParentCommandLine
    - User
    - UtcTime
EOF

echo "[+] Sigma rule written to ~/labs/lab14/sigma/"
cat ~/labs/lab14/sigma/lolbin_b64_pipe_python.yml
```

**Task 5.2** — Convert to grep format for flat-file log analysis:

```bash
pip3 install sigma-cli --break-system-packages 2>/dev/null | tail -1
sigma convert -t grep ~/labs/lab14/sigma/lolbin_b64_pipe_python.yml 2>/dev/null \
  || echo "sigma-cli not available — manual conversion:"
echo 'grep -E "base64.*-d|python3" /var/log/audit/audit.log'
```

---

## Completion Checklist

- [ ] Fileless payload executed — no .py file existed on disk during execution
- [ ] Flag captured from in-memory output
- [ ] auditd captured base64 and python3 execve events
- [ ] Parent-child relationship confirmed between both execve events
- [ ] RWX region scanner run — results documented
- [ ] All four persistence locations checked (ld.so.preload, authorized_keys, cron, env vars)
- [ ] Simulated cron persistence planted, detected and removed
- [ ] ptrace_scope value documented and interpreted
- [ ] Sigma rule written with correct ATT&CK tags

> **Flag:** `FLAG{lolbin_base64_pipe_python3_no_file_on_disk}`
