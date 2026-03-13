# Lab 05: YARA Rules

## Objective

Write, test, tune, and deploy YARA rules against all four toy samples. Every rule must achieve a true positive against its target and zero false positives against a clean corpus of system binaries.

## Prerequisites

- Module 05 (YARA and Sigma) completed
- Labs 01–04 completed
- `yara` installed or `yara-python` available

## Time Required

90 minutes

## Tools Used

`yara`, `python3` (yara-python), `strings`, `xxd`

---

## Setup

```bash
# Install yara (binary)
sudo apt install -y yara

# Or use Python bindings
pip3 install yara-python --break-system-packages
python3 -c "import yara; print('yara-python:', yara.__version__)"

mkdir -p ~/labs/lab05/{rules,tests,reports}
cd ~/labs/lab05

SAMPLES="$HOME/course/Digital-Forensics-Malware-Analysis-Zero-to-Mastery-main/samples/benign_toy_app"

gcc -o tests/toy_app         ${SAMPLES}/toy_app.c
gcc -o tests/toy_network     ${SAMPLES}/toy_app_network.c
gcc -o tests/toy_persistence ${SAMPLES}/toy_app_persistence.c
gcc -o tests/toy_enum        ${SAMPLES}/toy_app_enumeration.c

# Clean corpus for false positive testing
cp /bin/ls          tests/clean_ls
cp /bin/cat         tests/clean_cat
cp /usr/bin/python3 tests/clean_python3 2>/dev/null || true
cp /bin/bash        tests/clean_bash

echo "[+] Setup complete"
echo "Toy samples: $(ls tests/toy_* | wc -l)"
echo "Clean files: $(ls tests/clean_* | wc -l)"
```

### Test Harness

Save this — you will use it after every rule you write:

```bash
cat > ~/labs/lab05/test_rule.sh << 'EOF'
#!/bin/bash
# test_rule.sh — test a YARA rule for TPs and FPs
# Usage: ./test_rule.sh <rule.yar> [expected_match_file]

RULE="$1"
EXPECTED="${2:-tests/toy_}"

echo "Testing: $RULE"
echo ""

PASS=0; FAIL=0

run_test() {
    local target="$1"
    local expect_hit="$2"  # "yes" or "no"
    local label="$3"

    if command -v yara &>/dev/null; then
        result=$(yara -s "$RULE" "$target" 2>/dev/null)
    else
        result=$(python3 -c "
import yara, sys
rules = yara.compile('$RULE')
matches = rules.match('$target')
if matches:
    for m in matches:
        print(m.rule)
" 2>/dev/null)
    fi

    hit=$( [ -n "$result" ] && echo "yes" || echo "no" )

    if [ "$hit" = "$expect_hit" ]; then
        outcome="PASS"
        PASS=$((PASS + 1))
    else
        outcome="FAIL"
        FAIL=$((FAIL + 1))
    fi

    printf "  [%s] %-45s %s\n" "$outcome" "$label" \
        "$([ $hit = yes ] && echo 'HIT' || echo 'miss')"
}

echo "--- Expected hits (toy samples) ---"
run_test "tests/toy_app"         "$(echo $EXPECTED | grep -q 'app'   && echo yes || echo no)" "toy_app"
run_test "tests/toy_network"     "$(echo $EXPECTED | grep -q 'net'   && echo yes || echo no)" "toy_network"
run_test "tests/toy_persistence" "$(echo $EXPECTED | grep -q 'pers'  && echo yes || echo no)" "toy_persistence"
run_test "tests/toy_enum"        "$(echo $EXPECTED | grep -q 'enum'  && echo yes || echo no)" "toy_enum"

echo ""
echo "--- Expected clean (no hit) ---"
run_test "tests/clean_ls"      "no" "/bin/ls"
run_test "tests/clean_cat"     "no" "/bin/cat"
run_test "tests/clean_bash"    "no" "/bin/bash"
[ -f tests/clean_python3 ] && run_test "tests/clean_python3" "no" "/usr/bin/python3"

echo ""
echo "Results: $PASS passed, $FAIL failed"
EOF
chmod +x ~/labs/lab05/test_rule.sh
```

