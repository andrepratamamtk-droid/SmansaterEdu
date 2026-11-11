import React, { useState } from "react";
import { HeartHandshake, Plus, Trash2, Pencil, X, Save, CheckCircle2, UserPlus, History, Search, Filter } from "lucide-react";
import { BimbinganWali, SiswaBimbingan, Siswa, Pengaturan } from "../types";
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

interface BimbinganWaliViewProps {
  bimbinganList: BimbinganWali[];
  siswaBimbinganList: SiswaBimbingan[];
  siswaList: Siswa[];
  config: Pengaturan;
}

export const BimbinganWaliView: React.FC<BimbinganWaliViewProps> = ({
  bimbinganList,
  siswaBimbinganList,
  siswaList,
  config
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"input" | "rekap">("input");

  // Form Siswa Perwalian
  const [newSiswaNama, setNewSiswaNama] = useState("");
  const [newSiswaKelas, setNewSiswaKelas] = useState("");

  // Edit Siswa Perwalian
  const [editingSiswaBimbingan, setEditingSiswaBimbingan] = useState<SiswaBimbingan | null>(null);
  const [editSiswaBimbinganNama, setEditSiswaBimbinganNama] = useState("");
  const [editSiswaBimbinganKelas, setEditSiswaBimbinganKelas] = useState("");

  // Form Catatan Bimbingan
  const [isManualStudentInput, setIsManualStudentInput] = useState(false);
  const [selectedSiswaName, setSelectedSiswaName] = useState("");
  const [manualSiswaName, setManualSiswaName] = useState("");
  const [manualSiswaKelas, setManualSiswaKelas] = useState("");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [jenis, setJenis] = useState("Akademik");
  const [kasus, setKasus] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");

  // Edit Bimbingan Modal State
  const [editingBimbingan, setEditingBimbingan] = useState<BimbinganWali | null>(null);
  const [editBimbinganNama, setEditBimbinganNama] = useState("");
  const [editBimbinganKelas, setEditBimbinganKelas] = useState("");
  const [editBimbinganTanggal, setEditBimbinganTanggal] = useState("");
  const [editBimbinganJenis, setEditBimbinganJenis] = useState("Akademik");
  const [editBimbinganKasus, setEditBimbinganKasus] = useState("");
  const [editBimbinganTindakLanjut, setEditBimbinganTindakLanjut] = useState("");

  // Rekap Filters & Inline Row Edit State
  const [rekapKelasFilter, setRekapKelasFilter] = useState("");
  const [rekapJenisFilter, setRekapJenisFilter] = useState("");
  const [rekapSearchFilter, setRekapSearchFilter] = useState("");

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<BimbinganWali | null>(null);

  // Only students manually input in the Guru Wali menu itself
  const studentOptions = siswaBimbinganList
    .map((sb) => ({ nama: sb.namaSiswa, kelas: sb.kelas }))
    .filter((v, i, a) => a.findIndex((t) => t.nama === v.nama) === i);

  // Auto fill class when student selected
  const activeStudentObj = studentOptions.find((s) => s.nama === selectedSiswaName);
  const activeKelas = isManualStudentInput ? manualSiswaKelas : (activeStudentObj ? activeStudentObj.kelas : "");
  const effectiveStudentName = isManualStudentInput ? manualSiswaName : selectedSiswaName;

  const kelasOptions = Array.from(
    new Set([...siswaBimbinganList.map((s) => s.kelas), ...bimbinganList.map((b) => b.kelas)].filter(Boolean))
  ).sort();

  // Add student to advisory list
  const handleAddSiswaPerwalian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiswaNama.trim() || !newSiswaKelas.trim()) return;

    const id = Date.now().toString();
    const item: SiswaBimbingan = {
      id,
      namaSiswa: newSiswaNama.trim(),
      kelas: newSiswaKelas.trim()
    };

    try {
      await saveDocument(COLLECTIONS.SISWA_BIMBINGAN, id, item);
      setNewSiswaNama("");
      setNewSiswaKelas("");
      notifySimpanSuccess(`Siswa ${item.namaSiswa} ditambahkan ke daftar perwalian.`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menambah.");
    }
  };

  const handleDeleteSiswaBimbingan = async (id: string, nama: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Siswa Perwalian?", `Apakah Anda yakin ingin menghapus ${nama} dari daftar siswa perwalian?`);
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.SISWA_BIMBINGAN, id);
        notifyHapusSuccess(`Siswa ${nama} telah dihapus dari perwalian.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus.");
      }
    }
  };

  const handleStartEditSiswaBimbingan = (sb: SiswaBimbingan) => {
    setEditingSiswaBimbingan(sb);
    setEditSiswaBimbinganNama(sb.namaSiswa);
    setEditSiswaBimbinganKelas(sb.kelas);
  };

  const handleSaveEditSiswaBimbingan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswaBimbingan) return;

    const updated: SiswaBimbingan = {
      ...editingSiswaBimbingan,
      namaSiswa: editSiswaBimbinganNama.trim(),
      kelas: editSiswaBimbinganKelas.trim()
    };

    try {
      await saveDocument(COLLECTIONS.SISWA_BIMBINGAN, editingSiswaBimbingan.id, updated);
      setEditingSiswaBimbingan(null);
      notifyEditSuccess("Data siswa perwalian berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui.");
    }
  };

  // Add counseling record
  const handleAddBimbingan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStudentName.trim() || !kasus.trim() || !tindakLanjut.trim()) {
      notifySimpanError("Silakan isi nama siswa, deskripsi kasus, dan solusi tindak lanjut.");
      return;
    }

    const id = Date.now().toString();
    const record: BimbinganWali = {
      id,
      tanggal,
      namaSiswa: effectiveStudentName.trim(),
      kelas: activeKelas.trim(),
      jenis,
      kasus: kasus.trim(),
      tindakLanjut: tindakLanjut.trim(),
      guruWali: config.Nama_Guru || "Guru Wali"
    };

    try {
      await saveDocument(COLLECTIONS.BIMBINGAN_WALI, id, record);
      setKasus("");
      setTindakLanjut("");
      setManualSiswaName("");
      setManualSiswaKelas("");
      notifySimpanSuccess(`Catatan bimbingan ${effectiveStudentName} tersimpan!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan catatan.");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Catatan Bimbingan?", "Apakah Anda yakin ingin menghapus catatan bimbingan ini?");
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.BIMBINGAN_WALI, id);
        notifyHapusSuccess("Catatan bimbingan telah dihapus.");
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus.");
      }
    }
  };

  const handleStartEditBimbingan = (b: BimbinganWali) => {
    setEditingBimbingan(b);
    setEditBimbinganNama(b.namaSiswa);
    setEditBimbinganKelas(b.kelas);
    setEditBimbinganTanggal(b.tanggal);
    setEditBimbinganJenis(b.jenis);
    setEditBimbinganKasus(b.kasus);
    setEditBimbinganTindakLanjut(b.tindakLanjut);
  };

  const handleSaveEditBimbingan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBimbingan) return;

    const updated: BimbinganWali = {
      ...editingBimbingan,
      namaSiswa: editBimbinganNama.trim(),
      kelas: editBimbinganKelas.trim(),
      tanggal: editBimbinganTanggal,
      jenis: editBimbinganJenis,
      kasus: editBimbinganKasus.trim(),
      tindakLanjut: editBimbinganTindakLanjut.trim()
    };

    try {
      await saveDocument(COLLECTIONS.BIMBINGAN_WALI, editingBimbingan.id, updated);
      setEditingBimbingan(null);
      notifyEditSuccess("Catatan bimbingan berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui catatan.");
    }
  };

  // Inline Row Edit handlers
  const handleStartRowEdit = (item: BimbinganWali) => {
    setEditingRowId(item.id);
    setEditRowData({ ...item });
  };

  const handleSaveRowEdit = async (id: string) => {
    if (!editRowData) return;
    try {
      await saveDocument(COLLECTIONS.BIMBINGAN_WALI, id, editRowData);
      setEditingRowId(null);
      setEditRowData(null);
      notifyEditSuccess("Catatan bimbingan berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui catatan.");
    }
  };

  // Filtered Rekap List
  const filteredBimbinganList = bimbinganList.filter((b) => {
    const matchKelas = !rekapKelasFilter || b.kelas === rekapKelasFilter;
    const matchJenis = !rekapJenisFilter || b.jenis === rekapJenisFilter;
    const q = rekapSearchFilter.toLowerCase();
    const matchSearch = !q || b.namaSiswa.toLowerCase().includes(q) || b.kasus.toLowerCase().includes(q) || b.tindakLanjut.toLowerCase().includes(q);
    return matchKelas && matchJenis && matchSearch;
  });

  // Rekap Stats
  const totalCatatan = bimbinganList.length;
  const totalAkademik = bimbinganList.filter((b) => b.jenis === "Akademik").length;
  const totalKarakter = bimbinganList.filter((b) => b.jenis !== "Akademik").length;

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
          <HeartHandshake className="w-4 h-4" />
          <span>Input Bimbingan Wali</span>
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
          <span>Riwayat & Rekapitulasi Bimbingan</span>
          {bimbinganList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold">
              {bimbinganList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "input" ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-blue-600" />
              Bimbingan Guru Wali
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan perkembangan karakter, akademik, dan penanganan khusus siswa perwalian.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Add & List Student to Advisory */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                1. Daftar Siswa Perwalian
              </h3>
              <form onSubmit={handleAddSiswaPerwalian} className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama Lengkap Siswa"
                  value={newSiswaNama}
                  onChange={(e) => setNewSiswaNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Kelas (misal: VII A)"
                  value={newSiswaKelas}
                  onChange={(e) => setNewSiswaKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Perwalian</span>
                </button>
              </form>

              {/* List Siswa Perwalian khusus */}
              {siswaBimbinganList.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Siswa Terdaftar ({siswaBimbinganList.length})</span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {siswaBimbinganList.map((sb) => (
                      <div
                        key={sb.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">{sb.namaSiswa}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">Kelas {sb.kelas}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEditSiswaBimbingan(sb)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSiswaBimbingan(sb.id, sb.namaSiswa)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Counseling Form */}
            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  2. Catatan Kasus & Solusi Bimbingan
                </h3>
                <button
                  type="button"
                  onClick={() => setIsManualStudentInput(!isManualStudentInput)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isManualStudentInput ? "Gunakan Dropdown Siswa" : "Input Manual Nama"}</span>
                </button>
              </div>

              <form onSubmit={handleAddBimbingan} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isManualStudentInput ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Siswa (Manual) *</label>
                      <input
                        type="text"
                        placeholder="Ketik Nama Siswa"
                        value={manualSiswaName}
                        onChange={(e) => setManualSiswaName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                      <input
                        type="text"
                        placeholder="Contoh: VIII B"
                        value={manualSiswaKelas}
                        onChange={(e) => setManualSiswaKelas(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-bold"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Siswa *</label>
                      <select
                        value={selectedSiswaName}
                        onChange={(e) => setSelectedSiswaName(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                        required
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {studentOptions.map((so, idx) => (
                          <option key={idx} value={so.nama}>
                            {so.nama} ({so.kelas})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas (Otomatis)</label>
                      <input
                        type="text"
                        value={activeKelas}
                        readOnly
                        placeholder="Terisi otomatis"
                        className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Masalah *</label>
                  <select
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Pribadi & Karakter">Pribadi & Karakter</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Pengembangan Keterampilan">Pengembangan Keterampilan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Masalah / Deskripsi Kasus *</label>
                  <input
                    type="text"
                    placeholder="Detail permasalahan siswa"
                    value={kasus}
                    onChange={(e) => setKasus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Solusi / Tindak Lanjut *</label>
                  <input
                    type="text"
                    placeholder="Solusi, konseling, atau pemanggilan orang tua"
                    value={tindakLanjut}
                    onChange={(e) => setTindakLanjut(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simpan Catatan Bimbingan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Table List */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3 text-center">Jenis</th>
                  <th className="p-3">Masalah / Kasus</th>
                  <th className="p-3">Solusi & Tindak Lanjut</th>
                  <th className="p-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {bimbinganList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada catatan bimbingan wali kelas.
                    </td>
                  </tr>
                ) : (
                  bimbinganList.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 font-semibold whitespace-nowrap">{b.tanggal}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{b.namaSiswa}</td>
                      <td className="p-3 text-center font-extrabold">{b.kelas}</td>
                      <td className="p-3 text-center">
                        <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {b.jenis}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs">{b.kasus}</td>
                      <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400 max-w-xs">{b.tindakLanjut}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEditBimbingan(b)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Catatan"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(b.id)}
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
        /* Riwayat & Rekapitulasi Bimbingan View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Riwayat & Rekapitulasi Bimbingan Guru Wali
            </h2>
            <p className="text-xs text-slate-500">
              Rekapitulasi lengkap catatan bimbingan siswa perwalian. Anda dapat mengedit, menyimpan pembaruan, atau menghapus entri.
            </p>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Bimbingan</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{totalCatatan}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60">
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Kasus Akademik</p>
              <p className="text-lg font-extrabold text-blue-800 dark:text-blue-200">{totalAkademik}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60">
              <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Pribadi/Karakter/Lainnya</p>
              <p className="text-lg font-extrabold text-purple-800 dark:text-purple-200">{totalKarakter}</p>
            </div>
          </div>

          {/* Rekap Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Jenis Masalah</label>
              <select
                value={rekapJenisFilter}
                onChange={(e) => setRekapJenisFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Jenis</option>
                <option value="Akademik">Akademik</option>
                <option value="Pribadi & Karakter">Pribadi & Karakter</option>
                <option value="Sosial">Sosial</option>
                <option value="Pengembangan Keterampilan">Pengembangan Keterampilan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Siswa / Kasus</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik kata kunci..."
                  value={rekapSearchFilter}
                  onChange={(e) => setRekapSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Table with Edit, Simpan, Hapus */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3 text-center">Jenis</th>
                  <th className="p-3">Masalah / Kasus</th>
                  <th className="p-3">Solusi & Tindak Lanjut</th>
                  <th className="p-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBimbinganList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada catatan bimbingan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredBimbinganList.map((item, idx) => {
                    const isEditing = editingRowId === item.id;

                    if (isEditing && editRowData) {
                      return (
                        <tr key={item.id} className="bg-blue-50/70 dark:bg-blue-950/40">
                          <td className="p-3 text-center font-bold text-blue-600">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={editRowData.tanggal}
                              onChange={(e) => setEditRowData({ ...editRowData, tanggal: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-32"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editRowData.namaSiswa}
                              onChange={(e) => setEditRowData({ ...editRowData, namaSiswa: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editRowData.kelas}
                              onChange={(e) => setEditRowData({ ...editRowData, kelas: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none text-center w-16"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={editRowData.jenis}
                              onChange={(e) => setEditRowData({ ...editRowData, jenis: e.target.value })}
                              className="px-1.5 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none"
                            >
                              <option value="Akademik">Akademik</option>
                              <option value="Pribadi & Karakter">Pribadi & Karakter</option>
                              <option value="Sosial">Sosial</option>
                              <option value="Pengembangan Keterampilan">Pengembangan Keterampilan</option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editRowData.kasus}
                              onChange={(e) => setEditRowData({ ...editRowData, kasus: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editRowData.tindakLanjut}
                              onChange={(e) => setEditRowData({ ...editRowData, tindakLanjut: e.target.value })}
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
                        <td className="p-3 font-semibold whitespace-nowrap">{item.tanggal}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{item.namaSiswa}</td>
                        <td className="p-3 text-center font-extrabold">{item.kelas}</td>
                        <td className="p-3 text-center">
                          <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {item.jenis}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs">{item.kasus}</td>
                        <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400 max-w-xs">{item.tindakLanjut}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleStartRowEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Catatan"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Catatan"
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

      {/* Modal Edit Siswa Bimbingan */}
      {editingSiswaBimbingan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Edit Siswa Perwalian</span>
              </h3>
              <button
                onClick={() => setEditingSiswaBimbingan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSiswaBimbingan} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Siswa *</label>
                <input
                  type="text"
                  value={editSiswaBimbinganNama}
                  onChange={(e) => setEditSiswaBimbinganNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                <input
                  type="text"
                  value={editSiswaBimbinganKelas}
                  onChange={(e) => setEditSiswaBimbinganKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingSiswaBimbingan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Catatan Bimbingan */}
      {editingBimbingan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Edit Catatan Bimbingan BK</span>
              </h3>
              <button
                onClick={() => setEditingBimbingan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBimbingan} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Siswa *</label>
                <input
                  type="text"
                  value={editBimbinganNama}
                  onChange={(e) => setEditBimbinganNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                <input
                  type="text"
                  value={editBimbinganKelas}
                  onChange={(e) => setEditBimbinganKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={editBimbinganTanggal}
                  onChange={(e) => setEditBimbinganTanggal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Masalah *</label>
                <select
                  value={editBimbinganJenis}
                  onChange={(e) => setEditBimbinganJenis(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="Akademik">Akademik</option>
                  <option value="Pribadi & Karakter">Pribadi & Karakter</option>
                  <option value="Sosial">Sosial</option>
                  <option value="Pengembangan Keterampilan">Pengembangan Keterampilan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Masalah / Deskripsi Kasus *</label>
                <input
                  type="text"
                  value={editBimbinganKasus}
                  onChange={(e) => setEditBimbinganKasus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Solusi / Tindak Lanjut *</label>
                <input
                  type="text"
                  value={editBimbinganTindakLanjut}
                  onChange={(e) => setEditBimbinganTindakLanjut(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingBimbingan(null)}
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

