import React, { useState } from "react";
import { Clock, Plus, Trash2, Pencil, X, Save, CheckCircle2, History, Search, Filter } from "lucide-react";
import { Jadwal, Mapel, Siswa } from "../types";
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

interface JadwalMengajarViewProps {
  jadwalList: Jadwal[];
  mapelList: Mapel[];
  siswaList: Siswa[];
}

export const JadwalMengajarView: React.FC<JadwalMengajarViewProps> = ({
  jadwalList,
  mapelList,
  siswaList
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"input" | "rekap">("input");
  const [hari, setHari] = useState("Senin");
  const [jam, setJam] = useState("07:30 - 09:00");
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");

  // Edit Jadwal State
  const [editingJadwal, setEditingJadwal] = useState<Jadwal | null>(null);
  const [editHari, setEditHari] = useState("Senin");
  const [editJam, setEditJam] = useState("");
  const [editKelas, setEditKelas] = useState("");
  const [editMapel, setEditMapel] = useState("");

  // Rekap Filters & Inline Edit
  const [rekapHariFilter, setRekapHariFilter] = useState("");
  const [rekapKelasFilter, setRekapKelasFilter] = useState("");
  const [rekapMapelFilter, setRekapMapelFilter] = useState("");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<Jadwal | null>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  const handleStartEditModal = (j: Jadwal) => {
    setEditingJadwal(j);
    setEditHari(j.hari);
    setEditJam(j.jam);
    setEditKelas(j.kelas);
    setEditMapel(j.mapel);
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJadwal) return;

    if (!editKelas || !editMapel || !editJam.trim()) {
      notifyEditError("Silakan isi Jam, Kelas, dan Mata Pelajaran.");
      return;
    }

    const updated: Jadwal = {
      ...editingJadwal,
      hari: editHari,
      jam: editJam.trim(),
      kelas: editKelas,
      mapel: editMapel
    };

    try {
      await saveDocument(COLLECTIONS.JADWAL, editingJadwal.id, updated);
      setEditingJadwal(null);
      notifyEditSuccess("Jadwal mengajar berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui jadwal.");
    }
  };

  const handleAddJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelas || !mapel) {
      notifySimpanError("Silakan pilih kelas dan mata pelajaran.");
      return;
    }

    const id = Date.now().toString();
    const newJadwal: Jadwal = {
      id,
      hari,
      jam: jam.trim(),
      kelas,
      mapel
    };

    try {
      await saveDocument(COLLECTIONS.JADWAL, id, newJadwal);
      setJam("07:30 - 09:00");
      notifySimpanSuccess("Jadwal mengajar berhasil ditambahkan!");
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan jadwal.");
    }
  };

  const handleDeleteJadwal = async (id: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Jadwal Mengajar?", "Apakah Anda yakin ingin menghapus jadwal mengajar ini?");
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.JADWAL, id);
        notifyHapusSuccess("Jadwal mengajar berhasil dihapus.");
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus jadwal.");
      }
    }
  };

  // Inline Row Edit handlers
  const handleStartRowEdit = (item: Jadwal) => {
    setEditingRowId(item.id);
    setEditRowData({ ...item });
  };

  const handleSaveRowEdit = async (id: string) => {
    if (!editRowData) return;
    try {
      await saveDocument(COLLECTIONS.JADWAL, id, editRowData);
      setEditingRowId(null);
      setEditRowData(null);
      notifyEditSuccess("Jadwal mengajar berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui jadwal.");
    }
  };

  // Filtered Rekap List
  const filteredJadwalList = jadwalList.filter((j) => {
    const matchHari = !rekapHariFilter || j.hari === rekapHariFilter;
    const matchKelas = !rekapKelasFilter || j.kelas === rekapKelasFilter;
    const matchMapel = !rekapMapelFilter || j.mapel === rekapMapelFilter;
    return matchHari && matchKelas && matchMapel;
  });

  return (
    <div className="space-y-6">
      {/* Sub-menu Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => setActiveSubTab("input")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "input"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Tambah & Kelola Jadwal</span>
        </button>
        <button
          onClick={() => setActiveSubTab("rekap")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "rekap"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat & Rekapitulasi Jadwal</span>
          {jadwalList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold">
              {jadwalList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "input" ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Jadwal Mengajar Anda
            </h2>
            <p className="text-xs text-slate-500">Atur jam tatap muka harian per kelas dan mata pelajaran.</p>
          </div>

          <form
            onSubmit={handleAddJadwal}
            className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Hari *</label>
              <select
                value={hari}
                onChange={(e) => setHari(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jam (WIB) *</label>
              <input
                type="text"
                placeholder="Contoh: 07:30 - 09:00"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                required
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran *</label>
              <div className="flex space-x-2">
                <select
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                  required
                >
                  <option value="">Pilih Mapel</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
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

          {/* Schedule List Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 w-28">Hari</th>
                  <th className="p-3">Jam Mengajar</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {jadwalList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Belum ada jadwal mengajar.
                    </td>
                  </tr>
                ) : (
                  jadwalList.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{j.hari}</td>
                      <td className="p-3 font-mono font-semibold">{j.jam}</td>
                      <td className="p-3 text-center font-bold">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">{j.kelas}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{j.mapel}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEditModal(j)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteJadwal(j.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
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
      ) : (
        /* Riwayat & Rekapitulasi Jadwal View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Riwayat & Rekapitulasi Jadwal Mengajar
            </h2>
            <p className="text-xs text-slate-500">
              Rekapitulasi lengkap jadwal tatap muka. Anda dapat mengedit, menyimpan pembaruan, atau menghapus entri jadwal.
            </p>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Jadwal</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{jadwalList.length}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60">
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Total Kelas Diajar</p>
              <p className="text-lg font-extrabold text-blue-800 dark:text-blue-200">
                {Array.from(new Set(jadwalList.map((j) => j.kelas))).length}
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
              <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Total Mapel Diajar</p>
              <p className="text-lg font-extrabold text-indigo-800 dark:text-indigo-200">
                {Array.from(new Set(jadwalList.map((j) => j.mapel))).length}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Hari Aktif Mengajar</p>
              <p className="text-lg font-extrabold text-amber-800 dark:text-amber-200">
                {Array.from(new Set(jadwalList.map((j) => j.hari))).length}
              </p>
            </div>
          </div>

          {/* Rekap Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Hari</label>
              <select
                value={rekapHariFilter}
                onChange={(e) => setRekapHariFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
              <select
                value={rekapKelasFilter}
                onChange={(e) => setRekapKelasFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Mapel</label>
              <select
                value={rekapMapelFilter}
                onChange={(e) => setRekapMapelFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Table with Action Buttons: Edit, Simpan, Hapus */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3 w-28">Hari</th>
                  <th className="p-3">Jam Mengajar</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredJadwalList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada data jadwal ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredJadwalList.map((item, idx) => {
                    const isEditing = editingRowId === item.id;

                    if (isEditing && editRowData) {
                      return (
                        <tr key={item.id} className="bg-blue-50/70 dark:bg-blue-950/40">
                          <td className="p-3 text-center font-bold text-blue-600">{idx + 1}</td>
                          <td className="p-2">
                            <select
                              value={editRowData.hari}
                              onChange={(e) => setEditRowData({ ...editRowData, hari: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-24"
                            >
                              <option value="Senin">Senin</option>
                              <option value="Selasa">Selasa</option>
                              <option value="Rabu">Rabu</option>
                              <option value="Kamis">Kamis</option>
                              <option value="Jumat">Jumat</option>
                              <option value="Sabtu">Sabtu</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editRowData.jam}
                              onChange={(e) => setEditRowData({ ...editRowData, jam: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-32"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editRowData.kelas}
                              onChange={(e) => setEditRowData({ ...editRowData, kelas: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none text-center w-20"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editRowData.mapel}
                              onChange={(e) => setEditRowData({ ...editRowData, mapel: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveRowEdit(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRowId(null);
                                  setEditRowData(null);
                                }}
                                className="bg-slate-300 hover:bg-slate-400 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{item.hari}</td>
                        <td className="p-3 font-mono font-semibold">{item.jam}</td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">{item.kelas}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{item.mapel}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleStartRowEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteJadwal(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Jadwal */}
      {editingJadwal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Edit Jadwal Mengajar</span>
              </h3>
              <button
                onClick={() => setEditingJadwal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Hari *</label>
                <select
                  value={editHari}
                  onChange={(e) => setEditHari(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jam (WIB) *</label>
                <input
                  type="text"
                  value={editJam}
                  onChange={(e) => setEditJam(e.target.value)}
                  placeholder="Contoh: 07:30 - 09:00"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                <select
                  value={editKelas}
                  onChange={(e) => setEditKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran *</label>
                <select
                  value={editMapel}
                  onChange={(e) => setEditMapel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                >
                  <option value="">Pilih Mapel</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingJadwal(null)}
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

