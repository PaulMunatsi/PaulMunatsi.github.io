# Module 15 — Network Forensics & Traffic Analysis

**Prerequisites:** Module 03 (Dynamic Analysis), Module 07 (Reporting & IOCs)  
**Estimated time:** 4–5 hours  
**Tools:** tshark, Wireshark, tcpdump, scapy, python3  
**Difficulty:** Intermediate–Advanced

---

## Overview

Module 03 introduced tcpdump to confirm a beacon was happening. This module goes further — analysing the full content of network traffic, reconstructing data transferred between malware and its C2, detecting covert channels that hide inside legitimate protocols, and identifying domain generation algorithms before they establish contact.

Network evidence is often the most reliable artefact in an investigation. Files can be deleted. Logs can be cleared. Memory evaporates at shutdown. But if your network was monitored, a PCAP is a timestamped record of everything that crossed the wire — and no amount of anti-forensics erases what was already captured upstream.

---

## 15.1 tshark — Wireshark from the Command Line

Wireshark's GUI is useful for exploration. tshark is what you use when you have a 2GB PCAP and need answers fast, when you're working over SSH, or when you need to pipe output to other tools.

### Essential tshark Syntax

```bash
# Basic read
tshark -r capture.pcap

# Apply display filter (same syntax as Wireshark)
tshark -r capture.pcap -Y "tcp.port == 4444"

# Extract specific fields
tshark -r capture.pcap -T fields \
  -e frame.time \
  -e ip.src \
  -e ip.dst \
  -e tcp.dstport \
  -e http.user_agent \
  -Y "http"

# Count packets per protocol
tshark -r capture.pcap -q -z io,phs

# Conversation statistics (who talked to whom, how much)
tshark -r capture.pcap -q -z conv,tcp

# DNS queries only
tshark -r capture.pcap -Y "dns" -T fields \
  -e frame.time -e ip.src -e dns.qry.name -e dns.resp.addr

# Follow a TCP stream and dump as ASCII
tshark -r capture.pcap -q -z follow,tcp,ascii,0
```

### Building a Practice PCAP

```bash
# Generate a PCAP of toy_network beacon traffic for analysis
sudo tcpdump -i lo -w ~/labs/lab15/toy_beacon.pcap port 4444 &
TCPDUMP_PID=$!

# Run beacon (3 connections, 5s apart)
timeout 18 ~/course/samples/benign_toy_app/toy_network_linux &
sleep 18

kill $TCPDUMP_PID 2>/dev/null
echo "[+] PCAP saved: ~/labs/lab15/toy_beacon.pcap"
tshark -r ~/labs/lab15/toy_beacon.pcap -q -z io,phs
```

---

## 15.2 C2 Traffic Identification

### Beacon Identification by Timing

Real C2 beacons have a defining characteristic: regularity. Human-generated traffic is bursty and irregular. Malware beacons on a timer — every N seconds with small jitter.

```python
#!/usr/bin/env python3
# beacon_detector.py — Detect periodic connections in a PCAP
# Uses tshark (no external Python dependencies)
# Requires: sudo apt install tshark

import subprocess, statistics, sys
from collections import defaultdict

def detect_beacons(pcap_path, min_packets=3, max_jitter_pct=25):
    """Find connections that occur with suspicious regularity."""
    cmd = [
        'tshark', '-r', pcap_path,
        '-Y', 'tcp.flags.syn==1 and tcp.flags.ack==0',
        '-T', 'fields',
        '-e', 'frame.time_epoch',
        '-e', 'ip.dst',
        '-e', 'tcp.dstport',
        '-E', 'separator=|'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    connections = defaultdict(list)
    for line in result.stdout.splitlines():
        parts = line.strip().split('|')
        if len(parts) == 3:
            ts, ip, port = parts
            try:
                connections[f"{ip}:{port}"].append(float(ts))
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
    detect_beacons(sys.argv[1] if len(sys.argv) > 1 else "capture.pcap")
```

Run against the toy beacon PCAP:
```bash
python3 beacon_detector.py ~/labs/lab15/toy_beacon.pcap
```

Expected output: `127.0.0.1:4444` flagged as BEACON with ~5s average interval and <5% jitter.

### Extracting the Payload

