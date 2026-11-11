import React, { useState } from "react";
import { 
  Sparkles, 
  Printer, 
  Download, 
  Copy, 
  RotateCcw, 
  Loader2, 
  School, 
  Compass, 
  BookOpen, 
  Users, 
  Target, 
  CheckCircle2, 
  Layers, 
  Laptop, 
  ClipboardCheck, 
  Award,
  Check
} from "lucide-react";
import { Pengaturan } from "../types";
import { notifySimpanSuccess, notifySimpanError, notifyUnduhSuccess } from "../lib/swal";

interface ModulKokurikulerAIViewProps {
  config: Pengaturan;
}

// 8 Dimensi Profil Lulusan
const DIMENSI_LIST = [
  {
    id: "Keimanan dan Ketakwaan terhadap Tuhan YME",
    label: "Keimanan & Ketakwaan terhadap Tuhan YME",
    desc: "Berakhlak mulia, menjaga hubungan dengan Tuhan, sesama, dan alam"
  },
  {
    id: "Kewargaan",
    label: "Kewargaan",
    desc: "Bangga identitas bangsa, menghargai keberagaman, menaati aturan"
  },
  {
    id: "Penalaran Kritis",
    label: "Penalaran Kritis",
    desc: "Rasa ingin tahu, berpikir logis analitis, memecahkan masalah"
  },
  {
    id: "Kreativitas",
    label: "Kreativitas",
    desc: "Produktif, berinovasi, dan merumuskan solusi alternatif"
  },
  {
    id: "Kolaborasi",
    label: "Kolaborasi",
    desc: "Peduli, berbagi, dan membangun kerja sama tim yang solid"
  },
  {
    id: "Kemandirian",
    label: "Kemandirian",
    desc: "Bertanggung jawab, berinisiatif, dan beradaptasi dalam belajar"
  },
  {
    id: "Kesehatan",
    label: "Kesehatan",
    desc: "Pola hidup bersih dan sehat, kebugaran fisik dan mental"
  },
  {
    id: "Komunikasi",
    label: "Komunikasi",
    desc: "Menyimak, membaca, berbicara, dan menulis santun dan efektif"
  }
];

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
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold text-blue-900 mt-6 mb-3 pb-1.5 border-b-2 border-blue-600">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black text-slate-950 mt-6 mb-4 text-center pb-2 border-b-2 border-slate-900 uppercase">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

  // Unordered Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 py-0.5">$1</li>');
  html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 py-0.5">$1</li>');

  // Ordered Lists
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-slate-700 py-0.5"><strong class="text-slate-900">$1.</strong> $2</li>');

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

