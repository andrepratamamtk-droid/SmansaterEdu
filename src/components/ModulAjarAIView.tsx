import React, { useState } from "react";
import { 
  Wand2, 
  Printer, 
  Download, 
  Sparkles, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  BookOpen, 
  Copy, 
  Check, 
  Award, 
  ShieldCheck, 
  Layers, 
  RotateCcw,
  CheckCircle2,
  Share2,
  FileSpreadsheet
} from "lucide-react";
import { ModulFormState, Pengaturan } from "../types";
import { notifySimpanSuccess, notifySimpanError, notifyCetakSuccess, notifyUnduhSuccess, notifyUnduhError } from "../lib/swal";

interface ModulAjarAIViewProps {
  config: Pengaturan;
}

export const ModulAjarAIView: React.FC<ModulAjarAIViewProps> = ({ config }) => {
  const [form, setForm] = useState<ModulFormState>({
    namaGuru: config.Nama_Guru || "Hengki Guslau,S.Pd.,Gr",
    nipGuru: config.NIP_Guru || "199001302024211019",
    namaSekolah: config.Nama_Sekolah || "SMA Negeri 1 Terentang",
    namaKepsek: config.Nama_Kepsek || "Drs. Sudari,M.Pd",
    nipKepsek: config.NIP_Kepsek || "196710061994121002",
    kota: config.Tempat_Tanda_Tangan || "Terentang",
    tahunAjaran: "2026/2027",
    semester: "Semester Ganjil (1)",
    jenjang: "SMA",
    fase: "Fase E",
    kelas: "X",
    waktu: "2 pertemuan x (2 JP x 45 menit)",
    mataPelajaran: "Pendidikan Pancasila",
    topik: "Gagasan Para Pendiri Bangsa tentang Dasar Negara dan Kedudukan Pancasila",
    subTopik: "Komparasi Naskah Piagam Jakarta dan Pembukaan UUD NRI 1945",
    kodeTp: "TP-10-PP-01",
    rumusanTp: "Peserta didik mampu menganalisis cara pandang para pendiri bangsa tentang dasar negara, serta membandingkan rumusan dasar negara dalam Piagam Jakarta dengan Pembukaan UUD NRI 1945 secara kritis, toleran, dan berkesadaran.",
    cpAsal: "Keputusan Kepala BSKAP No. 046/H/KR/2025 (Elemen Pancasila: Peserta didik mampu menganalisis cara pandang para pendiri bangsa tentang dasar negara; menganalisis kedudukan Pancasila sebagai dasar negara, pandangan hidup bangsa, dan ideologi negara; serta mempraktikkan nilai-nilai Pancasila dalam kehidupan sehari-hari).",
    kktp: "Rubrik Skala 4 Kategori (Belum Berkembang, Mulai Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang) dengan kriteria ketercapaian minimal 75 pada aspek ketepatan analisis komparasi historis dan argumentasi tertulis.",
    sarana: "LCD Proyektor, Smartphone peserta didik, Akses Internet/Digital, Salindia Presentasi, Buku Siswa Pendidikan Pancasila Kemendikdasmen 2024/2025, Risalah Sidang BPUPK-PPKI.",
    jumlahPertemuan: "2",
    model: "Problem Based Learning (PBL)",
    metode: "Penyelidikan dokumen primer, diskusi kelompok heterogen, analisis komparatif, dan presentasi panel",
    targetPeserta: "36 peserta didik heterogen: 10 murid kinestetik/audio butuh perancah (scaffolding), 18 reguler mandiri, 8 berpencapaian tinggi/tutor sebaya.",
    profilPancasila: "Bernalar Kritis (Tersurat), Bergotong Royong (Tersurat), dan Kreatif (Usulan)",
    mode: "rpm_pancasila",
    tujuan: "Peserta didik mampu menganalisis cara pandang para pendiri bangsa tentang dasar negara dan menerapkan nilai Pancasila dalam kehidupan bermasyarakat.",
    karakteristik: "Siswa aktif berdiskusi, antusias dalam kerja kelompok, serta responsif terhadap stimulasi visual dan studi kasus kontekstual."
  });

  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFillBskapPreset = () => {
    setForm({
      namaGuru: config.Nama_Guru || "Hengki Guslau,S.Pd.,Gr",
      nipGuru: config.NIP_Guru || "199001302024211019",
      namaSekolah: config.Nama_Sekolah || "SMA Negeri 1 Terentang",
      namaKepsek: config.Nama_Kepsek || "Drs. Sudari,M.Pd",
      nipKepsek: config.NIP_Kepsek || "196710061994121002",
      kota: config.Tempat_Tanda_Tangan || "Terentang",
      tahunAjaran: "2026/2027",
      semester: "Semester Ganjil (1)",
      jenjang: "SMA",
      fase: "Fase E",
      kelas: "X",
      waktu: "2 pertemuan x (2 JP x 45 menit)",
      mataPelajaran: "Pendidikan Pancasila",
      topik: "Gagasan Para Pendiri Bangsa tentang Dasar Negara dan Kedudukan Pancasila",
      subTopik: "Komparasi Naskah Piagam Jakarta dan Pembukaan UUD NRI 1945",
      kodeTp: "TP-10-PP-01",
      rumusanTp: "Peserta didik mampu menganalisis cara pandang para pendiri bangsa tentang dasar negara, serta membandingkan rumusan dasar negara dalam Piagam Jakarta dengan Pembukaan UUD NRI 1945 secara kritis, toleran, dan berkesadaran.",
      cpAsal: "Keputusan Kepala BSKAP No. 046/H/KR/2025 (Elemen Pancasila: Peserta didik mampu menganalisis cara pandang para pendiri bangsa tentang dasar negara; menganalisis kedudukan Pancasila sebagai dasar negara, pandangan hidup bangsa, dan ideologi negara; serta mempraktikkan nilai-nilai Pancasila dalam kehidupan sehari-hari).",
      kktp: "Rubrik Skala 4 Kategori (Belum Berkembang, Mulai Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang) dengan kriteria ketercapaian minimal 75 pada aspek ketepatan analisis komparasi historis dan argumentasi tertulis.",
      sarana: "LCD Proyektor, Smartphone peserta didik, Akses Internet/Digital, Salindia Presentasi, Buku Siswa Pendidikan Pancasila Kemendikdasmen 2024/2025, Risalah Sidang BPUPK-PPKI.",
      jumlahPertemuan: "2",
      model: "Problem Based Learning (PBL)",
      metode: "Penyelidikan dokumen primer, diskusi kelompok heterogen, analisis komparatif, dan presentasi panel",
      targetPeserta: "36 peserta didik heterogen: 10 murid kinestetik/audio butuh perancah (scaffolding), 18 reguler mandiri, 8 berpencapaian tinggi/tutor sebaya.",
      profilPancasila: "Bernalar Kritis (Tersurat), Bergotong Royong (Tersurat), dan Kreatif (Usulan)",
      mode: "rpm_pancasila",
      tujuan: "Peserta didik mampu menganalisis gagasan pendiri bangsa tentang dasar negara dan menerapkan nilai Pancasila dalam kehidupan bermasyarakat.",
      karakteristik: "Siswa aktif berdiskusi, antusias dalam kerja kelompok, serta responsif terhadap stimulasi visual dan studi kasus kontekstual."
    });
    notifySimpanSuccess("Preset Standar BSKAP 046/H/KR/2025 SMAN 1 Terentang berhasil dimuat!");
  };

  const cleanHtmlContent = (rawHtml: string): string => {
    if (!rawHtml) return "";
    return rawHtml
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^#+\s*(.*?)$/gm, "<h3>$1</h3>")
      .replace(/`/g, "")
      .trim();
  };

  // Raw Prompt Text based on user specification
  const getMasterPromptText = () => {
    return `PERAN
Anda adalah pakar kurikulum dan perancang pembelajaran Pendidikan Pancasila jenjang SMA, yang menguasai Kurikulum Merdeka, pendekatan Pembelajaran Mendalam (Deep Learning), dan sintaks model-model pembelajaran. Saya adalah guru yang wajib menyajikan perangkat ajar yang kredibel dan valid. Akurasi, keterlacakan, dan tidak mengarang lebih penting daripada kecepatan.

TUGAS
Susun Modul Ajar / Rencana Pembelajaran Mendalam (RPM) yang siap pakai di kelas. Sintaks model pembelajaran WAJIB tampil lengkap dan terintegrasi dengan Pembelajaran Mendalam, bukan dua bagian yang terpisah.

DATA MASUKAN
- Satuan pendidikan : ${form.namaSekolah}
- Mata pelajaran    : ${form.mataPelajaran}
- Fase / Kelas      : ${form.fase} / Kelas ${form.kelas}
- Semester          : ${form.semester || '1'}
- Materi / topik    : ${form.topik} ${form.subTopik ? `(${form.subTopik})` : ''}
- Kode TP           : ${form.kodeTp || 'TP-10-PP-01'}
- Rumusan TP        : ${form.rumusanTp || form.tujuan}
- Komponen CP asal  : ${form.cpAsal || 'Keputusan Kepala BSKAP No. 046/H/KR/2025'}
- KKTP              : ${form.kktp}
- Alokasi waktu     : ${form.waktu} (${form.jumlahPertemuan} pertemuan)
- Karakteristik kelas: ${form.targetPeserta}
- Sarana            : ${form.sarana}
- Model pembelajaran: ${form.model}

ATURAN INTEGRITAS (WAJIB)
1. Bangun modul hanya dari TP, CP, dan KKTP yang saya berikan. Jangan menciptakan TP baru.
2. Satu modul = satu kelas. Jangan memuat TP atau materi kelas lain.
3. Nomor regulasi, istilah resmi, tanggal, dan kutipan hanya boleh dari sumber yang dapat disebutkan.
4. Kegiatan, asesmen, dan soal tidak boleh menuntut kemampuan lebih tinggi daripada kata kerja TP/CP.
5. Pisahkan isi yang dikutip dari sumber dan rumusan Anda sendiri.
6. SINTAKS MODEL: Gunakan sintaks baku sesuai pencetus/sumber modelnya (Arends 2012 untuk PBL / Buck Institute untuk PjBL / Bruner untuk Discovery).
7. PRINSIP INTEGRASI: Setiap tahap sintaks dipetakan ke SATU pengalaman belajar dominan: Memahami / Mengaplikasi / Merefleksi, serta memuat prinsip berkesadaran, bermakna, atau menggembirakan.
8. STRUKTUR MODUL: Seluruh 15 bagian disajikan dalam TABEL yang rapi dan terstruktur.`;
  };

  const handleCopyPrompt = async () => {
    try {
      const promptText = getMasterPromptText();
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      notifySimpanSuccess("Prompt RPM Pendidikan Pancasila berhasil disalin ke Clipboard!");
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      notifySimpanError("Gagal menyalin teks ke clipboard.");
    }
  };

  const handleGenerate = async () => {
    if (
      !form.namaGuru ||
      !form.namaSekolah ||
      !form.tahunAjaran ||
      !form.fase ||
      !form.kelas ||
      !form.mataPelajaran ||
      !form.topik ||
      !form.waktu ||
      !form.model
    ) {
      notifySimpanError("Mohon lengkapi seluruh kolom bertanda bintang (*)");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate-modul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.status === "success" && data.html) {
        const cleaned = cleanHtmlContent(data.html);
        setGeneratedHtml(cleaned);
        notifySimpanSuccess("Rencana Pembelajaran Mendalam (RPM) berhasil disusun dalam format tabel lengkap!");
      } else {
        throw new Error(data.message || "Gagal membuat modul AI.");
      }
    } catch (err: any) {
      notifySimpanError(err.message || "Terjadi kesalahan saat memproses generator AI.");
    } finally {
      setLoading(false);
    }
  };

  // Export Word .doc with full table borders
  const handleExportWord = () => {
    if (!generatedHtml) return;

    try {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>RPM Pendidikan Pancasila - ${form.topik}</title>
          <style>
            @page { size: A4 portrait; margin: 1.8cm 1.5cm 1.8cm 1.5cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.25; color: #000000; }
            h1 { font-size: 14pt; text-align: center; font-weight: bold; margin-bottom: 6pt; text-transform: uppercase; color: #1e3a8a; }
            h2 { font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid #1e3a8a; padding-bottom: 2pt; margin-top: 14pt; margin-bottom: 6pt; color: #1e3a8a; text-transform: uppercase; }
            h3 { font-size: 11pt; font-weight: bold; margin-top: 8pt; margin-bottom: 3pt; color: #0f172a; }
            p { margin-bottom: 4pt; text-align: justify; color: #000000; font-size: 10pt; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; page-break-inside: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            th { border: 1pt solid #1e3a8a; padding: 5pt 7pt; vertical-align: middle; text-align: center; font-size: 9.5pt; font-weight: bold; background-color: #1e3a8a !important; color: #ffffff !important; }
            td { border: 1pt solid #64748b; padding: 5pt 7pt; vertical-align: top; text-align: left; font-size: 9.5pt; color: #000000 !important; background-color: #ffffff !important; }
            ul, ol { margin-bottom: 4pt; padding-left: 16pt; }
            li { margin-bottom: 2pt; font-size: 9.5pt; }
          </style>
        </head>
        <body>
      `;
      const footer = "</body></html>";
      const fullSource = header + generatedHtml + footer;

      const blob = new Blob(["\ufeff", fullSource], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTopic = form.topik ? form.topik.replace(/\s+/g, "_").slice(0, 30) : "Modul";
      link.href = url;
      link.download = `RPM_Pendidikan_Pancasila_${cleanTopic}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifyUnduhSuccess("Dokumen RPM (.DOC) berhasil diunduh!");
    } catch {
      notifyUnduhError("Gagal mengunduh file Word.");
    }
  };

  // Print PDF with high-quality landscape/portrait table rules
  const handlePrint = () => {
    if (!generatedHtml) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifyCetakSuccess("Gagal membuka jendela cetak.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak RPM - ${form.topik}</title>
          <style>
            @page { size: A4 portrait; margin: 1.5cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.25; color: #000000; margin: 0; padding: 0; }
            h1 { font-size: 14pt; text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; color: #1e3a8a; }
            h2 { font-size: 11.5pt; font-weight: bold; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 3px; margin-top: 14px; margin-bottom: 6px; color: #1e3a8a; text-transform: uppercase; }
            h3 { font-size: 10.5pt; font-weight: bold; margin-top: 8px; margin-bottom: 3px; color: #0f172a; }
            p { margin-bottom: 4px; text-align: justify; color: #000000; font-size: 10pt; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; page-break-inside: auto; }
            thead { display: table-header-group !important; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            th { border: 1px solid #1e3a8a !important; padding: 5px 7px; vertical-align: middle; text-align: center; font-size: 9.5pt; font-weight: bold; background-color: #1e3a8a !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            td { border: 1px solid #475569 !important; padding: 5px 7px; vertical-align: top; text-align: left; font-size: 9.5pt; color: #000000 !important; background-color: #ffffff !important; }
            ul, ol { margin-bottom: 4px; padding-left: 16pt; }
            li { margin-bottom: 2px; font-size: 9.5pt; }
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid !important; break-inside: avoid !important; }
              thead { display: table-header-group !important; }
            }
          </style>
        </head>
        <body>
          ${generatedHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      notifyCetakSuccess("Dokumen dikirim ke printer!");
    }, 500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[82vh]">
      {/* Left Form Panel */}
      <div className="w-full lg:w-[460px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Wand2 className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                  Generator RPM & Modul Ajar AI
                </h2>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  Kurikulum Merdeka x Pembelajaran Mendalam
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowIntegrityModal(true)}
                title="Aturan Integritas & Sintaks Baku"
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Aturan</span>
              </button>

              <button
                onClick={() => setShowPromptModal(true)}
                title="Lihat Teks Master Prompt"
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
              >
                <Share2 className="w-3 h-3 text-amber-300" />
                <span>Prompt</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-blue-200 font-medium leading-relaxed">
            Perancang Rencana Pembelajaran Mendalam (RPM) Pendidikan Pancasila berbasis BSKAP 046/H/KR/2025 dengan integrasi sintaks model & tabel terstruktur.
          </p>
        </div>

        {/* Action Quick Bar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleFillBskapPreset}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 py-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Muat Standar BSKAP (SMAN 1 Terentang)</span>
          </button>

          <button
            onClick={handleCopyPrompt}
            className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 py-1 cursor-pointer"
          >
            {copiedPrompt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedPrompt ? "Tersalin!" : "Salin Prompt"}</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas Satuan Pendidikan & Guru */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b pb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              1. Satuan Pendidikan & Pengampu
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Satuan Pendidikan *</label>
              <input
                type="text"
                id="namaSekolah"
                value={form.namaSekolah}
                onChange={handleChange}
                placeholder="SMA Negeri 1 Terentang"
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Guru *</label>
                <input
                  type="text"
                  id="namaGuru"
                  value={form.namaGuru}
                  onChange={handleChange}
                  placeholder="Hengki Guslau,S.Pd.,Gr"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP Guru</label>
                <input
                  type="text"
                  id="nipGuru"
                  value={form.nipGuru || ""}
                  onChange={handleChange}
                  placeholder="199001302024211019"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kepala Sekolah</label>
                <input
                  type="text"
                  id="namaKepsek"
                  value={form.namaKepsek || ""}
                  onChange={handleChange}
                  placeholder="Drs. Sudari,M.Pd"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kota Titimangsa</label>
                <input
                  type="text"
                  id="kota"
                  value={form.kota || ""}
                  onChange={handleChange}
                  placeholder="Terentang"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kurikulum, TP, & CP Asal */}
          <div className="space-y-2.5 pt-2">
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b pb-1">
              2. Kurikulum, TP, & Komponen CP Asal (BSKAP 046/2025)
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fase / Jenjang *</label>
                <select
                  id="fase"
                  value={form.fase}
                  onChange={handleChange}
                  className="w-full px-2 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="Fase E">Fase E (Kelas X)</option>
                  <option value="Fase F">Fase F (Kelas XI/XII)</option>
                  <option value="Fase D">Fase D (SMP)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                <select
                  id="kelas"
                  value={form.kelas}
                  onChange={handleChange}
                  className="w-full px-2 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Semester *</label>
                <select
                  id="semester"
                  value={form.semester || "Semester Ganjil (1)"}
                  onChange={handleChange}
                  className="w-full px-2 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="Semester Ganjil (1)">1 (Ganjil)</option>
                  <option value="Semester Genap (2)">2 (Genap)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran *</label>
              <input
                type="text"
                id="mataPelajaran"
                value={form.mataPelajaran}
                onChange={handleChange}
                placeholder="Pendidikan Pancasila"
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none text-blue-900 dark:text-blue-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Materi / Topik *</label>
                <input
                  type="text"
                  id="topik"
                  value={form.topik}
                  onChange={handleChange}
                  placeholder="Gagasan Dasar Negara"
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kode TP *</label>
                <input
                  type="text"
                  id="kodeTp"
                  value={form.kodeTp || "TP-10-PP-01"}
                  onChange={handleChange}
                  placeholder="TP-10-PP-01"
                  className="w-full px-3 py-2 text-xs font-mono font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none text-indigo-700 dark:text-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rumusan Tujuan Pembelajaran (TP) *</label>
              <textarea
                id="rumusanTp"
                value={form.rumusanTp || form.tujuan}
                onChange={handleChange}
                rows={2}
                placeholder="Tempel teks rumusan TP autentik di sini..."
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Komponen CP Asal (BSKAP 046/H/KR/2025) *</label>
              <textarea
                id="cpAsal"
                value={form.cpAsal || ""}
                onChange={handleChange}
                rows={2}
                placeholder="Kode & teks CP acuan Keputusan Kepala BSKAP 046/H/KR/2025..."
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bentuk KKTP *</label>
              <textarea
                id="kktp"
                value={form.kktp || ""}
                onChange={handleChange}
                rows={2}
                placeholder="Rubrik / deskripsi kriteria / interval ketercapaian..."
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          {/* Section 3: Model Sintaks & Integrasi Pembelajaran Mendalam */}
          <div className="space-y-2.5 pt-2">
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b pb-1">
              3. Sintaks Model & Pembelajaran Mendalam
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Model Pembelajaran *</label>
                <select
                  id="model"
                  value={form.model}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="Problem Based Learning (PBL)">PBL (Arends 2012)</option>
                  <option value="Project Based Learning (PjBL)">PjBL (Lucas / BIE)</option>
                  <option value="Discovery Learning">Discovery Learning (Bruner)</option>
                  <option value="Inquiry Learning">Inquiry (Suchman / Joyce-Weil)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alokasi Pertemuan *</label>
                <input
                  type="text"
                  id="waktu"
                  value={form.waktu}
                  onChange={handleChange}
                  placeholder="2 pertemuan x 2 JP x 45 menit"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Karakteristik Kelas / Murid</label>
              <textarea
                id="targetPeserta"
                value={form.targetPeserta || ""}
                onChange={handleChange}
                rows={2}
                placeholder="Jumlah murid, kemampuan awal, gaya belajar, kendala..."
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sarana Pembelajaran</label>
              <input
                type="text"
                id="sarana"
                value={form.sarana || ""}
                onChange={handleChange}
                placeholder="Internet, proyektor, HP murid, perpustakaan..."
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          {/* Section 4: Standar Kedalaman & Lampiran Dokumen */}
          <div className="space-y-2.5 pt-2">
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b pb-1">
              4. Tingkat Kedalaman & Kelengkapan Lampiran
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Standar Kompleksitas Modul</label>
              <select
                id="mode"
                value={form.mode || "akreditasi_premium"}
                onChange={handleChange}
                className="w-full px-2.5 py-2 text-xs font-bold border rounded-lg bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 outline-none"
              >
                <option value="akreditasi_premium">Tingkat Masterclass: Supervisi & Akreditasi Paripurna (16 Bagian Super Kompleks)</option>
                <option value="deep_learning">Standar Deep Learning: Sintaks Model Baku Terintegrasi</option>
                <option value="diferensiasi">Standar Berdiferensiasi: Scaffolding, Konten, Proses & Produk</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelengkapan Lampiran Siap Pakai</label>
              <select
                id="lampiranPilihan"
                value={form.lampiranPilihan || "semua"}
                onChange={handleChange}
                className="w-full px-2.5 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="semua">Semua Lampiran Lengkap (Bahan Ajar Mendalam, LKPD Studi Kasus, Bank Soal HOTS 8 Butir + Kunci, Glosarium, Pustaka)</option>
                <option value="lkpd_materi">Bahan Ajar Esensial + LKPD Interaktif Terstruktur</option>
                <option value="soal_rubrik">Bank Soal HOTS + Rubrik Analitik KKTP Skala 4 Kategori</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 hover:from-blue-800 hover:to-purple-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-transform hover:scale-101 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyusun RPM Pendidikan Pancasila...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>GENERATE RPM DEEP LEARNING (TABEL)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Preview Workspace */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Workspace Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Workspace Pratinjau RPM (15 Bagian Lengkap)</h3>
              <p className="text-[11px] text-slate-500">Sintaks model terintegrasi utuh dengan Pembelajaran Mendalam dalam format tabel resmi</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              disabled={!generatedHtml}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={handleExportWord}
              disabled={!generatedHtml}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Word (.DOC)</span>
            </button>
          </div>
        </div>

        {/* Content Display */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/80 custom-scrollbar">
          {!generatedHtml && !loading && (
            <div className="h-[520px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-900/50">
              <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">RPM Belum Digenerate</h4>
              <p className="text-xs text-slate-500 max-w-lg mt-1 leading-relaxed">
                Sesuaikan data masukan TP, acuan regulasi BSKAP 046/H/KR/2025, KKTP, dan model sintaks di sebelah kiri, lalu klik <b>GENERATE RPM DEEP LEARNING</b> untuk menyusun dokumen 15 bagian lengkap dalam format tabel terstruktur.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={handleFillBskapPreset}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                >
                  Gunakan Preset Standar BSKAP
                </button>
                <button
                  onClick={() => setShowIntegrityModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lihat Aturan Integritas</span>
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-[520px] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">Menyusun Rencana Pembelajaran Mendalam (RPM)...</h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                AI sedang mengintegrasikan sintaks {form.model} dengan pilar Memahami, Mengaplikasi, dan Merefleksi, memetakan bukti KKTP, menyusun LKPD, serta merancang bank soal HOTS.
              </p>
            </div>
          )}

          {generatedHtml && !loading && (
            <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 shadow-xl rounded-xl border border-slate-200 text-xs leading-relaxed space-y-4 font-serif">
              <div
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
                className="prose max-w-none prose-headings:font-sans prose-h1:text-lg prose-h1:font-black prose-h1:text-center prose-h1:text-blue-900 prose-h2:text-xs prose-h2:font-bold prose-h2:border-b-2 prose-h2:border-blue-900 prose-h2:pb-1 prose-h2:mt-6 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-800 prose-th:p-2 prose-th:bg-blue-900 prose-th:text-white prose-th:font-bold prose-th:text-center prose-td:border prose-td:border-slate-400 prose-td:p-2 prose-td:text-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Aturan Integritas Modal */}
      {showIntegrityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-sm">Pedoman & Aturan Integritas Penyusunan RPM</h3>
              </div>
              <button
                onClick={() => setShowIntegrityModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs text-slate-700 dark:text-slate-300 custom-scrollbar leading-relaxed">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 space-y-1.5">
                <p className="font-bold text-blue-900 dark:text-blue-200">1. Prinsip Utama: Kredibilitas & Non-Fabrikasi</p>
                <p>Akurasi, keterlacakan, dan tidak mengarang lebih penting daripada kecepatan. Seluruh modul dibangun hanya dari TP, CP (BSKAP 046/H/KR/2025), dan KKTP yang valid.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">2. Sintaks Baku Model Pembelajaran</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><b>Problem Based Learning (PBL):</b> Arends (2012) - 5 Tahap Baku.</li>
                  <li><b>Project Based Learning (PjBL):</b> Lucas / Buck Institute for Education - 6 Tahap Baku.</li>
                  <li><b>Discovery Learning:</b> Bruner / Kemendikbud - 6 Tahap Baku.</li>
                  <li><b>Inquiry Learning:</b> Suchman / Joyce & Weil - 6 Tahap Baku.</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-1.5">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">3. Integrasi Sintaks x Pembelajaran Mendalam</p>
                <p>Setiap tahap sintaks dipetakan ke 1 pengalaman belajar dominan: <b>Memahami</b>, <b>Mengaplikasi</b>, atau <b>Merefleksi</b>, dengan penanda prinsip <b>berkesadaran</b>, <b>bermakna</b>, atau <b>menggembirakan</b>.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowIntegrityModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Saya Paham
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-300" />
                <h3 className="font-extrabold text-sm">Teks Master Prompt RPM Pendidikan Pancasila</h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {getMasterPromptText()}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handleCopyPrompt}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {copiedPrompt ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPrompt ? "Berhasil Disalin!" : "Salin Prompt ke Clipboard"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
