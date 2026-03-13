# Lab 02: Static Analysis

## Objective

Extract maximum intelligence from binary files without executing them. By the end you will have produced a complete static analysis report for all four toy samples using only Ubuntu command-line tools.

## Prerequisites

- Module 02 (Static Analysis) completed
- Lab 01 completed
- `radare2`, `binutils`, `strings`, `upx-ucl` installed

## Time Required

90–120 minutes

## Tools Used

`strings`, `rabin2`, `readelf`, `objdump`, `xxd`, `file`, `python3`, UPX

---

## Setup

```bash
sudo apt install -y radare2 binutils upx-ucl python3-pip
pip3 install pefile --break-system-packages

mkdir -p ~/labs/lab02/{samples,reports,scripts}
cd ~/labs/lab02

SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

gcc -o samples/toy_app         ${SAMPLES}/toy_app.c
gcc -o samples/toy_network     ${SAMPLES}/toy_app_network.c
gcc -o samples/toy_persistence ${SAMPLES}/toy_app_persistence.c
gcc -o samples/toy_enum        ${SAMPLES}/toy_app_enumeration.c

echo "[+] Setup complete"
```

---

## Part 1: String Extraction and Classification

Strings are the cheapest and highest-yield step in static analysis. The question is not just "what strings are there" but "what does each string tell you the binary might do."

```bash
cd ~/labs/lab02

# Basic extraction — minimum 8 character strings
strings -n 8 samples/toy_enum

# With file offsets (critical for YARA rule writing later)
strings -n 8 -t x samples/toy_enum | head -30

# Separate ASCII and wide strings
strings -n 6 -e s samples/toy_enum | head -20    # ASCII
strings -n 6 -e l samples/toy_enum | head -20    # 16-bit LE (UTF-16)
strings -n 6 -e b samples/toy_enum | head -20    # 16-bit BE
```

### String Classification Exercise

For each string found, assign a category. Build a table:

```bash
# Automate initial classification
strings -n 6 samples/toy_enum | while read line; do
    category=""
    echo "$line" | grep -qiE '^/(proc|etc|tmp|var)' && category="FILE_PATH"
    echo "$line" | grep -qiE '(socket|connect|send|recv|bind)' && category="NETWORK"
    echo "$line" | grep -qiE '(wireshark|ghidra|procmon|ollydbg|ida\b)' && category="ANTIDEBUG"
    echo "$line" | grep -qiE '(cron|persist|autostart|rc\.local|systemd)' && category="PERSISTENCE"
    echo "$line" | grep -qiE '(CUCKOO|SANDBOX|ANALYSIS|INETSIM)' && category="EVASION"
    echo "$line" | grep -qiE '([0-9]{1,3}\.){3}[0-9]{1,3}' && category="IP_ADDR"
    echo "$line" | grep -qiE '^(http|ftp|ssh|tcp)' && category="URL_PROTO"
    [ -n "$category" ] && echo "$category | $line"
done | sort | head -40
```

**Task 1.1:** Run the classifier against all four toy samples. Which sample has the most ANTIDEBUG strings? Which has any NETWORK strings?

**Task 1.2:** `toy_network` has a user-agent string but it does not appear in `strings` output. Why? (Hint: check Module 02 Section 3 on encoding.)

**Task 1.3:** The format string `BEACON|%d|%s|%s|%s|%s` is visible in `strings toy_network`. Write a one-sentence description of what this tells you about the binary's behaviour, as if writing it for an IOC report.

---

## Part 2: Import Table Analysis

The import table reveals capability. A binary that imports `socket`, `connect`, and `send` can make network connections. One that imports `fopen` and `fwrite` can create files. The combination tells a story.

```bash
cd ~/labs/lab02

# Full import table for each sample
for sample in samples/toy_*; do
    echo "=== $(basename $sample) ==="
    rabin2 -i "$sample" 2>/dev/null | grep -v "^[0-9]* $\|Ordinal\|---"
    echo ""
done

# Cross-reference: which samples import socket functions?
echo "=== Network capability detection ==="
for sample in samples/toy_*; do
    hits=$(rabin2 -i "$sample" 2>/dev/null | grep -cE '(socket|connect|send|recv)')
    echo "$(basename $sample): $hits network-related imports"
done

# Which samples can create/write files?
echo ""
echo "=== File I/O capability detection ==="
for sample in samples/toy_*; do
    hits=$(rabin2 -i "$sample" 2>/dev/null | grep -cE '(fopen|fwrite|open|write|creat)')
    echo "$(basename $sample): $hits file-related imports"
done
```

