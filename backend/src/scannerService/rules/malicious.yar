// ============================================================================
// SECTION 1 — IMAGE STEGANOGRAPHY
// ============================================================================

rule RealLife_Image_Stego_MZ
{
    meta:
        description   = "Detects hidden Windows PE (MZ) header embedded inside Image files"
        threat_level  = "Critical"
        author        = "Updated v2.0"
        fix_notes     = "Lowered MZ search window from 1024 to 2; added BMP and WebP headers"

    strings:
        $header_jpg  = { FF D8 FF }
        $header_png  = { 89 50 4E 47 0D 0A 1A 0A }
        $header_gif  = { 47 49 46 38 }                   // GIF87a / GIF89a
        $header_bmp  = { 42 4D }                          // BMP — added v2.0
        $header_webp = { 52 49 46 46 }                    // WebP (RIFF) — added v2.0
        $header_tiff_le = { 49 49 2A 00 }                 // TIFF little-endian
        $header_tiff_be = { 4D 4D 00 2A }                 // TIFF big-endian

        $mz_marker   = { 4D 5A }                          // PE/MZ signature

    condition:
        (any of ($header_*)) at 0
        and $mz_marker in (2..filesize)                   // FIX: was 1024, now 2
}

rule RealLife_Image_Stego_ELF
{
    meta:
        description  = "Detects hidden ELF binary embedded inside Image files"
        threat_level = "Critical"
        author       = "Added v2.0"

    strings:
        $header_jpg  = { FF D8 FF }
        $header_png  = { 89 50 4E 47 0D 0A 1A 0A }
        $header_gif  = { 47 49 46 38 }
        $header_bmp  = { 42 4D }
        $header_webp = { 52 49 46 46 }

        $elf_marker  = { 7F 45 4C 46 }                    // ELF magic

    condition:
        (any of ($header_*)) at 0
        and $elf_marker in (2..filesize)
}


// ============================================================================
// SECTION 2 — PDF EXPLOITS
// ============================================================================

rule RealLife_PDF_Exploit_Objects
{
    meta:
        description  = "Detects PDF objects commonly used in weaponized documents"
        threat_level = "High"
        author       = "Updated v2.0"
        fix_notes    = "Added /Launch, /EmbeddedFile, /RichMedia; kept threshold at 3-of"
        reference    = "CVE-2010-1240, CVE-2008-2992"

    strings:
        $magic = { 25 50 44 46 }          // %PDF

        // JavaScript execution vectors
        $s1 = "/JavaScript"    nocase
        $s2 = "/JS"            nocase

        // Auto-trigger actions
        $s3 = "/OpenAction"    nocase
        $s4 = "/AA"            nocase     // Additional Actions dict

        // Form/XFA abuse
        $s5 = "/AcroForm"      nocase
        $s6 = "/XFA"           nocase

        // Dropper/execution vectors — added v2.0
        $s7 = "/Launch"        nocase     // CVE-2010-1240
        $s8 = "/EmbeddedFile"  nocase     // File dropper
        $s9 = "/RichMedia"     nocase     // Flash exploit vector
        $s10 = "/URI"          nocase     // SSRF / redirect abuse

    condition:
        $magic at 0
        and (3 of ($s*))                  // Require 3 suspicious objects
}

rule RealLife_PDF_Shellcode_Stream
{
    meta:
        description  = "Detects encoded shellcode payloads in PDF streams"
        threat_level = "Critical"
        author       = "Added v2.0"

    strings:
        $magic      = { 25 50 44 46 }     // %PDF
        $stream     = "stream"
        $filter1    = "/FlateDecode"
        $filter2    = "/ASCIIHexDecode"
        $filter3    = "/ASCII85Decode"
        $filter4    = "/LZWDecode"
        $shellcode1 = { E8 00 00 00 00 58 }
        $shellcode2 = { EB 0E 5B 48 31 C0 }

    condition:
        $magic at 0
        and $stream
        and (any of ($filter*))
        and (any of ($shellcode*))
}


