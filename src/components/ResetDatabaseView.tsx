import React, { useState } from "react";
import { Trash2, AlertTriangle, ShieldAlert, RefreshCw, Layers } from "lucide-react";
import { clearAllDatabaseCollections } from "../lib/firebase";
import { notifyHapusSuccess, notifyHapusError, confirmDeleteAlert } from "../lib/swal";

interface ResetDatabaseViewProps {
  onSuccessReset: () => void;
}

export const ResetDatabaseView: React.FC<ResetDatabaseViewProps> = ({ onSuccessReset }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canProceed = isConfirmed && confirmText.trim().toUpperCase() === "HAPUS";

  const handleExecuteReset = async () => {
    setIsLoading(true);
    try {
      await clearAllDatabaseCollections();
      setShowModal(false);
      setIsLoading(false);
      notifyHapusSuccess("Seluruh isi database telah dibersihkan secara permanen. Aplikasi kini bersih dan siap digunakan dari awal.");
      setIsConfirmed(false);
      setConfirmText("");
      onSuccessReset();
    } catch (err: any) {
      setIsLoading(false);
      setShowModal(false);
      notifyHapusError(err.message || "Gagal menghapus database. Silakan periksa koneksi Anda.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Alert */}
      <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500/30 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-red-900 dark:text-red-200">
              PERINGATAN PENTING: Kosongkan / Hapus Semua Isi Database
            </h2>
            <p className="text-xs font-medium text-red-700 dark:text-red-300 leading-relaxed">
              Menu ini digunakan untuk melakukan reset total aplikasi. Guru dan Pengelola wajib waspada sebelum mengeksekusi penghapusan ini.
            </p>
          </div>
        </div>

        {/* List of Data to be Erased */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-red-200 dark:border-red-900/50 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-600" />
            Daftar Data Yang Akan Dihapus Bersih Secara Permanen:
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>1. Master Data Siswa (NISN & Kelas)</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>2. QR Code Kartu Pelajar</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>3. Data Mata Pelajaran</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>4. Jadwal Mengajar Guru</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>5. Log & Presensi Absensi Siswa</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>6. Data Penilaian Akademik & Leger</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>7. Jurnal Agenda Mengajar Harian</span>
            </li>
            <li className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>8. Catatan Bimbingan Guru Wali</span>
            </li>
          </ul>

          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>CATATAN PENTING: Data Pengaturan Profil Guru & Kop Sekolah (Nama Guru, NIP, Nama Sekolah, Kepsek, & Logo) TETAP DISIMPAN dan TIDAK DIHAPUS.</span>
          </div>
        </div>

        {/* Confirmation Checklist & Input */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
              Saya memahami bahwa tindakan ini menghapus seluruh isi database secara permanen dari server Firebase dan TIDAK DAPAT DIBATALKAN.
            </span>
          </label>

          {isConfirmed && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Ketik kata <span className="text-red-600 font-black">HAPUS</span> di bawah ini untuk mengonfirmasi tindakan Anda:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Ketik "HAPUS"'
                className="w-full sm:w-64 px-4 py-2 text-xs font-black uppercase tracking-widest border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <button
              disabled={!canProceed || isLoading}
              onClick={() => setShowModal(true)}
              className={`px-6 py-3 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
                canProceed && !isLoading
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>HAPUS SELESAI ISI DATABASE SEKARANG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-red-200 dark:border-red-900/50 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Konfirmasi Terakhir Penghapusan!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Apakah Anda benar-benar YAKIN 100% untuk menghapus seluruh data siswa, absensi, nilai, jadwal, agenda, dan bimbingan secara permanen?
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-center">
              Aplikasi akan bersih sepenuhnya (0 data) dan siap digunakan dari nol.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                disabled={isLoading}
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Batal / Batalkan
              </button>
              <button
                disabled={isLoading}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Semua</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
