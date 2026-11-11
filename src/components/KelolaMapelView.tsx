import React, { useState } from "react";
import { BookOpen, Plus, Trash2, Pencil, X, Save, CheckCircle2 } from "lucide-react";
import { Mapel } from "../types";
import { saveDocument, deleteDocument, COLLECTIONS } from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  confirmDeleteAlert 
} from "../lib/swal";

interface KelolaMapelViewProps {
  mapelList: Mapel[];
}

export const KelolaMapelView: React.FC<KelolaMapelViewProps> = ({ mapelList }) => {
  const [namaMapel, setNamaMapel] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");

  // Edit Mapel State
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editSemester, setEditSemester] = useState("Ganjil");
  const [editTahunAjaran, setEditTahunAjaran] = useState("2026/2027");

  const handleStartEdit = (m: Mapel) => {
    setEditingMapel(m);
    setEditNama(m.namaMapel);
    setEditSemester(m.semester);
    setEditTahunAjaran(m.tahunAjaran);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;

    if (!editNama.trim() || !editTahunAjaran.trim()) {
      notifyEditError("Lengkapi Nama Mata Pelajaran dan Tahun Ajaran.");
      return;
    }

    const updated: Mapel = {
      ...editingMapel,
      namaMapel: editNama.trim(),
      semester: editSemester,
      tahunAjaran: editTahunAjaran.trim()
    };

    try {
      await saveDocument(COLLECTIONS.MAPEL, editingMapel.id, updated);
      setEditingMapel(null);
      notifyEditSuccess(`Mata pelajaran ${updated.namaMapel} berhasil diperbarui!`);
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui mapel.");
    }
  };

  const handleAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMapel.trim()) {
      notifySimpanError("Mohon isi Nama Mata Pelajaran.");
      return;
    }

    const id = Date.now().toString();
    const newMapel: Mapel = {
      id,
      namaMapel: namaMapel.trim(),
      semester,
      tahunAjaran: tahunAjaran.trim()
    };

    try {
      await saveDocument(COLLECTIONS.MAPEL, id, newMapel);
      setNamaMapel("");
      notifySimpanSuccess(`Mata pelajaran ${newMapel.namaMapel} berhasil ditambahkan!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan data mapel.");
    }
  };

  const handleDeleteMapel = async (id: string, name: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Mata Pelajaran?", `Apakah Anda yakin ingin menghapus mata pelajaran ${name}?`);
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.MAPEL, id);
        notifyHapusSuccess(`Mapel ${name} berhasil dihapus.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus mapel.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Kelola Mata Pelajaran
          </h2>
          <p className="text-xs text-slate-500">Tambah dan kelola mata pelajaran yang diampu untuk semester berjalan.</p>
        </div>

        <form
          onSubmit={handleAddMapel}
          className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Mata Pelajaran *</label>
            <input
              type="text"
              placeholder="Contoh: Matematika / Bahasa Indonesia"
              value={namaMapel}
              onChange={(e) => setNamaMapel(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tahun Ajaran</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="2026/2027"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">Mata Pelajaran</th>
                <th className="p-3 text-center">Semester</th>
                <th className="p-3 text-center">Tahun Ajaran</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {mapelList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Belum ada mata pelajaran terdaftar.
                  </td>
                </tr>
              ) : (
                mapelList.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{m.namaMapel}</td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1 rounded-md text-[11px] font-extrabold">
                        {m.semester}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">{m.tahunAjaran}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Mapel"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMapel(m.id, m.namaMapel)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Mapel"
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

      {/* Modal Edit Mapel */}
      {editingMapel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Edit Mata Pelajaran</span>
              </h3>
              <button
                onClick={() => setEditingMapel(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Semester *</label>
                <select
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tahun Ajaran *</label>
                <input
                  type="text"
                  value={editTahunAjaran}
                  onChange={(e) => setEditTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingMapel(null)}
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
