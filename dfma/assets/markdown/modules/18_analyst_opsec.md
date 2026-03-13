# Module 18 — Analyst OPSEC

**Prerequisites:** Module 00 (Ethics & Legal)  
**Estimated time:** 1–2 hours  
**Tools:** Browser, VPN, VM  
**Difficulty:** Foundational — read this before investigating anything live

---

## Overview

This module has no lab. It is entirely conceptual and procedural.

Most malware analysis courses treat OPSEC as optional. For analysts working with samples that target human rights defenders, journalists and civil society in contexts like Zimbabwe, South Africa or DRC, it is not optional. It is professional and ethical obligation.

When you look up a C2 domain, the actor sees it. When you submit a sample to VirusTotal, the actor may download your submission. When you curl a C2 URL to see what it serves, your IP is logged. Some actors configure their infrastructure to serve different (or no) payloads to analysts — or to alert when analyst IPs contact them.

You are not anonymous by default.

---

## 18.1 What You Reveal When You Analyse

### Looking Up IOCs

Every IOC lookup leaks information:

| Action | What the attacker may learn |
|---|---|
| VirusTotal hash lookup | Sample is being analysed (if they watch VT) |
| VirusTotal URL/domain scan | Your IP contacts their infrastructure via VT |
| Direct HTTP GET to C2 URL | Your IP, User-Agent, timestamp |
| Reverse DNS of C2 IP | Your resolver IP |
| WHOIS lookup | Your IP via query logs |
| Shodan search for C2 IP | Shodan caches it — no direct leak |
| crt.sh certificate search | No leak — passive |
| nslookup/dig against their domain | Your resolver's IP in their DNS logs |

**The golden rule:** Passive lookups (Shodan, crt.sh, cached VirusTotal reports) reveal nothing. Active queries (direct HTTP, DNS resolution of live domains) reveal your source IP.

### VirusTotal Specifically

VT is both useful and a counterintelligence risk:

- Submitting a sample publicly: **the actor can download your submission** if they monitor VT for their samples
- Looking up a private sample via hash: **reveals you have the sample** if VT notifies submitters of subsequent lookups
- Scanning a URL: **VT visits that URL from its own IPs** but your account is associated with the query

Best practice:
- Use hash lookups against VirusTotal, not sample submissions, when operational sensitivity is high
- Use private VT submissions (requires premium) if you must submit
- Know that a "0 detections" result on a brand-new sample means nothing — the sample may be purpose-built and submitted by the actor themselves to check detection rates

---

## 18.2 The Analysis Environment and Network Isolation

### Layered Isolation Model

```
Your physical machine
  └── Analysis VPN (routes all VM traffic through a non-attributable exit)
        └── Analysis VM (isolated, snapshots, no personal accounts)
              └── Nested sandbox (for dangerous dynamic analysis)
```

The VPN layer is the minimum addition when doing active investigation of samples that may be attributable to specific actors or campaigns. Without it, C2 connections from your dynamic analysis reveal:
- Your ISP's IP (traceable to your country, city, and with a legal order: your identity)
- Your organisation's IP if you're working from an office network

**Critical:** Do not use a commercial VPN you subscribe to with personal payment. Operators of surveillance malware know the IP ranges of popular commercial VPNs. For sensitive analysis:
- Use a cloud VM (VPS from a provider in a neutral country) as your exit point
- Route analysis VM traffic through it via WireGuard or OpenVPN
- Use a VPS paid for in a way that does not link to your identity or organisation

### VM Fingerprinting

Some malware checks if it is running in a VM and behaves differently (or does nothing). For analysis purposes this is usually managed — let the sandbox detect VM and study its evasion. But be aware that:

- VM hostname, username, and installed software can fingerprint your analysis environment
- Some actors collect analyst fingerprints and whitelist them — if your VM is known to them, they serve a clean payload
- Basic countermeasures: rename your VM to something generic (`desktop-abc123`), use a common username (`user`, `john`)

---

## 18.3 IOC Lookups — Safe vs Unsafe