### Import Danger Rating

Rate each import combination from the table below. Calculate a composite score for each sample.

| Import | Risk | Reason |
|---|---|---|
| `socket` + `connect` + `send` | High | C2 communication |
| `VirtualAllocEx` + `WriteProcessMemory` | Critical | Process injection |
| `opendir` + `readdir` | Medium | Directory traversal |
| `fopen` + `/etc/passwd` string | High | Credential access |
| `strcmp` + analyst keywords | High | Sandbox evasion |
| `fopen` + `/tmp/` string | Medium | File dropper |
| `system` or `execve` | High | Command execution |
| `getenv` | Low alone | Environment probing |

**Task 2.1:** Complete this import risk table for all four samples:

| Sample | Highest-risk import combination | Risk level | Evidence of capability |
|---|---|---|---|
| toy_app | | | |
| toy_network | | | |
| toy_persistence | | | |
| toy_enum | | | |

**Task 2.2:** `toy_enum` imports both `opendir`/`readdir` AND string comparison functions. Combined with the keyword strings from Part 1, what specific attack technique does this combination suggest? Cite the MITRE ATT&CK technique ID.

---

## Part 3: Section Analysis and Entropy

```bash
cd ~/labs/lab02

# Section table with sizes and permissions
rabin2 -S samples/toy_network

# Compare section sizes across samples
echo "=== Section size comparison (.text = code size) ==="
for sample in samples/toy_*; do
    text_size=$(readelf -S "$sample" | grep ' \.text ' | awk '{print $7}')
    echo "$(basename $sample) .text: 0x${text_size} bytes"
done

# Per-section entropy (radare2)
echo ""
echo "=== Per-section entropy ==="
for sample in samples/toy_*; do
    echo "--- $(basename $sample) ---"
    python3 << PYEOF
import math
import subprocess

result = subprocess.run(['readelf', '-S', '$sample'], capture_output=True, text=True)
# Parse section info and compute entropy for each
data = open('$sample', 'rb').read()
freq = [0]*256
for b in data: freq[b] += 1
n = len(data)
e = -sum((f/n)*math.log2(f/n) for f in freq if f>0)
print(f"  Overall: {e:.4f}")
PYEOF
done
```

### UPX Packing Experiment

```bash
cd ~/labs/lab02

# Record pre-pack stats
echo "=== Before packing ==="
ls -lh samples/toy_network
python3 -c "
import math
data=open('samples/toy_network','rb').read()
freq=[0]*256
for b in data: freq[b]+=1
n=len(data)
e=-sum((f/n)*math.log2(f/n) for f in freq if f>0)
print(f'Entropy: {e:.4f}')
"
strings -n 6 samples/toy_network | grep -c "."
echo "strings count (above)"

# Pack it
cp samples/toy_network samples/toy_network_packed
upx --best samples/toy_network_packed

echo ""
echo "=== After packing ==="
ls -lh samples/toy_network_packed
python3 -c "
import math
data=open('samples/toy_network_packed','rb').read()
freq=[0]*256
for b in data: freq[b]+=1
n=len(data)
e=-sum((f/n)*math.log2(f/n) for f in freq if f>0)
print(f'Entropy: {e:.4f}')
"
strings -n 6 samples/toy_network_packed | grep -c "."
echo "strings count (above)"

# Does BEACON string survive packing?
echo ""
echo "=== Is BEACON string visible after packing? ==="
strings samples/toy_network_packed | grep "BEACON"
# Expected: NOT visible — it is compressed inside the UPX stub
```

**Task 3.1:** Fill in the comparison table:

| Metric | Before packing | After packing | Change |
|---|---|---|---|
| File size | | | |
| Entropy | | | |
| String count | | | |
| BEACON string visible | | | |

**Task 3.2:** Unpack the packed binary and verify the BEACON string reappears:
```bash
upx -d samples/toy_network_packed -o samples/toy_network_unpacked
strings samples/toy_network_unpacked | grep "BEACON"
```

**Task 3.3:** If you received `toy_network_packed` from an incident and ran `strings` on it, what would you conclude? What should you do next?

---

## Part 4: Hex Analysis — Finding the Encoded Buffer

