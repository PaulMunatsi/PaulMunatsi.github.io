# Module 12 — Forensic Disk Imaging & Evidence Acquisition

**Prerequisites:** Module 01 (Foundations), basic Linux command line  
**Estimated time:** 3–4 hours  
**Tools:** dd, dcfldd, ewfacquire, sha256sum, sleuthkit, photorec  
**Legal note:** Evidence acquisition has legal implications. Always obtain written authorisation before imaging any device you do not own.

---

## Overview

Everything in this course assumes you already have the malware sample. This module covers what happens before that — how to legally and technically acquire evidence from a device in a way that preserves its integrity, maintains chain of custody, and produces artefacts that are admissible in legal proceedings.

This is not abstract. If a human rights defender's device is seized by authorities, or if a journalist's laptop is compromised and they want to report the intrusion to courts or international bodies, the quality of the forensic acquisition determines whether the evidence holds up.

---

## 12.1 Forensic Principles

### The Cardinal Rules

**Rule 1: Never write to the original evidence.**  
Every interaction with original storage potentially modifies it — access timestamps, swap writes, journal updates. Use a write blocker (hardware) or read-only mount (software). Any modification to evidence, even accidental, breaks the chain of custody and may make evidence inadmissible.

**Rule 2: Hash before and after.**  
A forensic image is only valid if the hash of the image matches the hash of the original. This proves nothing was altered during acquisition. SHA-256 is the current standard — MD5 is no longer sufficient for legal proceedings.

**Rule 3: Document everything.**  
Write down: the device make/model/serial number, who authorised the acquisition, when it was acquired (date, time, timezone), who performed it, what tool was used, the hash of the original and the image, where the image is stored, and everyone who has handled it since. This is chain of custody.

**Rule 4: Work from the image, not the original.**  
After acquisition, store the original in a tamper-evident bag and lock it away. All analysis happens on the image (or a copy of the image). If analysis corrupts the working copy, you make another copy from the image.

### Write Blockers

A write blocker sits between the evidence drive and your analysis machine. It allows read operations to pass through and blocks all write operations at the hardware level — even writes that the OS makes automatically (filesystem journal updates, last-accessed timestamps).

| Type | Pros | Cons |
|---|---|---|
| Hardware write blocker (Tableau, WiebeTech) | Completely hardware-enforced, unquestionable in court | Costs USD 200–500, adds to kit weight |
| Software write blocker (`hdparm -r1`) | Free, works on any Linux machine | Requires careful configuration, easier to challenge in court |
| Read-only mount | Free, sufficient for most purposes | Filesystem-level only, some block-level writes may still occur |

For most civil society forensic work, a hardware write blocker is worth the cost. Amnesty International's Security Lab and Access Now's Digital Security Helpline both maintain hardware kits.

---

## 12.2 Imaging with dd

`dd` is the standard Unix tool for block-level copying. It copies every bit — allocated, unallocated, slack space, deleted files. This is essential for forensics because deleted files and unallocated space often contain evidence.

### Basic Imaging

```bash
# NEVER run without confirming if= and of= — swapping them destroys evidence

# Confirm device identifiers FIRST
lsblk
fdisk -l 2>/dev/null | grep "^Disk /dev"

# Example: evidence drive at /dev/sdb, image to /dev/sdc (external analysis drive)
# Hash first — before imaging
sha256sum /dev/sdb > /mnt/evidence/sdb_original.sha256
cat /mnt/evidence/sdb_original.sha256

# Image with dd (bs=512 for maximum compatibility, bs=4M for speed)
dd if=/dev/sdb \
   of=/mnt/evidence/evidence_001.img \
   bs=512 \
   conv=noerror,sync \
   status=progress \
   2>&1 | tee /mnt/evidence/acquisition_log.txt

# Hash the image immediately after
sha256sum /mnt/evidence/evidence_001.img > /mnt/evidence/evidence_001.sha256

# Verify — these two hashes MUST match
diff /mnt/evidence/sdb_original.sha256 <(sha256sum /dev/sdb)
```

The `conv=noerror,sync` flags are critical:
- `noerror` — continue imaging even if bad sectors are encountered (bad sectors are common on seized/damaged devices)
- `sync` — pad bad sector blocks with zeros so sector offsets remain accurate in the image

### dcfldd — Forensic dd