### Safe (Passive)

These do not contact attacker infrastructure and do not reveal you have the sample:

```bash
# Hash lookup against VirusTotal (no submission — hash only)
curl -s "https://www.virustotal.com/api/v3/files/SHA256_HASH" \
  -H "x-apikey: YOUR_VT_KEY" | python3 -m json.tool | \
  grep -E "last_analysis_stats|meaningful_name" | head -5

# Shodan — cached, no active probe
# https://www.shodan.io/host/IP_ADDRESS

# Certificate transparency — completely passive
# https://crt.sh/?q=domain.com

# URLScan.io historical results — request a new scan only if acceptable
# https://urlscan.io/search/#domain:attacker-domain.com

# GreyNoise — context on IP (is it a scanner? a known bad actor?)
# https://viz.greynoise.io/ip/IP_ADDRESS
```

### Unsafe Without VPN (Active)

These contact live infrastructure or reveal your query:

```bash
# Direct HTTP to C2 — DO NOT do this without VPN
curl http://c2.attacker.com/config

# DNS resolution of live C2 domain — your resolver IP logged
nslookup c2.attacker.com

# VirusTotal URL scan — VT visits the URL, reveals your account queried it
# virustotal.com/gui/url (submit URL for analysis)

# SSL certificate grab — your IP contacts the server
openssl s_client -connect c2.attacker.com:443 </dev/null
```