// ============================================================================
// SECTION 3 — OFFICE MACRO EXPLOITS
// ============================================================================

rule RealLife_Office_VBA_Macro_OLE
{
    meta:
        description  = "Detects malicious VBA auto-exec macros in legacy OLE Office files (.doc/.xls/.ppt)"
        threat_level = "High"
        author       = "Updated v2.0"
        fix_notes    = "Added AutoClose, Auto_Open, Workbook_Activate, Chr(), Environ(), Shell()"

    strings:
        // OLE Structured Storage magic — legacy Office formats only
        $magic = { D0 CF 11 E0 A1 B1 1A E1 }

        // Auto-execution triggers
        $a1 = "AutoOpen"            nocase
        $a2 = "Document_Open"       nocase
        $a3 = "Workbook_Open"       nocase
        $a4 = "AutoClose"           nocase    // added v2.0
        $a5 = "Auto_Open"           nocase    // added v2.0
        $a6 = "Workbook_Activate"   nocase    // added v2.0
        $a7 = "AutoExec"            nocase    // added v2.0

        // Shell/execution capabilities
        $s1 = "Shell"               nocase
        $s2 = "CreateObject"        nocase
        $s3 = "WScript.Shell"       nocase
        $s4 = "powershell"          nocase
        $s5 = "Chr("                nocase    // added v2.0 — obfuscation helper
        $s6 = "Environ("            nocase    // added v2.0 — env var access
        $s7 = "Shell("              nocase    // added v2.0
        $s8 = "CallByName"          nocase    // added v2.0 — reflection abuse
        $s9 = "StrReverse"          nocase    // added v2.0 — string obfuscation

    condition:
        $magic at 0
        and (any of ($a*))
        and (any of ($s*))
}

rule RealLife_Office_VBA_Macro_OOXML
{
    meta:
        description  = "Detects malicious VBA auto-exec macros in modern OOXML Office files (.docm/.xlsm/.pptm)"
        threat_level = "High"
        author       = "Added v2.0 — CRITICAL: old rule missed all modern Office formats"

    strings:
        // ZIP/OOXML magic (PK header) — covers .docm, .xlsm, .pptm
        $magic = { 50 4B 03 04 }

        // OOXML-specific macro entry point indicators
        $ooxml1 = "vbaProject.bin"  nocase
        $ooxml2 = "xl/vbaProject"   nocase
        $ooxml3 = "word/vbaProject" nocase

        // Auto-execution triggers
        $a1 = "AutoOpen"            nocase
        $a2 = "Document_Open"       nocase
        $a3 = "Workbook_Open"       nocase
        $a4 = "AutoClose"           nocase
        $a5 = "Auto_Open"           nocase
        $a6 = "Workbook_Activate"   nocase
        $a7 = "AutoExec"            nocase

        // Shell/execution capabilities
        $s1 = "Shell"               nocase
        $s2 = "CreateObject"        nocase
        $s3 = "WScript.Shell"       nocase
        $s4 = "powershell"          nocase
        $s5 = "Chr("                nocase
        $s6 = "Environ("            nocase
        $s7 = "CallByName"          nocase

    condition:
        $magic at 0
        and (any of ($ooxml*))
        and (any of ($a*))
        and (any of ($s*))
}

rule RealLife_Office_VBA_Macro_XLSB
{
    meta:
        description  = "Detects malicious macros in binary Excel workbooks (.xlsb) — commonly used to evade detection"
        threat_level = "High"
        author       = "Added v2.0"

    strings:
        // XLSB uses CFB like legacy but with different internal stream names
        $magic = { D0 CF 11 E0 A1 B1 1A E1 }
        $xlsb1 = "Workbook"
        $xlsb2 = "xl/workbook.bin"

        $a1 = "AutoOpen"            nocase
        $a2 = "Auto_Open"           nocase
        $a3 = "Workbook_Open"       nocase

        $s1 = "Shell"               nocase
        $s2 = "powershell"          nocase
        $s3 = "CreateObject"        nocase

    condition:
        $magic at 0
        and (any of ($xlsb*))
        and (any of ($a*))
        and (any of ($s*))
}


