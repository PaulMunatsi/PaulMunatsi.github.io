# Module 05: YARA and Sigma Rules

## Learning Objectives

By the end of this module, you will:
- Write YARA rules that detect malware based on strings, byte patterns, and structure
- Test and tune YARA rules against the toy samples without false positives
- Understand Sigma rule syntax and convert Sigma to platform-specific queries
- Write Sigma rules from dynamic analysis findings
- Understand the difference between IOC-based and behavioural detection
- Use YARA inside Volatility to scan memory dumps

---

## 1. Detection Engineering vs IOC Sharing

Before writing a single rule, understand what you are building and why.

**IOC-based detection** fires on exact values: a specific file hash, an exact IP address, a precise domain name. It catches the sample you already analysed. The attacker changes one byte and the detection misses entirely.

**Behavioural detection** fires on patterns: this binary imports `VirtualAllocEx` + `WriteProcessMemory` + `CreateRemoteThread` together. This memory region is executable but not backed by a file. This log entry shows PowerShell with a base64-encoded command spawned by Word. These patterns hold across malware families and variants because the underlying technique is harder to change than a domain name.

YARA sits in the middle. A good YARA rule combines structural patterns (PE header, specific section names, import combinations) with string fragments that are meaningful but not trivially rotated. A good Sigma rule captures behavioural patterns in log data that persist even when individual IOCs change.

Writing one good behavioural rule is worth more than a thousand hash IOCs.

---

## 2. YARA Installation on Ubuntu

```bash
sudo apt install -y yara

# Verify
yara --version

# Install the Python bindings (for scripting and Volatility integration)
pip3 install yara-python --break-system-packages

# Verify Python bindings
python3 -c "import yara; print('yara-python:', yara.__version__)"
```

---

## 3. YARA Rule Anatomy

Every YARA rule has three sections: metadata, strings, and a condition. Only the condition is required but a rule without strings is rarely useful.

```yara
rule RuleName {

    meta:
        description = "What this rule detects"
        author      = "Your name"
        date        = "2026-01-01"
        hash        = "sha256 of the sample that triggered this rule"
        severity    = "high"
        reference   = "https://source-of-intel.example.com"

    strings:
        // Plain text strings (case sensitive by default)
        $s1 = "ANALYSIS_DEMO"

        // Case-insensitive match
        $s2 = "ToyBeacon" nocase

        // Wide string (UTF-16LE — common in Windows binaries)
        $s3 = "malware" wide

        // Both ASCII and wide
        $s4 = "suspicious_string" ascii wide

        // Hex byte pattern
        $b1 = { 4D 5A 90 00 }          // MZ header
        $b2 = { 6A 40 68 00 30 00 00 } // VirtualAlloc shellcode pattern

        // Hex with wildcards (?? = any byte)
        $b3 = { 48 89 5C 24 ?? 48 89 6C 24 ?? }

        // Regular expression
        $r1 = /BEACON\|\d+\|[a-zA-Z0-9-]+/ nocase

        // XOR-encoded string (YARA 4.2+)
        $x1 = "ToyBeacon" xor(1-255)

    condition:
        // Must have MZ header (is a PE file)
        $b1 at 0
        // AND at least one of the other strings
        and any of ($s*, $r*)
}
```

### Condition Logic

```yara
condition:
    // Basic boolean
    $s1 and $s2

    // At least 2 of these 5 strings
    2 of ($s1, $s2, $s3, $s4, $s5)

    // Any string from a set
    any of ($s*)

    // All strings from a set
    all of ($b*)

    // String at a specific offset
    $s1 at 0                    // must be at start of file
    $b1 at 0x3C                 // must be at PE header offset

    // String within a range
    $s1 in (0..1024)            // within first 1KB
    $s1 in (filesize-256..filesize)  // in last 256 bytes

    // File size constraints (prevents matching every file)
    filesize < 1MB
    filesize > 10KB and filesize < 5MB

    // PE structure checks (requires `import "pe"`)
    pe.number_of_sections > 3
    pe.imports("kernel32.dll", "VirtualAllocEx")

    // Combining everything
    uint16(0) == 0x5A4D and      // MZ header
    filesize < 500KB and
    any of ($s*) and
    2 of ($b*)
```