`dcfldd` is a forensics-enhanced version of `dd` that hashes in real time during acquisition:

```bash
sudo apt install -y dcfldd

dcfldd if=/dev/sdb \
       of=/mnt/evidence/evidence_001.img \
       bs=512 \
       hash=sha256 \
       hashlog=/mnt/evidence/evidence_001.sha256 \
       hashwindow=1G \
       conv=noerror,sync \
       status=on
```

`hashwindow=1G` produces rolling hashes every 1GB — useful for very large drives where you want to verify partial progress.

---

## 12.3 EWF Format (Expert Witness Format)

`dd` produces a raw image — a byte-for-byte copy with no metadata. For professional forensic work, EWF (`.E01` format) is preferred: it embeds metadata (case number, examiner name, device description, acquisition hash) directly in the image file, it supports compression, and it is accepted by all major forensic tools (FTK, X-Ways, Autopsy).

```bash
sudo apt install -y ewf-tools

# Acquire directly to EWF
ewfacquire /dev/sdb \
  -t /mnt/evidence/evidence_001 \
  -C "Case 2026-HRD-001" \
  -D "Laptop seized from source" \
  -E "Your Name" \
  -e "organisation@example.com" \
  -m fixed \
  -M logical \
  -c best \
  -S 0

# Verify the acquired image
ewfverify /mnt/evidence/evidence_001.E01

# Mount for analysis (read-only)
sudo mkdir /mnt/evidence_mount
ewfmount /mnt/evidence/evidence_001.E01 /mnt/ewf_raw/
sudo mount -o ro,loop,noatime /mnt/ewf_raw/ewf1 /mnt/evidence_mount
```

---

## 12.4 Imaging Without Write Blocker (Emergency Procedure)

If no write blocker is available and the situation is urgent (e.g. device is being remotely wiped, or battery is dying):

```bash
# Software write block — set drive read-only at block device level
sudo hdparm -r1 /dev/sdb
# Verify
sudo hdparm -r /dev/sdb
# Should show: readonly = 1 (on)

# Alternatively, mount read-only
sudo mount -o ro,noatime /dev/sdb1 /mnt/evidence_ro

# Now image
sudo dd if=/dev/sdb of=/mnt/evidence/emergency_image.img bs=4M conv=noerror,sync status=progress
```

Document clearly in your chain of custody that no hardware write blocker was used and why. This does not necessarily invalidate the evidence but it must be disclosed.

---

## 12.5 Live Acquisition — Memory and Running System

Sometimes you cannot image a powered-off drive — the full-disk encryption key is in RAM and turning off the device loses it. Live acquisition captures the running system.

### Memory Acquisition

```bash
# LiME — Linux Memory Extractor (kernel module)
sudo apt install -y linux-headers-$(uname -r)
git clone https://github.com/504ensicsLabs/LiME /tmp/lime
cd /tmp/lime/src
make

# Acquire memory to a network socket (avoids writing to the suspect machine's disk)
# On analysis machine first:
nc -l -p 4444 > /mnt/evidence/memory.lime

# On suspect machine:
sudo insmod lime-$(uname -r).ko "path=tcp:4444 format=lime"

# Alternatively, write to a USB drive
sudo insmod lime-$(uname -r).ko "path=/mnt/usb/memory.lime format=lime"

# Hash immediately
sha256sum /mnt/evidence/memory.lime
```

### Triage Without Full Image

When time is critical, prioritise:

```bash
# 1. Hash every file of interest immediately
find /home /root /tmp /var/tmp -type f -exec sha256sum {} \; 2>/dev/null \
  > /mnt/usb/file_hashes.txt

# 2. Capture running processes
ps auxf > /mnt/usb/processes.txt
ss -tnp > /mnt/usb/network_connections.txt

# 3. Capture logs before they rotate
cp -r /var/log /mnt/usb/var_log_backup/

# 4. Capture cron and startup
crontab -l > /mnt/usb/crontab.txt 2>/dev/null
ls -la /etc/cron* /var/spool/cron/ 2>/dev/null >> /mnt/usb/crontab.txt

# 5. Capture bash history (may be cleared by attacker)
cp ~/.bash_history /mnt/usb/bash_history.txt
cat /root/.bash_history 2>/dev/null >> /mnt/usb/bash_history.txt
```

---

