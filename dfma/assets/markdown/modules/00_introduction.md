# Module 00: Introduction to Digital Forensics & Malware Analysis

## Learning Objectives

By the end of this module, you will be able to:
- Understand the scope and ethics of defensive security analysis
- Recognize legal boundaries and authorization requirements
- Set up a safe, isolated lab environment
- Identify the different phases of malware analysis
- Understand the threat landscape and analysis goals

---

## 1. Welcome to Defensive Security

### What This Course Covers

This course teaches **defensive** cybersecurity skills:
- **Digital Forensics**: Investigating security incidents and recovering evidence
- **Malware Analysis**: Understanding malicious behavior to detect and prevent threats
- **Incident Response**: Responding to and recovering from security breaches
- **Threat Intelligence**: Identifying indicators and tracking threat actors

### What This Course Does NOT Cover

- Creating or weaponizing malware
- Offensive hacking or penetration testing
- Unauthorized system access techniques
- Exploiting vulnerabilities (except in authorized testing)

---

## 2. Ethics and Legal Framework

### Core Ethical Principles

1. **Authorization is Mandatory**
   - Never analyze a device you don't own without written permission
   - Corporate devices require employer authorization
   - Personal devices require owner consent

2. **Isolation is Required**
   - All analysis must occur in isolated lab environments
   - No connection to production networks
   - Use VMs with snapshots for safety

3. **Responsible Disclosure**
   - Report vulnerabilities through proper channels
   - Give organizations time to patch before public disclosure
   - Follow industry-standard disclosure timelines (typically 90 days)

4. **Minimize Harm**
   - Never create or release actual malware
   - Don't share exploit code publicly
   - Consider the impact of your research

### Legal Considerations

!!! danger "Legal Warning"
    Violating these laws can result in criminal prosecution, fines, and imprisonment.

**Key Laws to Know:**

- **United States**: Computer Fraud and Abuse Act (CFAA)
  - Unauthorized access to computers is a federal crime
  - Penalties: Up to 10+ years imprisonment, significant fines
  
- **European Union**: Computer Misuse Directive, GDPR
  - Unauthorized access and data processing violations
  - GDPR fines: Up to €20 million or 4% of global revenue

- **United Kingdom**: Computer Misuse Act 1990
  - Unauthorized access, modification, or impairment
  - Penalties: Up to 10 years imprisonment

- **International**: Council of Europe Convention on Cybercrime
  - Harmonizes cybercrime laws across 60+ countries

**Always Verify**: Check your local laws and regulations.

---

## 3. The Malware Analysis Workflow

### Analysis Phases

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Triage & Basic Static Analysis                │
│  - File type, size, hashes                              │
│  - Strings, metadata, PE/ELF headers                    │
│  - Quick determination: Is this malicious?              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 2: Dynamic Analysis (Behavioral)                 │
│  - Run in isolated sandbox                              │
│  - Monitor: files, registry, network, processes         │
│  - Observe behavior without reverse engineering         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Advanced Static Analysis (Reverse Eng.)       │
│  - Disassembly with Ghidra/IDA                          │
│  - Understand code logic and capabilities               │
│  - Identify obfuscation, packing, anti-analysis         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 4: Reporting & IOC Creation                      │
│  - Document findings                                     │
│  - Create detection rules (YARA, Sigma, STIX)           │
│  - Share intelligence with community                     │
└─────────────────────────────────────────────────────────┘
```

### Analysis Goals

Different scenarios require different analysis depths:

| Scenario | Goal | Analysis Depth |
|----------|------|----------------|
| **Incident Response** | Contain & remediate | Basic + Dynamic |
| **Threat Hunting** | Find similar threats | Basic + IOC creation |
| **Zero-Day Investigation** | Full understanding | All phases |
| **Detection Engineering** | Create robust rules | Dynamic + Some RE |

---

## 4. Lab Environment Overview

### Essential Components

1. **Hypervisor** (Choose one)
   - VirtualBox (Free, cross-platform)
   - VMware Workstation/Player (Free player available)
   - KVM/QEMU (Linux, free)
   - Cloud VMs (AWS, Azure, GCP with proper isolation)

2. **Analysis VMs** (Both recommended)
   - **REMnux**: Linux-based malware analysis
   - **FLARE-VM**: Windows-based malware analysis

3. **Victim VMs** (for dynamic analysis)
   - Windows 10/11 (use evaluation copies)
   - Various Linux distributions
   - Mobile emulators (Android/iOS)

### Network Isolation Strategies

```
Strategy 1: Host-Only Network (Recommended for beginners)
┌──────────────────────────────────────┐
│  Host Computer                       │
│  ┌────────────┐    ┌──────────────┐ │
│  │ REMnux VM  │───│  Victim VM   │ │
│  └────────────┘    └──────────────┘ │
│         │                 │          │
│    Host-Only Network (No Internet)   │
└──────────────────────────────────────┘

