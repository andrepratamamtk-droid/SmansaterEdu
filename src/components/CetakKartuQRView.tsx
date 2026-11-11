import React, { useState, useEffect, useRef } from "react";
import { IdCard, Printer, Eye, Download, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { Siswa, Pengaturan } from "../types";
import { notifyCetakSuccess, notifyCetakError } from "../lib/swal";

interface CetakKartuQRViewProps {
  siswaList: Siswa[];
  config: Pengaturan;
}

export const CetakKartuQRView: React.FC<CetakKartuQRViewProps> = ({ siswaList, config }) => {
  const [selectedKelas, setSelectedKelas] = useState("");
  const [previewSiswa, setPreviewSiswa] = useState<Siswa | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  // Filter students for selected class
  const studentsInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  useEffect(() => {
    if (studentsInClass.length > 0) {
      const s = studentsInClass[0];
      setPreviewSiswa(s);

      // Generate QR
      QRCode.toDataURL(s.nisn || s.id, { margin: 1, width: 200 })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);

      // Generate Barcode
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, s.nisn || s.id, {
            format: "CODE128",
            displayValue: true,
            height: 35,
            width: 1.8,
            fontSize: 12,
            background: "#ffffff",
            lineColor: "#000000"
          });
        } catch (e) {
          console.warn(e);
        }
      }
    } else {
      setPreviewSiswa(null);
      setQrDataUrl("");
    }
  }, [selectedKelas, siswaList]);

  // Generate and Download PDF Kartu Pelajar (A4 Portrait - 3 Cards per Page)
  const handleExportPDF = async () => {
    if (!selectedKelas) {
      notifyCetakError("Silakan pilih kelas terlebih dahulu!");
      return;
    }

    if (studentsInClass.length === 0) {
      notifyCetakError("Belum ada data siswa di kelas ini.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4"
      });

    const namaSekolah = (config.Nama_Sekolah || "SMA NEGERI 1 KOTA").toUpperCase();
    const alamatSekolah = (config.Alamat_Sekolah || "Jalan Pendidikan No. 1").toUpperCase();
    const kepsek = config.Nama_Kepsek || "Nama Kepala Sekolah, M.Pd.";
    const nipKepsek = config.NIP_Kepsek || "19800101 200501 1 001";
    const tempatTTD = config.Tempat_Tanda_Tangan || "Kota";

    const cardW = 153;
    const cardH = 242;
    const gapX = 20;

    const startX_Depan = 134.64;
    const startX_Belakang = startX_Depan + cardW + gapX;
    const startY = 38.5;
    const gapY = 20;

    const chunk = 3;
    for (let i = 0; i < studentsInClass.length; i += chunk) {
      const batch = studentsInClass.slice(i, i + chunk);
      if (i > 0) doc.addPage();

      for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
        const s = batch[rowIdx];
        const currentY = startY + rowIdx * (cardH + gapY);

        const idSiswa = String(s.nisn || s.id);
        const namaSiswa = (s.nama || "-").toUpperCase();
        const kelasSiswa = s.kelas || "-";

        // --- DEPAN KARTU ---
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(startX_Depan, currentY, cardW, cardH, 4, 4, "FD");
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(startX_Depan, currentY, cardW, cardH, 4, 4, "S");

        // Header Blue Banner
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Depan, currentY, cardW, 50, 4, 4, "F");
        doc.rect(startX_Depan, currentY + 25, cardW, 25, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        const schoolLines = doc.splitTextToSize(namaSekolah, cardW - 20);
        doc.text(schoolLines, startX_Depan + cardW / 2, currentY + 16, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.5);
        const alamatLines = doc.splitTextToSize(alamatSekolah, cardW - 20);
        doc.text(alamatLines, startX_Depan + cardW / 2, currentY + 28 + (schoolLines.length > 1 ? 4 : 0), { align: "center" });

        // Kartu Pelajar Title
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.text("KARTU PELAJAR", startX_Depan + cardW / 2, currentY + 65, { align: "center" });
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.line(startX_Depan + 20, currentY + 70, startX_Depan + cardW - 20, currentY + 70);

        // Student Info Box
        let tableY = currentY + 78;
        const tableX = startX_Depan + 8;
        const tableW = cardW - 16;

        doc.setDrawColor(200, 210, 230);
        doc.setLineWidth(0.5);

        // Row Nama
        doc.setFillColor(245, 248, 255);
        doc.rect(tableX, tableY, tableW, 14, "F");
        doc.rect(tableX, tableY, tableW, 14, "S");
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text("NAMA", tableX + 3, tableY + 9);
        doc.setTextColor(0, 0, 0);
        doc.text(": " + (namaSiswa.length > 20 ? namaSiswa.substring(0, 20) + "..." : namaSiswa), tableX + 30, tableY + 9);

        // Row NISN
        tableY += 14;
        doc.setFillColor(255, 255, 255);
        doc.rect(tableX, tableY, tableW, 14, "F");
        doc.rect(tableX, tableY, tableW, 14, "S");
        doc.setTextColor(30, 58, 138);
        doc.text("NISN", tableX + 3, tableY + 9);
        doc.setTextColor(0, 0, 0);
        doc.text(": " + idSiswa, tableX + 30, tableY + 9);

        // Row Kelas
        tableY += 14;
        doc.setFillColor(245, 248, 255);
        doc.rect(tableX, tableY, tableW, 14, "F");
        doc.rect(tableX, tableY, tableW, 14, "S");
        doc.setTextColor(30, 58, 138);
        doc.text("KELAS", tableX + 3, tableY + 9);
        doc.setTextColor(0, 0, 0);
        doc.text(": " + kelasSiswa, tableX + 30, tableY + 9);

        // QR Code Image
        const qrUrl = await QRCode.toDataURL(idSiswa, { margin: 1, width: 200 });
        const qrSize = 75;
        const qrX = startX_Depan + (cardW - qrSize) / 2;
        const qrY = currentY + 138;
        doc.addImage(qrUrl, "PNG", qrX, qrY, qrSize, qrSize);

        // Footer Blue Strip
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Depan, currentY + cardH - 15, cardW, 15, 4, 4, "F");
        doc.rect(startX_Depan, currentY + cardH - 15, cardW, 5, "F");

        // --- BELAKANG KARTU ---
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(startX_Belakang, currentY, cardW, cardH, 4, 4, "FD");
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(startX_Belakang, currentY, cardW, cardH, 4, 4, "S");

        // Header Blue Banner
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Belakang, currentY, cardW, 25, 4, 4, "F");
        doc.rect(startX_Belakang, currentY + 10, cardW, 15, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("SYARAT & KETENTUAN", startX_Belakang + cardW / 2, currentY + 16, { align: "center" });

        // Rules text
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        const rules = [
          "1. Kartu Pelajar ini diterbitkan resmi oleh sekolah.",
          "2. Kartu bersifat pribadi dan tidak boleh dipinjamkan.",
          "3. Wajib menjaga kebersihan & keutuhan kartu.",
          "4. Berlaku selama masa studi aktif di sekolah.",
          "5. Bila hilang/rusak, segera lapor ke Tata Usaha."
        ];

        let ry = currentY + 38;
        rules.forEach((rule) => {
          const splitR = doc.splitTextToSize(rule, cardW - 20);
          doc.text(splitR, startX_Belakang + 10, ry);
          ry += splitR.length * 9;
        });

        // Signature section
        const ttdY = currentY + 128;
        doc.setFontSize(6);
        doc.text(
          `${tempatTTD}, ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
          startX_Belakang + cardW - 10,
          ttdY,
          { align: "right" }
        );
        doc.text("Kepala Sekolah", startX_Belakang + cardW - 10, ttdY + 8, { align: "right" });

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(kepsek, startX_Belakang + cardW - 10, ttdY + 34, { align: "right" });

        const nameWidth = doc.getTextWidth(kepsek);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(startX_Belakang + cardW - 10 - nameWidth, ttdY + 36, startX_Belakang + cardW - 10, ttdY + 36);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        if (nipKepsek) {
          doc.text("NIP. " + nipKepsek, startX_Belakang + cardW - 10, ttdY + 44, { align: "right" });
        }

        // Barcode
        const bcCanvas = document.createElement("canvas");
        try {
          JsBarcode(bcCanvas, idSiswa, {
            format: "CODE128",
            displayValue: true,
            height: 35,
            width: 2,
            margin: 0,
            fontSize: 12,
            background: "#ffffff",
            lineColor: "#000000"
          });
          const bcWidth = 100;
          const bcX = startX_Belakang + (cardW - bcWidth) / 2;
          doc.addImage(bcCanvas.toDataURL("image/jpeg"), "JPEG", bcX, currentY + 188, bcWidth, 24);
        } catch (e) {
          console.warn(e);
        }

        // Footer Blue Strip
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Belakang, currentY + cardH - 15, cardW, 15, 4, 4, "F");
        doc.rect(startX_Belakang, currentY + cardH - 15, cardW, 5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("IDENTITAS DIGITAL", startX_Belakang + cardW / 2, currentY + cardH - 5, { align: "center" });
      }
    }

    doc.save(`Kartu_Pelajar_Kelas_${selectedKelas}.pdf`);
      notifyCetakSuccess(`Kartu Pelajar Kelas ${selectedKelas} berhasil diunduh!`);
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mengunduh Kartu Pelajar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <IdCard className="w-5 h-5 text-blue-600" />
              Cetak Kartu Pelajar QR Code (Presisi 3 Deret)
            </h2>
            <p className="text-xs text-slate-500">
              Kartu pelajar format Portrait Formal dengan QR Code presisi di depan & Barcode di belakang. Siap dicetak langsung ke Kertas A4/PVC.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none"
            >
              <option value="">Pilih Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportPDF}
              disabled={!selectedKelas || studentsInClass.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF ({studentsInClass.length} Kartu)</span>
            </button>
          </div>
        </div>

        {/* Live Preview Display */}
        {previewSiswa ? (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-4">
              Pratinjau Desain Kartu (Depan & Belakang)
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              {/* DEPAN */}
              <div className="w-[216px] h-[342px] bg-white text-slate-900 relative rounded-lg overflow-hidden shadow-xl border border-slate-300 shrink-0">
                <div className="h-[60px] bg-blue-900 text-white p-2.5 text-center flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase leading-tight line-clamp-2">
                    {config.Nama_Sekolah || "NAMA SEKOLAH ANDA"}
                  </p>
                  <p className="text-[7px] text-blue-200 mt-0.5 line-clamp-2">
                    {config.Alamat_Sekolah || "Alamat Sekolah"}
                  </p>
                </div>

                <p className="text-center font-black text-blue-900 text-xs mt-3">KARTU PELAJAR</p>
                <div className="w-3/4 mx-auto h-[1.5px] bg-blue-400 my-1" />

                <div className="mx-3 mt-3 rounded border border-blue-200 text-[9px] overflow-hidden">
                  <div className="flex bg-blue-50 p-1.5 border-b border-blue-200">
                    <span className="w-12 font-bold text-blue-900">NAMA</span>
                    <span className="font-bold truncate flex-1">: {previewSiswa.nama}</span>
                  </div>
                  <div className="flex bg-white p-1.5 border-b border-blue-200">
                    <span className="w-12 font-bold text-blue-900">NISN</span>
                    <span className="font-bold truncate flex-1">: {previewSiswa.nisn}</span>
                  </div>
                  <div className="flex bg-blue-50 p-1.5">
                    <span className="w-12 font-bold text-blue-900">KELAS</span>
                    <span className="font-bold truncate flex-1">: {previewSiswa.kelas}</span>
                  </div>
                </div>

                {qrDataUrl && (
                  <div className="w-24 h-24 mx-auto mt-4 p-1 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-center">
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 h-4 bg-blue-900" />
              </div>

              {/* BELAKANG */}
              <div className="w-[216px] h-[342px] bg-white text-slate-900 relative rounded-lg overflow-hidden shadow-xl border border-slate-300 shrink-0">
                <div className="h-[30px] bg-blue-900 text-white flex items-center justify-center">
                  <p className="text-[10px] font-bold uppercase">SYARAT & KETENTUAN</p>
                </div>

                <div className="p-3 text-[8.5px] space-y-1 font-medium text-slate-800">
                  <p>1. Kartu Pelajar ini diterbitkan resmi oleh sekolah.</p>
                  <p>2. Kartu bersifat pribadi dan tidak boleh dipinjamkan.</p>
                  <p>3. Wajib menjaga kebersihan & keutuhan kartu.</p>
                  <p>4. Berlaku selama masa studi aktif di sekolah.</p>
                  <p>5. Bila hilang/rusak, segera lapor ke Tata Usaha.</p>
                </div>

                <div className="absolute right-3 top-44 text-[8px] text-right">
                  <p>{config.Tempat_Tanda_Tangan || "Kota"}, Tanggal</p>
                  <p className="mb-6">Kepala Sekolah</p>
                  <p className="font-bold border-b border-black pb-0.5 inline-block">
                    {config.Nama_Kepsek || "Nama Kepala Sekolah"}
                  </p>
                  <p className="text-[7.5px] mt-0.5">NIP. {config.NIP_Kepsek || "-"}</p>
                </div>

                <div className="absolute bottom-6 inset-x-0 flex justify-center">
                  <svg ref={barcodeRef} className="max-w-[140px] h-8" />
                </div>

                <div className="absolute bottom-0 inset-x-0 h-4 bg-blue-900 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white tracking-widest">IDENTITAS DIGITAL</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Pilih kelas di atas untuk melihat pratinjau kartu pelajar.
          </div>
        )}
      </div>
    </div>
  );
};