```bash
# Follow TCP stream 0 — see the raw exchange
tshark -r ~/labs/lab15/toy_beacon.pcap -q -z follow,tcp,ascii,0

# Extract payload bytes from stream
tshark -r ~/labs/lab15/toy_beacon.pcap \
  -Y "tcp.port==4444 and data" \
  -T fields -e data | head -5

# Decode hex to ascii
tshark -r ~/labs/lab15/toy_beacon.pcap \
  -Y "tcp.port==4444 and data" \
  -T fields -e data | \
  python3 -c "
import sys
for line in sys.stdin:
    line = line.strip()
    if line:
        try:
            decoded = bytes.fromhex(line)
            print(repr(decoded))
        except:
            print(line)
"
```

The XOR-encoded User-Agent from `toy_network` appears in the payload as non-printable bytes. You can confirm it with the key from Module 06:

```python
python3 -c "
key = 0x55
enc = bytes.fromhex('013a2c1730343 63a3b7a647b6575 7d1031203634213c3a3b34397c'.replace(' ',''))
print('Decoded:', bytes(b^key for b in enc).decode('utf-8', errors='replace'))
"
```

---

## 15.3 Protocol Dissection — Going Deeper Than Defaults

### HTTP Traffic Analysis

```bash
# All HTTP requests with method, URI and User-Agent
tshark -r capture.pcap -Y "http.request" \
  -T fields \
  -e ip.src -e ip.dst \
  -e http.request.method \
  -e http.request.uri \
  -e http.user_agent \
  -E separator="|"

# HTTP responses — status codes
tshark -r capture.pcap -Y "http.response" \
  -T fields \
  -e ip.src -e http.response.code -e http.content_type \
  -E separator="|"

# Extract files transferred over HTTP
tshark -r capture.pcap --export-objects http,/tmp/extracted_http/
ls -la /tmp/extracted_http/
file /tmp/extracted_http/*
sha256sum /tmp/extracted_http/*
```

### DNS Analysis — Finding DGA Domains

Domain Generation Algorithms (DGAs) produce hundreds of random-looking domains daily. Malware queries them all and only one (the live C2) responds. Defenders see massive DNS query volume for nonexistent domains.

```python
#!/usr/bin/env python3
# dga_detector.py — Identify DGA-like domains in DNS traffic

import re
import math
from collections import Counter

def entropy(s):
    """Shannon entropy of a string."""
    if not s:
        return 0
    p = [s.count(c) / len(s) for c in set(s)]
    return -sum(x * math.log2(x) for x in p)

def consonant_ratio(s):
    """High consonant ratio = more random-looking."""
    consonants = set('bcdfghjklmnpqrstvwxyz')
    letters = [c for c in s.lower() if c.isalpha()]
    if not letters:
        return 0
    return sum(1 for c in letters if c in consonants) / len(letters)

def score_domain(domain):
    """Higher score = more DGA-like."""
    label = domain.split('.')[0]  # First label only
    score = 0

    # Entropy (random strings have high entropy)
    ent = entropy(label)
    if ent > 3.5:
        score += 2
    if ent > 4.0:
        score += 2

    # Length (DGA domains often 8-20 chars)
    if 8 <= len(label) <= 20:
        score += 1

    # High consonant ratio
    if consonant_ratio(label) > 0.65:
        score += 2

    # No dictionary words (simple check: no common 3-letter combixes)
    common = ['the','and','for','ing','ion','ent','tion','com','net','www']
    if not any(w in label.lower() for w in common):
        score += 1

    # Lots of digits mixed in
    digit_ratio = sum(1 for c in label if c.isdigit()) / len(label) if label else 0
    if 0.1 < digit_ratio < 0.4:
        score += 1

    return score, ent

# Example usage against tshark DNS output
# tshark -r capture.pcap -Y dns -T fields -e dns.qry.name > dns_queries.txt
# python3 dga_detector.py dns_queries.txt

import sys
if len(sys.argv) > 1:
    with open(sys.argv[1]) as f:
        domains = [line.strip() for line in f if line.strip()]
else:
    # Demo with sample domains
    domains = [
        "google.com", "microsoft.com", "update.windows.com",
        "xk3mdf92kqp.com", "a8f3b2c9d4.net", "zyxwvuts.org",
        "jv8k2mxpqr4.info", "news.bbc.co.uk", "k4f9n2x7p.com"
    ]

print(f"{'Domain':<40} {'Score':>6} {'Entropy':>8} {'Verdict':>12}")
print("-" * 70)
for domain in sorted(set(domains)):
    score, ent = score_domain(domain)
    verdict = "DGA CANDIDATE" if score >= 5 else "likely benign"
    print(f"{domain:<40} {score:>6} {ent:>8.2f} {verdict:>12}")
```

