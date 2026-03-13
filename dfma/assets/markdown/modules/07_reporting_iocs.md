# Module 07: Reporting and IOCs

## Learning Objectives

By the end of this module, you will:
- Write a complete malware analysis report that a non-technical stakeholder can act on
- Structure findings using the industry-standard report format
- Create STIX 2.1 bundles from your analysis IOCs
- Understand MITRE ATT&CK mapping and apply it to your findings
- Share and consume IOC feeds using MISP concepts
- Know what makes a good IOC versus a weak one

---

## 1. Why Reporting Matters

The analysis is only half the job. A finding that lives only in your head, or in disorganised notes, protects nobody. The report is what turns your technical work into something a SOC analyst can use to hunt, a network admin can use to block, and a manager can use to justify an incident response budget.

Bad reports cause real harm. An imprecise IOC blocks legitimate traffic. A vague finding gets ignored. A poorly scoped report misses affected systems. The technical skills this course builds are only valuable if the output communicates clearly to people who were not in the disassembler with you.

Two types of audience, two different reports:

**Technical report** — for incident responders, SOC analysts, other malware analysts. Full methodology, exact commands, raw IOCs, YARA rules, disassembly excerpts. They need enough detail to reproduce your findings and extend the analysis.

**Executive summary** — for management, legal, compliance. Business impact, scope, recommended actions, timeline. No disassembly. No hex bytes. One page maximum.

Write both. They serve different people and different decisions.

---

## 2. Report Structure

Every malware analysis report has the same core sections. The order matters — readers scan from the top, so the most important information (verdict, impact, what to do) comes first.

```
1. Executive Summary          ← most important, written last
2. Sample Metadata            ← hashes, filenames, timestamps
3. Static Analysis Findings   ← strings, imports, entropy
4. Dynamic Analysis Findings  ← behaviour, network, filesystem
5. Memory Analysis Findings   ← injected code, decoded payloads (if applicable)
6. Reverse Engineering Notes  ← key functions, algorithms (if applicable)
7. MITRE ATT&CK Mapping       ← technique IDs
8. Indicators of Compromise   ← the IOC table
9. YARA Rules                 ← detection rules
10. Recommendations           ← immediate actions, long-term
11. Appendices                ← full strace output, raw hexdumps, etc.
```

---

## 3. Executive Summary

Write this last, after you have completed everything else. It is a maximum of one page and answers four questions:

1. What is this? (Classification and confidence)
2. What did it do or try to do?
3. Who or what is affected?
4. What should happen next?

```markdown
## Executive Summary

**Sample:** toy_network_linux  
**Classification:** Suspicious — C2 Beacon Simulator  
**Confidence:** High  
**Date:** 2026-03-11  
**Analyst:** [Name]

### What is this?

A Linux ELF binary that establishes a TCP connection to a configured 
host and port, transmitting system reconnaissance data (hostname, 
username, platform) in a structured beacon format. The binary contains 
XOR-encoded strings to evade static string analysis.

### What did it do?

On execution, the sample decoded an obfuscated user-agent string, 
enumerated local system information, and made three outbound TCP 
connection attempts to 127.0.0.1:4444 at five-second intervals. 
Each beacon transmitted hostname, username, operating system platform, 
and user-agent. No files were written to disk. No persistence mechanism 
was installed.

### Who is affected?

Any system where this binary is present and executable. The loopback 
destination (127.0.0.1) in this sample suggests a test or educational 
version; a production variant would target a remote C2 server.

### Recommended Actions

**Immediate (0–24 hours):**
- Block outbound TCP on non-standard ports from endpoints not requiring it
- Scan all endpoints with the attached YARA rule (toy_network_detection.yar)
- Review firewall logs for connections to ports 4444, 1337, 31337

**Short-term (1–2 weeks):**
- Deploy the Sigma rule for process-level network connection monitoring
- Audit cron jobs and startup scripts for recently added entries
```

---

## 4. Sample Metadata Block

This block appears at the top of the technical report and must be complete. Hashes are the universal identifier that links your report to the exact file analysed.