---

## 4. YARA Modules

YARA modules extend rule capability beyond raw byte matching.

### PE Module

```yara
import "pe"

rule SuspiciousPEImports {
    meta:
        description = "PE file with classic injection import triad"

    condition:
        pe.imports("kernel32.dll", "VirtualAllocEx") and
        pe.imports("kernel32.dll", "WriteProcessMemory") and
        pe.imports("kernel32.dll", "CreateRemoteThread")
}
```

```yara
import "pe"

rule PackedOrEncryptedPE {
    meta:
        description = "PE with high-entropy sections suggesting packing"

    condition:
        // At least one section with entropy > 7.2
        for any section in pe.sections: (
            section.entropy > 7.2
        )
}
```

```yara
import "pe"

rule SuspiciousCompileTime {
    meta:
        description = "PE compiled in the future or with zeroed timestamp"

    condition:
        pe.timestamp == 0 or
        pe.timestamp > 1893456000   // after 2030-01-01
}
```

### Hash Module

```yara
import "hash"

rule KnownMaliciousHash {
    meta:
        description = "EICAR test file by hash"

    condition:
        hash.md5(0, filesize) == "44d88612fea8a8f36de82e1278abb02f"
}
```

### Math Module

```yara
import "math"

rule HighEntropySection {
    meta:
        description = "Any file section with entropy over 7.5"

    strings:
        $mz = { 4D 5A }

    condition:
        $mz at 0 and
        math.entropy(0, filesize) > 7.5
}
```

---

## 5. Writing Rules for the Toy Samples

Work through each toy sample and write a rule that detects it. Start specific, then generalise.

### Rule 1 — toy_app

From static analysis (Module 02) we know:
- Contains string `ANALYSIS_DEMO`
- Contains string `toy_app.log`
- Has an XOR decode loop with key `0x41`
- Encoded bytes `09 24 2d 2d 2e 70 16 2e 33 2d 25` are present

```yara
rule ToyApp_Base {
    meta:
        description = "Detects toy_app educational sample"
        author      = "Course Student"
        date        = "2026-01-01"
        sample_hash = ""    // fill in after sha256sum

    strings:
        $s1 = "ANALYSIS_DEMO"
        $s2 = "toy_app.log"
        $s3 = "XOR decode completed"

        // The encoded bytes for "Hello1World" XOR 0x41
        $b1 = { 09 24 2D 2D 2E 70 16 2E 33 2D 25 }

    condition:
        filesize < 200KB and
        2 of ($s*) or
        $b1
}
```

Test it:

```bash
# Save the rule
cat > ~/labs/module05/rules/toy_app.yar << 'EOF'
rule ToyApp_Base {
    meta:
        description = "Detects toy_app educational sample"
    strings:
        $s1 = "ANALYSIS_DEMO"
        $s2 = "toy_app.log"
        $s3 = "XOR decode completed"
        $b1 = { 09 24 2D 2D 2E 70 16 2E 33 2D 25 }
    condition:
        filesize < 200KB and
        (2 of ($s*) or $b1)
}
EOF

# Test against the binary
yara ~/labs/module05/rules/toy_app.yar \
    ~/course/samples/benign_toy_app/toy_app_linux

# Test that it does NOT fire on unrelated files
yara ~/labs/module05/rules/toy_app.yar /bin/ls
yara ~/labs/module05/rules/toy_app.yar /bin/bash
```

### Rule 2 — toy_persistence (Persistence Patterns)

This rule is intentionally broader — it targets the *technique* not just this specific sample:

```yara
rule LinuxPersistenceIndicators {
    meta:
        description  = "ELF binary with Linux persistence technique indicators"
        author       = "Course Student"
        mitre_attack = "T1053.003 - Scheduled Task/Job: Cron"

    strings:
        // Cron-related paths (real malware targets)
        $cron1 = "/etc/crontab"      nocase
        $cron2 = "/etc/cron.d/"      nocase
        $cron3 = "crontab -e"        nocase

        // Our toy sample's safe cron demo
        $cron4 = "cron_demo"

        // Autorun / startup paths
        $auto1 = ".bashrc"           nocase
        $auto2 = ".profile"          nocase
        $auto3 = "/etc/rc.local"     nocase
        $auto4 = "/etc/init.d/"      nocase

        // File dropper patterns
        $drop1 = "/tmp/"             nocase
        $drop2 = "/var/tmp/"         nocase
        $drop3 = "/dev/shm/"         nocase

        // Our toy sample specific
        $toy1  = "ANALYSIS_DEMO_PERSISTENCE"

    condition:
        // Must be an ELF file
        uint32(0) == 0x464C457F and
        filesize < 1MB and
        (
            // Any cron manipulation
            any of ($cron*) or
            // File drop to temp + any persistence mechanism
            (any of ($drop*) and any of ($auto*)) or
            // Exact toy sample match
            $toy1
        )
}
```

### Rule 3 — toy_network (C2 Beacon Pattern)

```yara
rule C2BeaconPattern {
    meta:
        description  = "Binary with C2 beaconing characteristics"
        author       = "Course Student"
        mitre_attack = "T1071.001 - Application Layer Protocol: Web Protocols"

    strings:
        // Beacon format string from toy_network
        $beacon_fmt = "BEACON|%d|%s|%s|%s|%s"

        // Socket function imports (ELF dynamic symbols)
        $sock1 = "socket"   fullword
        $sock2 = "connect"  fullword
        $sock3 = "send"     fullword
        $sock4 = "recv"     fullword

        // XOR-encoded user agent (the encoded bytes)
        $ua_encoded = { 01 3A 2C 17 30 34 36 3A 3B 7A
                        64 7B 65 75 7D 10 31 20 36 34
                        21 3C 3A 3B 34 39 7C }

        // Toy sample identifier
        $toy = "ANALYSIS_DEMO_NETWORK"

    condition:
        uint32(0) == 0x464C457F and
        filesize < 500KB and
        (
            // Has the beacon format string
            $beacon_fmt or
            // Has all socket functions AND the encoded UA
            (all of ($sock*) and $ua_encoded) or
            // Exact toy sample
            $toy
        )
}
```

### Rule 4 — toy_enumeration (Sandbox Evasion)

This rule targets a real and dangerous technique:

```yara
rule SandboxEvasionKeywordList {
    meta:
        description  = "Binary containing analyst tool detection keyword list"
        author       = "Course Student"
        mitre_attack = "T1497.001 - Virtualization/Sandbox Evasion: System Checks"
        severity     = "high"

    strings:
        // The exact keywords from our sandbox_keywords[] array
        // Any binary containing 3+ of these is checking for analysis tools
        $k01 = "wireshark"      nocase fullword
        $k02 = "procmon"        nocase fullword
        $k03 = "x64dbg"         nocase fullword
        $k04 = "ollydbg"        nocase fullword
        $k05 = "ida"            nocase fullword
        $k06 = "ghidra"         nocase fullword
        $k07 = "pestudio"       nocase fullword
        $k08 = "processhacker"  nocase fullword
        $k09 = "tcpdump"        nocase fullword
        $k10 = "fiddler"        nocase fullword
        $k11 = "burpsuite"      nocase fullword
        $k12 = "volatility"     nocase fullword

    condition:
        filesize < 5MB and
        // 3 or more analyst tool names in one binary = deliberate detection list
        3 of ($k*)
}
```

This last rule is genuinely useful beyond the course. Any real malware sample with three or more of those strings is almost certainly performing sandbox evasion. The MITRE ATT&CK mapping (T1497.001) connects it to a broader detection framework.

---

## 6. Testing and Tuning Rules

A rule that generates false positives is worse than no rule — it trains analysts to ignore alerts.

### Running YARA

```bash
# Single rule against single file
yara rule.yar target_binary

# Single rule against a directory (recursive)
yara -r rule.yar /path/to/samples/

# All rules in a directory against a target
yara -r ~/labs/module05/rules/ target_binary

# Print strings that matched (useful for debugging)
yara -s rule.yar target_binary

# Print metadata
yara -m rule.yar target_binary

# Verbose output
yara -v rule.yar target_binary

# Count matches only
yara -c rule.yar target_binary

# Negate: list files that do NOT match
yara -n rule.yar target_binary
```

### False Positive Testing

Before deploying any rule, test it against a clean corpus:

```bash
# Create a quick false-positive test script
cat > ~/labs/module05/test_rule.sh << 'EOF'
#!/bin/bash
# test_rule.sh — Test a YARA rule against clean system binaries
# Usage: ./test_rule.sh <rule.yar>

RULE="$1"
if [ -z "$RULE" ]; then
    echo "Usage: $0 <rule.yar>"
    exit 1
fi

echo "Testing: $RULE"
echo ""

# Test against common system binaries
echo "--- System binaries ---"
for f in /bin/ls /bin/cat /bin/bash /bin/sh /usr/bin/python3 \
          /usr/bin/wget /usr/bin/curl /usr/bin/ssh; do
    [ -f "$f" ] && yara -s "$RULE" "$f" 2>/dev/null
done

# Test against the toy samples (should match)
echo ""
echo "--- Toy samples (should match) ---"
for f in ~/course/samples/benign_toy_app/toy_*linux; do
    [ -f "$f" ] && yara -s "$RULE" "$f" 2>/dev/null
done

echo ""
echo "Done. Any system binary hits above are FALSE POSITIVES."
echo "Any toy sample hits are TRUE POSITIVES."
EOF
chmod +x ~/labs/module05/test_rule.sh
```

### Common False Positive Causes and Fixes

| Problem | Cause | Fix |
|---|---|---|
| Rule fires on `/bin/ls` | String too generic (e.g. `"connect"`) | Add `fullword`, combine with other conditions |
| Rule fires on all ELF files | Condition only checks ELF magic | Add filesize constraint, require specific strings |
| Rule fires on debug builds | Debug symbols contain many strings | Add entropy check or require specific combination |
| Rule never fires | Encoded string not matching | Check encoding, use `xor` keyword or hex pattern |
| Rule too slow on large corpus | Complex regex or many wildcards | Simplify regex, use string anchoring |

### Improving a Rule

Start with a specific rule that matches only the exact sample, then generalise to catch variants:

```yara
// Version 1: Too specific — misses any variant
rule ToyNetwork_v1 {
    strings:
        $s1 = "toy_network.log"
    condition: $s1
}

// Version 2: Too broad — false positives on any networked binary
rule ToyNetwork_v2 {
    strings:
        $s1 = "connect"
        $s2 = "send"
    condition: all of them
}

// Version 3: Balanced — catches the technique, not just the sample
rule ToyNetwork_v3 {
    meta:
        description = "Binary with C2 beacon loop characteristics"
    strings:
        $beacon  = "BEACON|" ascii
        $sock1   = "socket"  fullword ascii
        $sock2   = "connect" fullword ascii
        $encoded = { 01 3A 2C 17 30 34 36 3A }  // first 8 bytes of encoded UA
    condition:
        uint32(0) == 0x464C457F and
        filesize < 500KB and
        ($beacon or ($sock1 and $sock2 and $encoded))
}
```

---

## 7. YARA in Memory Analysis

YARA can scan live process memory and Volatility memory dumps — the single most powerful combination for finding unpacked malware.

### Scanning Live Processes (Ubuntu)

```bash
# Scan all running processes for a YARA rule
# Requires root or CAP_SYS_PTRACE
sudo yara -p 8 ~/labs/module05/rules/c2_beacon.yar /proc/*/mem 2>/dev/null

# Scan a specific PID
sudo yara ~/labs/module05/rules/c2_beacon.yar /proc/$PID/mem

# Scan while toy_network is running
gcc -o /tmp/toy_net ~/course/samples/benign_toy_app/toy_app_network.c
/tmp/toy_net &
TOY_PID=$!

sudo yara ~/labs/module05/rules/toy_network.yar /proc/$TOY_PID/mem 2>/dev/null
# Should hit on the BEACON| format string and socket function names in memory

kill $TOY_PID
```

### Scanning a Volatility Memory Dump with YARA

```yara
# yarascan plugin searches the entire memory image
vol3 -f ~/labs/module04/live/toy_network_dump.$PID \
    linux.yarascan \
    --yara-rules ~/labs/module05/rules/c2_beacon.yar

# Scan Windows memory dump
vol3 -f ~/labs/module04/samples/win7_x64.vmem \
    windows.vadyarascan \
    --yara-rules ~/labs/module05/rules/sandbox_evasion.yar
```