// ============================================================================
// SECTION 4 — MEDIA FILE HEAP SPRAY & NOP SLEDS
// ============================================================================

rule RealLife_Video_Heap_Spray
{
    meta:
        description  = "Detects NOP sleds and heap spray patterns scoped to video files"
        threat_level = "Critical"
        author       = "Updated v2.0"
        fix_notes    = "Added file-type anchoring — old rule fired on any binary file"

    strings:
        // Video format magic bytes
        $mp4_ftyp  = { 00 00 00 ?? 66 74 79 70 }    // MP4/MOV ftyp box
        $avi_riff  = { 52 49 46 46 }                  // AVI (RIFF container)
        $mkv_ebml  = { 1A 45 DF A3 }                  // MKV/WebM EBML
        $flv_magic = { 46 4C 56 01 }                  // FLV
        $wmv_magic = { 30 26 B2 75 8E 66 CF 11 }      // WMV/ASF

        // Attack patterns
        $nop_sled   = { 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 }
        $heap_spray = { 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C }
        $heap_alt   = { 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D }

    condition:
        (any of ($mp4_ftyp, $avi_riff, $mkv_ebml, $flv_magic, $wmv_magic)) at 0
        and (any of ($nop_sled, $heap_spray, $heap_alt))
}

rule RealLife_Audio_Heap_Spray
{
    meta:
        description  = "Detects NOP sleds and heap spray patterns scoped to audio files"
        threat_level = "Critical"
        author       = "Added v2.0"

    strings:
        // Audio format magic bytes
        $mp3_id3   = { 49 44 33 }                     // MP3 ID3 tag
        $mp3_sync  = { FF FB }                         // MP3 frame sync
        $wav_riff  = { 52 49 46 46 }                   // WAV (RIFF container)
        $ogg_magic = { 4F 67 67 53 }                   // OGG
        $flac_magic= { 66 4C 61 43 }                   // FLAC
        $aac_adts  = { FF F1 }                         // AAC ADTS

        // Attack patterns
        $nop_sled   = { 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 }
        $heap_spray = { 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C 0C }
        $heap_alt   = { 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D 0D }

    condition:
        (any of ($mp3_id3, $mp3_sync, $wav_riff, $ogg_magic, $flac_magic, $aac_adts)) at 0
        and (any of ($nop_sled, $heap_spray, $heap_alt))
}


// ============================================================================
// SECTION 5 — SHELLCODE PATTERNS
// ============================================================================

rule RealLife_Shellcode_In_Document
{
    meta:
        description  = "Detects shellcode byte patterns embedded inside non-PE, non-ZIP document files"
        threat_level = "High"
        author       = "Updated v2.0"
        fix_notes    = "Added PE and ZIP exclusions to drastically cut false positives on legitimate binaries"

    strings:
        // Call/pop — position-independent shellcode prologue
        $s1 = { E8 00 00 00 00 58 }

        // JMP/pop — alternative PIC prologue (Linux/x64)
        $s2 = { EB 0E 5B 48 31 C0 }

        // PEB access via FS segment (Windows shellcode)
        $s3 = { 64 A1 30 00 00 00 }

        // WOW64 / x64 PEB access
        $s4 = { 65 48 8B 04 25 60 00 00 00 }

        // Common Windows API hash resolution stub
        $s5 = { 60 89 E5 31 D2 64 8B 52 30 }

        // Linux x86 execve("/bin/sh") shellcode pattern
        $s6 = { 31 C0 50 68 2F 2F 73 68 68 2F 62 69 6E 89 E3 }

    condition:
        // FIX: Exclude standalone PE files and ZIP archives (huge FP source)
        not (uint16(0) == 0x5A4D)          // not MZ/PE
        and not (uint32(0) == 0x04034B50)  // not ZIP/OOXML
        and not (uint32(0) == 0x464c457f)  // not ELF
        and (any of ($s*))
}