Strategy 2: Internal Network (Maximum isolation)
┌──────────────────────────────────────┐
│  Host Computer (No connection)       │
│  ┌────────────┐    ┌──────────────┐ │
│  │ Analysis   │───│  Victim VM   │ │
│  │    VM      │    └──────────────┘ │
│  └────────────┘         │            │
│       Internal Network Only          │
└──────────────────────────────────────┘

Strategy 3: INetSim (Fake Internet)
┌──────────────────────────────────────┐
│  ┌────────────┐    ┌──────────────┐ │
│  │ INetSim VM │───│  Victim VM   │ │
│  │ (Fake DNS/ │    │ (thinks it   │ │
│  │  HTTP/etc) │    │  has web)    │ │
│  └────────────┘    └──────────────┘ │
└──────────────────────────────────────┘
```

### Snapshot Strategy

!!! tip "Golden Rule"
    **Always work with snapshots. Take a clean snapshot before each analysis session.**

```bash
# VirtualBox example
VBoxManage snapshot "WindowsVictim" take "CleanState" --description "Fresh OS, no malware"

# Before analysis
VBoxManage snapshot "WindowsVictim" restore "CleanState"

# After analysis (if needed)
VBoxManage snapshot "WindowsVictim" take "PostInfection" --description "After EICAR test"
```

---

## 5. The Threat Landscape

### Common Threat Categories

1. **Ransomware**
   - Encrypts files, demands payment
   - Examples: WannaCry, Ryuk, Conti
   - Impact: $20B+ in 2021 damages

2. **Information Stealers**
   - Steals credentials, credit cards, crypto wallets
   - Examples: Agent Tesla, Raccoon, RedLine
   - Distribution: Phishing, malicious ads

3. **Banking Trojans**
   - Targets financial transactions
   - Examples: Emotet, TrickBot, Dridex
   - Techniques: Web injects, man-in-the-browser

4. **RATs (Remote Access Trojans)**
   - Provides remote control
   - Examples: NanoCore, Remcos, AsyncRAT
   - Use cases: Espionage, data theft

5. **Cryptominers**
   - Uses resources for cryptocurrency mining
   - Examples: XMRig, CGMiner
   - Impact: Performance degradation, high energy costs

6. **Mobile Malware**
   - Android/iOS targeted threats
   - Examples: Pegasus (spyware), Joker (billing fraud)
   - Distribution: App stores, SMS phishing

### Attack Vectors

**How malware spreads:**

1. **Phishing Emails** (90% of breaches start here)
   - Malicious attachments (Office docs, PDFs, archives)
   - Malicious links leading to drive-by downloads
   - Credential harvesting pages

2. **Software Vulnerabilities**
   - Unpatched systems (OS, browsers, plugins)
   - Zero-day exploits
   - Supply chain attacks

3. **Social Engineering**
   - Technical support scams
   - Fake software updates
   - Watering hole attacks

4. **Removable Media**
   - USB drives with AutoRun malware
   - Infected external hard drives

5. **Malvertising**
   - Malicious advertisements on legitimate sites
   - Exploit kits (e.g., RIG, Magnitude)

---

## 6. Analysis Tools Overview

### Quick Reference

| Analysis Phase | Primary Tools |
|----------------|---------------|
| **Static** | strings, file, PE-bear, Detect It Easy, Ghidra |
| **Dynamic** | Process Monitor, Process Hacker, Wireshark, Cuckoo |
| **Memory** | Volatility, Rekall, WinDbg |
| **Network** | Wireshark, Zeek, Suricata, tcpdump |
| **Reversing** | Ghidra, IDA Pro, Binary Ninja, radare2 |
| **Detection** | YARA, Sigma, Suricata rules, Snort |

*Detailed tool usage covered in subsequent modules.*

---

## 7. Safe Sample Handling

### The EICAR Test File

EICAR (European Institute for Computer Antivirus Research) provides a **safe** test string that antivirus products detect as malware:

```
X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
```

**Properties:**
- Contains no malicious code
- Completely harmless ASCII text
- Detected by all AV products (for testing)
- Used in this course for safe detection testing

### Sample Sources (Benign/Safe Only)

For this course, use ONLY:
- **EICAR test file** (provided in `samples/`)
- **Benign toy applications** (source code in `samples/benign_toy_app/`)
- **Simulated behaviors** (file operations, no actual malicious code)
- **Public forensics datasets** (from NIST, SANS, Digital Corpora)

!!! danger "Never Download Real Malware"
    Do NOT download actual malware from VirusTotal, malware bazaar, or underground forums for this course. It's unnecessary, dangerous, and potentially illegal.

---

## 8. Lab Safety Checklist

Before EVERY lab, verify:

- [ ] **Isolation**: VM is in host-only or internal network
- [ ] **No Production Access**: VM cannot reach corporate/home networks
- [ ] **Snapshot Exists**: Clean snapshot taken before starting
- [ ] **Authorization**: You own the device or have written permission
- [ ] **Tools Ready**: Required analysis tools installed
- [ ] **Logs Enabled**: Monitoring/logging configured
- [ ] **Sample Verified**: Using only provided safe samples
- [ ] **Exit Plan**: Know how to restore snapshot

---

## Hands-On Labs

### Lab 0.1: Environment Verification

**Objective**: Verify your lab environment is properly isolated.

**Prerequisites**: 
- VirtualBox or VMware installed
- At least one VM created

**Steps**:

1. **Check VM network settings**
   ```bash
   # On your VM (REMnux or any Linux VM)
   ip addr show
   ip route show
   
   # Expected: Only host-only network interface (e.g., 192.168.56.x)
   # No default route or internet gateway
   ```

2. **Test internet isolation**
   ```bash
   ping -c 3 8.8.8.8
   # Expected: Network unreachable or 100% packet loss
   
   curl -I https://google.com
   # Expected: Connection failed or timeout
   ```

3. **Test host communication**
   ```bash
   # From VM, ping host's host-only IP (usually .1)
   ping -c 3 192.168.56.1
   # Expected: Success (this is okay - host can coordinate analysis)
   ```

4. **Verify snapshot capability**
   ```bash
   # From host
   VBoxManage snapshot "YourVM" list
   # Should show any existing snapshots
   
   # Take a test snapshot
   VBoxManage snapshot "YourVM" take "TestSnapshot"
   
   # Verify
   VBoxManage snapshot "YourVM" list
   # Should now show TestSnapshot
   
   # Delete test snapshot
   VBoxManage snapshot "YourVM" delete "TestSnapshot"
   ```

**Expected Results**: 
- No internet connectivity from VM
- Host-only network functional
- Snapshot operations successful

**Troubleshooting**:
- If VM has internet: Change network adapter to Host-Only in VM settings
- If can't ping host: Check host firewall, ensure host-only adapter is up
- If snapshots fail: Ensure VM is powered off, check disk space

---

### Lab 0.2: Create Analysis Snapshot

**Objective**: Create a clean baseline snapshot for analysis.

**Prerequisites**: 
- REMnux or FLARE-VM installed
- VM in clean state (no malware analysis performed yet)

**Steps**:

1. **Prepare the VM**
   ```bash
   # Update system (REMnux example)
   sudo apt update && sudo apt upgrade -y
   
   # Clear temporary files
   sudo apt clean
   rm -rf ~/.cache/*
   
   # Clear bash history
   history -c
   cat /dev/null > ~/.bash_history
   
   # Shutdown cleanly
   sudo poweroff
   ```

2. **Take the golden snapshot**
   ```bash
   # From host
   VBoxManage snapshot "REMnux" take "GoldenImage" \
     --description "Clean REMnux with all tools, ready for analysis"
   ```

3. **Document the snapshot**
   Create a file `snapshots.txt`:
   ```
   VM: REMnux
   Snapshot: GoldenImage
   Date: 2025-10-07
   Description: Clean state, all analysis tools installed
   OS: Ubuntu 20.04 with REMnux toolkit
   Network: Host-only (192.168.56.0/24)
   Tools: strings, radare2, Volatility, Wireshark, etc.
   ```

4. **Test restore process**
   ```bash
   # Start VM and make a small change
   VBoxManage startvm "REMnux"
   
   # (In VM: create a test file)
   touch /tmp/test_file.txt
   
   # Shutdown
   VBoxManage controlvm "REMnux" poweroff
   
   # Restore snapshot
   VBoxManage snapshot "REMnux" restore "GoldenImage"
   
   # Start again
   VBoxManage startvm "REMnux"
   
   # Verify test file is gone
   ls /tmp/test_file.txt
   # Expected: No such file or directory
   ```

**Expected Results**:
- Golden snapshot created successfully
- Restore process removes all changes
- VM returns to clean baseline

---

## Knowledge Check

### Quiz Questions

1. **Which of the following requires explicit written authorization?**
   - a) Analyzing EICAR test file
   - b) Analyzing your own personal laptop
   - c) Analyzing your employer's workstation
   - d) Analyzing samples in this course

   <details>
   <summary>Answer</summary>
   c) Analyzing your employer's workstation requires written authorization, even if it's "your" work computer.
   </details>

2. **What is the correct order of analysis phases?**
   - a) Dynamic → Static → Reverse Engineering → Reporting
   - b) Static → Dynamic → Reverse Engineering → Reporting
   - c) Reverse Engineering → Static → Dynamic → Reporting
   - d) Reporting → Static → Dynamic → Reverse Engineering

   <details>
   <summary>Answer</summary>
   b) Start with static (quick), then dynamic (behavioral), then reverse engineering (deep dive), and finally reporting.
   </details>

3. **Which network configuration provides maximum isolation?**
   - a) NAT with internet access
   - b) Bridged to host network
   - c) Internal network (VM-to-VM only)
   - d) Host-only network

   <details>
   <summary>Answer</summary>
   c) Internal network provides maximum isolation (VMs can only talk to each other, not even the host).
   </details>

---

## Suggested Reading

### Supply Chain and Open-Source Package Attacks

A growing threat category that hits developers and technical staff at NGOs and civil society tech teams: malicious packages published to public registries.

**npm (Node.js packages)** and **PyPI (Python packages)** are routinely abused:

- **Typosquatting:** A package named `requesst` (not `requests`) or `colourama` (not `colorama`) that installs a stealer alongside the misspelled import
- **Dependency confusion:** Attacker publishes a package with the same name as an internal private package — public registries take priority in some configurations
- **Account takeover:** Legitimate package maintainer's account is compromised; malicious update pushed to existing trusted package
- **Protestware:** Maintainer intentionally adds malicious code (rare but documented)

**Real cases:**
- `event-stream` (2018) — compromised npm package, 8M weekly downloads, targeted Bitcoin wallet
- `SolarWinds` (2020) — build pipeline compromised, malicious update signed with legitimate certificate
- `PyPI malware campaigns` (ongoing) — Amnesty International and others document PyPI packages that exfiltrate credentials from developer machines

**Analysis indicators:** A malicious package typically:
- Contains install scripts (`setup.py`, `postinstall`) that run on `pip install` or `npm install`
- Makes outbound network connections during installation
- Reads SSH keys, browser cookies, environment variables
- Drops a persistence mechanism

**Triage a suspicious package:**
```bash
# Before installing any package — inspect it
pip3 download suspicious-package --no-deps -d /tmp/pkg_inspect/
cd /tmp/pkg_inspect/
unzip -l *.whl  # or tar -tzf *.tar.gz
# Look at setup.py BEFORE installing
cat suspicious-package-*/setup.py
strings suspicious-package-* | grep -iE "http|socket|exec|subprocess|base64|os.system"
```

**Module 13** covers cryptominer malware — which is the most common payload in supply chain attacks targeting developer machines.

### Essential Resources
- [SANS Digital Forensics Blog](https://www.sans.org/blog/)
- [Practical Malware Analysis Book](https://nostarch.com/malware) (Sikorski & Honig)
- [The IDA Pro Book](https://nostarch.com/idapro2.htm)

### Legal & Ethics
- [CFAA Legal Overview](https://www.justice.gov/criminal-ccips/ccmanual)
- [Responsible Disclosure Guidelines](https://www.bugcrowd.com/resource/a-full-guide-to-coordinated-vulnerability-disclosure/)

### Malware Reports
- [Mandiant Threat Intelligence](https://www.mandiant.com/resources)
- [Microsoft Security Intelligence](https://www.microsoft.com/security/blog/)
- [Kaspersky Securelist](https://securelist.com/)

---

## Summary

In this module, you learned:
- ✅ The ethical and legal framework for security analysis
- ✅ Required authorization and isolation practices
- ✅ The four phases of malware analysis
- ✅ How to set up a safe lab environment
- ✅ The importance of snapshots and isolation
- ✅ How to verify your lab is properly configured

**Next Module**: [Module 01 - Foundations](01_foundations.md) covers file formats, OS internals, and the technical foundation for analysis.