```markdown
## Sample Metadata

| Field             | Value                                                            |
|---|---|
| Filename          | toy_network_linux                                                |
| File Size         | 18,432 bytes                                                     |
| File Type         | ELF 64-bit LSB executable, x86-64                               |
| MD5               | (run: md5sum toy_network_linux)                                  |
| SHA-1             | (run: sha1sum toy_network_linux)                                 |
| SHA-256           | (run: sha256sum toy_network_linux)                               |
| Compile Timestamp | (from: readelf -p .comment toy_network_linux)                    |
| First Seen        | 2026-03-11                                                       |
| Analysis Date     | 2026-03-11                                                       |
| Analyst           | [Name]                                                           |
| Analysis System   | Ubuntu 24.04 LTS, isolated network namespace                     |
| Tools Used        | file, strings, rabin2, strace, tcpdump, Wireshark, radare2      |
```

Generate the hashes automatically:

```bash
BINARY=~/course/samples/benign_toy_app/toy_network_linux

echo "MD5:    $(md5sum     $BINARY | cut -d' ' -f1)"
echo "SHA-1:  $(sha1sum    $BINARY | cut -d' ' -f1)"
echo "SHA-256:$(sha256sum  $BINARY | cut -d' ' -f1)"
echo "Size:   $(stat -c %s $BINARY) bytes"
echo "Type:   $(file -b    $BINARY)"
```

---

## 5. IOC Quality

Not all IOCs are equally useful. Before publishing an IOC, assess its durability — how long before an attacker trivially changes it?

### IOC Durability Scale

```
Weakest ──────────────────────────────────────────── Strongest

Hash         IP        Domain      String      Behaviour
(exact)    (changes   (changes    (survives   (survives
           in hours)  in days)    variants)   rewrite)
```

This is the Diamond Model of Intrusion Analysis expressed as detection durability. TTPs (Tactics, Techniques, Procedures) at the top — hardest to change. File hashes at the bottom — trivial to change.

### IOC Types and Their Uses

| IOC Type | Example | When to Use | Lifespan |
|---|---|---|---|
| File hash (MD5) | `44d88612...` | Known-bad blocking, deduplication | Hours to days |
| File hash (SHA-256) | `275a021b...` | Authoritative sample ID | Permanent for that file |
| IP address | `185.220.101.42` | Network block, firewall rule | Hours |
| Domain | `c2.evil.example.com` | DNS sinkhole, proxy block | Days |
| URL | `http://evil.com/payload.exe` | Proxy rule | Days |
| Mutex name | `Global\MalwareInstance` | Host-based detection | Weeks to months |
| Registry key | `HKCU\Software\evil\config` | Host-based hunting | Weeks |
| File path | `/tmp/toy_dropped_payload.txt` | Filesystem hunting | Days to weeks |
| Beacon format | `BEACON\|\d+\|` | YARA/Sigma detection | Months |
| XOR key + encoded bytes | `key=0x41, buf=09 24 2d...` | YARA memory scan | Long |
| Code pattern | XOR loop at specific offset | YARA rule | Very long |
| MITRE technique | T1071.001 | Hunt for technique class | Permanent |

### IOC Table Format

```markdown
## Indicators of Compromise

### Network IOCs
| Type      | Value             | Context                              | Confidence |
|---|---|---|---|
| IP        | 127.0.0.1         | C2 beacon destination (loopback)     | High       |
| Port      | 4444/TCP          | C2 beacon destination port           | High       |
| Protocol  | TCP               | Beacon transport                     | High       |
| User-Agent| ToyBeacon/1.0 (Educational) | Decoded beacon UA string    | High       |

### File IOCs
| Type       | Value                          | Context           | Confidence |
|---|---|---|---|
| SHA-256    | [from sha256sum]               | Sample hash       | High       |
| Filename   | toy_network_linux              | Original filename | Medium     |
| File size  | 18,432 bytes                   | Compiled binary   | Low        |

### Behavioural IOCs
| Type       | Value                                   | Context         |
|---|---|---|
| Syscall    | connect() to 127.0.0.1:4444             | C2 beacon       |
| String     | BEACON\|%d\|%s\|%s\|%s\|%s             | Beacon format   |
| String     | ToyBeacon/1.0 (Educational)             | Decoded UA      |
| Memory     | XOR key 0x41, 11-byte encoded buffer    | String encoding |
```

---

## 6. MITRE ATT&CK Mapping