---

## 8. Sigma Rules

Sigma is to log analysis what YARA is to file analysis. A Sigma rule describes a suspicious event pattern in a vendor-neutral format. The same rule converts to Splunk SPL, Elastic Query DSL, Microsoft Sentinel KQL, or grep/awk for flat log files.

### Sigma Rule Anatomy

```yaml
title: Suspicious C2 Beacon Connection Attempt
id: a1b2c3d4-5678-90ab-cdef-1234567890ab   # random UUID
status: experimental
description: >
  Detects outbound TCP connection attempts matching C2 beacon
  characteristics - periodic connections to non-standard ports
  from processes that do not normally make outbound connections.
references:
  - https://attack.mitre.org/techniques/T1071/
  - https://example.com/malware-report
author: Course Student
date: 2026/01/01
modified: 2026/01/01
tags:
  - attack.command_and_control
  - attack.t1071.001
logsource:
  category: network_connection
  product: linux
detection:
  selection:
    # Process making the connection
    Image|endswith:
      - '/bash'
      - '/sh'
      - '/python3'
      - '/perl'
    # Destination port — malware favourites
    DestinationPort:
      - 4444
      - 1337
      - 8080
      - 31337
    # Not loopback
    DestinationIp|startswith:
      - '10.'
      - '172.'
      - '192.168.'
  filter:
    # Exclude known legitimate tools
    Image|contains:
      - 'ssh'
      - 'curl'
      - 'wget'
  condition: selection and not filter
falsepositives:
  - Development tools using non-standard ports
  - Legitimate applications using these ports
level: medium
```

### Sigma Detection Logic

The `detection` block is the core. Learn these operators:

```yaml
detection:
  # Simple value match
  selection:
    EventID: 4688           # exact match

  # List = OR
  selection:
    CommandLine|contains:
      - 'powershell'        # CommandLine contains 'powershell' OR
      - 'cmd.exe'           # CommandLine contains 'cmd.exe'

  # Multiple fields = AND
  selection:
    ParentImage: 'WINWORD.EXE'    # parent is Word
    Image: 'cmd.exe'               # AND child is cmd

  # Modifiers
  # |contains     — substring match
  # |startswith   — prefix match
  # |endswith     — suffix match
  # |contains|all — ALL items in list must match (not OR)
  # |re           — regex match

  # Combining named selections
  selection_a:
    EventID: 4688
  selection_b:
    CommandLine|contains: 'powershell -EncodedCommand'

  condition: selection_a and selection_b
```

### Converting Sigma Rules

Install `sigma-cli` to convert rules to platform queries:

```bash
pip3 install sigma-cli --break-system-packages

# List available backends (platforms)
sigma list backends

# Convert to Elastic/OpenSearch
sigma convert -t elasticsearch \
    ~/labs/module05/sigma/c2_beacon.yml

# Convert to Splunk SPL
sigma convert -t splunk \
    ~/labs/module05/sigma/c2_beacon.yml

# Convert to grep (quick test against flat log files)
sigma convert -t grep \
    ~/labs/module05/sigma/c2_beacon.yml

# Convert entire rules directory
sigma convert -t splunk \
    -r ~/labs/module05/sigma/
```

---

## 9. Writing Sigma Rules from Dynamic Analysis

The output from Module 03's dynamic analysis directly informs Sigma rules. Each finding in strace, auditd, or inotifywait becomes a detection opportunity.

### From strace to Sigma

strace finding from `toy_enumeration`:

```
openat(AT_FDCWD, "/etc/passwd", O_RDONLY) = 3
openat(AT_FDCWD, "/proc/1/comm", O_RDONLY) = 4
openat(AT_FDCWD, "/proc/2/comm", O_RDONLY) = 5
... (repeats for every PID)
```

Sigma rule derived from this:

```yaml
title: Suspicious /etc/passwd Read by Non-System Process
id: b2c3d4e5-6789-01bc-def0-234567890abc
status: experimental
description: >
  A non-system process read /etc/passwd, potentially performing
  user enumeration. Combined with /proc enumeration this indicates
  a reconnaissance phase commonly seen in post-exploitation.
author: Course Student
date: 2026/01/01
tags:
  - attack.discovery
  - attack.t1087.001
logsource:
  product: linux
  category: file_access
detection:
  selection:
    TargetFilename: '/etc/passwd'
    AccessMask: 'ReadData'
  filter_legitimate:
    Image|startswith:
      - '/usr/bin/id'
      - '/usr/bin/whoami'
      - '/usr/bin/getent'
      - '/bin/login'
      - '/usr/sbin/sshd'
  condition: selection and not filter_legitimate
falsepositives:
  - System administration tools
  - PAM modules
  - Custom scripts with legitimate need
level: low
```

### From inotifywait to Sigma

inotifywait finding from `toy_persistence`:

```
08:15:32 CREATE /tmp/toy_dropped_payload.txt
08:15:32 CREATE /tmp/cron_demo
```

```yaml
title: Executable Dropped to Temp Directory
id: c3d4e5f6-7890-12cd-ef01-345678901bcd
status: stable
description: >
  A file with executable permissions or an ELF magic header was
  created in /tmp, /var/tmp, or /dev/shm. Malware commonly uses
  these world-writable directories to stage payloads.
author: Course Student
date: 2026/01/01
tags:
  - attack.defense_evasion
  - attack.t1027
  - attack.execution
  - attack.t1059
logsource:
  product: linux
  category: file_event
detection:
  selection:
    TargetFilename|startswith:
      - '/tmp/'
      - '/var/tmp/'
      - '/dev/shm/'
    TargetFilename|endswith:
      - '.sh'
      - '.py'
      - '.pl'
      - '.elf'
    EventType: 'FileCreate'
  condition: selection
falsepositives:
  - Package managers using /tmp during installation
  - Build systems
level: medium
```

### From Network IOCs to Sigma

```yaml
title: Outbound Connection to High-Risk Port from Non-Browser Process
id: d4e5f6a7-8901-23de-f012-456789012cde
status: experimental
description: >
  Detects processes other than known browsers making outbound
  TCP connections to ports commonly used by C2 frameworks:
  4444 (Metasploit default), 1337, 31337, 8888.
author: Course Student
date: 2026/01/01
tags:
  - attack.command_and_control
  - attack.t1071
logsource:
  category: network_connection
  product: linux
detection:
  selection:
    Initiated: 'true'
    DestinationPort:
      - 4444
      - 1337
      - 31337
      - 8888
  filter_browsers:
    Image|contains:
      - 'firefox'
      - 'chromium'
      - 'google-chrome'
  filter_dev:
    DestinationIp: '127.0.0.1'
  condition: selection and not 1 of filter_*
falsepositives:
  - Development servers
  - Game servers on these ports
level: high
```

---

## 10. Community YARA and Sigma Resources

Do not write every rule from scratch. The security community maintains enormous open-source rule sets.

```bash
# Florian Roth's Signature-Base (highest quality YARA rules available)
git clone https://github.com/Neo23x0/signature-base.git ~/rules/signature-base

# YARA-Rules project (community rules)
git clone https://github.com/Yara-Rules/rules.git ~/rules/yara-rules

# Sigma HQ — canonical Sigma rule repository (4000+ rules)
git clone https://github.com/SigmaHQ/sigma.git ~/rules/sigma

# Test signature-base against your toy samples
yara -r ~/rules/signature-base/yara/ \
    ~/course/samples/benign_toy_app/toy_enum_linux 2>/dev/null
# Should get minimal hits since our samples are clearly benign

# Browse Sigma rules for Linux
ls ~/rules/sigma/rules/linux/
```

---

## Hands-On Labs

### Lab 5.1: Write Rules for All Four Toy Samples

**Objective:** Write one YARA rule per toy sample, test for true positives and false positives.

**Time estimate:** 45 minutes

**Setup:**

```bash
mkdir -p ~/labs/module05/rules
cd ~/labs/module05

# Build toy samples if not already built
for src in toy_app toy_app_persistence toy_app_network toy_app_enumeration; do
    gcc -o "builds/${src/toy_app_/toy_}_linux" \
        ~/course/samples/benign_toy_app/${src}.c 2>/dev/null || \
    gcc -o "builds/${src}_linux" \
        ~/course/samples/benign_toy_app/${src}.c
done
```

