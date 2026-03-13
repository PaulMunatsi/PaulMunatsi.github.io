# Lab 10 — Volatility3 Deep Dive & Mobile Triage

**Modules:** 04 (Memory Forensics), 10 (Android & Mobile Malware)  
**Estimated time:** 90–120 minutes  
**Difficulty:** Intermediate–Advanced  
**Flag:** `FLAG{vol3_malfind_injected_region_xor_decoded_in_heap}`

---

## Objectives

- Run Volatility3 against a real Linux memory image and interpret plugin output
- Use `linux.pslist`, `linux.bash`, `linux.netstat`, `linux.malfind` against a live dump
- Cross-reference process memory anomalies with static binary analysis
- Triage a suspicious APK manifest for stalkerware indicators
- Correlate mobile and desktop findings into a single IOC package

---

## Setup

```bash
pip3 install volatility3 --break-system-packages
mkdir -p ~/labs/lab10/{memory,apk,iocs,reports}

# Verify vol3 is working
python3 -m volatility3 -h | head -5
```

---

## Part 1 — Capturing a Live Memory Image

You will dump memory of the toy samples to create a realistic analysis target.

**Task 1.1** — Start three toy processes simultaneously:

```bash
cd ~/course/samples/benign_toy_app

# Compile if needed
gcc -o toy_app_linux toy_app.c 2>/dev/null
gcc -o toy_network_linux toy_app_network.c 2>/dev/null
gcc -o toy_persistence_linux toy_app_persistence.c 2>/dev/null

# Run in background
./toy_app_linux &; APP_PID=$!
./toy_network_linux &; NET_PID=$!
./toy_persistence_linux &; PERS_PID=$!

echo "PIDs: app=$APP_PID network=$NET_PID persistence=$PERS_PID"
sleep 2
```

**Task 1.2** — Dump each process with gcore:

```bash
gcore -o ~/labs/lab10/memory/toy_app_dump      $APP_PID
gcore -o ~/labs/lab10/memory/toy_network_dump  $NET_PID
gcore -o ~/labs/lab10/memory/toy_persist_dump  $PERS_PID

kill $APP_PID $NET_PID $PERS_PID 2>/dev/null
ls -lh ~/labs/lab10/memory/
```

**Task 1.3** — Hash all dumps immediately:

```bash
sha256sum ~/labs/lab10/memory/*.* | tee ~/labs/lab10/memory/hashes.txt
```

---

## Part 2 — Volatility3 Against Process Dumps

Volatility3 works best against full system memory images. For process dumps from `gcore`, we use raw string analysis alongside vol3 for maximum coverage.

**Task 2.1** — String extraction (the vol3 equivalent for process dumps):

```bash
# Decoded strings visible in memory but NOT in the binary
echo "=== toy_app — strings in dump vs binary ==="
strings ~/labs/lab10/memory/toy_app_dump.* | \
  grep -iE "analysis|demo|decoded|c2_host|campaign|key" | sort -u

echo "=== Same search on binary (compare) ==="
strings ~/course/samples/benign_toy_app/toy_app_linux | \
  grep -iE "analysis|demo|decoded|c2_host|campaign|key" | sort -u

echo ""
echo "Strings found in DUMP but NOT in binary = XOR-decoded content"
```

**Task 2.2** — Extract network IOCs from memory dump:

```bash
strings ~/labs/lab10/memory/toy_network_dump.* | \
  grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}|:[0-9]{4,5}|beacon|ToyBeacon|C2_HOST"
```

Record: IP address, port, User-Agent string found in memory. Compare with what `strings` shows on the binary.

**Task 2.3** — Find the XOR-decoded string in toy_app memory:

```bash
strings ~/labs/lab10/memory/toy_app_dump.* | grep "ANALYSIS_DEMO"
```

If found: the decode worked at runtime and the decoded string is now in heap memory. Note the context around it (preceding and following bytes/strings).

---

## Part 3 — Volatility3 Against a Full System Image

If you have access to a full Linux memory image (from LiME, AVML, or Volatility Foundation test data), use these commands. The workflow is the same — only the image source changes.