Every finding should map to an ATT&CK technique ID. This gives your report a common language that links to broader threat intelligence and hunting strategies.

ATT&CK IDs follow the format `T[tactic].[technique].[sub-technique]`. For example, `T1071.001` = Command and Control (tactic), Application Layer Protocol (technique), Web Protocols (sub-technique).

### Toy Sample ATT&CK Mapping

```markdown
## MITRE ATT&CK Mapping

| Sample                | Technique ID | Technique Name                          |
|---|---|---|
| toy_app_network       | T1071.001    | C2: Application Layer Protocol: Web     |
| toy_app_network       | T1132.001    | C2: Data Encoding: Standard Encoding    |
| toy_app_network       | T1027        | Defense Evasion: Obfuscated Files       |
| toy_app_persistence   | T1053.003    | Persistence: Scheduled Task: Cron       |
| toy_app_persistence   | T1059        | Execution: Command and Scripting        |
| toy_app_persistence   | T1105        | C2: Ingress Tool Transfer (file drop)   |
| toy_app_enumeration   | T1057        | Discovery: Process Discovery            |
| toy_app_enumeration   | T1087.001    | Discovery: Account Discovery: Local     |
| toy_app_enumeration   | T1497.001    | Defense Evasion: Sandbox Evasion        |
| toy_app_enumeration   | T1083        | Discovery: File and Directory Discovery |
| toy_app_enumeration   | T1082        | Discovery: System Information Discovery |
```

Navigate the full ATT&CK matrix at `https://attack.mitre.org`. Each technique page includes:
- Detection guidance (what logs catch it)
- Mitigation guidance (how to prevent it)
- Real-world procedure examples (which APT groups use it)
- Data sources required for detection

---

## 7. Generating Hashes and Metadata Automatically

```bash
cat > ~/scripts/generate_report_metadata.sh << 'EOF'
#!/bin/bash
# generate_report_metadata.sh — Produce report metadata block for a binary
# Usage: ./generate_report_metadata.sh <binary>

BINARY="$1"
if [ ! -f "$BINARY" ]; then
    echo "Usage: $0 <binary_path>"
    exit 1
fi

echo "## Sample Metadata"
echo ""
echo "| Field        | Value |"
echo "|---|---|"
echo "| Filename     | $(basename $BINARY) |"
echo "| File Size    | $(stat -c %s $BINARY) bytes |"
echo "| File Type    | $(file -b $BINARY) |"
echo "| MD5          | $(md5sum $BINARY | cut -d' ' -f1) |"
echo "| SHA-1        | $(sha1sum $BINARY | cut -d' ' -f1) |"
echo "| SHA-256      | $(sha256sum $BINARY | cut -d' ' -f1) |"
echo "| Analysis Date| $(date +%Y-%m-%d) |"
echo ""
echo "## Static Strings (top 20 interesting)"
echo ""
echo "\`\`\`"
strings -n 8 "$BINARY" \
    | grep -vE '^(lib|/lib|_|__|\[|GCC|GLIBC|GNU|\.symtab)' \
    | head -20
echo "\`\`\`"
echo ""
echo "## Imports"
echo ""
echo "\`\`\`"
rabin2 -i "$BINARY" 2>/dev/null | head -30
echo "\`\`\`"
EOF
chmod +x ~/scripts/generate_report_metadata.sh

# Run against each toy sample
for sample in toy_app toy_network toy_persistence toy_enum; do
    echo "=== $sample ==="
    ~/scripts/generate_report_metadata.sh \
        ~/course/samples/benign_toy_app/${sample}_linux 2>/dev/null
    echo ""
done
```

---

## 8. STIX 2.1 — Structured Threat Intelligence

STIX (Structured Threat Information eXpression) is the standard format for exchanging threat intelligence. A STIX bundle is a JSON document containing objects — Indicators, Malware, Attack Patterns, Relationships, Threat Actors — that can be imported directly into MISP, OpenCTI, or any TAXII-compatible threat intel platform.

The course repo already contains `scripts/generate_stix_template.py` and `iocs/sample_ioc.stix2`. This section explains the format and extends that script.

### STIX Object Types