---

## Part 1: Writing Your First Rule

Start simple. Build complexity only when the simple version fails.

### 1.1 — Minimal Rule for toy_app

The unique string `ANALYSIS_DEMO` appears only in our toy samples:

```bash
cat > rules/toy_app_v1.yar << 'EOF'
rule ToyApp_v1 {
    meta:
        description = "Detects toy_app — version 1, string only"
    strings:
        $s1 = "ANALYSIS_DEMO"
    condition:
        $s1
}
EOF

./test_rule.sh rules/toy_app_v1.yar "app"
```

**Task 1.1:** Does v1 fire on the correct sample? Does it fire on any clean files? If yes, explain why and fix it.

### 1.2 — Add Structural Constraints

Pure string rules are fragile. Add context:

```bash
cat > rules/toy_app_v2.yar << 'EOF'
rule ToyApp_v2 {
    meta:
        description = "Detects toy_app — version 2, ELF + strings"
    strings:
        $s1 = "ANALYSIS_DEMO"
        $s2 = "toy_app.log"
        $s3 = "XOR decode completed"
    condition:
        // Must be ELF (magic bytes at offset 0)
        uint32(0) == 0x464C457F and
        // Small file — toy samples are under 200KB
        filesize < 200KB and
        // At least 2 of 3 strings present
        2 of ($s*)
}
EOF

./test_rule.sh rules/toy_app_v2.yar "app"
```

**Task 1.2:** Does adding the ELF check and filesize constraint change the results? Why are these constraints useful in production?

### 1.3 — Add the Hex Pattern

The XOR-encoded bytes are more durable than plain strings:

```bash
# First, verify the encoded bytes
python3 -c "
encoded = [0x09, 0x24, 0x2d, 0x2d, 0x2e, 0x70, 0x16, 0x2e, 0x33, 0x2d, 0x25]
print('Encoded hex:', ' '.join(f'{b:02x}' for b in encoded))
print('Decoded:    ', ''.join(chr(b ^ 0x41) for b in encoded))
"

cat > rules/toy_app_v3.yar << 'EOF'
rule ToyApp_v3 {
    meta:
        description  = "Detects toy_app — version 3, ELF + strings + hex pattern"
        mitre_attack = "T1027"
    strings:
        $s1  = "ANALYSIS_DEMO"
        $s2  = "XOR decode completed"
        // XOR-encoded "Hello1World" with key 0x41
        $enc = { 09 24 2D 2D 2E 70 16 2E 33 2D 25 }
    condition:
        uint32(0) == 0x464C457F and
        filesize < 200KB and
        (2 of ($s*) or $enc)
}
EOF

./test_rule.sh rules/toy_app_v3.yar "app"
```

**Task 1.3:** Does the hex pattern `$enc` match independently? Test it:
```bash
python3 -c "
import yara
rule = yara.compile(source='''
rule TestHex {
    strings: \$enc = { 09 24 2D 2D 2E 70 16 2E 33 2D 25 }
    condition: \$enc
}
''')
for f in ['tests/toy_app', 'tests/toy_network', 'tests/clean_ls']:
    m = rule.match(f)
    print(f'{f}: {\"HIT\" if m else \"miss\"}')
"
```

---

## Part 2: Network Beacon Rule

### 2.1 — Find the Exact Encoded Bytes

From Lab 04 and Module 05, the user agent `ToyBeacon/1.0 (Educational)` is XOR'd with key `0x55`:

```bash
python3 -c "
ua = 'ToyBeacon/1.0 (Educational)'
key = 0x55
enc = bytes(b ^ key for b in ua.encode())
print('UA:      ', ua)
print('Key:     ', hex(key))
print('Encoded: ', enc.hex())
print('First 8: ', enc[:8].hex())
print('YARA:    ', ' '.join(f'{b:02x}' for b in enc[:8]).upper())
"
```