export const ModulKokurikulerAIView: React.FC<ModulKokurikulerAIViewProps> = ({ config }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [modulMarkdown, setModulMarkdown] = useState<string>("");

  const [formData, setFormData] = useState({
    school: config.Nama_Sekolah || "SMA Negeri 1 Terentang",
    grade: "Kelas X",
    topic: "Peduli Lingkungan & Gotong Royong Pengelolaan Sampah Sekolah",
    duration: "4 JP (4 x 45 Menit)",
    location: "Lingkungan sekolah SMA Negeri 1 Terentang",
    dimensions: ["Penalaran Kritis", "Kolaborasi"],
    subject1: "Pendidikan Pancasila",
    subject2: "Biologi",
    pedagogicalPractice: "Pembelajaran Berbasis Proyek (Project-Based Learning)",
    learningEnvironment: "Memberi kesempatan siswa untuk mengeksplorasi secara nyata pemilahan jenis sampah di lingkungan sekolah dan mempraktikkan proses pembuatan kompos sederhana",
    partnership: "Kolaborasi lintas mapel IPA (prinsip dekomposisi biologis & daur materi) dan Bahasa Indonesia (penyusunan teks laporan hasil observasi), serta pendampingan pengelola Bank Sampah",
    digitalTools: "Canva untuk infografis kampanye peduli sampah, Google Spreadsheet untuk mencatat bobot harian sampah, dan video dokumentasi"
  });

  const handleToggleDimension = (dimensionId: string) => {
    if (formData.dimensions.includes(dimensionId)) {
      setFormData(prev => ({
        ...prev,
        dimensions: prev.dimensions.filter(d => d !== dimensionId)
      }));
    } else {
      if (formData.dimensions.length >= 2) {
        notifySimpanError("Pilih maksimal 2 Dimensi Profil Lulusan yang paling relevan dengan tema kegiatan.");
        return;
      }
      setFormData(prev => ({
        ...prev,
        dimensions: [...prev.dimensions, dimensionId]
      }));
    }
  };

  const handleFillSample = () => {
    setFormData({
      school: config.Nama_Sekolah || "SMA Negeri 1 Terentang",
      grade: "Kelas X",
      topic: "Peduli Lingkungan & Gotong Royong Pengelolaan Sampah Sekolah",
      duration: "4 JP (4 x 45 Menit)",
      location: "Lingkungan sekolah SMA Negeri 1 Terentang",
      dimensions: ["Penalaran Kritis", "Kolaborasi"],
      subject1: "Pendidikan Pancasila",
      subject2: "Biologi",
      pedagogicalPractice: "Pembelajaran Berbasis Proyek (Project-Based Learning)",
      learningEnvironment: "Memberi kesempatan siswa untuk mengeksplorasi secara nyata pemilahan jenis sampah di lingkungan sekolah dan mempraktikkan proses pembuatan kompos sederhana",
      partnership: "Kolaborasi lintas mapel IPA (prinsip dekomposisi biologis & daur materi) dan Bahasa Indonesia (penyusunan teks laporan hasil observasi), serta pendampingan pengelola Bank Sampah",
      digitalTools: "Canva untuk infografis kampanye peduli sampah, Google Spreadsheet untuk mencatat bobot harian sampah, dan video dokumentasi"
    });
    notifySimpanSuccess("Contoh perencanaan Modul Kokurikuler berhasil dimuat!");
  };

  const handleGenerateModul = async () => {
    if (!formData.topic.trim()) {
      notifySimpanError("Silakan isi Tema Kegiatan Kokurikuler.");
      return;
    }
    if (formData.dimensions.length !== 2) {
      notifySimpanError("Silakan pilih tepat 2 Dimensi Profil Lulusan yang paling relevan.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-modul-kokurikuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData })
      });

      const data = await res.json();
      if (data.status === "success" && data.markdown) {
        setModulMarkdown(data.markdown);
        notifySimpanSuccess("Modul Kokurikuler AI Berhasil Disusun!");
      } else {
        throw new Error(data.message || "Gagal menghasilkan Modul Kokurikuler AI");
      }
    } catch (err: any) {
      console.error(err);
      notifySimpanError(err.message || "Terjadi kesalahan saat memproses Modul Kokurikuler AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPdf = () => {
    if (!modulMarkdown) {
      notifySimpanError("Belum ada Modul Kokurikuler yang dihasilkan untuk dicetak.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifySimpanError("Gagal membuka jendela cetak. Periksa perizinan pop-up browser.");
      return;
    }

    const htmlContent = parseMarkdownToHtml(modulMarkdown);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Modul Kokurikuler - ${formData.topic} - ${formData.school}</title>
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
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 12px 0;
            }
            table, th, td {
              border: 1px solid #333;
            }
            th {
              background-color: #1e3a8a;
              color: #ffffff;
              font-weight: bold;
              padding: 6px;
              text-align: center;
            }
            td {
              padding: 5px 8px;
              vertical-align: top;
            }
            @media print {
              .no-print { display: none !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 14pt; text-transform: uppercase;">MODUL PERENCANAAN KEGIATAN KOKURIKULER</h2>
            <h3 style="margin: 3px 0 0 0; font-size: 12pt; text-transform: uppercase;">${formData.school}</h3>
          </div>
          ${htmlContent}
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

  const handleDownloadWord = () => {
    if (!modulMarkdown) {
      notifySimpanError("Belum ada Modul Kokurikuler untuk diunduh.");
      return;
    }

    const htmlContent = parseMarkdownToHtml(modulMarkdown);
    const filename = `Modul_Kokurikuler_${formData.grade.replace(/[^a-zA-Z0-9]/g, "_")}_${formData.topic.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.doc`;

    const htmlDocument = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Modul Kokurikuler</title>
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
            line-height: 1.45;
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
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 14pt; text-transform: uppercase;">MODUL PERENCANAAN KEGIATAN KOKURIKULER</h2>
            <h3 style="margin: 3px 0 0 0; font-size: 12pt; text-transform: uppercase;">${formData.school}</h3>
          </div>
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

    notifyUnduhSuccess(`Modul Kokurikuler Word (${filename}) berhasil diunduh!`);
  };

  const handleCopyMarkdown = () => {
    if (!modulMarkdown) {
      notifySimpanError("Belum ada Modul Kokurikuler untuk disalin.");
      return;
    }
    navigator.clipboard.writeText(modulMarkdown);
    notifySimpanSuccess("Format Markdown Modul Kokurikuler berhasil disalin ke clipboard!");
  };

  return (
    <div className="space-y-6" id="modul-kokurikuler-ai-container">
      {/* Top Banner Header */}
      <div 
        id="kokurikuler-banner-header"
        className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-400 text-slate-950 font-black px-3.5 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Generator Modul Kokurikuler AI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Perencanaan Kegiatan Kokurikuler Lintas Mata Pelajaran
          </h2>

          <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed">
            Rancang perencanaan kegiatan kokurikuler komprehensif (SMP/SMA) berbasis <strong>Dimensi Profil Lulusan</strong>, <strong>kemitraan lintas 2 mata pelajaran</strong>, lingkungan belajar kontekstual, pemanfaatan digital, serta instrumen asesmen lengkap (catatan anekdotal & rubrik kinerja).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id="btn-muat-contoh-kokurikuler"
              onClick={handleFillSample}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Contoh Perencanaan Kokurikuler</span>
            </button>
            <span className="text-xs text-emerald-200">
              Format Siap Cetak PDF (A4) & Ekspor Word (.doc)
            </span>
          </div>
        </div>
      </div>

      {/* Input Parameters Form Card */}
      <div 
        id="form-parameter-kokurikuler-card"
        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md p-5 sm:p-7 space-y-6"
      >
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Identitas & Parameter Kegiatan Kokurikuler
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lengkapi tema, alokasi waktu, lokasi, serta pilihan 2 dimensi profil lulusan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Satuan Pendidikan
            </label>
            <input
              id="koku-school"
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: SMA Negeri 1 Terentang"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Kelas / Jenjang
            </label>
            <select
              id="koku-grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <optgroup label="Jenjang SMP">
                <option value="Kelas VII">Kelas VII (SMP)</option>
                <option value="Kelas VIII">Kelas VIII (SMP)</option>
                <option value="Kelas IX">Kelas IX (SMP)</option>
              </optgroup>
              <optgroup label="Jenjang SMA / SMK">
                <option value="Kelas X">Kelas X (SMA/SMK)</option>
                <option value="Kelas XI">Kelas XI (SMA/SMK)</option>
                <option value="Kelas XII">Kelas XII (SMA/SMK)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Alokasi Waktu
            </label>
            <input
              id="koku-duration"
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: 4 JP (4 x 40 Menit)"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lokasi Kegiatan
            </label>
            <input
              id="koku-location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Lingkungan sekolah & masyarakat sekitar"
            />
          </div>
        </div>

        {/* Tema Kegiatan */}
        <div className="space-y-1.5">
          <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
            Tema Kegiatan Kokurikuler
          </label>
          <input
            id="koku-topic"
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Contoh: Peduli Lingkungan / Literasi Digital / Kewirausahaan / Kearifan Lokal"
          />
        </div>

        {/* 8 Dimensi Profil Lulusan Selector */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block font-extrabold text-sm text-slate-900 dark:text-white">
              A. Dimensi Profil Lulusan (Pilih Tepat 2 Dimensi yang Paling Relevan)
            </label>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Terpilih: {formData.dimensions.length} / 2 Dimensi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DIMENSI_LIST.map((dimensi) => {
              const isSelected = formData.dimensions.includes(dimensi.id);
              return (
                <button
                  type="button"
                  key={dimensi.id}
                  id={`dimensi-${dimensi.id.replace(/[^a-zA-Z0-9]/g, "-")}`}
                  onClick={() => handleToggleDimension(dimensi.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-emerald-100"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-xs leading-snug">
                      {dimensi.label}
                    </span>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-slate-600"
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {dimensi.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lintas 2 Mata Pelajaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mata Pelajaran 1 (Fokus Pokok)
            </label>
            <input
              id="koku-subject-1"
              type="text"
              value={formData.subject1}
              onChange={(e) => setFormData({ ...formData, subject1: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: IPA / Biologi"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mata Pelajaran 2 (Kemitraan Lintas Mapel)
            </label>
            <input
              id="koku-subject-2"
              type="text"
              value={formData.subject2}
              onChange={(e) => setFormData({ ...formData, subject2: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Bahasa Indonesia / Matematika"
            />
          </div>
        </div>

        {/* Praktik Pedagogis, Lingkungan, Kemitraan, Pemanfaatan Digital */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              C. Praktik Pedagogis
            </label>
            <input
              id="koku-pedagogical"
              type="text"
              value={formData.pedagogicalPractice}
              onChange={(e) => setFormData({ ...formData, pedagogicalPractice: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Pembelajaran berbasis proyek / riset / pemecahan masalah"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              F. Pemanfaatan Digital
            </label>
            <input
              id="koku-digital-tools"
              type="text"
              value={formData.digitalTools}
              onChange={(e) => setFormData({ ...formData, digitalTools: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Canva, Google Classroom, Spreadsheet, Video Smartphone"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              D & E. Lingkungan Belajar & Kemitraan Pembelajaran
            </label>
            <input
              id="koku-environment"
              type="text"
              value={formData.learningEnvironment}
              onChange={(e) => setFormData({ ...formData, learningEnvironment: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Memberikan kesempatan siswa bereksplorasi di lingkungan sekitar sekolah dan bermitra dengan bank sampah/komunitas"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            id="btn-generate-modul-kokurikuler"
            onClick={handleGenerateModul}
            disabled={isGenerating}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center space-x-2.5 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-300" />
            )}
            <span>Generate Perencanaan Modul Kokurikuler AI</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {isGenerating && (
        <div 
          id="kokurikuler-progress-indicator"
          className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl flex items-center space-x-4 animate-pulse shadow-sm"
        >
          <Loader2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm truncate">
              Sedang menyusun Modul Kokurikuler Lintas Mata Pelajaran...
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Menyelaraskan Dimensi Profil Lulusan, tujuan pembelajaran kemitraan mapel, langkah kegiatan runtut, dan rubrik asesmen observasi
            </p>
          </div>
        </div>
      )}

      {/* Output Viewer Card */}
      <div 
        id="output-kokurikuler-card"
        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
      >
        {/* Output Header */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">
                Hasil Perencanaan Modul Kokurikuler
              </h4>
              <p className="text-[11px] text-slate-400">
                Dokumen resmi terstruktur (Bagian A–H) lengkap dengan instrumen asesmen
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="btn-copy-koku-markdown"
              onClick={handleCopyMarkdown}
              disabled={!modulMarkdown}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
              title="Salin Teks"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Teks</span>
            </button>

            <button
              id="btn-print-koku-pdf"
              onClick={handlePrintPdf}
              disabled={!modulMarkdown}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF (A4)</span>
            </button>

            <button
              id="btn-download-koku-word"
              onClick={handleDownloadWord}
              disabled={!modulMarkdown}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Word (.doc)</span>
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-4 sm:p-8 overflow-x-auto min-h-[480px] bg-slate-50 dark:bg-slate-900/40 flex justify-center">
          {modulMarkdown ? (
            <div 
              id="rendered-kokurikuler-paper"
              className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-300 max-w-4xl w-full font-serif leading-relaxed text-sm my-2 transition-all"
            >
              {/* Header Kop */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
                <h2 className="font-extrabold text-base uppercase tracking-wider text-slate-900">
                  MODUL PERENCANAAN KEGIATAN KOKURIKULER
                </h2>
                <h3 className="font-bold text-sm uppercase text-slate-700 mt-0.5">
                  {formData.school}
                </h3>
              </div>

              <div 
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(modulMarkdown) }} 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md my-auto">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center shadow-inner">
                <Compass className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                Belum Ada Perencanaan Modul Kokurikuler
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tentukan tema, pilih 2 dimensi profil lulusan, kemitraan 2 mata pelajaran, lalu klik <strong>Generate Perencanaan Modul Kokurikuler AI</strong>.
              </p>
              <button
                onClick={handleGenerateModul}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Mulai Generate Modul Kokurikuler</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