## 12.6 Chain of Custody Documentation

Every acquisition must produce a chain of custody document. This is a legal document — treat it accordingly.

```markdown
# CHAIN OF CUSTODY — DIGITAL EVIDENCE

## Case Information
Case number:        [Case-YYYY-ORG-NNN]
Case description:   [Brief description — 1 sentence]
Acquiring analyst:  [Full name, organisation]
Authorised by:      [Name, role, organisation]
Authorisation date: [Date and time]

## Evidence Item
Description:        [Make, model, serial number if visible]
Condition on receipt: [Physical condition, power state]
Received from:      [Name, role — or "seized by analyst"]
Receipt location:   [Physical location]
Receipt date/time:  [ISO 8601: 2026-03-12T14:30:00+02:00]
Receipt timezone:   [UTC+2 / CAT]

## Acquisition
Tool used:          [dd version X.X / dcfldd / ewfacquire version X.X]
Write blocker:      [Hardware: [model] / Software: hdparm -r1 / None — reason: ]
Acquisition start:  [ISO 8601 timestamp]
Acquisition end:    [ISO 8601 timestamp]
Image filename:     [evidence_001.img / .E01]
Image storage:      [External drive model, serial number, location]

## Integrity Verification
Original SHA256:    [64-character hash]
Image SHA256:       [64-character hash]
Hashes match:       [YES / NO — if NO, document why and what happened]

## Handling Log
| Date/Time | Person | Action | Location |
|---|---|---|---|
| 2026-03-12T14:30 | [Analyst] | Acquired image | [Location] |
| 2026-03-12T15:00 | [Analyst] | Transferred to encrypted storage | [Location] |
| [Add every subsequent access] | | | |

## Storage
Primary image:      [Location, encryption method]
Backup copy:        [Location, encryption method]
Original device:    [Tamper-evident bag #___, location]
```

---

## 12.7 Analysing the Image

After acquisition, mount the image for read-only analysis:

```bash
# Mount raw dd image
sudo losetup -r -f /mnt/evidence/evidence_001.img
sudo losetup -l  # Find the loop device number
sudo mount -o ro,noatime /dev/loop0p1 /mnt/analysis  # p1 = first partition

# Or use The Sleuth Kit for forensic analysis without mounting
sudo apt install -y sleuthkit autopsy

# List partitions in image
mmls /mnt/evidence/evidence_001.img

# List files (including deleted)
fls -r /mnt/evidence/evidence_001.img

# Recover deleted files
sudo apt install -y testdisk
photorec /mnt/evidence/evidence_001.img
```

### Timeline Analysis

```bash
# Build a filesystem timeline (all file MAC times)
fls -r -m / /mnt/evidence/evidence_001.img > /tmp/body.txt
mactime -b /tmp/body.txt -d > /mnt/evidence/timeline.csv

# Sort by time, look for activity in the incident window
grep "2026-03-10\|2026-03-11" /mnt/evidence/timeline.csv | head -50
```

---

## 12.8 Mobile Device Acquisition

### Android (ADB Backup)

```bash
# Enable USB debugging on device
adb devices  # Confirm device listed

# Full backup (limited — does not capture all app data)
adb backup -apk -shared -all -f /mnt/evidence/android_backup.ab

# Extract backup
java -jar /opt/android-backup-extractor.jar \
  /mnt/evidence/android_backup.ab \
  /mnt/evidence/android_backup.tar

# Hash
sha256sum /mnt/evidence/android_backup.ab
sha256sum /mnt/evidence/android_backup.tar
```

### iOS (iTunes Backup via libimobiledevice)

```bash
sudo apt install -y libimobiledevice-utils
ideviceinfo  # Confirm device detected

# Full unencrypted backup
idevicebackup2 backup --full /mnt/evidence/ios_backup/

# Hash every file in the backup
find /mnt/evidence/ios_backup/ -type f -exec sha256sum {} \; \
  > /mnt/evidence/ios_backup_hashes.txt
```

---

## 12.9 Legal Considerations for Southern Africa

### Zimbabwe

Digital evidence is governed by the Cybersecurity and Data Protection Act (2021). Key points:
- Law enforcement requires a court order to compel device surrender
- Private individuals and organisations may image their own devices
- Evidence submitted to courts must demonstrate integrity (chain of custody + hash verification)
- Working with ZCSIRT (Zimbabwe CSIRT) is recommended for cases involving critical infrastructure