### 2.2 — Write the Rule

```bash
cat > rules/c2_beacon.yar << 'EOF'
rule C2BeaconPattern {
    meta:
        description  = "ELF binary with C2 beacon characteristics"
        author       = "Lab 05"
        mitre_attack = "T1071.001"
        severity     = "high"
    strings:
        // Beacon format string — high confidence IOC
        $fmt    = "BEACON|%d|%s|%s|%s|%s" ascii

        // Socket function imports
        $sock1  = "socket"  fullword ascii
        $sock2  = "connect" fullword ascii
        $sock3  = "send"    fullword ascii

        // XOR-encoded user agent first 8 bytes
        // "ToyBeacon" XOR 0x55 — replace with computed value
        $ua_enc = { 01 3A 2C 17 30 34 36 3A }

    condition:
        uint32(0) == 0x464C457F and
        filesize < 500KB and
        (
            $fmt or
            ($ua_enc and all of ($sock*))
        )
}
EOF
```

Wait — let's verify the encoded bytes are correct before hardcoding them:

```bash
python3 << 'EOF'
ua = "ToyBeacon/1.0 (Educational)"
key = 0x41
enc = bytes(b ^ key for b in ua.encode())
print(f"First 8 encoded bytes (YARA format):")
print("{ " + " ".join(f"{b:02X}" for b in enc[:8]) + " }")

# Find them in the binary
data = open("tests/toy_network", "rb").read()
idx = data.find(enc[:8])
print(f"Found at offset: 0x{idx:04x}" if idx >= 0 else "NOT FOUND")
EOF
```

Update the rule with the correct bytes, then test:

```bash
# Update $ua_enc with correct bytes from the Python output above
# Then test
./test_rule.sh rules/c2_beacon.yar "network"
```

**Task 2.1:** Does the rule fire on toy_network only, or also on other toy samples? If it hits toy_enum (which imports `socket` indirectly), how do you fix it?

**Task 2.2:** Remove the `$fmt` string from the condition and test with only `$ua_enc`. Does it still detect the sample? Which approach is more durable against a variant that changes the format string?

---

## Part 3: Sandbox Evasion Rule

```bash
cat > rules/sandbox_evasion.yar << 'EOF'
rule SandboxEvasion_KeywordList {
    meta:
        description  = "ELF containing analyst tool detection keyword list"
        mitre_attack = "T1497.001"
        severity     = "high"
        notes        = "3 or more analyst tool names in a single binary = deliberate evasion"
    strings:
        $k01 = "wireshark"      nocase fullword
        $k02 = "procmon"        nocase fullword
        $k03 = "x64dbg"         nocase fullword
        $k04 = "ollydbg"        nocase fullword
        $k05 = "ghidra"         nocase fullword
        $k06 = "pestudio"       nocase fullword
        $k07 = "processhacker"  nocase fullword
        $k08 = "tcpdump"        nocase fullword
        $k09 = "fiddler"        nocase fullword
        $k10 = "burpsuite"      nocase fullword
        $k11 = "volatility"     nocase fullword
        $k12 = "ida"            nocase fullword

        // Sandbox environment variable names
        $e1  = "CUCKOO"   fullword ascii
        $e2  = "SANDBOX"  fullword ascii
        $e3  = "INETSIM"  fullword ascii
    condition:
        filesize < 5MB and
        (
            3 of ($k*) or
            (2 of ($k*) and any of ($e*))
        )
}
EOF

./test_rule.sh rules/sandbox_evasion.yar "enum"
```

**Task 3.1:** Does this rule fire on `toy_enum` and nothing in the clean corpus?

**Task 3.2:** The keyword `"ida"` with `fullword` may match the string "ida" appearing inside longer words. Find a clean binary where this causes a false positive:
```bash
strings tests/clean_ls | grep -wi "ida"
strings tests/clean_bash | grep -wi "ida"
```
If you find one, add it to the false positive test and update the rule condition to compensate.

