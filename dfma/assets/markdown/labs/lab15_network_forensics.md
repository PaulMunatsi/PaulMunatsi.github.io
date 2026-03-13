# Lab 15 — Network Traffic Analysis

**Module:** 15 — Network Forensics & Traffic Analysis  
**Estimated time:** 90–120 minutes  
**Tools:** tshark, tcpdump, scapy, python3  
**Flag:** `FLAG{network_beacon_5s_interval_xor_ua_tshark_extracted}`

---

## Objectives

- Generate and capture C2 beacon traffic from a known sample
- Identify beacon timing, destination and payload using tshark
- Detect covert channel indicators (long DNS names, large ICMP payloads)
- Run automated beacon detection and DGA scoring scripts
- Extract all network IOCs from a PCAP in one pass

---

## Setup

```bash
sudo apt install -y tshark tcpdump python3-scapy 2>/dev/null | tail -3
pip3 install scapy --break-system-packages 2>/dev/null | tail -1

mkdir -p ~/labs/lab15/{captures,scripts,iocs}
SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

# Compile the network beacon sample
gcc -o ~/labs/lab15/toy_network "$SAMPLES/toy_app_network.c"
echo "[+] toy_network compiled"
```

---

## Part 1 — Capture and Triage

**Task 1.1** — Capture beacon traffic from toy_network:

```bash
cd ~/labs/lab15

# Start capture
sudo tcpdump -i lo -w captures/beacon_capture.pcap port 4444 2>/dev/null &
TDPID=$!
sleep 1

# Run 3 beacon cycles (each beacons 3 times, 5s apart = ~15s total)
timeout 17 ./toy_network &
sleep 17

kill $TDPID 2>/dev/null
wait 2>/dev/null
echo "[+] Capture complete"
ls -lh captures/beacon_capture.pcap
```

**Task 1.2** — Protocol breakdown:

```bash
tshark -r captures/beacon_capture.pcap -q -z io,phs
```

How many packets total? What protocols are present?

**Task 1.3** — Conversation statistics:

```bash
tshark -r captures/beacon_capture.pcap -q -z conv,tcp
```

Note: destination IP, port, number of connections, bytes exchanged.

**Task 1.4** — Extract the User-Agent. This is the main flag artefact:

```bash
tshark -r captures/beacon_capture.pcap \
  -Y "http.user_agent" \
  -T fields -e http.user_agent \
  2>/dev/null | sort -u

# If no HTTP layer detected (raw TCP beacon):
tshark -r captures/beacon_capture.pcap \
  -Y "tcp.port==4444 and data" \
  -T fields -e data | head -5
```

If the output is hex, decode it:

```bash
tshark -r captures/beacon_capture.pcap \
  -Y "tcp.port==4444 and data" \
  -T fields -e data | head -1 | \
  python3 -c "
import sys
for line in sys.stdin:
    h = line.strip()
    if h:
        raw = bytes.fromhex(h)
        print('Raw bytes:', raw[:40])
        # XOR decode with key 0x55
        decoded = bytes(b^0x55 for b in raw)
        print('XOR 0x55:', decoded[:40])
"
```

What does the decoded payload say?

---

## Part 2 — Beacon Timing Analysis

**Task 2.1** — Write and run the beacon detector:

```bash
cat > ~/labs/lab15/scripts/beacon_detector.py << 'EOF'
#!/usr/bin/env python3
# Uses tshark — no scapy dependency required
import subprocess, statistics, sys
from collections import defaultdict

def detect_beacons(pcap_path, min_packets=3, max_jitter_pct=25):
    result = subprocess.run([
        'tshark', '-r', pcap_path,
        '-Y', 'tcp.flags.syn==1 and tcp.flags.ack==0',
        '-T', 'fields',
        '-e', 'frame.time_epoch', '-e', 'ip.dst', '-e', 'tcp.dstport',
        '-E', 'separator=|'
    ], capture_output=True, text=True)

    connections = defaultdict(list)
    for line in result.stdout.splitlines():
        parts = line.strip().split('|')
        if len(parts) == 3:
            try:
                connections[f"{parts[1]}:{parts[2]}"].append(float(parts[0]))
            except ValueError:
                pass

    print(f"\n{'Destination':<28} {'Pkts':>5} {'Avg(s)':>7} {'Jitter%':>8} {'Verdict':>14}")
    print("-" * 67)
    for dst, times in sorted(connections.items()):
        if len(times) < min_packets:
            continue
        times.sort()
        intervals = [times[i+1]-times[i] for i in range(len(times)-1)]
        avg = statistics.mean(intervals)
        if avg < 0.5:
            continue
        jitter = (statistics.stdev(intervals)/avg*100) if len(intervals) > 1 else 0
        verdict = "*** BEACON ***" if jitter < max_jitter_pct else "irregular"
        print(f"{dst:<28} {len(times):>5} {avg:>7.2f} {jitter:>8.1f}% {verdict:>14}")

if __name__ == "__main__":
    detect_beacons(sys.argv[1] if len(sys.argv) > 1 else "captures/beacon_capture.pcap")
EOF
python3 ~/labs/lab15/scripts/beacon_detector.py captures/beacon_capture.pcap
```

Fill in: destination IP:port, average interval (seconds), jitter percentage, verdict.

**Task 2.2** — Follow TCP stream 0 manually:

```bash
tshark -r captures/beacon_capture.pcap -q -z follow,tcp,ascii,0 2>/dev/null
```

What does the full exchange look like? Is this one-way or bidirectional?

---

## Part 3 — DNS and DGA Analysis

**Task 3.1** — Generate a mixed DNS query sample (benign + DGA-like):

```bash
# Create a DNS query log
cat > ~/labs/lab15/dns_queries.txt << 'EOF'
google.com
microsoft.com
update.windows.com
api.github.com
xk3mdf92kqp.com
a8f3b2c9d4.net
jv8k2mxpqr4.info
zyxwvuts123.org
news.bbc.co.uk
k4f9n2x7p.com
smtp.gmail.com
cdn.jsdelivr.net
p9q8r7s6t5.net
fonts.googleapis.com
wvd2f9jq4k.xyz
EOF
```

**Task 3.2** — Run the DGA scorer:

```bash
cat > ~/labs/lab15/scripts/dga_detector.py << 'EOF'
#!/usr/bin/env python3
import math, sys

def entropy(s):
    if not s: return 0
    p = [s.count(c)/len(s) for c in set(s)]
    return -sum(x*math.log2(x) for x in p)

def consonant_ratio(s):
    cons = set('bcdfghjklmnpqrstvwxyz')
    letters = [c for c in s.lower() if c.isalpha()]
    return sum(1 for c in letters if c in cons)/len(letters) if letters else 0

def score(domain):
    label = domain.split('.')[0]
    s = 0
    ent = entropy(label)
    if ent > 3.5: s += 2
    if ent > 4.0: s += 2
    if 8 <= len(label) <= 20: s += 1
    if consonant_ratio(label) > 0.65: s += 2
    common = ['the','and','for','ing','ion','com','net','www','mail','smtp']
    if not any(w in label.lower() for w in common): s += 1
    dr = sum(1 for c in label if c.isdigit())/len(label) if label else 0
    if 0.1 < dr < 0.5: s += 1
    return s, ent

print(f"{'Domain':<35} {'Score':>6} {'Entropy':>8} {'Verdict':>15}")
print("-" * 68)
with open(sys.argv[1] if len(sys.argv)>1 else 'dns_queries.txt') as f:
    for line in sorted(set(f.read().splitlines())):
        if not line.strip(): continue
        s, ent = score(line.strip())
        verdict = "DGA CANDIDATE" if s >= 5 else "likely benign"
        print(f"{line.strip():<35} {s:>6} {ent:>8.2f} {verdict:>15}")
EOF
python3 ~/labs/lab15/scripts/dga_detector.py ~/labs/lab15/dns_queries.txt
```

Which domains score as DGA candidates? Which ones are false positives (benign but score high)? What does this tell you about tuning a DGA detector?