---

## 15.4 Covert Channels

Attackers hide C2 traffic inside legitimate protocols to evade detection. The traffic looks normal at layer 7 — the malicious content is encoded inside valid protocol fields.

### DNS Tunnelling

Data is exfiltrated as subdomains of an attacker-controlled domain. Each DNS query for `c2data-chunk1.attacker.com` carries payload. The response carries C2 commands.

**Indicators:**
- Unusually long DNS query names (> 50 characters)
- High query volume to a single domain family
- Random-looking subdomains
- DNS queries to rarely-seen base domains

```bash
# Detect long DNS queries
tshark -r capture.pcap -Y "dns.qry.name" \
  -T fields -e dns.qry.name | \
  awk 'length($0) > 50 {print length($0), $0}' | \
  sort -rn | head -20

# Detect high query volume to same base domain
tshark -r capture.pcap -Y "dns" \
  -T fields -e dns.qry.name | \
  rev | cut -d. -f1-2 | rev | sort | uniq -c | sort -rn | head -20
# Any single domain with 50+ queries is suspicious
```

### ICMP Tunnelling

Data is encoded in the ICMP payload. Standard ping has an 8-byte fixed payload. ICMP tunnels have variable, large, or encrypted payloads.

```bash
# Find ICMP packets with large or unusual payloads
tshark -r capture.pcap -Y "icmp" \
  -T fields -e frame.time -e ip.src -e ip.dst \
  -e icmp.type -e data.len -e data

# ICMP with >100 byte payload is abnormal
tshark -r capture.pcap -Y "icmp and data.len > 100" | head -20
```

### HTTPS with Certificate Anomalies

Most C2 today uses HTTPS. The content is encrypted but the certificate reveals the infrastructure:

```bash
# Extract TLS certificate information
tshark -r capture.pcap -Y "ssl.handshake.type == 11" \
  -T fields \
  -e ip.dst \
  -e x509sat.uTF8String \
  -e x509ce.dNSName \
  -e tls.handshake.certificate

# JA3 fingerprinting — identifies TLS client regardless of SNI
# pip3 install pyshark --break-system-packages
python3 << 'EOF'
# JA3 hashes fingerprint the TLS client library
# Malware often has a unique JA3 hash (even if traffic is encrypted)
# Check your hash against: https://ja3er.com/search

print("JA3 analysis requires a PCAP with TLS handshakes.")
print("Extract with: tshark -r capture.pcap -Y 'tls.handshake.type==1'")
print("  -T fields -e ip.src -e ip.dst -e tls.handshake.ciphersuite")
print("")
print("Then compute JA3 hash manually or with: python3 -m ja3 capture.pcap")
EOF
```

### HTTP Beaconing with Jitter

Real C2 frameworks add random jitter (±20%) to beacon intervals to evade timing-based detection. Your beacon_detector.py uses a 20% jitter threshold for this reason.

```bash
# Show inter-request timing for a specific IP
tshark -r capture.pcap \
  -Y "http.request and ip.dst == 192.0.2.1" \
  -T fields -e frame.time_epoch \
  -E separator="\n" | \
python3 -c "
import sys
times = [float(l.strip()) for l in sys.stdin if l.strip()]
if len(times) > 1:
    intervals = [times[i+1]-times[i] for i in range(len(times)-1)]
    print(f'Requests: {len(times)}')
    print(f'Avg interval: {sum(intervals)/len(intervals):.1f}s')
    print(f'Min: {min(intervals):.1f}s  Max: {max(intervals):.1f}s')
"
```

---

## 15.5 File Extraction from PCAPs

When malware downloads a second-stage payload or exfiltrates files over HTTP/FTP, those files can be carved directly from the PCAP.

```bash
mkdir -p /tmp/pcap_carved

# HTTP file extraction (tshark built-in)
tshark -r capture.pcap --export-objects http,/tmp/pcap_carved/
ls -la /tmp/pcap_carved/

# Identify and hash everything extracted
for f in /tmp/pcap_carved/*; do
    echo "--- $f ---"
    file "$f"
    sha256sum "$f"
done

# SMB file extraction (useful for lateral movement PCAPs)
tshark -r capture.pcap --export-objects smb,/tmp/pcap_carved/

# Manual carving with tcpflow (reassembles TCP streams to files)
sudo apt install -y tcpflow
tcpflow -r capture.pcap -o /tmp/tcpflow_output/
ls /tmp/tcpflow_output/
file /tmp/tcpflow_output/*
```