**Tasks:**

1. Write a YARA rule for `toy_app_linux` that matches on the XOR byte pattern and at least one string. Save to `rules/toy_app.yar`.

2. Write a YARA rule for `toy_persistence_linux` that targets the persistence technique (cron path or file drop), not just the specific binary. Save to `rules/toy_persistence.yar`.

3. Write a YARA rule for `toy_network_linux` that detects the beacon format string and socket imports. Save to `rules/toy_network.yar`.

4. Write a YARA rule for `toy_enum_linux` that fires when 3 or more sandbox keyword strings are present. Save to `rules/toy_enum.yar`.

5. For each rule, run the false-positive test script:
   ```bash
   ./test_rule.sh rules/toy_app.yar
   ./test_rule.sh rules/toy_persistence.yar
   ./test_rule.sh rules/toy_network.yar
   ./test_rule.sh rules/toy_enum.yar
   ```

6. Fix any false positives before moving on.

---

### Lab 5.2: YARA in Memory

**Objective:** Scan a live process and a gcore dump with YARA rules.

**Time estimate:** 30 minutes

```bash
# Compile the network sample
gcc -o /tmp/toy_net ~/course/samples/benign_toy_app/toy_app_network.c

# Run it in the background
/tmp/toy_net &
TOY_PID=$!
echo "PID: $TOY_PID"

# Give it a moment to decode the UA and build the beacon
sleep 2
```

**Tasks:**

1. Scan the live process memory with your `toy_network.yar` rule:
   ```bash
   sudo yara -s rules/toy_network.yar /proc/$TOY_PID/mem 2>/dev/null
   ```
   Does it match? Which strings hit?

2. Dump the process and scan the dump:
   ```bash
   gcore -o /tmp/toy_net_mem $TOY_PID
   yara -s rules/toy_network.yar /tmp/toy_net_mem.$TOY_PID
   ```

3. Write a new rule that specifically searches for the *decoded* user agent string `ToyBeacon/1.0 (Educational)` in memory. This string is invisible on disk (it is XOR encoded) but visible in the memory dump.

4. Test the new rule against:
   - The disk binary (should NOT match — the string is encoded on disk)
   - The memory dump (SHOULD match — decoded at runtime)
   
   Document: in one paragraph, explain what this proves about the value of memory-based YARA scanning.

5. Kill the background process: `kill $TOY_PID`

---

### Lab 5.3: Write a Sigma Rule from strace Evidence

**Objective:** Convert a strace finding into a deployable Sigma rule.

**Time estimate:** 30 minutes

**Tasks:**

1. Run `toy_enum_linux` under strace and capture the output:
   ```bash
   strace -e trace=openat \
       ~/course/samples/benign_toy_app/toy_enum_linux 2>&1 \
       | grep openat > ~/labs/module05/strace_evidence.txt
   ```

2. Review `strace_evidence.txt`. Identify the three most suspicious file accesses.

3. Write a Sigma rule that detects one of these suspicious accesses. Use the template from Section 8. Save to `~/labs/module05/sigma/proc_enumeration.yml`.

4. Convert your rule to a grep query using sigma-cli:
   ```bash
   sigma convert -t grep \
       ~/labs/module05/sigma/proc_enumeration.yml
   ```

5. Test the grep query against your auditd log from Module 03 (if you saved it):
   ```bash
   sudo ausearch -k toy_demo --start today | grep -E '<your pattern>'
   ```

---

### Lab 5.4: Combined Rule Set

**Objective:** Combine all four toy sample rules into a single rule file and scan the entire samples directory.

**Time estimate:** 20 minutes

```bash
# Combine all rules into one file
cat ~/labs/module05/rules/*.yar > ~/labs/module05/rules/all_toy_rules.yar

# Scan the entire samples directory
yara -r ~/labs/module05/rules/all_toy_rules.yar \
    ~/course/samples/ 2>/dev/null

# Also scan compiled binaries
yara -r ~/labs/module05/rules/all_toy_rules.yar \
    ~/labs/module05/builds/ 2>/dev/null
```

