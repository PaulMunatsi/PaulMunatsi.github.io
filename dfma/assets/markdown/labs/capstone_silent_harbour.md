# Capstone — Operation Silent Harbour

**Type:** Final assessment — independent work  
**Prerequisites:** All modules (00–16)  
**Estimated time:** 6–8 hours  
**Difficulty:** Expert  
**Grading:** See scoring rubric at end of document  
**Flag:** Multiple — see Phase completions

---

## Scenario

It is 07:15 on a Tuesday. You receive an urgent message from a colleague at a partner organisation in Harare. A journalist who works with them — call her Source A — noticed her laptop has been behaving strangely for three weeks. Slow performance. Unexpected network activity late at night. An unfamiliar process she doesn't recognise. She also received a WhatsApp message two weeks ago with a link to what was described as a leaked government document.

The colleague has already done triage:
- Pulled a process list and network snapshot
- Retrieved three files found in unusual locations
- Captured 10 minutes of network traffic
- Asked Source A about every app on her phone

None of the three files appeared in any antivirus scan. The network traffic "looks like HTTPS." The phone has two apps Source A doesn't remember installing.

Your job is to analyse everything and produce a complete incident package.

---

## Evidence Preparation

Build the capstone environment. This creates all artefacts from scratch so every student's hashes are unique.

```bash
#!/bin/bash
# capstone_setup.sh — Run once to generate all evidence

set -e
CAPSTONE_DIR=~/labs/capstone
mkdir -p "$CAPSTONE_DIR"/{samples,pcap,memory,phone,reports}
cd "$CAPSTONE_DIR"

echo "[*] Building capstone evidence..."

# === Sample A: Obfuscated ELF ===
cat > /tmp/cap_sample_a.c << 'CSRC'
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>

// XOR key: 0x5E
static unsigned char enc_c2[] = {
    0x39,0x3f,0x3b,0x13,0x3f,0x3e,0x0f,  // decoded: "watcher"
    0x61,0x7b,0x61,0x7b,0x61,0x7b,0x61,  // more payload
};

static void decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++) buf[i] ^= 0x5E;
}

int main(void) {
    // Anti-debug: check TracerPid
    FILE *f = fopen("/proc/self/status", "r");
    char line[128];
    while (f && fgets(line, sizeof(line), f)) {
        if (strncmp(line, "TracerPid:", 10) == 0) {
            if (atoi(line + 10) > 0) {
                fclose(f);
                return 0; // Silently exit under debugger
            }
        }
    }
    if (f) fclose(f);

    unsigned char buf[sizeof(enc_c2)];
    memcpy(buf, enc_c2, sizeof(enc_c2));
    decode(buf, sizeof(enc_c2));

    printf("Process active. Monitoring interval: 30s\n");
    printf("Internal ref: SILENT_HARBOUR_IMPLANT_v2\n");
    // Simulate persistence check
    if (access("/tmp/.harbour_lock", F_OK) != 0) {
        FILE *lock = fopen("/tmp/.harbour_lock", "w");
        if (lock) { fprintf(lock, "active\n"); fclose(lock); }
    }
    return 0;
}
CSRC
gcc -O1 -o samples/document_viewer samples/document_viewer.c 2>/dev/null \
    || gcc -O1 -o samples/document_viewer /tmp/cap_sample_a.c
cp /tmp/cap_sample_a.c samples/document_viewer.c
echo "[+] Sample A: samples/document_viewer"

# === Sample B: Fileless persistence script ===
cat > samples/update_helper.sh << 'SHSRC'
#!/bin/bash
# update_helper.sh — found in /home/source_a/.config/autostart/
# Appears to be a system update helper

ENCODED="aW1wb3J0IHN5cywgb3MKcHJpbnQoJ1NJTEVORV9IQVJCT1VSX0MyX0NIRUNLSU4nKQpwcmludChmJ0hvc3Q6IHtvcy51bmFtZSgpLm5vZGVuYW1lfScpCg=="
echo "$ENCODED" | base64 -d | python3
SHSRC
chmod +x samples/update_helper.sh
echo "[+] Sample B: samples/update_helper.sh (fileless cron/autostart)"

# === Sample C: APK manifest (stalkerware) ===
python3 ~/course/samples/generate_suspicious_apk_manifest.py \
  > samples/suspicious_app_manifest.xml 2>/dev/null
echo "[+] Sample C: samples/suspicious_app_manifest.xml (mobile)"

# === Network capture ===
echo "[*] Generating network evidence (15 seconds)..."
sudo tcpdump -i lo -w pcap/silent_harbour_capture.pcap \
  port 4444 2>/dev/null &
TDPID=$!
sleep 2

# Beacon activity
timeout 14 ~/course/samples/benign_toy_app/toy_network_linux 2>/dev/null &
sleep 14
kill $TDPID 2>/dev/null
wait 2>/dev/null
echo "[+] PCAP: pcap/silent_harbour_capture.pcap"

# === Memory snapshot ===
gcc -o /tmp/cap_mem_proc ~/course/samples/benign_toy_app/toy_app_network.c 2>/dev/null \
  || cp ~/course/samples/benign_toy_app/toy_network_linux /tmp/cap_mem_proc
/tmp/cap_mem_proc &
MPID=$!
sleep 2
gcore -o memory/process_dump $MPID 2>/dev/null
kill $MPID 2>/dev/null
echo "[+] Memory dump: memory/process_dump.*"

# === Hashes (do this last) ===
echo ""
echo "[*] SHA256 hashes (document these immediately):"
sha256sum samples/document_viewer samples/update_helper.sh \
  samples/suspicious_app_manifest.xml \
  pcap/silent_harbour_capture.pcap 2>/dev/null | tee reports/initial_hashes.txt

echo ""
echo "[+] Capstone environment ready."
echo "[+] Working directory: $CAPSTONE_DIR"
echo "[+] Begin Phase 1."
```