rule RealLife_Shellcode_In_Media
{
    meta:
        description  = "Detects shellcode patterns inside media files — common in player exploits"
        threat_level = "Critical"
        author       = "Added v2.0"

    strings:
        $mp4_ftyp  = { 00 00 00 ?? 66 74 79 70 }
        $avi_riff  = { 52 49 46 46 }
        $mkv_ebml  = { 1A 45 DF A3 }
        $flv_magic = { 46 4C 56 01 }
        $mp3_id3   = { 49 44 33 }
        $wav_riff  = { 52 49 46 46 }

        $s1 = { E8 00 00 00 00 58 }
        $s2 = { EB 0E 5B 48 31 C0 }
        $s3 = { 64 A1 30 00 00 00 }
        $s4 = { 65 48 8B 04 25 60 00 00 00 }

    condition:
        (any of ($mp4_ftyp, $avi_riff, $mkv_ebml, $flv_magic, $mp3_id3, $wav_riff)) at 0
        and (any of ($s1, $s2, $s3, $s4))
}


// ============================================================================
// SECTION 6 — WEBSHELLS (PHP / Node.js / ASP)
// ============================================================================

rule RealLife_PHP_Webshell
{
    meta:
        description  = "Detects command execution webshell patterns in PHP scripts"
        threat_level = "High"
        author       = "Updated v2.0"
        fix_notes    = "Fixed condition so $p1 alone cannot satisfy rule; added passthru/proc_open"

    strings:
        $php_open = "<?php"                          // PHP opening tag

        // Dangerous execution functions — require at least one of these
        $exec1 = "eval(base64_decode("               nocase
        $exec2 = "system($_GET["                     nocase
        $exec3 = "shell_exec("                       nocase
        $exec4 = "passthru("                         nocase    // added v2.0
        $exec5 = "proc_open("                        nocase    // added v2.0
        $exec6 = "popen("                            nocase    // added v2.0
        $exec7 = "exec("                             nocase    // added v2.0
        $exec8 = "assert($_"                         nocase    // added v2.0 — assert abuse
        $exec9 = "preg_replace.*\/e"                 nocase    // added v2.0 — /e modifier RCE (PHP <7)

        // Input vector — receiving from HTTP request
        $input1 = "$_GET["                           nocase
        $input2 = "$_POST["                          nocase
        $input3 = "$_REQUEST["                       nocase
        $input4 = "$_COOKIE["                        nocase
        $input5 = "php://input"                      nocase

    condition:
        $php_open
        and (any of ($exec*))                        // FIX: now requires a dangerous function
        and (any of ($input*))                       // FIX: and an HTTP input source
}

rule RealLife_PHP_Webshell_Obfuscated
{
    meta:
        description  = "Detects obfuscated PHP webshells using encoding chains"
        threat_level = "High"
        author       = "Added v2.0"

    strings:
        $php_open = "<?php"

        // Encoding/obfuscation chains
        $ob1 = "base64_decode("   nocase
        $ob2 = "str_rot13("       nocase
        $ob3 = "gzinflate("       nocase
        $ob4 = "gzuncompress("    nocase
        $ob5 = "rawurldecode("    nocase
        $ob6 = "hex2bin("         nocase
        $ob7 = "str_replace("     nocase

        // Eval/assert executing decoded payload
        $ex1 = "eval("            nocase
        $ex2 = "assert("          nocase
        $ex3 = "call_user_func("  nocase

    condition:
        $php_open
        and (2 of ($ob*))         // At least 2 encoding layers (chained obfuscation)
        and (any of ($ex*))       // Executing the decoded output
}