Expected: each rule fires on its matching binary and nothing else. If any rule fires on more than one binary, examine whether that is a true positive (both samples share the technique) or a false positive to fix.

---

## Knowledge Check

1. **What is the difference between writing a YARA rule on a hash versus a string pattern? Which is more durable?**

   <details>
   <summary>Answer</summary>
   A hash rule fires only on that exact file — change one byte and it misses. A string pattern rule fires on any file containing those strings, including variants. String and byte pattern rules are far more durable. Hash rules are useful for known-bad IOCs in threat intel sharing but should never be the only detection for a threat family.
   </details>

2. **A YARA rule for `SandboxEvasionKeywordList` fires on a legitimate penetration testing tool. How do you fix it without removing the detection capability?**

   <details>
   <summary>Answer</summary>
   Add a filter condition excluding known pen-test tools by path or a specific identifier string unique to them. Example: `condition: 3 of ($k*) and not filepath contains "/usr/share/metasploit"`. Alternatively, raise the threshold from 3 to 5 keywords, or add a second condition requiring the binary to also lack a legitimate digital signature or version resource.
   </details>

3. **Why use Sigma rules instead of writing platform-specific queries (Splunk SPL, Elastic KQL) directly?**

   <details>
   <summary>Answer</summary>
   Sigma rules are platform-neutral and convert to any backend. A team using Splunk today that migrates to Elastic tomorrow does not rewrite every detection rule — they rerun sigma convert with the new backend. Sigma also enables sharing between organisations regardless of their SIEM stack. Writing directly in SPL locks your detection engineering work to one platform.
   </details>

4. **You scan a memory dump with `windows.malfind` and find a region in `notepad.exe` with an MZ header at the base address. Your YARA scan of the dump also hits on a known ransomware string. What conclusion do you draw and what are your next steps?**

   <details>
   <summary>Answer</summary>
   notepad.exe has been process-hollowed with ransomware code. The original notepad executable was replaced in memory with the ransomware payload. Immediate next steps: (1) isolate the machine from the network, (2) dump the injected memory region with windows.dumpfiles and submit to VirusTotal, (3) check netstat for active C2 connections from that PID, (4) check registry Run keys and scheduled tasks for persistence, (5) begin ransom indicator hunting across the environment.
   </details>

5. **What does the `fullword` YARA modifier do and when should you use it?**

   <details>
   <summary>Answer</summary>
   fullword requires the matched string to be bounded by non-alphanumeric characters — it cannot be part of a longer word. For example, `$s = "connect" fullword` matches the string "connect" but not "connection" or "reconnect". Use it on short generic strings (function names, keywords) to prevent false positives from partial matches in longer identifiers.
   </details>

---

## Summary

In this module you covered:
- ✅ YARA rule structure: meta, strings, condition
- ✅ String types: ASCII, wide, hex, regex, XOR
- ✅ PE, hash, and math modules
- ✅ Writing rules for each toy sample
- ✅ False positive testing and rule tuning
- ✅ YARA scanning of live processes and memory dumps
- ✅ Sigma rule anatomy and detection logic
- ✅ Converting dynamic analysis findings to Sigma rules
- ✅ Converting Sigma to platform-specific queries
- ✅ Community rule repositories

**Key rule:** Write for the technique, not the sample. A rule that catches one specific binary dies with that binary. A rule that catches a persistence technique or an injection pattern survives every variant.

**Next Module:** [Module 06 — Reverse Engineering Basics](06_reverse_engineering.md) — read disassembly, understand code flow, and manually decode what static and dynamic analysis could not explain.

---

## Suggested Reading

- [YARA Documentation](https://yara.readthedocs.io/)
- [Sigma GitHub Repository](https://github.com/SigmaHQ/sigma)
- [Florian Roth's YARA Rule Writing Guide](https://www.nextron-systems.com/2015/02/16/write-simple-sound-yara-rules/)
- [YARA Performance Guidelines](https://yara.readthedocs.io/en/stable/writingrules.html#performance-considerations)
- [The Sigma Meta-Language](https://github.com/SigmaHQ/sigma/wiki/Specification)
- [MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) — map your detections to techniques

---

*Module complete. Continue to [Module 06 — Reverse Engineering Basics](06_reverse_engineering.md)*