```bash
chmod +x capstone_setup.sh
bash capstone_setup.sh
```

---

## Phase 1 — Triage (45 minutes)

**Deliverable:** Triage report with prioritised sample list

**1.1** — Hash all evidence. Confirm hashes match `reports/initial_hashes.txt`:

```bash
cd ~/labs/capstone
sha256sum samples/* pcap/* 2>/dev/null
```

**1.2** — File type identification. What is each file actually, regardless of extension/name?

```bash
file samples/document_viewer
file samples/update_helper.sh
file samples/suspicious_app_manifest.xml
file pcap/silent_harbour_capture.pcap
```

**1.3** — Quick string triage on all binary/compiled samples:

```bash
strings samples/document_viewer | grep -iE "c2|harbour|implant|beacon|monitor|xor|encode|interval"
strings samples/document_viewer | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}|:[0-9]{4,5}"
```

**1.4** — What does `update_helper.sh` actually do? Decode the payload without executing it:

```bash
cat samples/update_helper.sh
ENCODED=$(grep "ENCODED=" samples/update_helper.sh | cut -d'"' -f2)
echo "$ENCODED" | base64 -d
```

**1.5** — Prioritise the four evidence items (highest risk first) and write one sentence justifying each ranking.

> **Phase 1 Flag:** The internal reference string inside `document_viewer` is part of the flag.  
> Extract it with: `strings samples/document_viewer | grep SILENT`  
> Flag: `FLAG{capstone_phase1_triage_SILENT_HARBOUR_IMPLANT_v2}`

---

## Phase 2 — Static Analysis (60 minutes)

**Deliverable:** Static analysis section of the final report

**2.1** — Full binary analysis of `document_viewer`:

```bash
# Imports
objdump -T samples/document_viewer 2>/dev/null | grep -v "^$\|DYNAMIC\|Format" | head -20

# Entropy
python3 -c "
import math
data = open('samples/document_viewer','rb').read()
counts = [0]*256
for b in data: counts[b] += 1
ent = -sum((c/len(data))*math.log2(c/len(data)) for c in counts if c)
print(f'Entropy: {ent:.2f}/8.0')
"

# Sections
objdump -h samples/document_viewer 2>/dev/null | head -20

# Anti-debug detection — find the TracerPid check
grep -n "TracerPid\|proc.*self\|status" samples/document_viewer.c
```

**2.2** — Reverse engineer the XOR decode function. The key is NOT `0x41` or `0x55`:

```bash
# Disassemble and find the XOR instruction and key
objdump -d samples/document_viewer | grep -B3 -A3 "xor"

# Once you have the key — what do the encoded bytes decode to?
python3 << 'EOF'
encoded = bytes([0x39,0x3f,0x3b,0x13,0x3f,0x3e,0x0f])
# Find the correct key from disassembly, then:
for key in range(0x01, 0xFF):
    decoded = bytes(b^key for b in encoded)
    if all(0x20 <= c <= 0x7e for c in decoded):
        print(f"Key 0x{key:02x}: {decoded.decode('utf-8', errors='replace')}")
EOF
```

**2.3** — Analyse `suspicious_app_manifest.xml`:

```bash
grep "uses-permission" samples/suspicious_app_manifest.xml | \
  sed 's/.*android:name="//;s/".*//' | \
  while read perm; do
    case "$perm" in
      *RECORD_AUDIO*|*ACCESS_FINE_LOCATION*|*READ_SMS*|*BIND_ACCESSIBILITY*)
        echo "CRITICAL: $perm" ;;
      *RECEIVE_BOOT*|*REQUEST_INSTALL*|*CAMERA*)
        echo "HIGH:     $perm" ;;
      *)
        echo "         $perm" ;;
    esac
  done
```

How many CRITICAL permissions? Does the app have a launcher activity?

**2.4** — Extract the encoded payload from `update_helper.sh` and analyse it:

```bash
ENCODED=$(grep "ENCODED=" samples/update_helper.sh | cut -d'"' -f2)
echo "$ENCODED" | base64 -d > /tmp/decoded_payload.py
cat /tmp/decoded_payload.py
strings /tmp/decoded_payload.py
```

What does the decoded script do? What IOCs does it contain?

> **Phase 2 Flag:** `FLAG{capstone_phase2_static_xor_key_0x5e_lolbin_base64}`

---

## Phase 3 — Dynamic & Network Analysis (60 minutes)

**Deliverable:** Dynamic analysis section + network IOC table

**3.1** — Run `document_viewer` under strace in a safe environment:

```bash
strace -f -e trace=openat,write,connect,socket \
  ~/labs/capstone/samples/document_viewer 2>&1 | head -40
```

What files does it open? What does it write? Does it attempt network connections?

**3.2** — Run beacon_detector.py against the PCAP:

```bash
python3 ~/course/samples/beacon_detector.py \
  ~/labs/capstone/pcap/silent_harbour_capture.pcap 2>/dev/null \
  || python3 << 'EOF'
# tshark-based beacon detection (no scapy needed)
import subprocess, statistics
from collections import defaultdict

result = subprocess.run([
    'tshark', '-r', 'pcap/silent_harbour_capture.pcap',
    '-Y', 'tcp.flags.syn==1 and tcp.flags.ack==0',
    '-T', 'fields', '-e', 'frame.time_epoch', '-e', 'ip.dst', '-e', 'tcp.dstport',
    '-E', 'separator=|'
], capture_output=True, text=True)

conns = defaultdict(list)
for line in result.stdout.splitlines():
    parts = line.strip().split('|')
    if len(parts) == 3:
        try: conns[f"{parts[1]}:{parts[2]}"].append(float(parts[0]))
        except: pass

for dst, times in conns.items():
    if len(times) < 2: continue
    times.sort()
    intervals = [times[i+1]-times[i] for i in range(len(times)-1)]
    avg = statistics.mean(intervals)
    print(f"{dst}: {len(times)} connections, avg interval {avg:.1f}s")
EOF
```

**3.3** — Extract all network IOCs from the PCAP:

```bash
tshark -r ~/labs/capstone/pcap/silent_harbour_capture.pcap \
  -T fields -e ip.dst -e tcp.dstport -e http.user_agent \
  -Y "tcp.flags.syn==1 or http" 2>/dev/null | sort -u | head -20
```

**3.4** — Memory analysis. Find decoded strings not in the binary:

```bash
strings ~/labs/capstone/memory/process_dump.* | \
  grep -iE "c2_host|beacon|harbour|interval|campaign|key=|ToyBeacon" | head -20
```

Compare with `strings samples/document_viewer` — what appears in memory that doesn't appear in the binary?

> **Phase 3 Flag:** The C2 host and port from the memory dump form the flag.  
> Flag: `FLAG{capstone_phase3_dynamic_c2_127_0_0_1_port_4444_beacon_5s}`