When you must do active lookups, route through your analysis VPN exit or use an online tool that does it for you (URLScan, VirusTotal URL scanner — your IP is hidden but VT's IPs are known to actors).

---

## 18.4 Sample Handling for Sensitive Cases

When you receive a sample that may have targeted a specific individual (a journalist, an activist), additional handling protocols apply:

**Do not share the sample without consent.** The sample may contain personal data from the victim's device — documents, photos, credentials — that the attacker exfiltrated. Sharing it publicly or even with other analysts without the victim's knowledge may re-expose that data.

**Anonymise before sharing.** If sharing IOCs or detection signatures derived from the sample, ensure the indicators do not reveal the victim's identity, organisation, or location. A hash and a YARA rule share analysis value without exposing personal information.

**TLP protocol applies strictly.** Label your reports:
- `TLP:RED` — for initial incident reports shared only with the directly involved parties
- `TLP:AMBER` — for sharing within your organisation and named partner organisations
- `TLP:GREEN` — for IOCs you are confident can be shared with the broader defender community without identifying the victim
- `TLP:CLEAR` — only when fully de-identified and victim has given explicit consent to public disclosure

**Inform the victim.** If your analysis confirms their device was compromised, they need to know immediately and specifically — what was accessed, for how long, what capability the attacker had. Vague "your device may have been compromised" is not sufficient. The victim needs to make informed decisions about their safety and the safety of their sources.

---

## 18.5 OPSEC Failures — Real Analyst Mistakes

These have actually happened to analysts in the security community:

**Mistake 1:** Analyst submits a sample to VirusTotal. The actor monitors VT submissions. The actor now knows the victim reported the incident and which organisation is handling the analysis. They change infrastructure before the investigation is complete.

**Mitigation:** Use hash-only lookups. If you must submit, use private submission and share the report only with named parties.

**Mistake 2:** Analyst resolves C2 domains from their office IP while doing dynamic analysis. The actor's server logs show a known security organisation's IP range querying the C2. The actor infers the victim has reached out to that organisation and may have been given a heads-up to specific targets.

**Mitigation:** All active analysis routes through an isolated exit IP not associated with your organisation.

**Mistake 3:** Analyst publishes a blog post with full IOCs including the victim's email address that appeared in a phishing lure. The victim's identity is now publicly linked to the incident.

**Mitigation:** Redact all personally identifying information before any public disclosure. Check your IOCs for email addresses, phone numbers, device names, usernames.

**Mistake 4:** Analyst uses their personal Twitter/X account to ask about a C2 domain. The tweet is public. The actor sees it within hours.

**Mitigation:** Keep investigation activity off personal social media. Use dedicated, pseudonymous research accounts if you need to ask publicly, but assume actors monitor searches for their infrastructure.

---

## 18.6 Quick Checklist for Every Investigation

Before starting:
- [ ] Is this sample operationally sensitive? (Targeted at specific individual/organisation)
- [ ] Are you working on a network you control and trust?
- [ ] Is your analysis VM isolated from your personal machine and accounts?
- [ ] Do you have an exit IP that is not attributable to you or your organisation?

During analysis:
- [ ] All hash lookups only — no sample submissions to public services without consent
- [ ] No direct curl/wget to live C2 URLs without VPN routing
- [ ] No DNS resolution of live actor domains from your real IP
- [ ] Document everything — timestamps, tool versions, hashes, what you did and when

When reporting:
- [ ] Correct TLP label applied before sharing
- [ ] All personally identifying information redacted from IOC lists
- [ ] Victim has been informed before public disclosure
- [ ] Sample not redistributed without explicit permission

---

## 18.7 Recommended Tools

| Tool | Purpose | Notes |
|---|---|---|
| Shodan.io | Passive IP/domain intelligence | No active probe — safe |
| crt.sh | Certificate transparency search | Fully passive |
| GreyNoise | IP context (scanner/actor lists) | Passive |
| URLScan.io | Historical URL data; can request new scan | New scan = active |
| MXToolbox | DNS history, blacklist checks | Can be passive |
| CIRCL.lu hash lookup | Malware hash database | Hash-only, passive |
| AnyRun (sandbox) | Dynamic analysis from their infrastructure | Your IP not involved |
| Any.run, Hybrid Analysis | Cloud sandboxes | Not your IP |
| WireGuard | VPN to analysis exit node | Set up once, use always |

---

## Knowledge Check

1. **You receive a suspicious .docx from a journalist. Before analysing, she asks "can I just send it to VirusTotal to see if it's dangerous?" What do you tell her?**

   <details>
   <summary>Answer</summary>
   Advise against submitting to VirusTotal directly for two reasons: (1) VT is public — the sample becomes downloadable by anyone, including the actor who sent it. If the document contains any of her data (drafts, contact names, metadata), that data is now public. (2) The attacker may monitor VT for their samples — a submission confirms the target has the file and is investigating, which could cause them to change infrastructure or escalate. Better options: send the SHA256 hash to VirusTotal (not the file), or send the file to you so you can analyse it in an isolated environment and report findings without exposing the file publicly.
   </details>

2. **During dynamic analysis, your strace output shows the sample connecting to `185.220.101.47:4444`. You want to know what the server returns. What is the correct procedure?**

   <details>
   <summary>Answer</summary>
   Do not curl the IP directly from your analysis machine or organisation network — your IP is logged by the attacker's server. Options in order of preference: (1) Check if the IP already appears in Shodan or GreyNoise — passive, reveals nothing. (2) Check URLScan.io historical data for that IP — passive. (3) Use a cloud sandbox (Any.run, Hybrid Analysis) that runs the sample itself against the live C2 — their infrastructure contacts the server, not yours. (4) If you must make an active connection, route through a VPS exit node that is not associated with your organisation or identity. Note: 185.220.101.x is a well-known Tor exit node range, so the server behind it is intentionally anonymised anyway.
   </details>

3. **A colleague argues "the attacker already knows they compromised the device — what does it matter if we reveal we're investigating?" Refute this.**

   <details>
   <summary>Answer</summary>
   Two distinct things the attacker does not necessarily know: (1) That the victim noticed and reported it. Many implants run silently for months. Revealing that an investigation is underway tells the actor the victim is aware — they may escalate, pivot to other targets in the victim's contact network, or begin covering tracks by wiping logs and infrastructure. (2) Which organisation is handling the investigation. If they know it is DSA or Citizen Lab or Access Now, they know the likely investigation methods, timelines and disclosure practices. This intelligence changes their response. OPSEC during investigation is about protecting the investigation itself, not about hiding from someone who knows about the compromise.
   </details>
