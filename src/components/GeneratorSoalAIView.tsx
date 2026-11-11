import React, { useState } from "react";
import { 
  Sparkles, 
  Printer, 
  Download, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  KeyRound, 
  Copy, 
  RotateCcw,
  School,
  ArrowRight,
  ArrowLeft,
  Check,
  HelpCircle,
  BookOpen,
  ClipboardList,
  Target,
  Sliders,
  FileCheck2,
  FileSpreadsheet
} from "lucide-react";
import { Pengaturan } from "../types";
import { notifySimpanSuccess, notifySimpanError, notifyUnduhSuccess } from "../lib/swal";

interface GeneratorSoalAIViewProps {
  config: Pengaturan;
}

// Simple and robust Markdown to HTML renderer for Kartu Soal preview
function parseMarkdownToHtml(md: string): string {
  if (!md) return "";
  let html = md;

  // Escape HTML tags to prevent XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold text-blue-900 mt-6 mb-3 pb-1 border-b-2 border-blue-600">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black text-slate-950 mt-6 mb-4">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

  // Unordered Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 py-0.5">$1</li>');
  html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 py-0.5">$1</li>');

  // Ordered Lists
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-slate-700 py-0.5"><strong class="text-slate-900">$1.</strong> $2</li>');

  // Blockquotes / Callouts
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-amber-500 bg-amber-50/50 p-2 my-2 text-slate-800 text-xs italic rounded-r">$1</blockquote>');

  // Simple Markdown Tables Parser
  const lines = html.split("\n");
  let inTable = false;
  let tableBuffer: string[] = [];
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(line);
    } else {
      if (inTable) {
        // Process tableBuffer
        processedLines.push(convertTableBufferToHtml(tableBuffer));
        inTable = false;
        tableBuffer = [];
      }
      processedLines.push(lines[i]);
    }
  }

  if (inTable && tableBuffer.length > 0) {
    processedLines.push(convertTableBufferToHtml(tableBuffer));
  }

  html = processedLines.join("\n");

  // Paragraphs
  html = html.replace(/\n\n+/g, '<div class="my-2"></div>');

  return html;
}