---

## Phase 4 — Attribution & Threat Intel (30 minutes)

**Deliverable:** Threat actor assessment section of the final report

**4.1** — Map every observed behaviour to ATT&CK:

| Behaviour | Source | ATT&CK ID | Technique |
|---|---|---|---|
| XOR encoding (key 0x5E) | document_viewer static | T1027 | Obfuscated Files |
| Anti-debug TracerPid check | document_viewer source | T1622 | Debugger Evasion |
| Lock file in /tmp | document_viewer dynamic | T1036 | Masquerading |
| base64 decode to python3 | update_helper.sh | T1059.006 | Python interpreter |
| Fileless autostart | update_helper.sh location | T1037 | Boot/Logon Init |
| Full stalkerware perm suite | APK manifest | T1417 | Input Capture |
| Periodic TCP beacon | PCAP | T1071.001 | Web Protocol |
| *(add your own findings)* | | | |

**4.2** — Attribution hypothesis. Based on the TTPs and the context (journalist target, Southern Africa, WhatsApp delivery, Android stalkerware + desktop implant):

Write a structured attribution hypothesis covering:
- Threat actor category (nation-state / commercial spyware / criminal)
- Which documented actor this most resembles and why
- Confidence level (low/medium/high) and what evidence would raise it
- What additional IOCs you would look for to confirm or deny

---

## Phase 5 — Final Report (60 minutes)

**Deliverable:** Complete analyst report package

**5.1** — Write the full incident report using the Module 07 template:

```bash
cat > ~/labs/capstone/reports/IR-2026-SilentHarbour.md << 'EOF'
# Incident Report — Operation Silent Harbour
**Reference:** IR-2026-SH-001
**Analyst:** [Your name]
**Organisation:** [Your organisation]
**Date:** [Today]
**Classification:** TLP:AMBER

## Executive Summary
[2-3 sentences — non-technical, for a manager or lawyer]

## Victim Profile
[What we know about Source A and why she would be targeted]

## Evidence Received
[4-item table: filename, SHA256, file type, received from]

## Technical Findings

### Phase 1 — Triage
[Priority ranking with justification]

### Phase 2 — Static Analysis
[document_viewer: XOR key, decoded string, imports, anti-debug]
[update_helper.sh: decoded payload, what it does]
[APK manifest: permission count, critical permissions, red flags]

### Phase 3 — Dynamic and Network Analysis
[strace findings]
[PCAP: beacon target, interval, payload content]
[Memory: decoded strings not in binary]

### Phase 4 — Attribution
[TTP table]
[Attribution hypothesis with confidence level]

## IOC Package

### File IOCs
| Type | Value | Confidence |
|---|---|---|
| SHA256 | (document_viewer hash) | High |
| SHA256 | (update_helper.sh hash) | High |
| Filename | document_viewer | Medium |
| String | SILENT_HARBOUR_IMPLANT_v2 | High |

### Network IOCs
| Type | Value | Confidence |
|---|---|---|
| IPv4 | (from PCAP) | High |
| Port | (from PCAP) | High |
| Beacon interval | (from PCAP) | Medium |
| User-Agent | ToyBeacon/1.0 (Educational) | High |

### Mobile IOCs
| Type | Value | Confidence |
|---|---|---|
| Package | com.security.update.installer | High |
| Permission cluster | BIND_ACCESSIBILITY + RECORD_AUDIO + READ_SMS | High |

## ATT&CK Summary
[Paste completed mapping table from Phase 4]

## STIX Bundle
[Generate with: python3 ~/course/scripts/generate_stix_template.py]

## Recommendations

### Immediate (next 24 hours)
1. [Specific action for Source A's laptop]
2. [Specific action for Source A's phone]
3. [Specific network action]

### Short-term (next 2 weeks)
1. [Detection rule deployment]
2. [IOC sharing action]

### Long-term (next 3 months)
1. [Hardening recommendation]
2. [Process recommendation]

## Appendix: YARA Rules
[YARA rule for document_viewer]
[YARA rule for the stalkerware APK]
EOF
echo "Report template created — fill in all sections"
```

**5.2** — Generate the STIX bundle:

