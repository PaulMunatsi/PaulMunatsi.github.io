# Module 11 — Threat Actor Profiling & African-Targeted Campaigns

**Prerequisites:** Modules 01–09 (all technical modules)  
**Estimated time:** 3–4 hours  
**Tools:** MITRE ATT&CK Navigator, MISP, OpenCTI (optional), browser  
**Note:** This module is intelligence-focused, not tool-focused

---

## Overview

Technical malware analysis answers "what does this do." Threat actor profiling answers "who did this, why, and what will they do next." Both questions matter — but defenders protecting journalists, lawyers and civil society organisations need the second answer more urgently than most.

This module covers how to profile threat actors using the ATT&CK framework, how documented campaigns targeting African civil society work technically, and how to use that intelligence to prioritise defences.

---

## 11.1 What Is a Threat Actor Profile

A threat actor profile is a structured summary of everything known about an adversary: their likely identity or affiliation, their motivations, their targets, their preferred techniques, their tools, and their infrastructure patterns.

The profile is not built in a single analysis session. It accumulates over multiple campaigns, cross-referenced with other analysts' findings, vendor reports and government advisories. Your contribution as a malware analyst is the technical layer — the TTPs (Tactics, Techniques and Procedures) extracted from the samples you analyse.

### The Diamond Model

The Diamond Model frames every intrusion as four linked elements:

```
         Adversary
        /          \
   Capability ——— Infrastructure
        \          /
          Victim
```

- **Adversary** — who (nation-state, criminal group, insider, hacktivist)
- **Capability** — what tools and techniques they use
- **Infrastructure** — the servers, domains, IPs, certificates they operate
- **Victim** — who they target and why

Changing any one element changes the others. When infrastructure is burned (domains blocked, IPs sinkholed), the adversary must rebuild. When a new capability is discovered, it may link previously unattributed campaigns to a known actor.

---

## 11.2 ATT&CK Groups — Structured Actor Intelligence

MITRE ATT&CK maintains profiles of over 130 documented threat actor groups at `attack.mitre.org/groups/`. Each profile lists:
- Known aliases (different vendors name the same group differently)
- Documented campaigns
- Associated software/malware families
- Techniques with references to original research

### Using ATT&CK Navigator for Threat Modelling

ATT&CK Navigator is a web tool that visualises technique coverage:

```
https://mitre-attack.github.io/attack-navigator/
```

Workflow:
1. Open Navigator
2. Click "New Layer" → "Enterprise ATT&CK"
3. Search for a threat actor group (e.g. G0040 — Patchwork, G0064 — APT33)
4. Select "View techniques used by this group"
5. The heatmap shows which techniques the actor uses
6. Compare against your detection coverage to find gaps

---

## 11.3 Documented Campaigns Against African Civil Society

### Dark Caracal (G0070)

**Attribution:** Strong technical evidence links infrastructure to Lebanese General Security (GDGS) headquarters in Beirut. Attribution published by EFF and Lookout (2018).

**Targets:** Journalists, lawyers, military, activists across 21 countries. Documented victims in Lebanon, India, France, USA, Germany, Brazil — and significant targeting across Africa and the Middle East.

**Primary capability:** Pallas Android RAT and CrossRAT (cross-platform desktop malware targeting Linux, Mac, Windows).

**Delivery:** Fake "secure messaging" apps distributed via WhatsApp and Facebook. Watering hole attacks on websites frequented by Lebanese diaspora and activist communities.

**Technical fingerprints:**
- Android apps requesting accessibility + SMS + location + microphone
- C2 domains using HTTPS, rotating periodically
- CrossRAT written in Java (detectable by class names in JAR analysis)
- Distinctive certificate reuse across infrastructure

**ATT&CK techniques (selected):**

| Technique ID | Name | Evidence |
|---|---|---|
| T1444 | Masquerade as Legitimate Application | Fake "WhatsApp", "Signal" APKs |
| T1417 | Input Capture | Accessibility service keylogging |
| T1412 | Capture SMS Messages | SMS interception for 2FA |
| T1430 | Location Tracking | Continuous GPS polling |
| T1437 | Standard Application Layer Protocol | HTTPS C2 |
| T1521.002 | Encrypted Channel: Asymmetric Cryptography | TLS-wrapped C2 |

**Defender relevance:** The delivery mechanism — fake privacy/security apps — is directly aimed at the HRD community. Anyone in your network who uses Signal or WhatsApp (everyone) is a potential target. The technical IOCs are well-documented and available via Amnesty International's GitHub.

---

### Operation Spy Cloud / Predator (Intellexa Alliance)

**Attribution:** Predator is commercial spyware sold by the Intellexa Alliance, a consortium of European companies. Documented customers include Egypt, Madagascar, Kazakhstan, Sudan and others. Unlike Pegasus (NSO Group), Predator does not require zero-click exploitation in most documented deployments — it typically uses one-click delivery via SMS or WhatsApp.

**Technical capability:** Similar to Pegasus — full device takeover, call/SMS interception, microphone/camera access, message exfiltration from encrypted apps.