rule RealLife_NodeJS_Webshell
{
    meta:
        description  = "Detects command execution webshells in Node.js scripts"
        threat_level = "High"
        author       = "Updated v2.0"
        fix_notes    = "Fixed: process.env alone was far too broad — now requires exec context too"

    strings:
        // Process/child process execution
        $exec1 = "child_process.exec("    nocase
        $exec2 = "child_process.spawn("   nocase
        $exec3 = "child_process.execSync(" nocase
        $exec4 = "require('child_process')" nocase
        $exec5 = "require(\"child_process\")" nocase

        // HTTP input vectors
        $input1 = "req.query."            nocase
        $input2 = "req.body."             nocase
        $input3 = "req.params."           nocase

        // Env abuse (only meaningful with exec context)
        $env1 = "process.env"

    condition:
        (any of ($exec*))                 // FIX: exec is now required, not optional
        and (any of ($input*))            // Must also receive user-controlled input
}

rule RealLife_ASP_Webshell
{
    meta:
        description  = "Detects command execution webshells in ASP/ASPX scripts"
        threat_level = "High"
        author       = "Added v2.0"

    strings:
        $asp_open1 = "<%"
        $asp_open2 = "<script runat=\"server\">"       nocase
        $asp_open3 = "<script runat='server'>"         nocase

        // Execution sinks
        $exec1 = "Process.Start("                      nocase
        $exec2 = "Shell("                              nocase
        $exec3 = "WScript.Shell"                       nocase
        $exec4 = "CreateObject(\"Wscript.Shell\")"     nocase
        $exec5 = "cmd.exe"                             nocase

        // Input vectors
        $input1 = "Request.QueryString"                nocase
        $input2 = "Request.Form"                       nocase
        $input3 = "Request[\"" 
        $input4 = "Request['"

    condition:
        (any of ($asp_open*))
        and (any of ($exec*))
        and (any of ($input*))
}


// ============================================================================
// SECTION 7 — BONUS: POLYGLOT FILE DETECTION
// ============================================================================

rule RealLife_Polyglot_PDF_ZIP
{
    meta:
        description  = "Detects PDF/ZIP polyglot files — valid as both formats simultaneously; used in parser confusion attacks"
        threat_level = "High"
        author       = "Added v2.0"
        reference    = "https://github.com/corkami/pocs/tree/master/poly"

    strings:
        $pdf_magic = { 25 50 44 46 }      // %PDF at start
        $zip_eocd  = { 50 4B 05 06 }      // ZIP End of Central Directory

    condition:
        $pdf_magic at 0
        and $zip_eocd in ((filesize - 22)..(filesize))
}

rule RealLife_Polyglot_Image_ZIP
{
    meta:
        description  = "Detects Image/ZIP polyglot files — ZIP data appended to valid image"
        threat_level = "High"
        author       = "Added v2.0"

    strings:
        $header_jpg  = { FF D8 FF }
        $header_png  = { 89 50 4E 47 0D 0A 1A 0A }
        $header_gif  = { 47 49 46 38 }
        $zip_local   = { 50 4B 03 04 }    // ZIP local file header
        $zip_eocd    = { 50 4B 05 06 }    // ZIP End of Central Directory

    condition:
        (any of ($header_*)) at 0
        and $zip_local in (100..filesize)
        and $zip_eocd in ((filesize - 22)..(filesize))
}


// ============================================================================
// SECTION 8 — BONUS: MALICIOUS RTF DOCUMENTS
// ============================================================================

rule RealLife_RTF_Exploit_Object
{
    meta:
        description  = "Detects OLE object embedding in RTF documents — used in CVE-2017-11882 (Equation Editor) and similar"
        threat_level = "Critical"
        author       = "Added v2.0"
        reference    = "CVE-2017-11882, CVE-2018-0802"

    strings:
        $rtf_magic  = { 7B 5C 72 74 66 }          // {\rtf
        $obj1       = "\\objdata"      nocase
        $obj2       = "\\object"       nocase
        $obj3       = "\\objocx"       nocase       // OCX control embedding
        $equation   = "0002CE020000"               // Equation Editor OLE CLSID fragment
        $exploit1   = "d0cf11e0"                   // OLE header in hex (inside RTF stream)

    condition:
        $rtf_magic at 0
        and (any of ($obj*))
        and (any of ($equation, $exploit1))
}