---

## Part 4 — IOC Extraction Pipeline

**Task 4.1** — Run the full IOC extraction against the beacon capture:

```bash
cat > ~/labs/lab15/scripts/extract_iocs.sh << 'EOF'
#!/bin/bash
PCAP="$1"
OUT="$2"
mkdir -p "$OUT"

echo "[*] Extracting IOCs from $PCAP"

tshark -r "$PCAP" -T fields -e ip.dst 2>/dev/null | \
  sort -u | grep -v "^$\|127\.\|::1\|0\.0\.0" > "$OUT/dst_ips.txt"

tshark -r "$PCAP" -Y "dns.flags.response==0" \
  -T fields -e dns.qry.name 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT/dns_queries.txt"

tshark -r "$PCAP" -Y "http.user_agent" \
  -T fields -e http.user_agent 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT/user_agents.txt"

tshark -r "$PCAP" -Y "http.request.uri" \
  -T fields -e ip.dst -e http.request.uri 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT/http_uris.txt"

tshark -r "$PCAP" -q -z conv,tcp 2>/dev/null > "$OUT/tcp_convs.txt"

echo "[+] Destination IPs:  $(wc -l < "$OUT/dst_ips.txt")"
echo "[+] DNS queries:      $(wc -l < "$OUT/dns_queries.txt")"
echo "[+] User-Agents:      $(wc -l < "$OUT/user_agents.txt")"
echo "[+] HTTP URIs:        $(wc -l < "$OUT/http_uris.txt")"
echo ""
echo "=== Destination IPs ==="
cat "$OUT/dst_ips.txt"
echo "=== User-Agents ==="
cat "$OUT/user_agents.txt"
EOF
chmod +x ~/labs/lab15/scripts/extract_iocs.sh
bash ~/labs/lab15/scripts/extract_iocs.sh \
  captures/beacon_capture.pcap iocs/
```

**Task 4.2** — Document findings in IOC table format:

```bash
cat > ~/labs/lab15/iocs/network_iocs.md << 'EOF'
# Network IOCs — Lab 15

| Type | Value | Confidence | Source |
|---|---|---|---|
| IPv4 | [destination IP from PCAP] | High | PCAP - dst_ips.txt |
| Port | [port from PCAP] | High | PCAP - tcp_convs.txt |
| Beacon interval | [X seconds] | Medium | beacon_detector.py |
| User-Agent | [decoded UA string] | High | PCAP + XOR decode |
| Jitter | [X%] | Medium | beacon_detector.py |
EOF
# Fill in the table using your findings from Parts 1 and 2
cat ~/labs/lab15/iocs/network_iocs.md
```

---

## Part 5 — Flag Extraction

The flag is embedded in the decoded User-Agent string from the beacon traffic. The toy_network sample encodes its User-Agent with XOR key 0x55.

```bash
# Decode the captured payload
tshark -r captures/beacon_capture.pcap \
  -Y "tcp.port==4444 and data" \
  -T fields -e data | head -1 | \
  python3 -c "
import sys
data = sys.stdin.read().strip()
if data:
    raw = bytes.fromhex(data)
    key = 0x55
    decoded = bytes(b^key for b in raw).decode('utf-8', errors='replace')
    print('Decoded:', decoded)
    if 'ToyBeacon' in decoded:
        print('')
        print('FLAG: FLAG{network_beacon_5s_interval_xor_ua_tshark_extracted}')
"
```

> **Flag:** `FLAG{network_beacon_5s_interval_xor_ua_tshark_extracted}`

---

## Completion Checklist

- [ ] PCAP captured with at least 3 beacon connections
- [ ] tshark conversation stats show destination IP and port
- [ ] beacon_detector.py identified the beacon and interval
- [ ] TCP stream followed — exchange content documented
- [ ] DGA scorer run — at least 3 candidates identified
- [ ] Full IOC extraction pipeline run
- [ ] IOC table populated with all four IOC types
- [ ] Flag extracted via XOR decode of payload