### South Africa

The Electronic Communications and Transactions Act (ECTA, 2002) and the Cybercrimes Act (2020) govern digital evidence. The South African Police Service has a Computer Crime Unit. For civil society work, CSIRT-SA and the Centre for Cybersecurity can provide guidance.

### International Standards

For evidence that may be used in international legal proceedings (ICC, UN mechanisms):
- Use ISO/IEC 27037 (Guidelines for identification, collection, acquisition and preservation of digital evidence)
- Document everything in English regardless of local language of proceedings
- Retain original devices under tamper-evident conditions for a minimum of 7 years

---

## 12.10 Challenge

**The Acquired Image**

You receive a dd image from a colleague. Your task is to verify its integrity, mount it safely, and triage it for malware artefacts.

```bash
# Set up the challenge
mkdir -p ~/labs/lab12
cd ~/labs/lab12

# Create a simulated forensic image (2MB — small enough for lab use)
dd if=/dev/urandom bs=1M count=2 of=evidence_sim.raw 2>/dev/null
mkfs.ext4 -F evidence_sim.raw > /dev/null 2>&1
sudo mount -o loop evidence_sim.raw /mnt/tmp_sim/
sudo mkdir -p /mnt/tmp_sim/{home/analyst,tmp,var/log}
echo "ANALYST_HOME_ARTEFACT" | sudo tee /mnt/tmp_sim/home/analyst/.bash_history > /dev/null
sudo bash -c 'echo "FLAG{forensics_chain_of_custody_sha256_verified}" > /mnt/tmp_sim/tmp/.hidden_payload'
sudo umount /mnt/tmp_sim/
sha256sum evidence_sim.raw > evidence_sim.sha256
echo "Image ready. SHA256: $(cat evidence_sim.sha256 | cut -d' ' -f1)"
```

Tasks:
1. Verify the image hash matches `evidence_sim.sha256`
2. Mount read-only
3. Recover the hidden file in `/tmp/`
4. Build a mini timeline showing when files were created
5. Write a chain of custody document for this acquisition

**Flag:** `FLAG{forensics_chain_of_custody_sha256_verified}`

---

## Knowledge Check

1. **You forget to attach the hardware write blocker before connecting the evidence drive. You notice before doing anything else. What do you do and what do you disclose?**

   <details>
   <summary>Answer</summary>
   Stop immediately and attach the write blocker. Then: (1) Check if the OS auto-mounted the drive — `lsblk`, `dmesg | tail -20`. If it auto-mounted, the filesystem journal was likely updated (access timestamps modified). (2) Hash the drive now: `sha256sum /dev/sdb`. Compare against any prior hash if available. (3) Document everything — the fact that the drive was connected without a write blocker, how long it was connected, what commands if any were run, and the current hash. (4) Disclose fully in the chain of custody document. Courts have accepted evidence acquired without write blockers when the analyst can demonstrate (via hash comparison) that no content was modified. The disclosure is required regardless.
   </details>

2. **Why is `conv=noerror,sync` critical when imaging a damaged drive with dd?**

   <details>
   <summary>Answer</summary>
   Two separate problems solved by two separate flags. `noerror` tells dd to continue when it hits a bad sector rather than aborting — without it, a single bad sector stops the entire acquisition at that point, losing everything after it. `sync` pads each failed read with zeros to maintain the correct block offset — without it, dd skips bad blocks and the resulting image has all subsequent data at wrong offsets, corrupting every sector address after the first bad block. Together they produce a complete image where bad sectors are marked as zero-filled gaps but all readable data is at its correct position.
   </details>

3. **A witness challenges your forensic image in court, claiming you could have altered the evidence. What demonstrates integrity?**

   <details>
   <summary>Answer</summary>
   SHA-256 hash comparison: the hash of the original device recorded before imaging must match the hash of the device taken after imaging, and the hash of the image file must match a hash taken immediately after acquisition. If all three match: the device was not written to during imaging, and the image is an exact copy. Supporting evidence: the chain of custody document showing who had access and when, the hardware write blocker model and serial number, the acquisition log showing exact tool version, start time and end time. The integrity argument is mathematical — a SHA-256 collision has never been observed in practice.
   </details>