**2023 Campaigns documented by Amnesty International Tech:**
- Egypt: targeting of presidential candidate Ahmed Tantawi's team
- Madagascar: targeting of journalists
- Multiple African governments as operators

**Technical fingerprints:**
- Uses "ALIEN" loader component on Android
- Infrastructure pattern: short-lived domains, frequently rotated
- Disguised as news articles or official government notices
- One-click delivery URLs sent via SMS/WhatsApp

**ATT&CK techniques:**

| Technique ID | Name |
|---|---|
| T1660 | Phishing (Mobile) |
| T1458 | Replication Through Removable Media (some variants) |
| T1636.004 | Protected User Data: SMS Messages |
| T1429 | Capture Audio |
| T1513 | Screen Capture |

---

### Charming Kitten / APT35 — African-Targeted Operations

**Attribution:** Iranian Ministry of Intelligence and Security (MOIS), with high confidence. Multiple US government indictments.

**Africa relevance:** Documented targeting of African journalists covering Iran, Persian Gulf politics, and opposition movements. Also targets international NGOs and human rights organisations operating in the Middle East and North Africa.

**Technical approach:** Predominantly phishing-based credential theft, with follow-on malware deployment. Uses:
- Fake interview requests from BBC Persian, Deutsche Welle, etc.
- Credential harvesting pages mimicking Google, Microsoft, ProtonMail
- CharmPower PowerShell backdoor on Windows
- Android malware disguised as VPN apps

**Defender relevance for Southern Africa:** Organisations in Zimbabwe and South Africa that have relationships with international media, Iranian diaspora communities, or work on MENA human rights issues may be in scope.

---

### Lazarus Group (G0032) — Ransomware and Financial Crime

**Attribution:** North Korean Reconnaissance General Bureau (RGB). Among the most technically sophisticated nation-state actors.

**Africa relevance:** Lazarus has targeted African financial institutions, cryptocurrency exchanges, and defence contractors. The WannaCry ransomware (attributed to Lazarus) severely impacted healthcare systems globally including in Africa.

**Technical signature:** Distinctive coding style, infrastructure reuse, and a consistent pattern of using legitimate tools (PsExec, WMI) for lateral movement before deploying ransomware or wipers.

**Relevance to this course:** Lazarus techniques appear throughout the technical modules — process injection, fileless malware, encrypted C2 — studying their playbook reinforces the technical content.

---

## 11.4 Building a Threat Intelligence Profile

When you complete a malware analysis, you contribute to the collective profile of the actor who deployed it. Here is the structured process:

### Step 1 — Extract TTPs from Your Analysis

Map every observed behaviour to ATT&CK:

```python
#!/usr/bin/env python3
# ttp_extractor.py — Template for TTP extraction during analysis

ttp_template = {
    "sample_sha256": "",
    "analysis_date": "",
    "analyst": "",
    "observed_ttps": [
        {
            "technique_id": "T1027",
            "technique_name": "Obfuscated Files or Information",
            "evidence": "XOR encoding with key 0x41 on 24-byte string array at .rodata offset 0x3010",
            "confidence": "HIGH"
        },
        # Add more as you discover them
    ],
    "infrastructure_iocs": [],
    "file_iocs": [],
    "network_iocs": []
}
```

### Step 2 — Cluster with Known Actors

After extracting TTPs, compare against known actor profiles:

```bash
# Search ATT&CK for groups using specific techniques
# Example: who uses T1027 + T1071.001 + T1055 together?
# This clustering is what analysts call "TTP fingerprinting"

# Tool: MITRE ATT&CK API
pip3 install attackcti --break-system-packages

python3 << 'EOF'
from attackcti import attack_client
client = attack_client()

# Get all groups using a specific technique
technique_id = "T1027"
groups = client.get_groups_using_technique(technique_id)
for group in groups[:10]:
    print(f"{group['name']} ({group.get('aliases', [''])[0]})")
EOF
```

### Step 3 — Infrastructure Analysis

C2 domains and IPs leave fingerprints:

```bash
# Passive DNS lookup (historical DNS records — no active querying)
# Use: https://www.virustotal.com, https://urlscan.io, https://securitytrails.com

# Certificate transparency — find related infrastructure
# curl "https://crt.sh/?q=%.suspicious-domain.com&output=json" | python3 -m json.tool

# WHOIS registration patterns
whois suspicious-domain.com | grep -E "Registrar|Created|Updated|Name Server"

# ASN lookup — who owns the IP
curl -s https://ipinfo.io/203.0.113.1 | python3 -m json.tool
```

Threat actors cluster infrastructure. If you find one C2 domain, WHOIS and cert transparency often reveal a dozen related domains registered the same day, using the same registrar, pointing to the same ASN.

### Step 4 — MISP Event Creation

If your organisation runs MISP, create an event for every significant analysis:

```bash
# Using PyMISP (if MISP is available)
pip3 install pymisp --break-system-packages

python3 << 'EOF'
from pymisp import PyMISP, MISPEvent, MISPAttribute

# Connect to your MISP instance
misp = PyMISP("https://your-misp.local", "YOUR_API_KEY", False)

event = MISPEvent()
event.info = "Suspicious Android APK — potential stalkerware"
event.distribution = 1  # Community
event.threat_level_id = 2  # Medium
event.analysis = 1  # Ongoing

# Add IOCs
event.add_attribute("sha256", "abc123...")
event.add_attribute("domain", "c2.suspicious.com")
event.add_attribute("ip-dst", "192.0.2.1")
event.add_attribute("url", "https://c2.suspicious.com/beacon")

misp.add_event(event)
print("Event created")
EOF
```

---

## 11.5 Threat Modelling for HRD Organisations

Using ATT&CK to build a threat model for a specific organisation:

### Identify Relevant Threat Actors

For a human rights organisation in Southern Africa, relevant actors include:
- State-sponsored actors aligned with targeted governments
- Commercial spyware vendors (Intellexa, NSO Group, Hacking Team successors)
- Criminal actors opportunistically targeting NGO finances

### Map Actor TTPs to Your Environment

```
Actor: Dark Caracal / Similar operators
Relevant techniques:
  Delivery:    T1444 (Fake apps via WhatsApp) → Mitigate: MDM, app vetting
  Persistence: T1402 (Broadcast receivers) → Detect: MVT scan
  Exfil:       T1437 (HTTPS C2) → Detect: DNS filtering, cert pinning
  Collection:  T1417 (Keylogging) → Mitigate: Accessibility service audits
```

### Priority Defences by Actor

| Actor Type | Highest Priority Defence |
|---|---|
| State spyware (Pegasus/Predator) | Regular MVT scans, no-click update policy |
| Dark Caracal-style RATs | App vetting, no sideloading policy |
| Phishing (Charming Kitten) | Hardware 2FA (YubiKey), phishing-resistant MFA |
| Ransomware (Lazarus) | Offline backups, network segmentation |

---

## 11.6 Challenge

**The Unnamed Campaign**

You receive a YARA rule and three IOCs from a colleague who analysed a sample targeting an East African news organisation:

```yara
rule UnnamedCampaign_C2 {
    strings:
        $ua = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)" ascii
        $c2 = { 50 4F 53 54 20 2F 75 70 64 61 74 65 }  // "POST /update"
        $xor_key = { 90 1F 3A 22 }
    condition:
        all of them
}
```

IOCs:
- Domain: `updates.cdn-delivery-network.com`
- IP: `185.220.x.x` (Tor exit node range)
- User-Agent: `Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)`

Using only open-source intelligence (ATT&CK, VirusTotal, urlscan.io):

1. What does the User-Agent string suggest about the actor's targeting or TTPs?
2. What does Tor exit node C2 infrastructure indicate about operational security posture?
3. Search ATT&CK Groups for actors known to use IE6 user-agent spoofing — who appears?
4. Write a threat actor hypothesis: who might this be and why?
5. What three additional IOCs would you want to confirm or refute your hypothesis?

**Flag:** `FLAG{threat_intel_dark_caracal_pallas_android_rat_tlp_green}`

---

## Knowledge Check

1. **A sample uses T1027 (XOR obfuscation), T1071.001 (HTTP C2) and T1053.003 (cron persistence). Three different threat actors use all three techniques. How do you narrow attribution?**

   <details>
   <summary>Answer</summary>
   Individual techniques are rarely unique — attribution requires clusters and context. Look beyond the technique IDs to the implementation specifics: the exact XOR key and encoded string format, the C2 domain registration pattern (registrar, ASN, certificate issuer), the cron entry format and timing, the target profile (who is being attacked and why), and delivery method. Two actors using "XOR + HTTP C2 + cron" will use different XOR key lengths, different User-Agent strings, different domain infrastructure, different victims. The combination of implementation details + infrastructure + victim set is what fingerprints an actor, not the ATT&CK technique IDs alone.
   </details>

2. **You are briefing a non-technical programme director at an HRD organisation about Dark Caracal. What are the three most important things to tell her?**

   <details>
   <summary>Answer</summary>
   (1) The threat is delivered through trust — fake Signal or WhatsApp apps, or malicious links that look like legitimate documents. Her staff install it willingly. Technical security means nothing if someone clicks a convincing link. (2) It is comprehensive surveillance — not just reading messages, but microphone, GPS, camera, and call recording. If installed, assume the attacker knows everything on and said near the device. (3) The defence is simple policies: only install apps from official stores, never click links to APKs sent via messaging apps, run MVT scans periodically. The technical complexity is on the attacker's side — the defender's most effective control is social and procedural.
   </details>

3. **What is the Diamond Model and why is it more useful than just listing IOCs?**

   <details>
   <summary>Answer</summary>
   The Diamond Model frames every intrusion across four linked elements: Adversary, Capability, Infrastructure, and Victim. It is more useful than an IOC list because it captures relationships. An IOC list tells you "block this IP." The Diamond Model tells you: this IP is infrastructure used by this adversary with this capability targeting this victim profile. When the IP is burned, the adversary rebuilds infrastructure — the new IP is unknown, but the adversary, capability and victim relationships persist. This lets you anticipate what the new infrastructure will look like (same registrar, same ASN, same certificate template) and hunt for it before a new IOC is published.
   </details>
