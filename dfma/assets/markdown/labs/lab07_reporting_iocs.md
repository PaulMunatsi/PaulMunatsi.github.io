# Lab 07 — Reporting and IOCs

**Module:** 07 — Reporting and IOCs  
**Estimated time:** 60–90 minutes  
**Difficulty:** Intermediate  
**Flag:** `FLAG{ioc_sha256_first8_toy_network}`

---

## Objectives

By the end of this lab you will:
- Produce a structured analyst report from raw lab notes
- Extract and format Indicators of Compromise (IOCs)
- Generate a STIX 2.1 bundle from your findings
- Map findings to MITRE ATT&CK technique IDs
- Submit a complete intelligence package

---

## Prerequisites

```bash
pip3 install stix2 --break-system-packages
sudo apt install -y sha256sum
```

You need completed notes from Labs 02–05. If you skipped any, run the toy samples first:

```bash
cd ~/course/samples/benign_toy_app
gcc -o toy_network_linux toy_app_network.c
gcc -o toy_persistence_linux toy_app_persistence.c
sha256sum toy_network_linux toy_persistence_linux
```

---

## Part 1 — IOC Extraction

**Task 1.1** — Hash every toy sample binary you compiled:

```bash
cd ~/course/samples/benign_toy_app
sha256sum toy_app_linux toy_network_linux toy_persistence_linux toy_enum_linux 2>/dev/null | tee ~/labs/lab07/hashes.txt
```

**Task 1.2** — Extract network IOCs from `toy_network`:

```bash
strings ~/course/samples/benign_toy_app/toy_network_linux | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}|:[0-9]{4,5}|http|beacon|User-Agent"
```

Record every IP address, port and protocol string you find.

**Task 1.3** — Extract filesystem IOCs from `toy_persistence`:

```bash
strings ~/course/samples/benign_toy_app/toy_persistence_linux | grep -E "/tmp|/home|cron|\.sh|drop"
```

Record every file path.

**Task 1.4** — Build your IOC table. Fill this in based on your findings:

| Type | Value | Source Sample | Confidence |
|---|---|---|---|
| SHA256 | `<hash>` | toy_network_linux | High |
| IPv4 | `127.0.0.1` | toy_network_linux | High |
| Port | `4444` | toy_network_linux | High |
| File path | `<path>` | toy_persistence_linux | Medium |
| User-Agent | `ToyBeacon/1.0 (Educational)` | toy_network_linux | High |

> **CTFd Flag:** Take the SHA256 hash of `toy_network_linux` from your hashes.txt. Take the first 8 characters of that hash. Your flag is: `FLAG{ioc_sha256_first8_<first8chars>}`  
> Example: if your hash starts with `a3f9c112...` the flag is `FLAG{ioc_sha256_first8_a3f9c112}`

---

## Part 2 — ATT&CK Mapping

**Task 2.1** — Map each toy sample to MITRE ATT&CK techniques. Use https://attack.mitre.org to look up technique IDs.

| Behaviour Observed | Sample | ATT&CK Technique ID | Technique Name |
|---|---|---|---|
| XOR string obfuscation | toy_app | T1027 | Obfuscated Files or Information |
| Beacon to C2 over TCP | toy_network | `T____` | |
| Drop file to /tmp | toy_persistence | `T____` | |
| Scheduled task via cron | toy_persistence | `T____` | |
| Read /etc/passwd | toy_enum | `T____` | |
| Check for analyst tools | toy_enum | `T____` | |
| mDNS/hostname enumeration via /proc | toy_enum | `T____` | |

**Task 2.2** — Which MITRE tactic (the column headers in ATT&CK) does each technique fall under? Add a Tactic column to your table.

**Task 2.3** — If this were real malware, which technique would you prioritise in a detection rule? Why?

---

## Part 3 — Writing the Analyst Report

**Task 3.1** — Write a structured analyst report. Use this template:

```markdown
# Malware Analysis Report
**Reference:** MAR-2026-001  
**Analyst:** [Your name]  
**Date:** [Today]  
**Classification:** TLP:GREEN

## Executive Summary
[2–3 sentences. What was analysed, what it does, what risk it poses.
Write for a non-technical manager.]

## Sample Details
| Field | Value |
|---|---|
| Filename | toy_network_linux |
| SHA256 | <hash> |
| File type | ELF 64-bit LSB executable |
| File size | <size> bytes |
| First seen | [date you compiled it] |

## Technical Findings

### Static Analysis
[What strings/imports revealed without execution]

### Dynamic Analysis  
[What happened when you ran it — network connections, file writes, process activity]

### Memory Analysis
[What was found in process memory that static analysis missed]

## Indicators of Compromise
[Paste your IOC table from Part 1]

## ATT&CK Mapping
[Paste your completed mapping table from Part 2]

## Recommendations
1. [Specific detection recommendation]
2. [Specific containment recommendation]
3. [Specific hardening recommendation]
```

Save to `~/labs/lab07/report_MAR-2026-001.md`.

---

## Part 4 — STIX 2.1 Bundle

**Task 4.1** — Generate a STIX bundle from your findings. A template is in the course scripts. Modify it with your actual IOCs:

```bash
cp ~/course/scripts/generate_stix_template.py ~/labs/lab07/generate_stix.py
```

Edit `generate_stix.py` and replace the placeholder values with your actual hashes, IPs and file paths from Part 1.

**Task 4.2** — Run it:

```bash
cd ~/labs/lab07
python3 generate_stix.py > bundle_MAR-2026-001.json
cat bundle_MAR-2026-001.json | python3 -m json.tool | head -60
```

Confirm the JSON is valid and contains your IOCs.

**Task 4.3** — Count the STIX objects in your bundle:

```bash
python3 -c "
import json
with open('bundle_MAR-2026-001.json') as f:
    b = json.load(f)
print(f'STIX objects: {len(b[\"objects\"])}')
for obj in b['objects']:
    print(f'  {obj[\"type\"]}: {obj.get(\"name\", obj.get(\"value\", obj[\"id\"][:30]))}')
"
```

---

## Part 5 — Peer Review Simulation

**Task 5.1** — Swap your report with another student (or review it yourself after a 10-minute break). Check for:

- [ ] Is the executive summary understandable without technical knowledge?
- [ ] Are all SHA256 hashes present and correctly formatted (64 hex chars)?
- [ ] Are ATT&CK technique IDs in the correct format (T followed by 4 digits)?
- [ ] Are the recommendations specific and actionable, not generic?
- [ ] Does the STIX bundle validate as valid JSON?
- [ ] Is the TLP classification appropriate for the content?

**Task 5.2** — Fix any issues found in the review.

---

## Completion Checklist

- [ ] SHA256 hashes computed for all four toy samples
- [ ] Network, filesystem and string IOCs extracted
- [ ] ATT&CK mapping table completed (7 techniques minimum)
- [ ] Analyst report written using the structured template
- [ ] STIX 2.1 bundle generated and validated
- [ ] Flag submitted on course platform

## Key Takeaway

A finding that isn't documented didn't happen. The analyst report and STIX bundle are what turns your technical work into intelligence that a SOC, CIRT or law enforcement can actually use. Format matters as much as content — a technically brilliant report that nobody can read is worthless.

**Next:** [Lab 08 — Case Study](lab08_case_study.md)