**Task 3.3:** Raise the threshold from `3 of ($k*)` to `5 of ($k*)`. Run the tests again. Does toy_enum still match? Does raising the threshold make the rule safer or less effective?

---

## Part 4: Persistence Detection Rule

```bash
cat > rules/persistence_drop.yar << 'EOF'
rule LinuxPersistenceDrop {
    meta:
        description  = "ELF with Linux persistence installation behaviour"
        mitre_attack = "T1053.003, T1105"
        severity     = "medium"
    strings:
        // Cron-related strings
        $c1 = "cron_demo"         ascii
        $c2 = "/etc/crontab"      nocase ascii
        $c3 = "/etc/cron.d"       nocase ascii

        // Drop paths
        $d1 = "/tmp/"             nocase ascii
        $d2 = "/var/tmp/"         nocase ascii
        $d3 = "/dev/shm/"         nocase ascii

        // Systemd user paths (macOS launchd equivalent not needed for Linux)
        $s1 = ".config/systemd"   nocase ascii

        // Sample identifier
        $id = "ANALYSIS_DEMO_PERSISTENCE" ascii
    condition:
        uint32(0) == 0x464C457F and
        filesize < 1MB and
        (
            $id or
            any of ($c*) or
            (any of ($d*) and any of ($s*))
        )
}
EOF

./test_rule.sh rules/persistence_drop.yar "persistence"
```

**Task 4.1:** This rule currently has a broad condition — `any of ($c*)` will fire if any cron path string is present. Test whether legitimate system tools like `/usr/sbin/cron` itself would trigger this rule. If yes, add a filter.

**Task 4.2:** Add a fourth string set for autostart paths commonly abused on Linux:
```
$a1 = ".bashrc"
$a2 = ".profile"
$a3 = "/etc/rc.local"
$a4 = "/etc/init.d/"
```
Update the condition to fire when a cron string OR a drop path AND an autostart path are present together.

---

## Part 5: YARA on Memory Dumps

The same rules work against memory dumps — this is where they catch the decoded user agent that is invisible on disk.

```bash
cd ~/labs/lab05

# Get a memory dump from Lab 04, or create a fresh one
if [ -f ~/labs/lab04/dumps/toy_network_mem.* ]; then
    DUMP=$(ls ~/labs/lab04/dumps/toy_network_mem.* | head -1)
    echo "Using existing dump: $DUMP"
else
    # Create fresh dump
    ./tests/toy_network &
    TOY_PID=$!
    sleep 2
    gcore -o /tmp/lab05_net_dump $TOY_PID 2>/dev/null
    wait $TOY_PID 2>/dev/null
    DUMP=$(ls /tmp/lab05_net_dump.* | head -1)
    echo "Fresh dump: $DUMP"
fi

# Write a memory-specific rule targeting the DECODED UA string
cat > rules/memory_ua_decoded.yar << 'EOF'
rule ToyBeacon_DecodedUA_InMemory {
    meta:
        description = "Decoded ToyBeacon user-agent string — only visible in memory"
        notes       = "This string is XOR-encoded on disk. Presence in memory = runtime decoding occurred"
    strings:
        // The DECODED string — invisible in static analysis
        $ua_decoded = "ToyBeacon/1.0 (Educational)" ascii
        // The full beacon payload format
        $beacon_payload = /BEACON\|[0-9]+\|[a-zA-Z0-9._-]+\|/ ascii
    condition:
        any of them
}
EOF

echo "=== Testing against DISK binary (should NOT match) ==="
python3 -c "
import yara
r = yara.compile('rules/memory_ua_decoded.yar')
m = r.match('tests/toy_network')
print('Disk binary: HIT' if m else 'Disk binary: miss (CORRECT — string is encoded on disk)')
"

echo ""
echo "=== Testing against MEMORY DUMP (should match) ==="
python3 -c "
import yara
r = yara.compile('rules/memory_ua_decoded.yar')
m = r.match('$DUMP')
print('Memory dump: HIT (CORRECT — string decoded at runtime)' if m else 'Memory dump: miss (check dump path)')
" 2>/dev/null || echo "Dump not available — run Lab 04 first"
```

