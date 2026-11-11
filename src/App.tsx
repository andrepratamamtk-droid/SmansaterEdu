import React, { useState, useEffect } from "react";
import { 
  PieChart, 
  GraduationCap, 
  Sparkles, 
  Printer,
  Clock, 
  ClipboardCheck, 
  Star, 
  Calendar, 
  HeartHandshake, 
  FileCheck, 
  Wand2, 
  Bot, 
  Settings,
  ChevronRight,
  X,
  SlidersHorizontal,
  FileQuestion,
  Compass
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { KelolaSiswaView } from "./components/KelolaSiswaView";
import { CetakKartuQRView } from "./components/CetakKartuQRView";
import { KelolaMapelView } from "./components/KelolaMapelView";
import { JadwalMengajarView } from "./components/JadwalMengajarView";
import { InputAbsensiView } from "./components/InputAbsensiView";
import { InputPenilaianView } from "./components/InputPenilaianView";
import { AgendaMengajarView } from "./components/AgendaMengajarView";
import { BimbinganWaliView } from "./components/BimbinganWaliView";
import { GeneratorPerangkatAjarAIView } from "./components/GeneratorPerangkatAjarAIView";
import { ModulAjarAIView } from "./components/ModulAjarAIView";
import { ModulKokurikulerAIView } from "./components/ModulKokurikulerAIView";
import { AsistenGuruAIView } from "./components/AsistenGuruAIView";
import { GeneratorSoalAIView } from "./components/GeneratorSoalAIView";
import { PusatLaporanView } from "./components/PusatLaporanView";
import { PengaturanView } from "./components/PengaturanView";
import { ResetDatabaseView } from "./components/ResetDatabaseView";
import { LoginView } from "./components/LoginView";

import { 
  subscribeCollection, 
  subscribePengaturan, 
  batchSaveDocuments, 
  savePengaturan,
  logOut,
  onAuthUserChanged,
  getCurrentUserUid,
  COLLECTIONS 
} from "./lib/firebase";

import { 
  Siswa, 
  Mapel, 
  Jadwal, 
  LogAbsensi, 
  DataNilai, 
  JurnalAgenda, 
  SiswaBimbingan, 
  BimbinganWali, 
  Pengaturan 
} from "./types";

const DEFAULT_CONFIG: Pengaturan = {
  Nama_Guru: "Hengki Guslau,S.Pd.,Gr",
  NIP_Guru: "199001302024211019",
  Pemerintah: "PEMERINTAH PROVINSI KALIMANTAN BARAT",
  Nama_Sekolah: "SMA Negeri 1 Terentang",
  Alamat_Sekolah: "Jl. Terentang, Kec. Terentang, Kab. Kubu Raya",
  Nama_Kepsek: "Drs. Sudari,M.Pd",
  NIP_Kepsek: "196710061994121002",
  Tempat_Tanda_Tangan: "Terentang",
  Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
  Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU"
};

// Sub-Menu Categories Definitions for Complete Android Navigation
const AKADEMIK_ITEMS = [
  { id: "jadwal", label: "Jadwal Mengajar", icon: Clock, desc: "Kelola & cetak jadwal pelajaran" },
  { id: "absensi", label: "Input Absensi", icon: ClipboardCheck, desc: "Pencatatan kehadiran harian siswa" },
  { id: "penilaian", label: "Input Penilaian", icon: Star, desc: "Rekap & input nilai formatif/sumatif" },
  { id: "agenda", label: "Agenda Mengajar", icon: Calendar, desc: "Jurnal kegiatan belajar harian guru" },
  { id: "bimbingan", label: "Bimbingan Guru Wali", icon: HeartHandshake, desc: "Catatan bimbingan & konseling wali kelas" },
];

const AI_TOOLS_ITEMS = [
  { id: "perangkat_ai", label: "Generator Perangkat Ajar AI", icon: FileCheck, desc: "Buat RPP & ATP otomatis dengan AI", badge: "AI Pro" },
  { id: "modulai", label: "Modul Ajar AI", icon: Wand2, desc: "Modul Ajar Akreditasi Premium & Deep Learning (Siap Supervisi)", badge: "Akreditasi" },
  { id: "kokurikuler_ai", label: "Modul Kokurikuler AI", icon: Compass, desc: "Perencanaan kokurikuler lintas mapel & dimensi profil", badge: "Kokurikuler" },
  { id: "asistenai", label: "Asisten Guru AI", icon: Bot, desc: "Tanya jawab & konsultasi materi mengajar", badge: "Chatbot" },
  { id: "soalai", label: "Generator Soal AI", icon: FileQuestion, desc: "Naskah Soal Ujian, LJS, dan Kunci Jawaban Siap Cetak", badge: "Ujian" },
];

const LAPORAN_ITEMS = [
  { id: "laporan", label: "Pusat Laporan", icon: Printer, desc: "Cetak Rekap Absensi, Leger & Jurnal PDF" },
  { id: "pengaturan", label: "Pengaturan Profil & Kop", icon: Settings, desc: "Atur data guru, sekolah & kop dokumen" },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("edadmin_auth_token"));
  });
  const [currentUid, setCurrentUid] = useState<string>(() => getCurrentUserUid());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategorySheet, setActiveCategorySheet] = useState<"akademik" | "ai" | "laporan" | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("edadmin_theme") === "dark";
  });
  const [isConnected, setIsConnected] = useState(false);

  // Sync dark class on documentElement and body for Tailwind CSS theme switching
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("edadmin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("edadmin_theme", "light");
    }
  }, [isDarkMode]);

  // Firestore Data Collections
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [absensiList, setAbsensiList] = useState<LogAbsensi[]>([]);
  const [nilaiList, setNilaiList] = useState<DataNilai[]>([]);
  const [agendaList, setAgendaList] = useState<JurnalAgenda[]>([]);
  const [siswaBimbinganList, setSiswaBimbinganList] = useState<SiswaBimbingan[]>([]);
  const [bimbinganList, setBimbinganList] = useState<BimbinganWali[]>([]);
  const [config, setConfig] = useState<Pengaturan>(DEFAULT_CONFIG);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthUserChanged((user) => {
      if (user) {
        setCurrentUid(user.uid);
        setIsAuthenticated(true);
      } else {
        const storedUid = getCurrentUserUid();
        setCurrentUid(storedUid);
        if (!localStorage.getItem("edadmin_auth_token")) {
          setIsAuthenticated(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Firebase real-time collections for the active Google account UID
  useEffect(() => {
    if (!isAuthenticated || !currentUid) return;

    // Reset current lists while switching / fetching user database
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);

    let unsubs: Array<() => void> = [];

    unsubs.push(subscribeCollection<Siswa>(COLLECTIONS.SISWA, (data) => {
      setSiswaList(data);
      setIsConnected(true);
    }, currentUid));

    unsubs.push(subscribeCollection<Mapel>(COLLECTIONS.MAPEL, (data) => {
      setMapelList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<Jadwal>(COLLECTIONS.JADWAL, (data) => {
      setJadwalList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<LogAbsensi>(COLLECTIONS.LOG_ABSENSI, (data) => {
      setAbsensiList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<DataNilai>(COLLECTIONS.DATA_NILAI, (data) => {
      setNilaiList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<JurnalAgenda>(COLLECTIONS.JURNAL_AGENDA, (data) => {
      setAgendaList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<SiswaBimbingan>(COLLECTIONS.SISWA_BIMBINGAN, (data) => {
      setSiswaBimbinganList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<BimbinganWali>(COLLECTIONS.BIMBINGAN_WALI, (data) => {
      setBimbinganList(data);
    }, currentUid));

    unsubs.push(subscribePengaturan((cfg) => {
      if (cfg && Object.keys(cfg).length > 0) {
        // Automatically sync legacy placeholder config to requested defaults
        const updatedCfg = { ...cfg };
        if (updatedCfg.Nama_Sekolah === "SMP NEGERI 3 KERINCI" || !updatedCfg.Nama_Sekolah) {
          updatedCfg.Nama_Sekolah = DEFAULT_CONFIG.Nama_Sekolah;
        }
        if (updatedCfg.Nama_Kepsek === "Hamdani, S.Pd., M.Si." || !updatedCfg.Nama_Kepsek) {
          updatedCfg.Nama_Kepsek = DEFAULT_CONFIG.Nama_Kepsek;
        }
        if (updatedCfg.NIP_Kepsek === "19780514 200212 1 003" || !updatedCfg.NIP_Kepsek) {
          updatedCfg.NIP_Kepsek = DEFAULT_CONFIG.NIP_Kepsek;
        }
        if (updatedCfg.Tempat_Tanda_Tangan === "Kerinci" || !updatedCfg.Tempat_Tanda_Tangan) {
          updatedCfg.Tempat_Tanda_Tangan = DEFAULT_CONFIG.Tempat_Tanda_Tangan;
        }
        if (updatedCfg.NIP_Guru === "19850312 201001 1 008" || !updatedCfg.NIP_Guru) {
          updatedCfg.NIP_Guru = DEFAULT_CONFIG.NIP_Guru;
        }
        if (updatedCfg.Nama_Guru === "Drs. Yefri Haryanto, M.Pd." || !updatedCfg.Nama_Guru) {
          updatedCfg.Nama_Guru = DEFAULT_CONFIG.Nama_Guru;
        }
        if (updatedCfg.Pemerintah === "PEMERINTAH PROVINSI JAMBI" || !updatedCfg.Pemerintah) {
          updatedCfg.Pemerintah = DEFAULT_CONFIG.Pemerintah;
        }
        setConfig((prev) => ({ ...prev, ...updatedCfg }));
      }
    }, currentUid));

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, currentUid]);

  // Seed initial sample data for new user if user's database is empty
  useEffect(() => {
    if (!isAuthenticated || !currentUid) return;

    const seedInitialData = async () => {
      // Do not re-seed sample data if database was explicitly cleared/wiped by this user
      if (
        localStorage.getItem(`edadmin_database_cleared_${currentUid}`) === "true" ||
        config?.isDatabaseCleared === true
      ) {
        return;
      }

      // Seed Siswa if empty
      if (siswaList.length === 0 && isConnected) {
        const sampleSiswa: Siswa[] = [
          { id: "1001", nisn: "0012345678", nama: "Ahmad Fulan", kelas: "X A" },
          { id: "1002", nisn: "0012345679", nama: "Siti Aminah", kelas: "X A" },
          { id: "1003", nisn: "0012345680", nama: "Budi Pratama", kelas: "X B" },
          { id: "1004", nisn: "0012345681", nama: "Rizky Febrian", kelas: "X B" }
        ];
        await batchSaveDocuments(COLLECTIONS.SISWA, sampleSiswa, currentUid);
      }

      // Seed Mapel if empty
      if (mapelList.length === 0 && isConnected) {
        const sampleMapel: Mapel[] = [
          { id: "m1", namaMapel: "Pendidikan Pancasila", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m2", namaMapel: "Bahasa Indonesia", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m3", namaMapel: "Matematika", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m4", namaMapel: "Sejarah", semester: "Ganjil", tahunAjaran: "2026/2027" }
        ];
        await batchSaveDocuments(COLLECTIONS.MAPEL, sampleMapel, currentUid);
      }

      // Seed Jadwal if empty
      if (jadwalList.length === 0 && isConnected) {
        const sampleJadwal: Jadwal[] = [
          { id: "j1", hari: "Senin", jam: "07:30 - 09:00", kelas: "X A", mapel: "Pendidikan Pancasila" },
          { id: "j2", hari: "Selasa", jam: "09:15 - 10:45", kelas: "X B", mapel: "Pendidikan Pancasila" }
        ];
        await batchSaveDocuments(COLLECTIONS.JADWAL, sampleJadwal, currentUid);
      }

      // Save initial config personalized to Google account if empty
      if (!config.Nama_Guru && isConnected) {
        let defaultName = DEFAULT_CONFIG.Nama_Guru;
        try {
          const userRaw = localStorage.getItem("edadmin_user");
          if (userRaw) {
            const userObj = JSON.parse(userRaw);
            if (userObj.name) defaultName = userObj.name;
          }
        } catch {}

        await savePengaturan({
          ...DEFAULT_CONFIG,
          Nama_Guru: defaultName
        }, currentUid);
      }
    };

    seedInitialData();
  }, [isAuthenticated, currentUid, isConnected, siswaList.length, mapelList.length, jadwalList.length, config.Nama_Guru, config.isDatabaseCleared]);

  const handleSuccessReset = () => {
    if (currentUid) {
      localStorage.setItem(`edadmin_database_cleared_${currentUid}`, "true");
    }
    setConfig((prev) => ({ ...prev, isDatabaseCleared: true }));
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);
  };

  const handleLogout = async () => {
    await logOut();
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);
    setIsConnected(false);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => setIsAuthenticated(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors ${isDarkMode ? "dark" : ""}`}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDarkMode}
          onSetDarkMode={(isDark) => setIsDarkMode(isDark)}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isConnected={isConnected}
          config={config}
          onLogout={handleLogout}
        />

        {/* Sub-Header Pill Navigation Bar for Complete Mobile Module Navigation */}
        {AKADEMIK_ITEMS.some(item => item.id === activeTab) && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
            <button 
              onClick={() => setActiveCategorySheet("akademik")}
              className="flex items-center space-x-1 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0 text-blue-600 dark:text-blue-400 font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              title="Buka Laci Menu Akademik"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Akademik:</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
            {AKADEMIK_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {AI_TOOLS_ITEMS.some(item => item.id === activeTab) && (
          <div className="bg-amber-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-200/50 dark:border-slate-800 px-3 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
            <button 
              onClick={() => setActiveCategorySheet("ai")}
              className="flex items-center space-x-1 pr-2 border-r border-amber-200 dark:border-slate-800 shrink-0 text-amber-600 dark:text-amber-400 font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              title="Buka Laci Menu AI Tools"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Tools:</span>
              <SlidersHorizontal className="w-3 h-3 text-amber-400 ml-0.5" />
            </button>
            {AI_TOOLS_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {LAPORAN_ITEMS.some(item => item.id === activeTab) && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
            <button 
              onClick={() => setActiveCategorySheet("laporan")}
              className="flex items-center space-x-1 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0 text-slate-700 dark:text-slate-300 font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              title="Buka Laci Menu Laporan"
            >
              <Printer className="w-4 h-4" />
              <span>Laporan:</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
            {LAPORAN_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar pb-24 lg:pb-8">
          {activeTab === "dashboard" && (
            <DashboardView
              siswaList={siswaList}
              mapelList={mapelList}
              absensiList={absensiList}
              nilaiList={nilaiList}
              jadwalList={jadwalList}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "siswa" && <KelolaSiswaView siswaList={siswaList} />}

          {activeTab === "kartu" && <CetakKartuQRView siswaList={siswaList} config={config} />}

          {activeTab === "mapel" && <KelolaMapelView mapelList={mapelList} />}

          {activeTab === "jadwal" && (
            <JadwalMengajarView
              jadwalList={jadwalList}
              mapelList={mapelList}
              siswaList={siswaList}
            />
          )}

          {activeTab === "absensi" && (
            <InputAbsensiView
              siswaList={siswaList}
              mapelList={mapelList}
              absensiList={absensiList}
              config={config}
            />
          )}

          {activeTab === "penilaian" && (
            <InputPenilaianView
              siswaList={siswaList}
              mapelList={mapelList}
              nilaiList={nilaiList}
              config={config}
            />
          )}

          {activeTab === "agenda" && (
            <AgendaMengajarView
              agendaList={agendaList}
              mapelList={mapelList}
              siswaList={siswaList}
              config={config}
            />
          )}

          {activeTab === "bimbingan" && (
            <BimbinganWaliView
              bimbinganList={bimbinganList}
              siswaBimbinganList={siswaBimbinganList}
              siswaList={siswaList}
              config={config}
            />
          )}

          {activeTab === "perangkat_ai" && <GeneratorPerangkatAjarAIView config={config} />}

          {activeTab === "modulai" && <ModulAjarAIView config={config} />}

          {activeTab === "kokurikuler_ai" && <ModulKokurikulerAIView config={config} />}

          {activeTab === "asistenai" && <AsistenGuruAIView config={config} />}

          {activeTab === "soalai" && <GeneratorSoalAIView config={config} />}

          {activeTab === "laporan" && (
            <PusatLaporanView
              siswaList={siswaList}
              mapelList={mapelList}
              absensiList={absensiList}
              nilaiList={nilaiList}
              agendaList={agendaList}
              bimbinganList={bimbinganList}
              config={config}
            />
          )}

          {activeTab === "pengaturan" && (
            <PengaturanView
              config={config}
              onNavigateToReset={() => setActiveTab("resetdb")}
            />
          )}

          {activeTab === "resetdb" && (
            <ResetDatabaseView onSuccessReset={handleSuccessReset} />
          )}

          {/* Creator Credit Footer */}
          <footer className="mt-12 mb-4 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center select-none">
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 shadow-xs backdrop-blur-xs text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">GuruDigitalLab.id SmansaterPRO</span>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <span>Created By <strong className="text-blue-600 dark:text-blue-400 font-bold">Hengki Guslau,S.Pd.,Gr</strong></span>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono font-medium">
                HG_Educreator
              </span>
            </div>
          </footer>
        </main>

        {/* Native Android Bottom Navigation Bar (4 Utama Menu: Dashboard, Akademik, AI Tools, Laporan) */}
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-30 px-2 py-1.5 pb-safe shadow-lg flex items-center justify-around transition-colors select-none"
          aria-label="Navigasi Bawah Android"
        >
          <button
            onClick={() => {
              setActiveCategorySheet(null);
              setActiveTab("dashboard");
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              activeTab === "dashboard"
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <PieChart className={`w-5 h-5 ${activeTab === "dashboard" ? "scale-110" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveCategorySheet(activeCategorySheet === "akademik" ? null : "akademik");
              if (!AKADEMIK_ITEMS.some(i => i.id === activeTab)) {
                setActiveTab("absensi");
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              AKADEMIK_ITEMS.some(i => i.id === activeTab)
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <GraduationCap className={`w-5 h-5 ${AKADEMIK_ITEMS.some(i => i.id === activeTab) ? "scale-110" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">Akademik</span>
          </button>

          <button
            onClick={() => {
              setActiveCategorySheet(activeCategorySheet === "ai" ? null : "ai");
              if (!AI_TOOLS_ITEMS.some(i => i.id === activeTab)) {
                setActiveTab("perangkat_ai");
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              AI_TOOLS_ITEMS.some(i => i.id === activeTab)
                ? "text-amber-500 dark:text-amber-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
            }`}
          >
            <Sparkles className={`w-5 h-5 ${AI_TOOLS_ITEMS.some(i => i.id === activeTab) ? "scale-110 text-amber-500" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">AI Tools</span>
          </button>

          <button
            onClick={() => {
              setActiveCategorySheet(activeCategorySheet === "laporan" ? null : "laporan");
              if (!LAPORAN_ITEMS.some(i => i.id === activeTab)) {
                setActiveTab("laporan");
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              LAPORAN_ITEMS.some(i => i.id === activeTab)
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Printer className={`w-5 h-5 ${LAPORAN_ITEMS.some(i => i.id === activeTab) ? "scale-110" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">Laporan</span>
          </button>
        </nav>

        {/* Android Native Bottom Sheet Chooser Modal */}
        {activeCategorySheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
            {/* Dark Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setActiveCategorySheet(null)}
            />

            {/* Bottom Sheet Modal Container */}
            <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl z-10 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-200 pb-20">
              {/* Top Drag Handle Bar */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Sheet Header Title */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  {activeCategorySheet === "akademik" && (
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  )}
                  {activeCategorySheet === "ai" && (
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  {activeCategorySheet === "laporan" && (
                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                      <Printer className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {activeCategorySheet === "akademik" && "Pilih Menu Akademik Lengkap"}
                      {activeCategorySheet === "ai" && "Pilih Tool AI Lengkap"}
                      {activeCategorySheet === "laporan" && "Pilih Laporan & Sistem"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeCategorySheet === "akademik" && "Semua modul administrasi akademik guru"}
                      {activeCategorySheet === "ai" && "Seluruh generator & kecerdasan buatan AI Pro"}
                      {activeCategorySheet === "laporan" && "Rekapitulasi cetak PDF & pengaturan"}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveCategorySheet(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Item List Options */}
              <div className="space-y-2.5">
                {activeCategorySheet === "akademik" && AKADEMIK_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveCategorySheet(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm truncate">{item.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    </button>
                  );
                })}

                {activeCategorySheet === "ai" && AI_TOOLS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveCategorySheet(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-amber-500 text-slate-950" : "bg-white dark:bg-slate-700 text-amber-500"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs sm:text-sm truncate">{item.label}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-400/30">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-500" : "text-slate-400"}`} />
                    </button>
                  );
                })}

                {activeCategorySheet === "laporan" && LAPORAN_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveCategorySheet(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm truncate">{item.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-slate-800 dark:text-white" : "text-slate-400"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