The XOR-encoded user agent in `toy_network` is not visible as a string. But the encoded bytes are in the binary. Find them.

```bash
cd ~/labs/lab02

# The key is 0x41. The encoded string starts with 0x01 (T XOR 0x41 = 0x01 XOR 0x41 = 'T')
# Wait — actually: 'T' = 0x54, 0x54 XOR 0x41 = 0x15
# Let's compute the correct encoded bytes

python3 << 'EOF'
ua = "ToyBeacon/1.0 (Educational)"
key = 0x41
encoded = [b ^ key for b in ua.encode()]
print("Plaintext: ", ua)
print("Key:       ", hex(key))
print("Encoded:   ", ' '.join(f'{b:02x}' for b in encoded))
print("First 8:   ", ' '.join(f'{b:02x}' for b in encoded[:8]))
print()
# Verify decode
decoded = ''.join(chr(b ^ key) for b in encoded)
print("Decoded:   ", decoded)
EOF
```

```bash
# Now search for those encoded bytes in the binary
python3 << 'EOF'
ua = "ToyBeacon/1.0 (Educational)"
key = 0x41
encoded = bytes(b ^ key for b in ua.encode())

data = open('samples/toy_network', 'rb').read()
offset = data.find(encoded[:8])  # search for first 8 bytes
if offset >= 0:
    print(f"Found encoded bytes at offset: 0x{offset:04x} ({offset})")
    print(f"Bytes at offset: {data[offset:offset+len(encoded)].hex()}")
    print(f"Decoded:         {''.join(chr(b ^ key) for b in data[offset:offset+len(encoded)])}")
else:
    print("Not found — check the encoding")
EOF

# Confirm with xxd
python3 -c "
ua = 'ToyBeacon/1.0 (Educational)'
key = 0x41
encoded = bytes(b ^ key for b in ua.encode())
data = open('samples/toy_network','rb').read()
offset = data.find(encoded[:8])
print(f'xxd offset: {offset}')
" | xargs -I{} bash -c "xxd -s {} -l 30 samples/toy_network"
```

**Task 4.1:** What is the file offset of the encoded user-agent buffer?

**Task 4.2:** Write a YARA hex pattern for the first 8 bytes of the encoded buffer. Format: `$ua_enc = { XX XX XX XX XX XX XX XX }`

**Task 4.3:** Why is finding the encoded bytes useful even though you cannot read them as a string? What analysis does it enable?

---

## Part 5: Automated Static Analysis Script

Write a reusable script that produces a formatted static analysis report for any ELF binary.

```bash
cat > ~/labs/lab02/scripts/static_report.sh << 'EOF'
#!/bin/bash
# static_report.sh — Automated static analysis for ELF binaries
# Usage: ./static_report.sh <binary> [output_file]

BINARY="$1"
OUTPUT="${2:-/dev/stdout}"

if [ ! -f "$BINARY" ]; then
    echo "Usage: $0 <binary> [output_file]"
    exit 1
fi

NAME=$(basename "$BINARY")

{
echo "# Static Analysis Report: $NAME"
echo "**Date:** $(date +%Y-%m-%d)"
echo "**Analyst:** $USER"
echo ""

echo "## File Metadata"
echo "| Field | Value |"
echo "|---|---|"
echo "| Filename | $NAME |"
echo "| Size | $(stat -c %s "$BINARY") bytes |"
echo "| Type | $(file -b "$BINARY") |"
echo "| MD5 | $(md5sum "$BINARY" | cut -d' ' -f1) |"
echo "| SHA-256 | $(sha256sum "$BINARY" | cut -d' ' -f1) |"
echo ""

echo "## Architecture"
readelf -h "$BINARY" 2>/dev/null | grep -E '(Class|Data|Type|Machine|Entry)' \
    | sed 's/^  *//' | while IFS=: read key val; do
    echo "| $(echo $key | xargs) | $(echo $val | xargs) |"
done
echo ""

echo "## Entropy"
python3 -c "
import math
data=open('$BINARY','rb').read()
freq=[0]*256
for b in data: freq[b]+=1
n=len(data)
e=-sum((f/n)*math.log2(f/n) for f in freq if f>0)
verdict='PACKED/ENCRYPTED' if e>7.0 else 'Elevated' if e>6.0 else 'Normal'
print(f'Overall entropy: {e:.4f} bits/byte ({verdict})')
"
echo ""

echo "## Imports"
echo '```'
rabin2 -i "$BINARY" 2>/dev/null | grep -v "^$\|Ordinal\|---\|vaddr\|^[0-9] $" | head -30
echo '```'
echo ""