| Object | Purpose |
|---|---|
| `indicator` | A pattern to detect the threat (YARA, STIX pattern, regex) |
| `malware` | Describes the malware family and characteristics |
| `attack-pattern` | Describes a MITRE ATT&CK technique |
| `relationship` | Links objects together (e.g. malware "uses" attack-pattern) |
| `observed-data` | Raw observables from analysis (file, network traffic) |
| `threat-actor` | Attribution (if known) |
| `identity` | The organisation producing the intelligence |

### A Complete STIX Bundle for toy_network

```python
#!/usr/bin/env python3
"""
generate_toy_network_stix.py
Generates a STIX 2.1 bundle for the toy_network sample
"""

import json
import uuid
import datetime

def new_id(obj_type):
    """Generate a valid STIX 2.1 ID"""
    return f"{obj_type}--{uuid.uuid4()}"

def ts():
    """Current timestamp in STIX format"""
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")

# ── Identity (producer of this report) ──────────────────────────────────────
identity = {
    "type": "identity",
    "spec_version": "2.1",
    "id": new_id("identity"),
    "created": ts(),
    "modified": ts(),
    "name": "Course Analyst",
    "identity_class": "individual"
}

# ── Malware object ───────────────────────────────────────────────────────────
malware = {
    "type": "malware",
    "spec_version": "2.1",
    "id": new_id("malware"),
    "created": ts(),
    "modified": ts(),
    "name": "ToyNetworkBeacon",
    "description": (
        "Educational C2 beacon sample. Connects to 127.0.0.1:4444 "
        "and transmits XOR-encoded system reconnaissance data."
    ),
    "malware_types": ["backdoor", "trojan"],
    "is_family": False,
    "created_by_ref": identity["id"]
}

# ── Indicator: SHA-256 file hash ─────────────────────────────────────────────
# Replace the hash value with the real sha256sum output
indicator_hash = {
    "type": "indicator",
    "spec_version": "2.1",
    "id": new_id("indicator"),
    "created": ts(),
    "modified": ts(),
    "name": "ToyNetworkBeacon SHA-256",
    "description": "File hash for toy_network_linux",
    "indicator_types": ["malicious-activity"],
    "pattern": "[file:hashes.'SHA-256' = 'REPLACE_WITH_SHA256SUM_OUTPUT']",
    "pattern_type": "stix",
    "valid_from": ts(),
    "created_by_ref": identity["id"]
}

# ── Indicator: Network beacon ────────────────────────────────────────────────
indicator_network = {
    "type": "indicator",
    "spec_version": "2.1",
    "id": new_id("indicator"),
    "created": ts(),
    "modified": ts(),
    "name": "C2 Beacon Connection",
    "description": "Outbound TCP connection to port 4444 with BEACON| format payload",
    "indicator_types": ["malicious-activity"],
    "pattern": (
        "[network-traffic:dst_port = 4444 AND "
        "network-traffic:protocols[*] = 'tcp']"
    ),
    "pattern_type": "stix",
    "valid_from": ts(),
    "created_by_ref": identity["id"]
}

# ── Indicator: YARA rule ─────────────────────────────────────────────────────
indicator_yara = {
    "type": "indicator",
    "spec_version": "2.1",
    "id": new_id("indicator"),
    "created": ts(),
    "modified": ts(),
    "name": "C2BeaconPattern YARA",
    "description": "YARA rule detecting the beacon format string and XOR-encoded UA",
    "indicator_types": ["malicious-activity"],
    "pattern": (
        'rule C2BeaconPattern { strings: $s = "BEACON|%d|%s|%s|%s|%s" '
        'condition: $s }'
    ),
    "pattern_type": "yara",
    "valid_from": ts(),
    "created_by_ref": identity["id"]
}

# ── Attack Pattern: T1071.001 ────────────────────────────────────────────────
attack_pattern = {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": new_id("attack-pattern"),
    "created": ts(),
    "modified": ts(),
    "name": "Application Layer Protocol: Web Protocols",
    "description": "Adversaries communicate using application layer protocols to avoid detection.",
    "external_references": [
        {
            "source_name": "mitre-attack",
            "url": "https://attack.mitre.org/techniques/T1071/001",
            "external_id": "T1071.001"
        }
    ]
}

# ── Relationships ────────────────────────────────────────────────────────────
rel_malware_indicator = {
    "type": "relationship",
    "spec_version": "2.1",
    "id": new_id("relationship"),
    "created": ts(),
    "modified": ts(),
    "relationship_type": "indicates",
    "source_ref": indicator_hash["id"],
    "target_ref": malware["id"]
}

rel_malware_technique = {
    "type": "relationship",
    "spec_version": "2.1",
    "id": new_id("relationship"),
    "created": ts(),
    "modified": ts(),
    "relationship_type": "uses",
    "source_ref": malware["id"],
    "target_ref": attack_pattern["id"]
}

# ── Bundle ───────────────────────────────────────────────────────────────────
bundle = {
    "type": "bundle",
    "id": new_id("bundle"),
    "objects": [
        identity,
        malware,
        indicator_hash,
        indicator_network,
        indicator_yara,
        attack_pattern,
        rel_malware_indicator,
        rel_malware_technique
    ]
}

if __name__ == "__main__":
    output_path = "toy_network.stix2"
    with open(output_path, "w") as f:
        json.dump(bundle, f, indent=2)
    print(f"[+] STIX bundle written to {output_path}")
    print(f"[+] Objects: {len(bundle['objects'])}")
    for obj in bundle["objects"]:
        print(f"    {obj['type']:20s} {obj['id']}")
```