function convertTableBufferToHtml(buffer: string[]): string {
  if (buffer.length < 2) return buffer.join("\n");
  
  let html = '<div class="overflow-x-auto my-3 rounded-xl border border-slate-300 shadow-sm"><table class="min-w-full text-xs text-left border-collapse">';
  
  // Header row
  const headerCells = buffer[0].split("|").slice(1, -1).map(c => c.trim());
  html += '<thead class="bg-blue-900 text-white font-bold"><tr>';
  headerCells.forEach(cell => {
    html += `<th class="p-2.5 border border-blue-800 text-center font-bold">${cell}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Body rows (skip separator at index 1)
  const startRow = buffer[1].includes("---") ? 2 : 1;
  for (let r = startRow; r < buffer.length; r++) {
    const cells = buffer[r].split("|").slice(1, -1).map(c => c.trim());
    const isEven = (r - startRow) % 2 === 0;
    html += `<tr class="${isEven ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/50 transition">`;
    cells.forEach((cell, cellIdx) => {
      const isCenter = cellIdx === 0 || cell.length <= 4;
      html += `<td class="p-2 border border-slate-300 ${isCenter ? 'text-center' : 'text-left'} text-slate-800">${cell}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

export const GeneratorSoalAIView: React.FC<GeneratorSoalAIViewProps> = ({ config }) => {
  // Main Step Tab: "tahap1" (Kartu Soal) vs "tahap2" (Naskah Ujian Siap Cetak)
  const [mainStep, setMainStep] = useState<"tahap1" | "tahap2">("tahap1");

  // Tahap 1 State: Generator Kartu Soal
  const [isGeneratingKartu, setIsGeneratingKartu] = useState(false);
  const [kartuSoalMarkdown, setKartuSoalMarkdown] = useState<string>("");
  const [kartuFormData, setKartuFormData] = useState({
    school: config.Nama_Sekolah || "SMA Negeri 1 Terentang",
    subject: "Pendidikan Pancasila",
    level: "Fase E / Kelas X",
    curriculum: "Kurikulum Merdeka",
    mainTopic: "Gagasan Para Pendiri Bangsa & Penerapan Nilai-Nilai Pancasila",
    duration: "90 Menit",
    assessmentType: "Sumatif" as "Formatif" | "Sumatif",
    totalQuestions: "10 Butir Soal (5 Pilihan Ganda, 3 Isian Singkat, 2 Uraian)",
    cognitiveSpread: "30% LOTS (C1-C2), 40% MOTS (C3), 30% HOTS (C4-C6)",
    questionTypesSpread: "Pilihan Ganda 50%, Isian Singkat 30%, Uraian 20%",
    additionalNotes: "Sertakan stimulus kasus kontekstual kehidupan berbangsa dan kearifan lokal."
  });

  // Tahap 2 State: Naskah Soal Ujian Siap Cetak
  const [activeDoc, setActiveDoc] = useState<"naskah" | "ljs" | "kunci">("naskah");
  const [isGeneratingNaskah, setIsGeneratingNaskah] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState("");

  const [generatedDocs, setGeneratedDocs] = useState<{
    naskah: string;
    ljs: string;
    kunci: string;
  }>({
    naskah: "",
    ljs: "",
    kunci: ""
  });

  const [naskahFormData, setNaskahFormData] = useState({
    school: config.Nama_Sekolah || "SMA Negeri 1 Terentang",
    subject: "Pendidikan Pancasila",
    level: "Fase E / Kelas X",
    examType: "Asesmen Sumatif Akhir Semester (SAS)",
    year: "2026/2027 - Semester Ganjil",
    examDate: "Senin, 1 Desember 2026",
    duration: "90 Menit",
    totalQuestions: "30 Butir Soal (20 PG, 5 Isian Singkat, 5 Uraian)",
    teacher: config.Nama_Guru || "Hengki Guslau,S.Pd.,Gr",
    nipTeacher: config.NIP_Guru || "199001302024211019",
    cityDate: `${config.Tempat_Tanda_Tangan || "Terentang"}, 1 Desember 2026`,
    principal: config.Nama_Kepsek || "Drs. Sudari,M.Pd",
    nipPrincipal: config.NIP_Kepsek || "196710061994121002",
    logoUrl: config.Logo_Kiri || config.Logo_Kanan || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    sumberMateri: ""
  });

  // Document types for Tahap 2
  const docTabs = [
    { 
      id: "naskah", 
      label: "1. Naskah Soal Ujian", 
      badge: "Siap Cetak", 
      icon: FileText,
      desc: "Kop naskah resmi, petunjuk umum formal, butir soal PG/Isian/Uraian A4" 
    },
    { 
      id: "ljs", 
      label: "2. Lembar Jawaban Siswa (LJS)", 
      badge: "LJS", 
      icon: Layers,
      desc: "Kolom identitas peserta, grid opsi PG bulatan/kotak, garis isian & uraian" 
    },
    { 
      id: "kunci", 
      label: "3. Kunci & Pedoman Penskoran", 
      badge: "Dokumen Guru", 
      icon: KeyRound,
      desc: "Dokumen rahasia guru: kunci tiap butir, rubrik analitik uraian, konversi 0-100" 
    }
  ];

  // -------------------------------------------------------------
  // TAHAP 1: Handler Generate Kartu Soal
  // -------------------------------------------------------------
  const handleGenerateKartuSoal = async () => {
    if (!kartuFormData.mainTopic.trim()) {
      notifySimpanError("Silakan isi Materi Pokok / Capaian Pembelajaran terlebih dahulu.");
      return;
    }

    setIsGeneratingKartu(true);
    try {
      const res = await fetch("/api/ai/generate-kartu-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: kartuFormData })
      });

      const data = await res.json();
      if (data.status === "success" && data.markdown) {
        setKartuSoalMarkdown(data.markdown);
        // Automatically sync to Tahap 2 sumberMateri
        setNaskahFormData(prev => ({
          ...prev,
          school: kartuFormData.school,
          subject: kartuFormData.subject,
          level: kartuFormData.level,
          duration: kartuFormData.duration,
          examType: kartuFormData.assessmentType === "Formatif" ? "Asesmen Formatif / Ulangan Harian" : "Asesmen Sumatif Akhir Semester (SAS)",
          sumberMateri: data.markdown
        }));
        notifySimpanSuccess("Kartu Soal & Kisi-Kisi Berhasil Disusun oleh AI!");
      } else {
        throw new Error(data.message || "Gagal menghasilkan Kartu Soal AI");
      }
    } catch (err: any) {
      console.error(err);
      notifySimpanError(err.message || "Terjadi kesalahan saat memproses Kartu Soal AI.");
    } finally {
      setIsGeneratingKartu(false);
    }
  };

  // Transfer Kartu Soal to Step 2
  const handleTransferToStep2 = () => {
    if (!kartuSoalMarkdown) {
      notifySimpanError("Belum ada Kartu Soal yang dihasilkan. Silakan generate Kartu Soal terlebih dahulu.");
      return;
    }
    setNaskahFormData(prev => ({
      ...prev,
      sumberMateri: kartuSoalMarkdown,
      school: kartuFormData.school,
      subject: kartuFormData.subject,
      level: kartuFormData.level,
      duration: kartuFormData.duration
    }));
    setMainStep("tahap2");
    notifySimpanSuccess("Kartu Soal berhasil dialihkan ke Tahap 2 Naskah Soal Ujian!");
  };

  const handleDownloadKartuWord = () => {
    if (!kartuSoalMarkdown) {
      notifySimpanError("Belum ada konten Kartu Soal untuk diunduh.");
      return;
    }

    const htmlContent = parseMarkdownToHtml(kartuSoalMarkdown);
    const filename = `Kartu_Soal_${kartuFormData.subject.replace(/[^a-zA-Z0-9]/g, "_")}_${kartuFormData.level.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;

    const htmlDocument = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Kartu Soal Asesmen</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 56.7pt 56.7pt 56.7pt 56.7pt;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 12px;
          }
          table, th, td {
            border: 1px solid #333;
          }
          th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            padding: 6px;
          }
          td {
            padding: 5px 8px;
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + htmlDocument], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifyUnduhSuccess(`Kartu Soal Word (${filename}) berhasil diunduh!`);
  };

  const handleCopyKartuMarkdown = () => {
    if (!kartuSoalMarkdown) {
      notifySimpanError("Belum ada Kartu Soal untuk disalin.");
      return;
    }
    navigator.clipboard.writeText(kartuSoalMarkdown);
    notifySimpanSuccess("Format Markdown Kartu Soal berhasil disalin ke clipboard!");
  };

  // -------------------------------------------------------------
  // TAHAP 2: Handler Generate Naskah Soal Ujian Siap Cetak
  // -------------------------------------------------------------
  const sanitizeHtmlForOutput = (rawHtml: string) => {
    if (!rawHtml) return "";
    let clean = rawHtml;
    const defaultLogoTag = `<img src="${config.Logo_Kiri || config.Logo_Kanan || 'https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU'}" alt="Logo Sekolah" class="logo-sekolah" style="max-height: 70px; width: auto; float: left; margin-right: 15px; object-fit: contain;" />`;
    
    clean = clean.replace(/\[\s*LOGO[^\n\]]*\]/gi, defaultLogoTag);
    clean = clean.replace(/\[\s*Gambar Logo[^\n\]]*\]/gi, defaultLogoTag);
    clean = clean.replace(/<button[^>]*>.*?cetak.*?<\/button>/gi, "");
    clean = clean.replace(/<a[^>]*>.*?cetak.*?<\/a>/gi, "");
    clean = clean.replace(/🖨️?\s*Cetak\s*Dokumen/gi, "");
    clean = clean.replace(/🖨️/g, "");
    return clean;
  };

  const handleGenerateSingleNaskah = async (targetType: "naskah" | "ljs" | "kunci") => {
    if (!naskahFormData.sumberMateri || !naskahFormData.sumberMateri.trim()) {
      notifySimpanError("Silakan isi kartu soal/kisi-kisi materi ujian terlebih dahulu.");
      return;
    }

    setIsGeneratingNaskah(true);
    const tabMeta = docTabs.find((d) => d.id === targetType);
    setGeneratingProgress(`Menyusun ${tabMeta?.label || targetType} berbasis format resmi...`);

    try {
      const res = await fetch("/api/ai/generate-soal-ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: targetType,
          formData: naskahFormData
        })
      });

      const data = await res.json();
      if (data.status === "success" && data.html) {
        const cleanedHtml = sanitizeHtmlForOutput(data.html);
        setGeneratedDocs((prev) => ({
          ...prev,
          [targetType]: cleanedHtml
        }));
        setActiveDoc(targetType);
        notifySimpanSuccess(`${tabMeta?.label || "Dokumen"} berhasil dibuat!`);
      } else {
        throw new Error(data.message || "Gagal menghasilkan dokumen");
      }
    } catch (err: any) {
      console.error(err);
      notifySimpanError(err.message || "Gagal menghasilkan naskah ujian AI.");
    } finally {
      setIsGeneratingNaskah(false);
      setGeneratingProgress("");
    }
  };

  const handleGenerateAllNaskah = async () => {
    if (!naskahFormData.sumberMateri || !naskahFormData.sumberMateri.trim()) {
      notifySimpanError("Silakan isi kartu soal/kisi-kisi materi ujian terlebih dahulu.");
      return;
    }

    setIsGeneratingNaskah(true);
    try {
      // 1. Naskah Soal
      setGeneratingProgress("1/3 Menyusun Naskah Soal Ujian Lengkap Siap Cetak...");
      const res1 = await fetch("/api/ai/generate-soal-ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "naskah", formData: naskahFormData })
      });
      const data1 = await res1.json();
      const naskahHtml = data1.status === "success" ? sanitizeHtmlForOutput(data1.html) : "";

      // 2. Lembar Jawaban Siswa
      setGeneratingProgress("2/3 Menyusun Lembar Jawaban Siswa (LJS) A4...");
      const res2 = await fetch("/api/ai/generate-soal-ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "ljs", formData: naskahFormData })
      });
      const data2 = await res2.json();
      const ljsHtml = data2.status === "success" ? sanitizeHtmlForOutput(data2.html) : "";

      // 3. Kunci Jawaban & Pedoman Penskoran
      setGeneratingProgress("3/3 Menyusun Kunci Jawaban & Rubrik Penskoran Dokumen Guru...");
      const res3 = await fetch("/api/ai/generate-soal-ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "kunci", formData: naskahFormData })
      });
      const data3 = await res3.json();
      const kunciHtml = data3.status === "success" ? sanitizeHtmlForOutput(data3.html) : "";

      setGeneratedDocs({
        naskah: naskahHtml,
        ljs: ljsHtml,
        kunci: kunciHtml
      });

      setActiveDoc("naskah");
      notifySimpanSuccess("3 Dokumen Ujian Lengkap (Naskah, LJS, dan Kunci) Berhasil Dibuat!");
    } catch (err: any) {
      console.error(err);
      notifySimpanError(err.message || "Gagal menyusun seluruh dokumen ujian AI.");
    } finally {
      setIsGeneratingNaskah(false);
      setGeneratingProgress("");
    }
  };

  const handlePrintA4 = () => {
    const content = generatedDocs[activeDoc];
    if (!content) {
      notifySimpanError("Belum ada dokumen yang dihasilkan untuk dicetak.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifySimpanError("Gagal membuka jendela cetak. Periksa perizinan pop-up browser.");
      return;
    }

    const docTitle = docTabs.find((d) => d.id === activeDoc)?.label || "Naskah Soal Ujian";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - ${naskahFormData.subject} ${naskahFormData.school}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 2cm 2cm 2cm 2cm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11.5pt;
              line-height: 1.45;
              color: #000000;
              margin: 0;
              padding: 0;
            }
            img {
              max-width: 100%;
            }
            table {
              border-collapse: collapse;
            }
            @media print {
              .no-print { display: none !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadNaskahWord = () => {
    const content = generatedDocs[activeDoc];
    if (!content) {
      notifySimpanError("Belum ada dokumen yang dihasilkan untuk diunduh.");
      return;
    }

    const docTypeLabel = activeDoc === "naskah" ? "Naskah_Soal" : activeDoc === "ljs" ? "Lembar_Jawaban" : "Kunci_Penskoran";
    const filename = `${docTypeLabel}_${naskahFormData.subject.replace(/[^a-zA-Z0-9]/g, "_")}_${naskahFormData.level.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;

    const htmlDocument = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${docTypeLabel}</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 56.7pt 56.7pt 56.7pt 56.7pt; /* 2cm margins */
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table, th, td {
            border: 1px solid #333;
          }
          th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${content}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + htmlDocument], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifyUnduhSuccess(`Dokumen Word ${filename} berhasil diunduh!`);
  };

  const handleCopyNaskahHtml = () => {
    const content = generatedDocs[activeDoc];
    if (!content) {
      notifySimpanError("Belum ada dokumen untuk disalin.");
      return;
    }
    navigator.clipboard.writeText(content);
    notifySimpanSuccess("Format HTML dokumen berhasil disalin ke clipboard!");
  };

  return (
    <div className="space-y-6" id="generator-soal-ai-container">
      {/* Top Banner Header */}
      <div 
        id="soal-banner-header"
        className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-400 text-slate-950 font-black px-3.5 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Alur Asesmen & Ujian AI Terpadu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Generator Kartu Soal & Naskah Ujian AI
          </h2>

          <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed">
            Sistem terintegrasi 2 tahap: <strong>(1) Buat Kisi-kisi & Kartu Soal berstandar BSNP/AKM</strong> (level kognitif C1–C6 Bloom, rubrik analitik, umpan balik), kemudian <strong>(2) Konversi otomatis menjadi Naskah Soal Ujian Siap Cetak</strong>, Lembar Jawaban Siswa (LJS), dan Dokumen Kunci Guru.
          </p>
        </div>
      </div>

      {/* Stepper Navigation: Tahap 1 vs Tahap 2 */}
      <div 
        id="soal-stepper-navigation"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <button
          id="btn-step-tahap-1"
          onClick={() => setMainStep("tahap1")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            mainStep === "tahap1"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg ring-2 ring-blue-400/30"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
              mainStep === "tahap1" ? "bg-white text-blue-700 shadow-sm" : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
            }`}>
              1
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>Tahap 1: Generator Kartu Soal & Kisi-Kisi</span>
                {kartuSoalMarkdown && (
                  <CheckCircle2 className={`w-4 h-4 ${mainStep === "tahap1" ? "text-amber-300" : "text-emerald-500"}`} />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${mainStep === "tahap1" ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                Indikator, level kognitif C1-C6, rubrik penskoran, & kaidah penulisan
              </p>
            </div>
          </div>
          <ArrowRight className={`w-5 h-5 shrink-0 ml-2 ${mainStep === "tahap1" ? "text-white" : "text-slate-400"}`} />
        </button>

        <button
          id="btn-step-tahap-2"
          onClick={() => setMainStep("tahap2")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            mainStep === "tahap2"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg ring-2 ring-blue-400/30"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
              mainStep === "tahap2" ? "bg-white text-blue-700 shadow-sm" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300"
            }`}>
              2
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>Tahap 2: Naskah Soal Ujian Siap Cetak (A4)</span>
                {generatedDocs.naskah && (
                  <CheckCircle2 className={`w-4 h-4 ${mainStep === "tahap2" ? "text-amber-300" : "text-emerald-500"}`} />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${mainStep === "tahap2" ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                3 Dokumen: Naskah Soal, Lembar Jawaban Siswa (LJS), & Dokumen Guru
              </p>
            </div>
          </div>
          <ArrowRight className={`w-5 h-5 shrink-0 ml-2 ${mainStep === "tahap2" ? "text-white" : "text-slate-400"}`} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAHAP 1 CONTENT: GENERATOR KARTU SOAL & KISI-KISI                          */}
      {/* ========================================================================= */}
      {mainStep === "tahap1" && (
        <div className="space-y-6" id="tahap1-kartu-soal-view">
          {/* Parameter Form */}
          <div 
            id="form-kartu-soal-card"
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md p-5 sm:p-7 space-y-6"
          >
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Pengaturan Kartu Soal & Kisi-Kisi Asesmen
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lengkapi identitas, kurikulum, alokasi waktu, sebaran level kognitif, dan bentuk soal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Satuan Pendidikan
                </label>
                <input
                  id="kartu-school"
                  type="text"
                  value={kartuFormData.school}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, school: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: SMA Negeri 1 Terentang"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mata Pelajaran
                </label>
                <input
                  id="kartu-subject"
                  type="text"
                  value={kartuFormData.subject}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Pendidikan Pancasila"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kelas / Fase
                </label>
                <input
                  id="kartu-level"
                  type="text"
                  value={kartuFormData.level}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Fase E / Kelas X"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kurikulum
                </label>
                <select
                  id="kartu-curriculum"
                  value={kartuFormData.curriculum}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, curriculum: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                  <option value="Kurikulum 2013 (K13)">Kurikulum 2013 (K13)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jenis Asesmen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKartuFormData({ ...kartuFormData, assessmentType: "Sumatif" })}
                    className={`py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      kartuFormData.assessmentType === "Sumatif"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <span>Sumatif (Nilai)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setKartuFormData({ ...kartuFormData, assessmentType: "Formatif" })}
                    className={`py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      kartuFormData.assessmentType === "Formatif"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <span>Formatif (Proses)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alokasi Waktu
                </label>
                <input
                  id="kartu-duration"
                  type="text"
                  value={kartuFormData.duration}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 90 Menit"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jumlah & Komposisi Butir Soal
                </label>
                <input
                  id="kartu-total-questions"
                  type="text"
                  value={kartuFormData.totalQuestions}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, totalQuestions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 10 Soal (5 PG, 3 Isian Singkat, 2 Uraian)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sebaran Level Kognitif
                </label>
                <input
                  id="kartu-cognitive-spread"
                  type="text"
                  value={kartuFormData.cognitiveSpread}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, cognitiveSpread: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 30% LOTS (C1-C2), 40% MOTS (C3), 30% HOTS (C4-C6)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sebaran Bentuk Soal
                </label>
                <input
                  id="kartu-types-spread"
                  type="text"
                  value={kartuFormData.questionTypesSpread}
                  onChange={(e) => setKartuFormData({ ...kartuFormData, questionTypesSpread: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Pilihan Ganda 50%, Isian Singkat 30%, Uraian 20%"
                />
              </div>
            </div>

            {/* Materi Pokok / CP / KD Input */}
            <div className="space-y-2 pt-2">
              <label className="block font-extrabold text-sm text-slate-900 dark:text-white">
                Materi Pokok / Capaian Pembelajaran (CP) / Kompetensi Dasar (KD)
              </label>
              <textarea
                id="kartu-main-topic"
                rows={3}
                value={kartuFormData.mainTopic}
                onChange={(e) => setKartuFormData({ ...kartuFormData, mainTopic: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed font-medium"
                placeholder="Tuliskan materi pokok, topik pembelajaran, atau CP yang ingin diujikan..."
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                Catatan Khusus / Permintaan Khusus Penulisan Soal (Opsional)
              </label>
              <input
                id="kartu-additional-notes"
                type="text"
                value={kartuFormData.additionalNotes}
                onChange={(e) => setKartuFormData({ ...kartuFormData, additionalNotes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Misal: Sertakan stimulus data statistik, gambar tabel, studi kasus kehidupan nyata..."
              />
            </div>

            {/* Trigger Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                id="btn-generate-kartu-soal"
                onClick={handleGenerateKartuSoal}
                disabled={isGeneratingKartu}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center space-x-2.5 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isGeneratingKartu ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
                <span>Generate Kartu Soal & Kisi-Kisi AI (Langkah 1)</span>
              </button>
            </div>
          </div>

          {/* Kartu Soal Output Container */}
          <div 
            id="output-kartu-soal-card"
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
          >
            {/* Output Header */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">
                    Hasil Kartu Soal & Kisi-Kisi Asesmen
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Format tabel Kisi-kisi, Kartu Soal per nomor, dan Kunci & Rubrik Penskoran
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  id="btn-copy-kartu-markdown"
                  onClick={handleCopyKartuMarkdown}
                  disabled={!kartuSoalMarkdown}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
                  title="Salin Markdown"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </button>

                <button
                  id="btn-download-kartu-word"
                  onClick={handleDownloadKartuWord}
                  disabled={!kartuSoalMarkdown}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Word (.doc)</span>
                </button>

                {kartuSoalMarkdown && (
                  <button
                    id="btn-lanjutkan-ke-tahap-2"
                    onClick={handleTransferToStep2}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Lanjut ke Tahap 2 (Naskah Ujian)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Rendered Preview */}
            <div className="p-4 sm:p-8 overflow-x-auto min-h-[400px] bg-slate-50 dark:bg-slate-900/40">
              {isGeneratingKartu ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                    Ahli Asesmen AI sedang menyusun Kisi-Kisi dan Kartu Soal Lengkap...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    Memetakan Capaian Pembelajaran, menentukan indikator soal terukur, merumuskan stimulus kontekstual, dan menyusun rubrik penskoran analitik.
                  </p>
                </div>
              ) : kartuSoalMarkdown ? (
                <div className="space-y-6">
                  {/* Smart Notification Banner */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          Kartu Soal siap digunakan untuk membuat Naskah Soal Ujian Siap Cetak!
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Klik tombol di sebelah kanan untuk mengubah kartu soal ini menjadi naskah ujian resmi A4 lengkap dengan LJS dan Kunci Guru.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleTransferToStep2}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-2 shrink-0 cursor-pointer active:scale-95"
                    >
                      <span>Jadikan Naskah Ujian (Tahap 2)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rendered HTML from Markdown */}
                  <div 
                    id="kartu-soal-rendered-content"
                    className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 shadow-sm"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(kartuSoalMarkdown) }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center shadow-inner">
                    <Target className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                    Belum Ada Kartu Soal
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Silakan isi parameter asesmen di atas, lalu klik <strong>Generate Kartu Soal & Kisi-Kisi AI</strong> untuk menghasilkan instrumen asesmen lengkap sebelum mencetak naskah ujian.
                  </p>
                  <button
                    onClick={handleGenerateKartuSoal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mulai Generate Kartu Soal Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 2 CONTENT: NASKAH SOAL UJIAN SIAP CETAK (A4, LJS, KUNCI GURU)       */}
      {/* ========================================================================= */}
      {mainStep === "tahap2" && (
        <div className="space-y-6" id="tahap2-naskah-ujian-view">
          {/* Back button to Step 1 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMainStep("tahap1")}
              className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Tahap 1: Edit Kartu Soal / Kisi-Kisi</span>
            </button>

            {kartuSoalMarkdown && (
              <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5" />
                <span>Kartu Soal dari Tahap 1 Terhubung</span>
              </span>
            )}
          </div>

          {/* Input Parameters Form Card */}
          <div 
            id="form-parameter-soal-card"
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md p-5 sm:p-7 space-y-6"
          >
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Identitas Naskah Soal Ujian Siap Cetak
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sesuaikan kop naskah, nama sekolah, jadwal pelaksanaan, dan alokasi waktu ujian
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Satuan Pendidikan / Sekolah
                </label>
                <input
                  id="input-school-name"
                  type="text"
                  value={naskahFormData.school}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, school: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: SMA Negeri 1 Terentang"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mata Pelajaran
                </label>
                <input
                  id="input-subject-name"
                  type="text"
                  value={naskahFormData.subject}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Pendidikan Pancasila"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kelas / Fase
                </label>
                <input
                  id="input-level-name"
                  type="text"
                  value={naskahFormData.level}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Fase E / Kelas X"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jenis Penilaian
                </label>
                <input
                  id="input-exam-type"
                  type="text"
                  value={naskahFormData.examType}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, examType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester (SAS)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tahun Ajaran & Semester
                </label>
                <input
                  id="input-year-name"
                  type="text"
                  value={naskahFormData.year}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, year: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 2026/2027 - Semester Ganjil"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hari & Tanggal Pelaksanaan
                </label>
                <input
                  id="input-exam-date"
                  type="text"
                  value={naskahFormData.examDate}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, examDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Senin, 1 Desember 2026"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alokasi Waktu Pengerjaan
                </label>
                <input
                  id="input-duration"
                  type="text"
                  value={naskahFormData.duration}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 90 Menit"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jumlah & Bentuk Soal
                </label>
                <input
                  id="input-total-questions"
                  type="text"
                  value={naskahFormData.totalQuestions}
                  onChange={(e) => setNaskahFormData({ ...naskahFormData, totalQuestions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 30 Soal (20 PG, 5 Isian, 5 Uraian)"
                />
              </div>
            </div>

            {/* Sumber Kartu Soal / Kisi-Kisi Textarea */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block font-extrabold text-sm text-slate-900 dark:text-white">
                  Sumber Kartu Soal & Kisi-Kisi Materi Ujian
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  *Otomatis terisi dari hasil Tahap 1 atau dapat ditempel/diedit langsung
                </span>
              </div>

              <textarea
                id="textarea-sumber-materi"
                rows={9}
                value={naskahFormData.sumberMateri}
                onChange={(e) => setNaskahFormData({ ...naskahFormData, sumberMateri: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                placeholder="Tempelkan di sini kartu soal / kisi-kisi dari Tahap 1 yang akan dikonversi menjadi naskah ujian resmi siap cetak..."
              />
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                id="btn-generate-all-docs"
                onClick={handleGenerateAllNaskah}
                disabled={isGeneratingNaskah}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center space-x-2.5 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isGeneratingNaskah ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
                <span>Generate 3 Dokumen Lengkap (Naskah + LJS + Kunci)</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-generate-naskah-only"
                  onClick={() => handleGenerateSingleNaskah("naskah")}
                  disabled={isGeneratingNaskah}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold px-3.5 py-3 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Naskah Soal Saja</span>
                </button>

                <button
                  id="btn-generate-ljs-only"
                  onClick={() => handleGenerateSingleNaskah("ljs")}
                  disabled={isGeneratingNaskah}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold px-3.5 py-3 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>LJS Saja</span>
                </button>

                <button
                  id="btn-generate-kunci-only"
                  onClick={() => handleGenerateSingleNaskah("kunci")}
                  disabled={isGeneratingNaskah}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold px-3.5 py-3 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Kunci & Pedoman Saja</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar when Generating */}
          {isGeneratingNaskah && (
            <div 
              id="generating-progress-indicator"
              className="bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 p-5 rounded-2xl flex items-center space-x-4 animate-pulse shadow-sm"
            >
              <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-blue-900 dark:text-blue-200 text-sm truncate">
                  {generatingProgress || "Sedang memproses AI Penyusun Naskah Ujian..."}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Menghasilkan format HTML terstruktur rapi, tabel opsi, dan CSS print-friendly A4
                </p>
              </div>
            </div>
          )}

          {/* Document Viewer & Output Container */}
          <div 
            id="output-dokumen-ujian-card"
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
          >
            {/* Document Selection Tabs Header */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                {docTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isTabActive = activeDoc === tab.id;
                  const isDone = Boolean(generatedDocs[tab.id as keyof typeof generatedDocs]);

                  return (
                    <button
                      id={`tab-btn-${tab.id}`}
                      key={tab.id}
                      onClick={() => setActiveDoc(tab.id as any)}
                      className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isTabActive
                          ? "bg-blue-600 text-white shadow-md"
                          : isDone
                          ? "bg-slate-800 text-emerald-400 hover:bg-slate-700"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isTabActive ? "text-white" : isDone ? "text-emerald-400" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Action Export Buttons */}
              <div className="flex items-center space-x-2 justify-end shrink-0">
                <button
                  id="btn-copy-html"
                  onClick={handleCopyNaskahHtml}
                  disabled={!generatedDocs[activeDoc]}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
                  title="Salin Kode HTML"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salin HTML</span>
                </button>

                <button
                  id="btn-print-a4"
                  onClick={handlePrintA4}
                  disabled={!generatedDocs[activeDoc]}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF (A4)</span>
                </button>

                <button
                  id="btn-download-word"
                  onClick={handleDownloadNaskahWord}
                  disabled={!generatedDocs[activeDoc]}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Word (.doc)</span>
                </button>
              </div>
            </div>

            {/* Document Content Paper Area */}
            <div className="p-4 sm:p-8 overflow-x-auto min-h-[520px] bg-slate-100 dark:bg-slate-950/60 flex justify-center">
              {generatedDocs[activeDoc] ? (
                <div 
                  id="rendered-doc-paper"
                  className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-300 max-w-4xl w-full font-serif leading-relaxed text-sm my-2 transition-all"
                  dangerouslySetInnerHTML={{ __html: generatedDocs[activeDoc] }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md my-auto">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                    Belum ada {docTabs.find((d) => d.id === activeDoc)?.label}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {docTabs.find((d) => d.id === activeDoc)?.desc}. Klik tombol generate di bawah untuk memproses dengan AI.
                  </p>
                  <button
                    id="btn-start-generating-active-tab"
                    onClick={() => handleGenerateSingleNaskah(activeDoc)}
                    disabled={isGeneratingNaskah}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mulai Generate {docTabs.find((d) => d.id === activeDoc)?.label}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