echo "## Suspicious Strings"
echo '```'
strings -n 6 "$BINARY" \
    | grep -iE '(socket|connect|send|recv|beacon|cron|/etc|/proc|/tmp|passwd|wireshark|ghidra|procmon|CUCKOO|SANDBOX)' \
    | sort -u | head -30
echo '```'
echo ""

echo "## Red Flags"
flags=0

rabin2 -i "$BINARY" 2>/dev/null | grep -qE '(socket|connect)' && \
    echo "- Network capability (socket/connect imports)" && flags=$((flags+1))

strings -n 6 "$BINARY" | grep -qiE '(wireshark|ghidra|procmon|ollydbg)' && \
    echo "- Anti-analysis keywords detected" && flags=$((flags+1))

strings -n 6 "$BINARY" | grep -qiE '(CUCKOO|SANDBOX|ANALYSIS)' && \
    echo "- Sandbox detection strings present" && flags=$((flags+1))

strings -n 6 "$BINARY" | grep -qiE '(/etc/passwd|/etc/shadow)' && \
    echo "- Sensitive file path: /etc/passwd or /etc/shadow" && flags=$((flags+1))

python3 -c "
import math
data=open('$BINARY','rb').read()
freq=[0]*256
for b in data: freq[b]+=1
n=len(data)
e=-sum((f/n)*math.log2(f/n) for f in freq if f>0)
import sys; sys.exit(0 if e>7.0 else 1)
" && echo "- HIGH ENTROPY: possible packing or encryption" && flags=$((flags+1))

echo ""
[ $flags -eq 0 ] && echo "No automated red flags detected." || \
    echo "**Total red flags: $flags**"

} > "$OUTPUT"

echo "[+] Report written to: $OUTPUT"
EOF
chmod +x ~/labs/lab02/scripts/static_report.sh
```

**Task 5.1:** Run the script against all four toy samples:
```bash
for sample in samples/toy_{app,network,persistence,enum}; do
    ./scripts/static_report.sh "$sample" \
        "reports/$(basename $sample)_static.md"
done

ls -lh reports/
```

**Task 5.2:** Review the generated reports. Does the automated red flag detection correctly identify which samples are highest risk? Are there any false negatives — red flags the script missed?

**Task 5.3:** Add one more check to the script: detect whether the binary contains the string `BEACON|` and flag it as a potential C2 beacon. Test that the new check fires on `toy_network` and not on `toy_app`.

---

## Part 6: Complete Static Analysis Report

Using everything from Parts 1–5, write a complete static analysis report for `toy_enum` (the most complex sample) using the Module 07 template.

Fill in every section:

```bash
# Generate the metadata block automatically
./scripts/static_report.sh samples/toy_enum reports/toy_enum_full_report.md

# Then manually extend the report with:
# - String classification table (from Part 1)
# - Import danger rating (from Part 2)
# - Section entropy table (from Part 3)
# - Your YARA rule (from Part 4)
# - ATT&CK mapping
# - Recommendations

echo "Extend the report at: reports/toy_enum_full_report.md"
```

**Minimum report content:**
- Metadata block with all hashes
- At least 10 classified strings in a table
- Import danger assessment
- Entropy assessment with verdict
- 3 ATT&CK technique mappings
- One YARA rule
- Recommended actions

---

## Completion Checklist

- [ ] Classified strings from all four samples into categories
- [ ] Explained why the XOR user-agent string is invisible in `strings` output
- [ ] Built the import risk table for all four samples
- [ ] Ran the UPX packing experiment and documented the entropy change
- [ ] Found the encoded buffer offset in `toy_network`
- [ ] Written and tested `static_report.sh`
- [ ] Produced a complete static report for `toy_enum`

---

## Key Takeaways

Static analysis without execution is fast but incomplete. You found what strings are visible, but not what strings get decoded at runtime. You found what functions are imported, but not which ones actually get called. Dynamic analysis (Lab 03) fills those gaps. The two disciplines answer different questions and you need both.

**Next:** [Lab 03 — Dynamic Analysis](lab03_dynamic_analysis.md)
