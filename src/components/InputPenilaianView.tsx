import React, { useState, useEffect } from "react";
import { Star, Save, CheckCircle2, History, Pencil, Trash2, Search, Filter, X, Check } from "lucide-react";
import { Siswa, Mapel, DataNilai, Pengaturan } from "../types";
import { saveDocument, deleteDocument, batchSaveDocuments, COLLECTIONS } from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  confirmDeleteAlert 
} from "../lib/swal";

interface InputPenilaianViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: DataNilai[];
  config: Pengaturan;
}

export const InputPenilaianView: React.FC<InputPenilaianViewProps> = ({
  siswaList,
  mapelList,
  nilaiList,
  config
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"input" | "rekap">("input");
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState<string>("");
  const [jenisPenilaian, setJenisPenilaian] = useState<string>("UH 1");
  const [gradesMap, setGradesMap] = useState<Record<string, number | "">>({});
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Rekapitulasi & Riwayat Filter and Edit states
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>("");
  const [rekapMapelFilter, setRekapMapelFilter] = useState<string>("");
  const [rekapJenisFilter, setRekapJenisFilter] = useState<string>("");
  const [rekapSearchFilter, setRekapSearchFilter] = useState<string>("");

  const [editingNilaiId, setEditingNilaiId] = useState<string | null>(null);
  const [editNilaiData, setEditNilaiData] = useState<DataNilai | null>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();
  const studentsInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  // Load existing grade records
  useEffect(() => {
    if (selectedKelas && selectedMapel && jenisPenilaian) {
      const existingGrades = nilaiList.filter(
        (n) => n.kelas === selectedKelas && n.mapel === selectedMapel && n.jenis === jenisPenilaian
      );

      const map: Record<string, number | ""> = {};
      studentsInClass.forEach((s) => {
        const found = existingGrades.find((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);
        map[s.id] = found && found.nilai !== "" && found.nilai !== undefined ? found.nilai : "";
      });

      setGradesMap(map);
    }
  }, [selectedKelas, selectedMapel, jenisPenilaian, nilaiList, siswaList]);

  const handleGradeChange = (studentId: string, value: string) => {
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setGradesMap((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveNilai = async () => {
    if (!selectedKelas || !selectedMapel || !jenisPenilaian) {
      notifySimpanError("Silakan pilih Kelas, Mapel, dan Jenis Penilaian.");
      return;
    }

    if (studentsInClass.length === 0) {
      notifySimpanError("Belum ada siswa di kelas ini.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const itemsToSave: DataNilai[] = studentsInClass.map((s) => {
      const docId = `${selectedKelas}_${selectedMapel}_${jenisPenilaian}_${s.id}`;
      return {
        id: docId,
        waktu: todayStr,
        jenis: jenisPenilaian,
        mapel: selectedMapel,
        kelas: selectedKelas,
        idSiswa: s.id,
        namaSiswa: s.nama,
        nilai: gradesMap[s.id] !== undefined ? gradesMap[s.id] : "",
        namaGuru: config.Nama_Guru || "Guru"
      };
    });

    try {
      await batchSaveDocuments(COLLECTIONS.DATA_NILAI, itemsToSave);
      notifySimpanSuccess(`Nilai ${jenisPenilaian} kelas ${selectedKelas} tersimpan ke Firebase!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan nilai.");
    }
  };

  // Start Editing Nilai Item
  const handleStartEditNilai = (item: DataNilai) => {
    setEditingNilaiId(item.id);
    setEditNilaiData({ ...item });
  };

  // Save Edited Nilai Item
  const handleSaveEditedNilai = async (id: string) => {
    if (!editNilaiData) return;
    try {
      await saveDocument(COLLECTIONS.DATA_NILAI, id, editNilaiData);
      setEditingNilaiId(null);
      setEditNilaiData(null);
      notifyEditSuccess("Data nilai siswa berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui data nilai.");
    }
  };

  // Delete Nilai Item
  const handleDeleteNilai = async (id: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Data Nilai?", "Apakah Anda yakin ingin menghapus data nilai siswa ini?");
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.DATA_NILAI, id);
        notifyHapusSuccess("Data nilai berhasil dihapus.");
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus data nilai.");
      }
    }
  };

  // Filtered Nilai List for Rekapitulasi
  const filteredNilaiList = nilaiList.filter((item) => {
    const matchKelas = !rekapKelasFilter || item.kelas === rekapKelasFilter;
    const matchMapel = !rekapMapelFilter || item.mapel === rekapMapelFilter;
    const matchJenis = !rekapJenisFilter || item.jenis.toLowerCase().includes(rekapJenisFilter.toLowerCase());
    const matchSearch = !rekapSearchFilter || item.namaSiswa.toLowerCase().includes(rekapSearchFilter.toLowerCase());
    return matchKelas && matchMapel && matchJenis && matchSearch;
  });

  // Rekap Statistics
  const totalEntri = filteredNilaiList.length;
  const numericValues = filteredNilaiList.map((n) => Number(n.nilai)).filter((v) => !isNaN(v) && v > 0);
  const avgNilai = numericValues.length > 0 ? (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(1) : "-";
  const maxNilai = numericValues.length > 0 ? Math.max(...numericValues) : "-";
  const minNilai = numericValues.length > 0 ? Math.min(...numericValues) : "-";

  return (
    <div className="space-y-6">
      {/* Sub-menu Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => setActiveSubTab("input")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "input"
              ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Input Nilai Akademik</span>
        </button>
        <button
          onClick={() => setActiveSubTab("rekap")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "rekap"
              ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat & Rekapitulasi Nilai</span>
          {nilaiList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-extrabold">
              {nilaiList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "input" ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Input Nilai Akademik Siswa
            </h2>
            <p className="text-xs text-slate-500">
              Kelola nilai Ulangan Harian (UH), Tugas, UTS, dan UAS per mata pelajaran.
            </p>
          </div>

          {/* Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Kelas *</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Mata Pelajaran *</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Penilaian *</label>
              <input
                type="text"
                placeholder="Contoh: UH 1 / UTS / Tugas 1"
                value={jenisPenilaian}
                onChange={(e) => setJenisPenilaian(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Grade Entry Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Nama Lengkap Siswa</th>
                  <th className="p-3 text-center w-36">Input Nilai (0-100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {!selectedKelas || !selectedMapel ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      Silakan pilih Kelas, Mapel, dan Jenis Penilaian terlebih dahulu.
                    </td>
                  </tr>
                ) : studentsInClass.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      Tidak ada siswa terdaftar di Kelas {selectedKelas}.
                    </td>
                  </tr>
                ) : (
                  studentsInClass.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{s.nama}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={gradesMap[s.id] !== undefined ? gradesMap[s.id] : ""}
                          onChange={(e) => handleGradeChange(s.id, e.target.value)}
                          className="w-24 text-center px-3 py-1.5 font-black text-sm border-2 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-amber-600 focus:border-amber-500 outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveNilai}
              disabled={studentsInClass.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Nilai ke Firebase</span>
            </button>
          </div>
        </div>
      ) : (
        /* Riwayat & Rekapitulasi Nilai View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Riwayat & Rekapitulasi Nilai Akademik
            </h2>
            <p className="text-xs text-slate-500">
              Kelola, edit, dan rekap seluruh rekaman nilai siswa yang tersimpan di database.
            </p>
          </div>

          {/* Rekap Statistics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Entri Nilai</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{totalEntri}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Rata-Rata Nilai</p>
              <p className="text-lg font-extrabold text-amber-800 dark:text-amber-200">{avgNilai}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Nilai Tertinggi</p>
              <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200">{maxNilai}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60">
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Nilai Terendah</p>
              <p className="text-lg font-extrabold text-rose-800 dark:text-rose-200">{minNilai}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
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

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Jenis Penilaian</label>
              <input
                type="text"
                placeholder="UH / UTS / Tugas..."
                value={rekapJenisFilter}
                onChange={(e) => setRekapJenisFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Nama Siswa</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama..."
                  value={rekapSearchFilter}
                  onChange={(e) => setRekapSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Interactive Table with Action Buttons: Edit, Simpan, Hapus */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal / Waktu</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Jenis Penilaian</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center w-24">Nilai</th>
                  <th className="p-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredNilaiList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada data nilai ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredNilaiList.map((item, idx) => {
                    const isEditing = editingNilaiId === item.id;

                    if (isEditing && editNilaiData) {
                      return (
                        <tr key={item.id} className="bg-amber-50/70 dark:bg-amber-950/40">
                          <td className="p-3 text-center font-bold text-amber-600">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={editNilaiData.waktu || ""}
                              onChange={(e) => setEditNilaiData({ ...editNilaiData, waktu: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-amber-400 outline-none w-32"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editNilaiData.kelas}
                              onChange={(e) => setEditNilaiData({ ...editNilaiData, kelas: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-amber-400 outline-none text-center w-20"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editNilaiData.mapel}
                              onChange={(e) => setEditNilaiData({ ...editNilaiData, mapel: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-amber-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editNilaiData.jenis}
                              onChange={(e) => setEditNilaiData({ ...editNilaiData, jenis: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-amber-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editNilaiData.namaSiswa}
                              onChange={(e) => setEditNilaiData({ ...editNilaiData, namaSiswa: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-amber-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editNilaiData.nilai}
                              onChange={(e) => setEditNilaiData({ ...editNilaiData, nilai: e.target.value === "" ? "" : Number(e.target.value) })}
                              className="px-2 py-1 text-xs font-black border rounded bg-white dark:bg-slate-800 border-amber-400 outline-none text-center w-20 text-amber-600"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveEditedNilai(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNilaiId(null);
                                  setEditNilaiData(null);
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
                        <td className="p-3 font-semibold whitespace-nowrap">{item.waktu || "-"}</td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{item.kelas}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{item.mapel}</td>
                        <td className="p-3 font-semibold text-amber-700 dark:text-amber-400">{item.jenis}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.namaSiswa}</td>
                        <td className="p-3 text-center font-black text-sm text-blue-600 dark:text-blue-400">
                          {item.nilai !== "" && item.nilai !== undefined ? item.nilai : "-"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleStartEditNilai(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNilai(item.id)}
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
    </div>
  );
};

