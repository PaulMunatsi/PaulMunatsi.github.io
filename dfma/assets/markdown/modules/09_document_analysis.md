# Module 09 — Document Malware Analysis

**Prerequisites:** Modules 01–03 (Foundations, Static Analysis, Dynamic Analysis)  
**Estimated time:** 3–4 hours  
**Tools:** pdfid, pdf-parser, oletools, strings, file, python3

---

## Overview

Most malware in the wild doesn't arrive as a Linux ELF binary. It arrives as a PDF invoice, a Word document with macros, or an Excel file with embedded objects — sent to someone's email. Document malware is the dominant initial access vector against civil society, journalists and human rights defenders globally.

This module covers how to analyse suspicious documents safely without executing them, extract embedded payloads, and write detections for document-based threats.

---

## Tool Installation

```bash
pip3 install pdfid pdf-parser oletools --break-system-packages
sudo apt install -y python3-magic libmagic1
```

Verify:
```bash
pdfid --version 2>/dev/null || python3 -m pdfid --version
mraptor --help 2>/dev/null | head -3
```

---

## 9.1 Why Documents Are Dangerous

A PDF, Word document or Excel file is not data — it is a program. PDF supports JavaScript. Word supports VBA macros. Excel supports XLM macros, DDE, and PowerQuery. All of these have been used to execute code on victim machines.

The attack chain is simple:

```
Email attachment → User opens document → Document executes embedded code
→ Code downloads second-stage payload → Attacker has shell
```

The sophistication is in making the document look legitimate enough that the user opens it. A defender's job is to triage the document before it reaches the user.

---

## 9.2 PDF Analysis

### Structure of a PDF

Every PDF is a tree of numbered objects. Malicious content lives in specific object types:

| Object/Keyword | What it does | Risk |
|---|---|---|
| `/JS` or `/JavaScript` | Embeds JavaScript | HIGH — executes on open |
| `/OpenAction` | Runs automatically when PDF opens | HIGH |
| `/AA` (Additional Actions) | Runs on page events | HIGH |
| `/Launch` | Launches an external program | CRITICAL |
| `/EmbeddedFile` | Contains an attached file | MEDIUM |
| `/URI` | Hyperlink (can be to malicious URL) | MEDIUM |
| `/RichMedia` | Flash content (obsolete but still seen) | LOW |

### pdfid — First Pass Triage

`pdfid` counts suspicious keywords in a PDF. Run it first on any unknown PDF:

```bash
pdfid suspicious.pdf
```

Sample output for a malicious PDF:
```
PDFiD 0.2.8 suspicious.pdf
 PDF Header: %PDF-1.6
 obj                   23
 endobj                23
 stream                 8
 endstream              8
 xref                   1
 trailer                1
 startxref              1
 /Page                  3
 /Encrypt               0
 /ObjStm                0
 /JS                    1    <-- RED FLAG
 /JavaScript            1    <-- RED FLAG
 /OpenAction            1    <-- RED FLAG
 /AcroForm              1
 /JBIG2Decode           0
 /RichMedia             0
 /Launch                0
 /EmbeddedFile          1    <-- WORTH INVESTIGATING
 /XFA                   0
```

Any non-zero value for `/JS`, `/JavaScript`, `/OpenAction`, `/Launch` means the PDF executes code. Escalate immediately.

### pdf-parser — Deep Inspection

`pdf-parser` lets you examine individual objects:

```bash
# List all objects
pdf-parser suspicious.pdf

# Extract JavaScript content
pdf-parser --search javascript suspicious.pdf

# Extract and decompress a stream (FlateDecode is zlib compression)
pdf-parser --object 7 --filter suspicious.pdf

# Search for specific keywords
pdf-parser --search openaction suspicious.pdf
```

### Extracting Embedded Files

```bash
# Find the EmbeddedFile object number first
pdf-parser --search embeddedfile suspicious.pdf

# Extract the stream from that object (replace 7 with actual object number)
pdf-parser --object 7 --filter --raw suspicious.pdf > extracted_payload.bin

# Identify what it is
file extracted_payload.bin
strings extracted_payload.bin | head -20
sha256sum extracted_payload.bin
```

---

## 9.3 Office Document Analysis (OLE/VBA)

### OLE Structure