---

## 15.6 Network IOC Extraction Pipeline

```bash
#!/bin/bash
# network_ioc_extract.sh — Extract all network IOCs from a PCAP in one pass

PCAP="$1"
OUT_DIR="${2:-/tmp/network_iocs}"
mkdir -p "$OUT_DIR"

echo "[*] Extracting network IOCs from: $PCAP"
echo "[*] Output to: $OUT_DIR"

# All destination IPs
tshark -r "$PCAP" -T fields -e ip.dst 2>/dev/null | \
  sort -u | grep -v "^$\|127\.\|::1\|0\.0\.0\.0" \
  > "$OUT_DIR/dst_ips.txt"
echo "[+] IPs: $(wc -l < "$OUT_DIR/dst_ips.txt")"

# All DNS queries
tshark -r "$PCAP" -Y "dns.flags.response == 0" \
  -T fields -e dns.qry.name 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT_DIR/dns_queries.txt"
echo "[+] DNS queries: $(wc -l < "$OUT_DIR/dns_queries.txt")"

# All HTTP User-Agents
tshark -r "$PCAP" -Y "http.user_agent" \
  -T fields -e http.user_agent 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT_DIR/user_agents.txt"
echo "[+] User-Agents: $(wc -l < "$OUT_DIR/user_agents.txt")"

# All HTTP URIs
tshark -r "$PCAP" -Y "http.request.uri" \
  -T fields -e ip.dst -e http.request.uri 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT_DIR/http_uris.txt"
echo "[+] HTTP URIs: $(wc -l < "$OUT_DIR/http_uris.txt")"

# TLS SNI (what domains is the malware connecting to over HTTPS)
tshark -r "$PCAP" -Y "ssl.handshake.extensions_server_name" \
  -T fields -e ssl.handshake.extensions_server_name 2>/dev/null | \
  sort -u | grep -v "^$" > "$OUT_DIR/tls_sni.txt"
echo "[+] TLS SNI: $(wc -l < "$OUT_DIR/tls_sni.txt")"

# Port scan / connection summary
tshark -r "$PCAP" -q -z conv,tcp 2>/dev/null \
  > "$OUT_DIR/tcp_conversations.txt"

echo ""
echo "[*] Key findings:"
echo "--- Destination IPs ---"
cat "$OUT_DIR/dst_ips.txt"
echo "--- DNS queries ---"
head -20 "$OUT_DIR/dns_queries.txt"
echo "--- User-Agents ---"
cat "$OUT_DIR/user_agents.txt"
```

---

## 15.7 ATT&CK Mapping for Network Threats

| Technique | ID | Network indicator |
|---|---|---|
| Application Layer Protocol: Web Protocols | T1071.001 | HTTP/HTTPS C2 traffic |
| Application Layer Protocol: DNS | T1071.004 | DNS tunnelling, DGA queries |
| Protocol Tunnelling | T1572 | C2 inside legitimate protocols |
| Non-Standard Port | T1571 | HTTP on port 4444, SSH on 443 |
| Encrypted Channel | T1573 | TLS-wrapped C2 |
| Data Encoding | T1132 | Base64/XOR in payload |
| Exfiltration Over C2 Channel | T1041 | Data in C2 beacon responses |
| Domain Generation Algorithms | T1568.002 | High-volume NX domain queries |

---

## 15.8 Lab

See [Lab 15 — Network Traffic Analysis](../labs/lab15_network_forensics.md)

---

## 15.9 Challenge

**The Encrypted Beacon**

You have a PCAP from a compromised server. The analyst who captured it says "it's all HTTPS — can't read anything." Your job is to extract everything you can without decrypting the content.

```bash
# Generate a multi-protocol capture
mkdir -p ~/labs/lab15
sudo tcpdump -i lo -w ~/labs/lab15/challenge.pcap port 4444 or port 53 &
TDPID=$!
sleep 2

# Beacon traffic
timeout 18 ~/course/samples/benign_toy_app/toy_network_linux &

# Simulated DNS queries
for domain in google.com microsoft.com update.windows.com \
  xk3mdf92kqp.com a8f3b2c9d4.net jv8k2mxpqr4.info; do
    dig $domain @8.8.8.8 > /dev/null 2>&1 || true
    sleep 0.5
done

wait $TDPID 2>/dev/null || kill $TDPID 2>/dev/null
echo "PCAP ready: ~/labs/lab15/challenge.pcap"
```