**Task 3.1** — Download a Volatility3 test image (small, publicly available):

```bash
# The Volatility Foundation provides sample images for testing
# Check current availability:
echo "Checking Volatility3 test data..."
python3 -m volatility3 -h | grep "linux\|windows"

# If you have a full memory image at /mnt/evidence/memory.lime:
MEMIMG="/mnt/evidence/memory.lime"

# Otherwise, create a full system dump with AVML:
# sudo snap install avml  (Ubuntu 22.04+)
# sudo avml /tmp/full_memory.lime
# MEMIMG="/tmp/full_memory.lime"
```

**Task 3.2** — Run essential Linux plugins (substitute your image path):

```bash
MEMIMG="~/labs/lab10/memory/toy_network_dump.*"

# Process list
python3 -m volatility3 -f $MEMIMG linux.pslist 2>/dev/null | head -30

# Bash command history from memory
python3 -m volatility3 -f $MEMIMG linux.bash 2>/dev/null | head -30

# Network connections at time of dump
python3 -m volatility3 -f $MEMIMG linux.netstat 2>/dev/null | head -20

# Find memory regions with unusual permissions (RWX = suspicious)
python3 -m volatility3 -f $MEMIMG linux.malfind 2>/dev/null | head -40
```

**Task 3.3** — Interpret malfind output. For each flagged region:

```
PID    Process   Start       End         Prot  Vma Flags
----   -------   -----       ---         ----  ---------
1234   toy_net   0x7f3b0000  0x7f3b1000  rwx   VMA_EXEC|WRITE|READ
```

- `rwx` (readable + writable + executable) is the key red flag — legitimate mapped memory is almost never all three
- In real malware: this is where shellcode or injected code lives
- Note the start address — dump that region specifically

**Task 3.4** — Dump a suspicious memory region:

```bash
# Using /proc (works on live processes)
python3 << 'EOF'
import subprocess, os

pid = int(input("Enter PID to inspect: "))

# Read memory map
with open(f'/proc/{pid}/maps') as f:
    maps = f.readlines()

print("Memory regions:")
for i, line in enumerate(maps[:20]):
    print(f"  {i:2d}: {line.strip()}")

region_num = int(input("\nWhich region to dump (number)? "))
region = maps[region_num].split()
start, end = [int(x, 16) for x in region[0].split('-')]
perms = region[1]

print(f"\nDumping: {hex(start)}-{hex(end)} ({perms})")
try:
    with open(f'/proc/{pid}/mem', 'rb') as mem:
        mem.seek(start)
        data = mem.read(end - start)
    out_path = f'/tmp/region_{pid}_{hex(start)}.bin'
    with open(out_path, 'wb') as f:
        f.write(data)
    print(f"Saved to: {out_path}")
    print(f"Strings preview:")
    import subprocess
    result = subprocess.run(['strings', '-n', '8', out_path], capture_output=True, text=True)
    for line in result.stdout.split('\n')[:20]:
        print(f"  {line}")
except Exception as e:
    print(f"Error: {e} (process may have exited)")
EOF
```

---

## Part 4 — Volatility3 Windows Plugins (Reference)

For Windows memory images (which you will encounter in real incidents), the key plugins are:

```bash
# Process list with parent/child relationships
python3 -m volatility3 -f windows_memory.raw windows.pslist
python3 -m volatility3 -f windows_memory.raw windows.pstree

# Process hollowing / injection detection
python3 -m volatility3 -f windows_memory.raw windows.malfind

# DLL injection detection
python3 -m volatility3 -f windows_memory.raw windows.dlllist --pid 1234

# Network connections (including recently closed)
python3 -m volatility3 -f windows_memory.raw windows.netstat

# Registry hives (persistence, credentials)
python3 -m volatility3 -f windows_memory.raw windows.registry.hivelist
python3 -m volatility3 -f windows_memory.raw windows.registry.printkey \
  --key "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"

# Extract files from memory
python3 -m volatility3 -f windows_memory.raw windows.dumpfiles --pid 1234

# Detect process hollowing (notepad running ransomware)
# Look for: PID with notepad.exe name but non-notepad DLLs loaded
python3 -m volatility3 -f windows_memory.raw windows.malfind | \
  grep -A 5 "notepad\|svchost\|explorer"
```