Run it:

```bash
python3 generate_toy_network_stix.py

# Validate the JSON structure
python3 -c "
import json
with open('toy_network.stix2') as f:
    bundle = json.load(f)
print(f'Valid JSON. Objects: {len(bundle[\"objects\"])}')
for o in bundle['objects']:
    print(f'  {o[\"type\"]:25s} {o.get(\"name\",\"\")}')
"
```

### Using the Existing Course Script

```bash
# The course repo has generate_stix_template.py
python3 ~/course/scripts/generate_stix_template.py --help

# Generate a bundle from a hash list
python3 ~/course/scripts/generate_stix_template.py \
    --name "ToyNetworkBeacon" \
    --hash "$(sha256sum ~/course/samples/benign_toy_app/toy_network_linux | cut -d' ' -f1)" \
    --output toy_network_from_template.stix2
```

---

## 9. Complete Analysis Report Template

Use this template for every analysis in the course. Fill it out section by section as you complete each analysis phase.

```markdown
# Malware Analysis Report
**[CONFIDENTIAL / TLP:WHITE / TLP:AMBER — choose one]**

---

## Executive Summary
[Write last. One page maximum. Business impact, scope, recommended actions.]

---

## Sample Metadata
| Field         | Value |
|---|---|
| Filename      | |
| SHA-256       | |
| MD5           | |
| File Type     | |
| File Size     | |
| First Seen    | |
| Analysis Date | |
| Analyst       | |
| System        | |
| Tools Used    | |

---

## Static Analysis

### File Properties
[file, readelf/rabin2 output summary]

### Strings of Interest
[table of significant strings: value, category, significance]

### Import Analysis
[suspicious imports and what they suggest]

### Entropy
[overall and per-section entropy, packing assessment]

---

## Dynamic Analysis

### Execution Environment
[OS, isolation method, monitoring tools active]

### Filesystem Activity
| Time | Action | Path | Significance |
|---|---|---|---|

### Network Activity
| Protocol | Destination | Port | Data | Significance |
|---|---|---|---|---|

### Process Activity
[child processes spawned, injections observed]

### System Resource Access
[sensitive files read, registry access, environment vars]

---

## Memory Analysis
[If performed. Decoded strings found, injected regions, hidden processes.]

---

## Reverse Engineering Notes
[Key functions, algorithms decoded, patches applied, decompiler findings.]

---

## MITRE ATT&CK Mapping
| Tactic              | Technique ID | Technique Name | Evidence |
|---|---|---|---|

---

## Indicators of Compromise

### Network
| Type | Value | Context | Confidence |
|---|---|---|---|

### File
| Type | Value | Context | Confidence |
|---|---|---|---|

### Behavioural
| Type | Value | Context | Confidence |
|---|---|---|---|

---

## Detection Rules

### YARA
\`\`\`yara
[paste rules here]
\`\`\`

### Sigma
\`\`\`yaml
[paste rules here]
\`\`\`

---

## Recommendations

### Immediate (0–24 hours)
-

### Short-term (1–2 weeks)
-

### Long-term
-

---

## Appendices
[Full strace output, pcap analysis, raw disassembly of key functions, etc.]
```