```bash
python3 ~/course/scripts/generate_stix_template.py \
  > ~/labs/capstone/reports/stix_bundle_SilentHarbour.json
# Edit the template to include your actual IOCs from all phases
```

**5.3** — Write the two YARA rules:

```bash
cat > ~/labs/capstone/reports/silent_harbour.yar << 'YARA'
// Add your YARA rules here based on your analysis findings
// Rule 1: document_viewer (ELF with XOR decode + anti-debug)
// Rule 2: Android stalkerware permission cluster

rule SilentHarbour_Desktop_Implant {
    meta:
        description = "Detects Silent Harbour desktop implant"
        author      = "[Your name]"
        date        = "2026-03-12"
        reference   = "IR-2026-SH-001"
        mitre_att   = "T1027, T1622"
    strings:
        // Add strings from your analysis
        $internal_ref = "SILENT_HARBOUR_IMPLANT" ascii
        $lock_file    = ".harbour_lock" ascii
        $anti_debug   = "TracerPid" ascii
    condition:
        uint32(0) == 0x464c457f and   // ELF magic
        2 of them
}

rule SilentHarbour_Android_Stalkerware {
    meta:
        description = "Detects Silent Harbour Android stalkerware component"
        mitre_mobile = "T1417, T1412, T1430"
    strings:
        $perm_access  = "BIND_ACCESSIBILITY_SERVICE" ascii
        $perm_audio   = "RECORD_AUDIO" ascii
        $perm_sms     = "READ_SMS" ascii
        $perm_loc     = "ACCESS_FINE_LOCATION" ascii
        $perm_boot    = "RECEIVE_BOOT_COMPLETED" ascii
        $no_launcher  = "android.intent.category.LAUNCHER"
    condition:
        uint16(0) == 0x4B50 and   // APK/ZIP magic
        $perm_access and
        3 of ($perm_audio, $perm_sms, $perm_loc, $perm_boot) and
        not $no_launcher
}
YARA
```

> **Phase 5 Flag:** Awarded for submitting a complete report with all required sections.  
> Flag: `FLAG{capstone_phase5_complete_IR_STIX_YARA_ATT&CK_mapped}`

---

## Scoring Rubric

| Component | Max Points | Pass Condition |
|---|---|---|
| Phase 1: Triage — hashes, types, priority ranking | 100 | All hashes correct, ranking justified |
| Phase 2: XOR key correctly identified | 75 | Key 0x5E extracted from disassembly |
| Phase 2: Decoded payload from update_helper.sh | 75 | Full decoded content documented |
| Phase 2: APK permission analysis | 50 | All critical perms identified |
| Phase 3: Beacon target, interval, payload | 100 | IP, port and interval from PCAP |
| Phase 3: Memory strings vs binary delta | 75 | At least 2 strings found only in dump |
| Phase 4: ATT&CK mapping (8+ techniques) | 100 | Correct TIDs with evidence |
| Phase 4: Attribution hypothesis | 75 | Structured, evidence-based, confidence stated |
| Phase 5: Executive summary (non-technical) | 50 | Readable by non-technical manager |
| Phase 5: IOC table (all three categories) | 75 | File, network, mobile IOCs complete |
| Phase 5: STIX bundle valid JSON | 50 | Validates with python3 -m json.tool |
| Phase 5: Both YARA rules syntactically correct | 75 | yara rule.yar samples/ runs without error |
| Phase 5: Three immediate recommendations | 50 | Specific and actionable |
| Flags submitted (all 4) | 75 | All four phase flags submitted on CTFd |
| **Total** | **1,000** | **Pass: 700 (70%)** |

---

## Examiner Notes

Students often make these mistakes:

1. **Writing the executive summary for an analyst, not a manager.** If the word "execve" appears in the executive summary, rewrite it.

2. **Incomplete IOC tables.** Every IOC needs a confidence level and a source. "SHA256: abc123" with no confidence or source is incomplete.

3. **Attribution hypothesis stated as fact.** Write "The TTPs are consistent with..." not "This is Dark Caracal." Attribution below high confidence must be stated as a hypothesis.

4. **YARA rules that don't compile.** Run `yara rule.yar /dev/null` before submitting. A rule with a syntax error scores zero.

5. **Missing the STIX bundle.** It is required. The template in `scripts/` covers the structure — fill in your actual IOCs.