**Key analyst questions from pslist:**
- Is there a `cmd.exe` or `powershell.exe` with an unusual parent (e.g. spawned by Word)?
- Is `notepad.exe` making network connections? (Hollowing indicator)
- Are there two processes with the same name at different paths?
- Is `svchost.exe` running outside `C:\Windows\System32\`?

---

## Part 5 — Mobile APK Triage

**Task 5.1** — Generate and analyse the suspicious APK manifest:

```bash
python3 ~/course/samples/generate_suspicious_apk_manifest.py \
  > ~/labs/lab10/apk/suspicious_manifest.xml
```

If the generator script doesn't exist yet, create the manifest directly:

```bash
cat > ~/labs/lab10/apk/suspicious_manifest.xml << 'MANIFEST'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.security.update.installer"
    android:versionCode="3"
    android:versionName="2.1.4">

    <!-- Surveillance permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.READ_SMS"/>
    <uses-permission android:name="android.permission.RECEIVE_SMS"/>
    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.READ_CALL_LOG"/>
    <uses-permission android:name="android.permission.PROCESS_OUTGOING_CALLS"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>

    <!-- Persistence permissions -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/>

    <!-- Evasion -->
    <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE"/>
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>

    <application
        android:label="Security Update"
        android:icon="@drawable/ic_system"
        android:allowBackup="false">

        <!-- No launcher activity = hidden from app drawer -->

        <receiver android:name=".BootReceiver"
            android:exported="true">
            <intent-filter android:priority="999">
                <action android:name="android.intent.action.BOOT_COMPLETED"/>
                <action android:name="android.intent.action.QUICKBOOT_POWERON"/>
            </intent-filter>
        </receiver>

        <service android:name=".SurveillanceService"
            android:exported="false"
            android:foregroundServiceType="microphone|location"/>

        <service android:name=".AccessibilityKeylogger"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService"/>
            </intent-filter>
        </service>
    </application>
</manifest>
MANIFEST
echo "Manifest created"
```

**Task 5.2** — Analyse every permission. Fill in this table:

```bash
grep "uses-permission" ~/labs/lab10/apk/suspicious_manifest.xml | \
  sed 's/.*android:name="//;s/".*//'
```

| Permission | Capability | Classification |
|---|---|---|
| `RECORD_AUDIO` | Microphone access | CRITICAL — covert surveillance |
| `ACCESS_FINE_LOCATION` | GPS tracking | CRITICAL |
| `READ_SMS` | Read all SMS | CRITICAL — 2FA bypass |
| `BIND_ACCESSIBILITY_SERVICE` | Screen/keyboard access | CRITICAL — keylogging |
| `RECEIVE_BOOT_COMPLETED` | Survives reboot | HIGH — persistence |
| `REQUEST_INSTALL_PACKAGES` | Install other apps | HIGH — dropper |
| *(continue for each)* | | |

**Task 5.3** — Identify structural red flags in the manifest:

1. Is there a launcher activity (appears in app drawer)? Yes / No
2. Does the app use `foregroundServiceType="microphone|location"`? What does this mean?
3. What is the intent priority of the boot receiver (999)? Why does high priority matter?
4. What is the package name? Does it look legitimate?

**Task 5.4** — Write a YARA rule matching this manifest:

```bash
cat > ~/labs/lab10/apk/suspicious_app.yar << 'YARA'
rule Android_Stalkerware_FullSuite {
    meta:
        description = "Android APK with full surveillance permission suite"
        author      = "Your name"
        date        = "2026-03-12"
        mitre_mobile = "T1417, T1412, T1430, T1429"
    strings:
        $p1  = "BIND_ACCESSIBILITY_SERVICE" ascii
        $p2  = "RECORD_AUDIO" ascii
        $p3  = "ACCESS_FINE_LOCATION" ascii
        $p4  = "READ_SMS" ascii
        $p5  = "RECEIVE_BOOT_COMPLETED" ascii
        $p6  = "READ_CALL_LOG" ascii
        $no_launcher = "android.intent.category.LAUNCHER"
    condition:
        uint16(0) == 0x4B50 and   // APK/ZIP magic
        $p1 and
        3 of ($p2, $p3, $p4, $p5, $p6) and
        not $no_launcher           // Hidden from app drawer
}
YARA