---

## Hands-On Labs

### Lab 7.1: Complete Report for toy_network_linux

**Objective:** Write a full technical analysis report for `toy_network_linux` using findings from Modules 02–06.

**Time estimate:** 1 hour

This is an integration exercise. Everything you need already exists in your notes and lab outputs from previous modules. This lab is about organising and presenting those findings clearly.

**Tasks:**

1. Generate the metadata block:
   ```bash
   ~/scripts/generate_report_metadata.sh \
       ~/course/samples/benign_toy_app/toy_network_linux
   ```

2. Fill in the Static Analysis section using your Module 02 findings:
   - Strings of interest (BEACON format, the encoded UA bytes)
   - Import table findings (socket, connect, send, recv)
   - Entropy value

3. Fill in the Dynamic Analysis section using Module 03 findings:
   - The connect() call visible in strace
   - The beacon payload captured in tcpdump
   - No filesystem writes (confirmed with inotifywait)

4. Fill in the Memory Analysis section using Module 04 findings:
   - The decoded UA string visible in the gcore dump
   - Contrast: encoded on disk, plaintext in RAM

5. Fill in the Reverse Engineering section using Module 06 findings:
   - XOR decode function: key, buffer size, algorithm
   - How the beacon string is constructed at runtime

6. Complete the ATT&CK mapping table.

7. Write the IOC table with at least 6 IOCs across network, file, and behavioural categories.

8. Paste in your YARA rule from Module 05.

9. Write the executive summary last.

Save the completed report to `~/labs/module07/toy_network_report.md`.

---

### Lab 7.2: Generate a STIX Bundle

**Objective:** Generate a STIX 2.1 bundle for `toy_network_linux` using the Python script from Section 8.

**Time estimate:** 30 minutes

```bash
mkdir -p ~/labs/module07/stix
cd ~/labs/module07/stix
```

**Tasks:**

1. Get the real SHA-256 hash:
   ```bash
   sha256sum ~/course/samples/benign_toy_app/toy_network_linux
   ```

2. Copy the `generate_toy_network_stix.py` script from Section 8 of this module into `~/labs/module07/stix/`.

3. Replace the placeholder hash value with the real SHA-256.

4. Run the script and inspect the output:
   ```bash
   python3 generate_toy_network_stix.py
   cat toy_network.stix2 | python3 -m json.tool | head -60
   ```

5. Count the STIX objects in the bundle:
   ```python
   import json
   b = json.load(open('toy_network.stix2'))
   print(f"Objects: {len(b['objects'])}")
   ```

6. Add one more indicator to the bundle: a STIX pattern for the beacon format string. Pattern should be:
   ```
   [process:command_line MATCHES '.*BEACON\\|.*']
   ```

7. Validate the final bundle has 9 objects.

---

### Lab 7.3: IOC Quality Assessment

**Objective:** Evaluate a set of IOCs for durability and decide which to publish.

**Time estimate:** 20 minutes

Evaluate each IOC from your `toy_network_linux` analysis using the durability scale from Section 5. For each IOC, answer:
- What type is it?
- How easily can an attacker change it?
- Should it be published? Why?

| IOC | Value | Type | Durability | Publish? | Reason |
|---|---|---|---|---|---|
| 1 | SHA-256 hash | File hash | Very low | ? | ? |
| 2 | `127.0.0.1:4444` | IP:Port | Low | ? | ? |
| 3 | `BEACON\|%d\|%s\|%s\|%s\|%s` | Format string | Medium | ? | ? |
| 4 | `ToyBeacon/1.0 (Educational)` | UA string | Medium | ? | ? |
| 5 | XOR key `0x41` alone | Algorithm param | Very low | ? | ? |
| 6 | XOR + specific byte sequence | Code pattern | High | ? | ? |
| 7 | T1071.001 (technique) | ATT&CK TTP | Permanent | ? | ? |

Write a one-paragraph justification for your three highest-priority IOCs — the ones you would put in a threat intel feed today.

---

## Knowledge Check

