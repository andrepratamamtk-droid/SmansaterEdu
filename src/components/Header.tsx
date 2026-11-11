import React from "react";
import { Menu, CloudCheck, CloudOff, Moon, Sun, GraduationCap, ShieldCheck, LogOut } from "lucide-react";
import { Pengaturan } from "../types";

interface HeaderProps {
  activeTab: string;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onSetDarkMode: (isDark: boolean) => void;
  onToggleDarkMode?: () => void;
  isConnected: boolean;
  config: Pengaturan;
  onLogout?: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  siswa: "Kelola Master Data Siswa",
  kartu: "Cetak Kartu Pelajar QR Code",
  mapel: "Kelola Mata Pelajaran",
  jadwal: "Jadwal Mengajar Guru",
  absensi: "Input Absensi Harian & QR Scanner",
  penilaian: "Input Nilai Akademik Siswa",
  agenda: "Jurnal Agenda Mengajar",
  bimbingan: "Catatan Bimbingan Guru Wali",
  perangkat_ai: "Generator Perangkat Ajar AI (Analisis CP, TP, ATP, Prota, Prosem, KKTP)",
  modulai: "Generator Modul Ajar AI (Deep Learning)",
  asistenai: "Asisten AI Pendamping Guru",
  laporan: "Pusat Cetak Laporan PDF",
  pengaturan: "Pengaturan & Profil Sekolah",
  resetdb: "Kosongkan & Hapus Seluruh Isi Database"
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleSidebar,
  isDarkMode,
  onSetDarkMode,
  onToggleDarkMode,
  isConnected,
  config,
  onLogout
}) => {
  const [currentUser, setCurrentUser] = React.useState<any>(() => {
    try {
      const raw = localStorage.getItem("edadmin_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem("edadmin_user");
        setCurrentUser(raw ? JSON.parse(raw) : null);
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSelectDark = (dark: boolean) => {
    if (onSetDarkMode) {
      onSetDarkMode(dark);
    } else if (onToggleDarkMode) {
      onToggleDarkMode();
    }
  };

  return (
    <header className="sticky top-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 z-30 transition-colors shadow-xs">
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Buka Laci Samping"
          title="Buka Laci Samping (Drawer Menu)"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-400 rounded-xl flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-xs">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight justify-center shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base lg:text-lg tracking-tight block whitespace-nowrap">
                GuruDigitalLab.id
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] sm:text-[11px] font-extrabold tracking-tight">
                SmansaterPRO
              </span>
            </div>
            {activeTab !== "dashboard" && TAB_TITLES[activeTab] && (
              <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[120px] sm:max-w-xs block">
                {TAB_TITLES[activeTab]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-1">
        {/* Firebase Live Status Badge */}
        <div
          className={`hidden min-[480px]:flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shadow-xs transition-colors shrink-0 ${
            isConnected
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          }`}
        >
          {isConnected ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Firebase Live</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Connecting...</span>
            </>
          )}
        </div>

        {/* Teacher / User profile badge */}
        <div className="hidden min-[380px]:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
            />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[80px] sm:max-w-[140px] truncate">
            {currentUser?.name || config.Nama_Guru || "Andi Yoka"}
          </span>
        </div>

        {/* Theme Toggle Switch (Sun = Light Mode, Moon = Dark Mode) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-700 space-x-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectDark(false)}
            className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center justify-center min-w-[30px] min-h-[30px] sm:min-w-[36px] sm:min-h-[36px] cursor-pointer ${
              !isDarkMode
                ? "bg-amber-400 text-slate-950 shadow-xs font-bold scale-105"
                : "text-slate-400 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 active:scale-95"
            }`}
            title="Sinar Matahari: Aktifkan Tema Terang (Light Mode)"
            aria-label="Tema Terang"
          >
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSelectDark(true)}
            className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center justify-center min-w-[30px] min-h-[30px] sm:min-w-[36px] sm:min-h-[36px] cursor-pointer ${
              isDarkMode
                ? "bg-indigo-600 text-white shadow-xs font-bold scale-105"
                : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95"
            }`}
            title="Bulan Sabit: Aktifkan Tema Gelap (Dark Mode)"
            aria-label="Tema Gelap"
          >
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 sm:p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 active:scale-95 transition-all min-w-[32px] min-h-[32px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center shrink-0 text-xs font-semibold cursor-pointer"
            title="Keluar dari Akses System (Logout)"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