Old-format Office files (.doc, .xls, .ppt) and newer macro-enabled formats (.docm, .xlsm) store content in OLE containers — essentially a mini filesystem inside a file.

### oletools Suite

```bash
# Quick triage — flags suspicious features
mraptor suspicious.docm

# List all OLE streams
oleid suspicious.docm

# Extract VBA macros
olevba suspicious.docm

# Extract embedded objects
oleobj suspicious.docm
```

### Reading olevba Output

```
olevba output:
  Suspicious keywords: AutoOpen, Shell, CreateObject, WScript
  IOCs found: http://malicious.example.com/payload.exe
```

Key VBA keywords that indicate malice:

| Keyword | Why Suspicious |
|---|---|
| `AutoOpen` / `Auto_Open` | Runs automatically when document opens |
| `Shell` | Executes system commands |
| `CreateObject` | Creates COM objects — used to run PowerShell, WScript |
| `WScript.Shell` | Windows Script Host — runs commands |
| `PowerShell` | Downloads and executes code |
| `Chr()` with concatenation | String obfuscation technique |
| `Base64` / `decode` | Encoding to hide payload |

### Extracting the Macro

```bash
olevba --decode suspicious.docm
olevba --deobfuscate suspicious.docm
```

The `--deobfuscate` flag attempts to resolve `Chr()` obfuscation automatically.

---

## 9.4 ATT&CK Mapping for Document Threats

| Technique | ATT&CK ID | Common in |
|---|---|---|
| Malicious PDF | T1566.001 | Spearphishing attachment |
| VBA macro execution | T1059.005 | Office documents |
| PowerShell via macro | T1059.001 | .docm, .xlsm |
| Embedded executable | T1027.009 | .doc, .pdf |
| Auto-execution on open | T1204.002 | All document types |
| Download second stage | T1105 | Any |

---

## 9.5 Safe Analysis Workflow

Never double-click an unknown document. The correct workflow:

```
1. Hash immediately (sha256sum)
2. file command — confirm type matches extension
3. pdfid / oleid — quick keyword triage
4. strings — look for URLs, IPs, suspicious function names
5. pdf-parser / olevba — extract and read embedded content
6. Extract embedded files — analyse separately as new samples
7. Only execute in an isolated VM with network monitoring if step 1-6 is inconclusive
```

The goal of steps 1–6 is to extract the payload without executing the document. In most cases, you can recover the full payload statically.

---

## 9.6 Regional Context — Africa-Specific Threats

Document malware is the primary attack vector against civil society in Sub-Saharan Africa. Documented campaigns against journalists and human rights defenders in the region consistently use:

- **PDF invoices or grants** with embedded JavaScript droppers
- **Word documents** with macros disguised as COVID-19 information, election results or government notices
- **Excel files** with XLM macros (older technique, still effective against unpatched Office)

The social engineering is context-specific — an "urgent payment" PDF during a conference, or a "press freedom report" Word document sent to a journalist. The technical payloads are often commodity RATs (Agent Tesla, njRAT, AsyncRAT) or commercial spyware.

The analysis techniques in this module apply directly to those real-world cases.

---

## 9.7 Lab

See [Lab 09 — Document Malware Analysis](../labs/lab09_document_analysis.md)

---

## 9.8 Challenge

**The Suspicious Invoice**

You receive `decoy_invoice.pdf` (in `samples/`). The sender claims it is a PDF invoice requiring urgent payment. Analyse it using only the tools in this module — do not open it in a PDF reader.

1. Run pdfid and document every suspicious keyword count
2. Identify the object number containing the embedded file
3. Extract and decompress the embedded stream
4. Read the extracted content and find the flag

**Flag format:** `FLAG{pdf_stream_decoded_embedded_payload_found}`

Generate the sample first:
```bash
python3 ~/course/samples/generate_decoy_pdf.py
```

---

## 9.9 RTF and Excel 4.0 Macro Analysis

Two document formats that antivirus consistently underperforms on: RTF and Excel 4.0 (XLM) macros.

### RTF — No Macros, Still Dangerous

RTF files cannot contain VBA. They can contain OLE objects. Attackers exploit equation editor vulnerabilities (CVE-2017-11882 is still active in 2026 against unpatched deployments) and embed shellcode inside RTF object data.