**Task 5.1:** Document the result: does the `memory_ua_decoded` rule fire on the disk binary? On the memory dump?

**Task 5.2:** In one paragraph, explain what this experiment proves and why it matters for real-world threat hunting. What kind of malware would you detect with memory-targeted YARA rules that disk-targeted rules completely miss?

---

## Part 6: Rule Combination and Final Testing

Combine all rules into a single ruleset and run it against the complete evidence set.

```bash
cd ~/labs/lab05

# Combine all rules
cat rules/toy_app_v3.yar \
    rules/c2_beacon.yar \
    rules/sandbox_evasion.yar \
    rules/persistence_drop.yar \
    > rules/all_rules.yar

echo "=== Running full ruleset against all test files ==="
python3 << 'EOF'
import yara, os

rules = yara.compile('rules/all_rules.yar')

targets = {
    "tests/toy_app":          ["ToyApp_v3"],
    "tests/toy_network":      ["C2BeaconPattern"],
    "tests/toy_persistence":  ["LinuxPersistenceDrop"],
    "tests/toy_enum":         ["SandboxEvasion_KeywordList"],
    "tests/clean_ls":         [],
    "tests/clean_cat":        [],
    "tests/clean_bash":       [],
}

print(f"{'File':<30} {'Expected':<30} {'Got':<30} {'Result'}")
print("-" * 100)

for path, expected in targets.items():
    try:
        matches = [m.rule for m in rules.match(path)]
    except:
        matches = []
    
    expected_set = set(expected)
    got_set = set(matches)
    
    if expected_set == got_set:
        result = "PASS"
    elif expected_set.issubset(got_set):
        result = "PASS (extra hits)"
    else:
        result = "FAIL"
    
    print(f"{os.path.basename(path):<30} {str(expected):<30} {str(matches):<30} {result}")
EOF
```

**Task 6.1:** Are there any FAIL results? If yes, which rule is missing a true positive or generating a false positive?

**Task 6.2:** The final ruleset has four rules. Write a fifth rule that would detect ANY of the four toy samples in a single rule (a "family" rule). Use the most durable indicators from across all four samples.

```bash
cat > rules/hollow_reed_family.yar << 'EOF'
rule HollowReed_Family {
    meta:
        description = "Any component of the HollowReed educational toolset"
        severity    = "informational"
    strings:
        // Unique identifiers across all four samples
        $id1 = "ANALYSIS_DEMO"             ascii  // toy_app + toy_enum
        $id2 = "ANALYSIS_DEMO_NETWORK"     ascii  // toy_network
        $id3 = "ANALYSIS_DEMO_PERSISTENCE" ascii  // toy_persistence
        $id4 = "BEACON|%d|%s|%s|%s|%s"    ascii  // toy_network
    condition:
        uint32(0) == 0x464C457F and
        filesize < 1MB and
        any of them
}
EOF

./test_rule.sh rules/hollow_reed_family.yar "toy_"
```

---

## Completion Checklist

- [ ] Wrote and tested three rule versions for toy_app (v1, v2, v3)
- [ ] Correctly computed the XOR-encoded UA bytes and embedded them in the c2_beacon rule
- [ ] Sandbox evasion rule fires on toy_enum and nothing in clean corpus
- [ ] Persistence rule fires on toy_persistence only
- [ ] Memory-targeted rule fires on dump but not disk binary
- [ ] Combined ruleset passes all true positive / true negative tests
- [ ] Wrote the HollowReed family rule covering all four samples

---

## Key Takeaways

A YARA rule is a hypothesis about what makes a piece of malware distinctive. The testing harness is how you validate that hypothesis. The strongest rules combine structural constraints (ELF magic, file size), durable string patterns (format strings, encoded byte sequences), and import-table evidence. Strings alone fail against packed malware. Import tables alone fail against statically linked malware. Combined, they catch far more than either does individually.

**Next:** [Solutions — Module 01 Challenge](../solutions/module01_challenge.md)