1. **A colleague submits an IOC feed containing only MD5 hashes of known malware samples. What is the primary weakness of this approach?**

   <details>
   <summary>Answer</summary>
   MD5 hashes are file-specific. One byte changed anywhere in the binary produces a completely different hash. An attacker recompiling the same malware with a minor modification, or a packer that repackages the payload, completely evades all hash-based detections. MD5 is also cryptographically broken for collision resistance. Hash IOCs are useful for triage (is this the exact known bad file?) but useless for detecting variants. They should always be supplemented with behavioural and pattern-based IOCs.
   </details>

2. **Who should read the executive summary, and what should it never contain?**

   <details>
   <summary>Answer</summary>
   The executive summary is for non-technical stakeholders: managers, legal, compliance, executives, or clients. It should answer what happened, what is at risk, and what to do next — in plain language. It should never contain assembly excerpts, hex bytes, YARA rules, syscall traces, or any technical detail that requires specialist knowledge to interpret. Technical detail belongs in the body of the report with appropriate section references.
   </details>

3. **You have two IOCs for the same malware: an IP address and a YARA rule detecting a XOR loop with a specific key and encoded byte sequence. Which do you prioritise for long-term hunting?**

   <details>
   <summary>Answer</summary>
   The YARA rule. An IP address is trivially changed — the attacker rotates C2 infrastructure routinely, sometimes daily. The XOR algorithm with its specific key and encoded buffer is embedded in the binary and requires recompilation to change. The YARA rule will continue detecting new samples from the same family or developer long after the IP has been abandoned. Both should be shared, but the YARA rule has long-term hunting value; the IP is only useful for immediate blocking.
   </details>

4. **What is a STIX relationship object and why does it matter?**

   <details>
   <summary>Answer</summary>
   A relationship object explicitly links two STIX objects — for example, connecting a malware object to an attack-pattern object with relationship_type "uses", or connecting an indicator to a malware object with "indicates". Without relationships, a STIX bundle is just a list of disconnected facts. Relationships let analysts and automated systems understand context: this specific malware uses this specific technique, this indicator detects this specific malware family. Threat intel platforms like MISP and OpenCTI use relationships to build knowledge graphs.
   </details>

5. **Why should TLP (Traffic Light Protocol) classification appear on every report?**

   <details>
   <summary>Answer</summary>
   TLP defines how far a report can be shared. TLP:RED means recipient only — no further distribution. TLP:AMBER means share within the recipient organisation. TLP:GREEN means share within the community. TLP:WHITE means no restrictions. Without TLP, a sensitive report (containing active C2 infrastructure, attribution details, or victim information) may be forwarded beyond its intended audience, potentially alerting the threat actor, exposing victim organisations, or triggering legal complications. It is the analyst's responsibility to classify correctly at the point of creation.
   </details>

---

## Summary

In this module you covered:
- ✅ Two-audience reporting: technical report and executive summary
- ✅ Standard report structure and why order matters
- ✅ IOC quality and the durability scale
- ✅ MITRE ATT&CK mapping for all four toy samples
- ✅ IOC table formats: network, file, behavioural
- ✅ STIX 2.1 bundle structure: objects, patterns, relationships
- ✅ Generating a complete STIX bundle in Python
- ✅ Automated metadata generation script
- ✅ Full report template for reuse across all future analyses

**Key principle:** A finding without a recommendation is a complaint. Every report section should connect to something an analyst, admin, or decision-maker can do. Strings of interest → YARA rule. Network IOC → firewall rule. ATT&CK technique → detection gap to close.

**Next Module:** [Module 08 — Case Study](08_case_study.md) — apply every technique from Modules 00–07 to a single end-to-end investigation, producing a complete intelligence package.

---

## Suggested Reading

- [MITRE ATT&CK Framework](https://attack.mitre.org)
- [STIX 2.1 Specification](https://oasis-open.github.io/cti-documentation/stix/intro)
- [TAXII 2.1 Protocol](https://oasis-open.github.io/cti-documentation/taxii/intro)
- [MISP — Malware Information Sharing Platform](https://www.misp-project.org/)
- [OpenCTI Platform](https://www.opencti.io/)
- [Traffic Light Protocol (TLP)](https://www.cisa.gov/tlp)
- [Mandiant M-Trends Report](https://www.mandiant.com/m-trends) — example of professional threat reporting style

---

*Module complete. Continue to [Module 08 — Case Study](08_case_study.md)*
