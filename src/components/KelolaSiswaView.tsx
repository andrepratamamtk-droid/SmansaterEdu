import React, { useState } from "react";
import { Users, Upload, Download, Plus, Search, Trash2, Pencil, X, Save, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Siswa } from "../types";
import { saveDocument, deleteDocument, batchSaveDocuments, COLLECTIONS } from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  notifyUnduhSuccess, 
  notifyUnduhError, 
  confirmDeleteAlert 
} from "../lib/swal";

interface KelolaSiswaViewProps {
  siswaList: Siswa[];
}

export const KelolaSiswaView: React.FC<KelolaSiswaViewProps> = ({ siswaList }) => {
  const [nisn, setNisn] = useState("");
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [search, setSearch] = useState("");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Siswa State
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [editNisn, setEditNisn] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editKelas, setEditKelas] = useState("");

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  // Start Editing Siswa
  const handleStartEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setEditNisn(siswa.nisn);
    setEditNama(siswa.nama);
    setEditKelas(siswa.kelas);
  };

  // Save Edit Siswa
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;

    if (!editNisn.trim() || !editNama.trim() || !editKelas.trim()) {
      notifyEditError("Mohon lengkapi NISN, Nama Lengkap, dan Kelas.");
      return;
    }

    // Check duplicate NISN (if changed to an existing NISN of another student)
    const duplicate = siswaList.find((s) => s.id !== editingSiswa.id && s.nisn === editNisn.trim());
    if (duplicate) {
      notifyEditError(`NISN ${editNisn} sudah digunakan oleh siswa ${duplicate.nama}.`);
      return;
    }

    const updatedSiswa: Siswa = {
      ...editingSiswa,
      nisn: editNisn.trim(),
      nama: editNama.trim(),
      kelas: editKelas.trim()
    };

    try {
      await saveDocument(COLLECTIONS.SISWA, editingSiswa.id, updatedSiswa);
      setEditingSiswa(null);
      notifyEditSuccess(`Data siswa ${updatedSiswa.nama} berhasil diperbarui!`);
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui data siswa.");
    }
  };

  // Handle manual submit
  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim() || !nama.trim() || !kelas.trim()) {
      notifySimpanError("Mohon isi NISN, Nama Lengkap, dan Kelas.");
      return;
    }

    const exists = siswaList.find((s) => s.nisn === nisn.trim());
    if (exists) {
      notifySimpanError(`Siswa dengan NISN ${nisn} sudah ada dalam database!`);
      return;
    }

    const id = Date.now().toString();
    const newSiswa: Siswa = {
      id,
      nisn: nisn.trim(),
      nama: nama.trim(),
      kelas: kelas.trim()
    };

    try {
      await saveDocument(COLLECTIONS.SISWA, id, newSiswa);
      setNisn("");
      setNama("");
      setKelas("");
      notifySimpanSuccess(`Siswa ${newSiswa.nama} berhasil ditambahkan!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan data siswa.");
    }
  };

  // Delete student
  const handleDelete = async (id: string, namaSiswa: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Data Siswa?", `Apakah Anda yakin ingin menghapus data siswa ${namaSiswa}?`);
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.SISWA, id);
        notifyHapusSuccess(`Data ${namaSiswa} telah dihapus.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus data.");
      }
    }
  };

  // Download XLSX template
  const downloadTemplate = () => {
    try {
      const data = [
        { NISN: "0012345678", "Nama Siswa": "Ahmad Fulan", Kelas: "VII A" },
        { NISN: "0012345679", "Nama Siswa": "Siti Aminah", Kelas: "VII A" }
      ];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Siswa");
      XLSX.writeFile(workbook, "Template_Import_Siswa.xlsx");
      notifyUnduhSuccess("Template_Import_Siswa.xlsx berhasil diunduh!");
    } catch (err: any) {
      notifyUnduhError("Gagal mengunduh template Excel.");
    }
  };

  // Upload XLSX import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        const existingNisns = new Set(siswaList.map((s) => s.nisn));
        const newItems: Siswa[] = [];

        rows.forEach((row, idx) => {
          const nisnVal = String(row["NISN"] || row["nisn"] || "").trim();
          const namaVal = String(row["Nama Siswa"] || row["Nama"] || row["nama"] || "").trim();
          const kelasVal = String(row["Kelas"] || row["kelas"] || "").trim();

          if (nisnVal && namaVal && kelasVal && !existingNisns.has(nisnVal)) {
            newItems.push({
              id: `${Date.now()}_${idx}`,
              nisn: nisnVal,
              nama: namaVal,
              kelas: kelasVal
            });
            existingNisns.add(nisnVal);
          }
        });

        if (newItems.length > 0) {
          await batchSaveDocuments(COLLECTIONS.SISWA, newItems);
          notifySimpanSuccess(`Berhasil mengimpor ${newItems.length} siswa baru!`);
        } else {
          notifySimpanError("Tidak ada siswa baru yang dapat diimpor (mungkin duplikat atau kolom tidak sesuai).");
        }
      } catch (err: any) {
        notifySimpanError("Format file Excel tidak valid. Gunakan template yang disediakan.");
      }
      e.target.value = "";
    };
    reader.readAsBinaryString(file);
  };

  // Filtered list - Require class filter to be selected first
  const filteredList = selectedKelasFilter
    ? siswaList.filter((s) => {
        const matchesSearch =
          s.nama.toLowerCase().includes(search.toLowerCase()) ||
          s.nisn.toLowerCase().includes(search.toLowerCase());
        const matchesKelas = s.kelas === selectedKelasFilter;
        return matchesSearch && matchesKelas;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header and Excel controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Kelola Master Data Siswa
            </h2>
            <p className="text-xs text-slate-500">Kelola daftar seluruh siswa, NISN, dan kelas untuk administrasi guru.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadTemplate}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>

            <label className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-colors shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Form Tambah Manual */}
        <form onSubmit={handleAddSiswa} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NISN *</label>
            <input
              type="text"
              placeholder="Contoh: 0012345678"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap *</label>
            <input
              type="text"
              placeholder="Nama lengkap siswa"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Contoh: VII A"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Student List Table & Search Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NISN atau Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
          >
            <option value="">-- Pilih Kelas untuk Melihat Siswa --</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">NISN</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3 text-center">Kelas</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {!selectedKelasFilter ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-900/30">
                    <Users className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-60" />
                    <p className="text-xs">Silakan pilih kelas pada dropdown filter di atas untuk menampilkan daftar siswa.</p>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan untuk Kelas {selectedKelasFilter}.
                  </td>
                </tr>
              ) : (
                filteredList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{s.nisn}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{s.nama}</td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.nama)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Siswa */}
      {editingSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Edit Data Siswa</span>
              </h3>
              <button
                onClick={() => setEditingSiswa(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NISN *</label>
                <input
                  type="text"
                  value={editNisn}
                  onChange={(e) => setEditNisn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-semibold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                <input
                  type="text"
                  value={editKelas}
                  onChange={(e) => setEditKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