Tasks:
1. Run `beacon_detector.py` against the PCAP — what IPs beacon and at what interval?
2. Extract the DNS query list — any DGA candidates?
3. Run `network_ioc_extract.sh` — produce the full IOC set
4. What User-Agent appears in the traffic? Why is it suspicious?
5. Without decrypting: what does the TLS certificate (if any) reveal about the C2?

**Flag:** `FLAG{network_beacon_5s_interval_xor_ua_tshark_extracted}`

---

## Knowledge Check

1. **A PCAP shows connections to `203.0.113.1:443` every 62 seconds with ±8 second variation. A colleague says "HTTPS traffic, can't analyse it." What can you extract without decrypting?**

   <details>
   <summary>Answer</summary>
   Without decrypting: (1) TLS certificate information — the certificate served by 203.0.113.1 reveals the domain, issuer, validity period, and whether it's self-signed. (2) JA3 fingerprint — the TLS client hello parameters uniquely identify the malware's TLS library. (3) Beacon timing — 62 second average with ±8s jitter (12.9%) is consistent with a C2 beacon. (4) Packet size patterns — malware C2 often has characteristic request/response size distributions. (5) TLS SNI — the Server Name Indication field in the client hello reveals the domain the client is connecting to, even in encrypted HTTPS.
   </details>

2. **tshark DNS analysis shows 847 queries in 5 minutes to subdomains of `updates-cdn-secure.net`, all returning NXDOMAIN. What is the likely explanation?**

   <details>
   <summary>Answer</summary>
   This is a Domain Generation Algorithm (DGA) in operation. The malware generates hundreds of random domain names daily and queries them all — only the live C2 domain resolves. NXDOMAIN responses for all of them means the C2 server is not currently active (perhaps taken down or not yet activated). The high query volume to a single base domain, all returning NXDOMAIN, is the characteristic signature. Extract the base domain as an IOC and the queried subdomains to reverse-engineer the DGA algorithm.
   </details>

3. **`beacon_detector.py` flags `127.0.0.1:4444` as a beacon with 5.0s average and 0.2% jitter. Another analyst says "that's just our toy_network sample — not real malware." Is the analysis still valuable?**

   <details>
   <summary>Answer</summary>
   Yes — the analytical technique is validated. The low jitter (0.2%) and precise 5-second interval confirm the detector works correctly on known-good beacon traffic. In a real engagement you would run the same tool against actual network captures. The toy sample teaches you exactly what a beacon signature looks like in a PCAP, so when you see a similar pattern against an unknown IP, you recognise it immediately. The tool's behaviour on known traffic is what gives you confidence in its output on unknown traffic.
   </details>

4. **ICMP packets in a PCAP have 800-byte payloads. Standard ping uses 8 bytes. What does this suggest and how do you investigate?**

   <details>
   <summary>Answer</summary>
   800-byte ICMP payloads are a strong indicator of ICMP tunnelling — data exfiltration or C2 communication hidden inside ICMP echo requests and replies. Investigate by: (1) Extracting the payload bytes with `tshark -Y "icmp" -T fields -e data`; (2) Checking if payload is high-entropy (encrypted/compressed exfiltration) or lower-entropy (structured data); (3) Looking for patterns across multiple ICMP packets that suggest reassembly of a larger data stream; (4) Comparing ICMP volume against baseline — legitimate ICMP is rare on most internal networks.
   </details>

5. **You extract HTTP objects from a PCAP and find a file named `update.exe` that your antivirus marks as clean. What else should you do?**

   <details>
   <summary>Answer</summary>
   AV clean does not mean safe — this is exactly the scenario where static analysis matters. Next steps: (1) Hash the extracted file and check VirusTotal with the hash (different engines may flag it); (2) Run `file update.exe` — confirm it actually is a PE; (3) Run strings, check imports for injection/persistence APIs; (4) Check entropy — clean AV + high entropy = possibly packed and the packer is unknown; (5) Compare the PE compile timestamp against when the download occurred — a future timestamp is a red flag; (6) Detonate in an isolated VM with full monitoring if static analysis is inconclusive.
   </details>