```bash
# rtfobj from oletools extracts embedded OLE objects
rtfobj suspicious.rtf

# Check for equation editor exploit indicators
strings suspicious.rtf | grep -iE "equation|eqnedt32|equation.3|shellcode|8.0"

# High object count + equation references = strong indicator
rtfobj -d /tmp/rtf_extracted/ suspicious.rtf
file /tmp/rtf_extracted/*
```

What to look for in rtfobj output:
- Objects with `OLE package` type (can contain any executable)
- Equation editor objects (`OLE equation.3`)
- Objects with suspicious size (shellcode is typically 300–1000 bytes)

### Excel 4.0 (XLM) Macros

XLM macros predate VBA by a decade. Many AV engines do not detect them because they look like ordinary spreadsheet cells. The malicious formula lives in the cell content, not in a VBA module. `olevba` does not always catch them — use `xlmdeobfuscator` instead.

```bash
pip3 install xlmdeobfuscator --break-system-packages 2>/dev/null | tail -1

# Deobfuscate XLM macros from an XLSX/XLS file
xlmdeobfuscator --file suspicious.xlsx 2>/dev/null | head -40

# What to look for in output:
# EXEC, CALL, URLDownloadToFile, WinExec, Shell — execution
# FORMULA cells that write to other cells — self-modifying macro
# Hidden sheets (Very Hidden status)
```

XLM macros that auto-execute are stored in sheets with names like `Macro1`, `Auto_Open`, or encoded as `HIDDEN_MACRO`. The macro runs on file open, identical to VBA AutoOpen.

### RTF Knowledge Check

**Why is CVE-2017-11882 still relevant in 2026?**

Many organisations in Southern Africa run older Microsoft Office versions on restricted budgets, particularly governments and local NGOs. A 2017 vulnerability is still live on those endpoints. Phishing campaigns targeting African civil society frequently weaponise this CVE specifically because the patching rate in the region is lower than Western targets.

---

## 9.10 Knowledge Check

1. **`pdfid` shows `/JavaScript: 2` and `/EmbeddedFile: 1` in a PDF claiming to be a tax invoice. What are the two next commands you run and why?**

   <details>
   <summary>Answer</summary>
   (1) `pdf-parser --search=JavaScript suspicious.pdf` — to extract and read the JavaScript content without executing it. JavaScript in a PDF is almost never legitimate; it is used for auto-execution of exploits or redirects. (2) `pdf-parser --search=EmbeddedFile suspicious.pdf` followed by `pdf-parser --object=N --raw suspicious.pdf | python3 -c "import sys,zlib; print(zlib.decompress(sys.stdin.buffer.read()))"` — to extract the embedded file. In a tax invoice there should be no embedded file. Whatever is embedded is the second-stage payload.
   </details>

2. **`olevba` shows `AutoOpen`, `Shell`, and `Chr()` in a Word document's VBA. Explain what each indicator means and the combined verdict.**

   <details>
   <summary>Answer</summary>
   `AutoOpen` means the macro runs automatically when the document opens — no user interaction needed beyond opening the file. `Shell` means the macro executes an operating system command — it can run any executable or command line. `Chr()` is character-by-character string construction: `Chr(99)&Chr(109)&Chr(100)` = "cmd" — this technique evades string-based detection because the command is never stored as a literal string. Combined verdict: this document executes a system command automatically on open, using obfuscated string construction to hide what the command is. Classify as MALICIOUS — do not open outside an isolated analysis VM.
   </details>

3. **A journalist sends you a `.docx` file and says she just received it from an unknown source. You open it on your analysis VM and it prompts "Enable editing" then "Enable macros." What do you tell her about her situation?**

   <details>
   <summary>Answer</summary>
   The two-step prompt is a social engineering technique called "Template Injection with macro lure" — Office intentionally opens unknown documents in Protected View, and the attacker designs the lure to convince users to click through both warnings. Tell her: (1) Do not click Enable Macros on any document from an unknown source — ever. The prompt means the document contains code that wants to run on her computer. (2) If she has already opened it on her actual machine and clicked Enable Macros, assume her machine is compromised and contact DSA immediately. (3) The correct analysis is what you are doing now — static analysis in an isolated VM, never clicking Enable Macros.
   </details>