# Test (works on any APK file)
yara ~/labs/lab10/apk/suspicious_app.yar ~/labs/lab10/apk/ 2>/dev/null || \
  echo "YARA rule written — test against a real APK file"
```

---

## Part 6 — Correlating Memory and Mobile Findings

**Task 6.1** — Build a unified IOC list from both analyses:

```bash
cat > ~/labs/lab10/iocs/unified_iocs.md << 'EOF'
# Unified IOC List — Lab 10

## Desktop Samples (from memory analysis)

| Type | Value | Source | Confidence |
|---|---|---|---|
| SHA256 | (toy_network hash) | toy_network_linux binary | High |
| IPv4 | 127.0.0.1 | Memory dump — decoded socket | High |
| Port | 4444 | Memory dump — decoded socket | High |
| User-Agent | ToyBeacon/1.0 (Educational) | Memory dump — decoded string | High |
| String | ANALYSIS_DEMO | toy_app_linux heap | High |
| String | C2_HOST=example-c2.io | toy_network_linux heap | High |

## Mobile Sample (from APK manifest analysis)

| Type | Value | Source | Confidence |
|---|---|---|---|
| Package | com.security.update.installer | AndroidManifest.xml | High |
| Permission cluster | BIND_ACCESSIBILITY + RECORD_AUDIO + READ_SMS | AndroidManifest.xml | High |
| Behaviour | Hidden from launcher (no LAUNCHER activity) | AndroidManifest.xml | High |
| Persistence | Boot receiver priority 999 | AndroidManifest.xml | High |

## ATT&CK Coverage

| Technique | ID | Platform | Sample |
|---|---|---|---|
| Obfuscated Files | T1027 | Linux | toy_app |
| C2 via App Layer | T1071.001 | Linux | toy_network |
| Input Capture | T1417 | Android | suspicious APK |
| SMS Capture | T1412 | Android | suspicious APK |
| Location Tracking | T1430 | Android | suspicious APK |
| Audio Capture | T1429 | Android | suspicious APK |
| Boot Persistence | T1402 | Android | suspicious APK |
EOF

echo "IOC file created at ~/labs/lab10/iocs/unified_iocs.md"
```

**Task 6.2** — Answer the debrief questions:

1. Why does a string appear in the memory dump but not in `strings` on the binary?
2. An APK has no launcher activity. What does this tell you about the actor's intent?
3. `linux.malfind` flags a memory region as `rwx`. What three explanations exist, from benign to malicious?
4. You run MVT on a defender's phone and get zero detections. Does that mean the device is clean?
5. Both the desktop malware and the Android sample use port 4444 and similar C2 patterns. What hypothesis does this suggest about attribution?

---

## Completion Checklist

- [ ] Three toy processes dumped with gcore and hashed
- [ ] Decoded strings found in memory dumps that were absent from binaries
- [ ] Network IOCs extracted from toy_network memory dump
- [ ] Volatility3 commands run and output interpreted (live or reference)
- [ ] malfind output understood — RWX regions explained
- [ ] Windows plugins documented for reference
- [ ] APK manifest analysed — all permissions classified
- [ ] Three structural red flags identified in the manifest
- [ ] YARA rule written for the stalkerware permission cluster
- [ ] Unified IOC document produced
- [ ] Six debrief questions answered
- [ ] Flag submitted

> **Flag:** `FLAG{vol3_malfind_injected_region_xor_decoded_in_heap}`

Submit on the course platform after completing Part 3, Task 3.3.
