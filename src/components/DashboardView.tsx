import React from "react";
import {
  Users,
  School,
  BookOpen,
  ClipboardCheck,
  Wand2,
  Calendar,
  Star,
  TrendingUp,
  QrCode,
  GraduationCap,
  BookMarked,
  HeartHandshake,
  Bot,
  FileText,
  Settings,
  ArrowRight,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { Siswa, Mapel, LogAbsensi, DataNilai, Jadwal } from "../types";

interface DashboardViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: LogAbsensi[];
  nilaiList: DataNilai[];
  jadwalList: Jadwal[];
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  siswaList,
  mapelList,
  absensiList,
  nilaiList,
  jadwalList,
  onNavigate
}) => {
  // Stat calculations
  const totalSiswa = siswaList.length;
  const kelasSet = new Set(siswaList.map((s) => s.kelas).filter(Boolean));
  const totalKelas = kelasSet.size;
  const totalMapel = mapelList.length;

  // Today's attendance percentage
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAbsensi = absensiList.filter((a) => a.waktu === todayStr || a.tanggal === todayStr);
  let attendancePercentage = 0;
  if (todayAbsensi.length > 0) {
    const hadirCount = todayAbsensi.filter((a) => a.status === "Hadir").length;
    attendancePercentage = Math.round((hadirCount / todayAbsensi.length) * 100);
  }

  // Calculate 7-day attendance trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const attendanceTrend = last7Days.map((date) => {
    const dayRecords = absensiList.filter((a) => a.waktu === date || a.tanggal === date);
    if (dayRecords.length === 0) return { date: date.slice(5), pct: 0 };
    const hadir = dayRecords.filter((a) => a.status === "Hadir").length;
    return {
      date: date.slice(5),
      pct: Math.round((hadir / dayRecords.length) * 100)
    };
  });

  // Calculate Average Grade per Mapel
  const subjectAverages = mapelList.map((m) => {
    const grades = nilaiList.filter((n) => n.mapel === m.namaMapel && n.nilai !== "" && typeof n.nilai === "number");
    if (grades.length === 0) return { name: m.namaMapel, avg: 0, count: 0 };
    const sum = grades.reduce((acc, curr) => acc + (curr.nilai as number), 0);
    return {
      name: m.namaMapel,
      avg: Math.round(sum / grades.length),
      count: grades.length
    };
  });

  // Full Menu Cards List matching all sidebar destinations
  const menuCards = [
    {
      id: "siswa",
      title: "Kelola Master Siswa",
      desc: "Olah data seluruh siswa, NISN, import Excel, edit & hapus data.",
      icon: Users,
      badge: "Master Data",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200"
    },
    {
      id: "kartu",
      title: "Cetak Kartu & QR Code",
      desc: "Cetak kartu pelajar resmi dengan QR Code presensi terintegrasi.",
      icon: QrCode,
      badge: "Kartu Pelajar",
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200"
    },
    {
      id: "mapel",
      title: "Kelola Mata Pelajaran",
      desc: "Atur daftar mapel, semester, dan alokasi jam mengajar harian.",
      icon: BookOpen,
      badge: "Kurikulum",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200"
    },
    {
      id: "jadwal",
      title: "Jadwal Mengajar",
      desc: "Kelola jadwal tatap muka kelas, jam pelajaran, dan ruang kelas.",
      icon: Calendar,
      badge: "Jadwal",
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200"
    },
    {
      id: "absensi",
      title: "Scan & Input Absensi",
      desc: "Pencatatan presensi harian manual & scan QR Code kamera otomatis.",
      icon: ClipboardCheck,
      badge: "Presensi",
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200"
    },
    {
      id: "penilaian",
      title: "Input Penilaian & Leger",
      desc: "Rekap nilai harian, UTS, UAS, kalkulasi otomatis & leger siswa.",
      icon: GraduationCap,
      badge: "Nilai & Rapor",
      color: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200"
    },
    {
      id: "agenda",
      title: "Agenda Mengajar Guru",
      desc: "Jurnal harian KBM, keterlaksanaan materi & catatan kehadiran.",
      icon: BookMarked,
      badge: "Jurnal KBM",
      color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-200"
    },
    {
      id: "bimbingan",
      title: "Bimbingan Guru Wali",
      desc: "Pencatatan konseling, apresiasi siswa & tindak lanjut orang tua.",
      icon: HeartHandshake,
      badge: "Guru Wali",
      color: "bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400 border-pink-200"
    },
    {
      id: "modulai",
      title: "Modul Ajar Deep Learning AI",
      desc: "Generator RPP Deep Learning Kurikulum Merdeka (hingga 5 pertemuan).",
      icon: Wand2,
      badge: "Fitur Unggulan AI",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300"
    },
    {
      id: "asistenai",
      title: "Asisten Chatbot Guru AI",
      desc: "Konsultan pedagogi AI, pembuat soal HOTS, & draf narasi rapor.",
      icon: Bot,
      badge: "Asisten AI",
      color: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border-violet-200"
    },
    {
      id: "laporan",
      title: "Pusat Laporan PDF",
      desc: "Cetak rekapitulasi presensi, leger nilai & jurnal resmi ke PDF.",
      icon: FileText,
      badge: "Cetak Dokumen",
      color: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border-teal-200"
    },
    {
      id: "pengaturan",
      title: "Pengaturan & Profil",
      desc: "Kelola profil guru, NIP, instansi sekolah, & gambar tanda tangan.",
      icon: Settings,
      badge: "Profil & Sekolah",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto w-full select-none">
      {/* Overview Stat Cards - Single Column Vertical Stack for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Siswa</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalSiswa}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Kelas</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalKelas}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mata Pelajaran</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalMapel}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hadir Hari Ini</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{attendancePercentage}%</h3>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col items-start justify-between gap-4 sm:gap-5 border border-blue-700/50">
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Deep Learning AI Pro
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black leading-snug">Buat Modul Ajar Deep Learning Otomatis</h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Susun modul pembelajaran Kurikulum Merdeka lengkap dengan skenario kegiatan per pertemuan (hingga 5 pertemuan), tabel diagnostik, rubrik asesmen, dan LKPD interaktif siap cetak.
          </p>
        </div>
        <button
          onClick={() => onNavigate("modulai")}
          className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-transform active:scale-95 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          <span>Buka Modul Ajar AI</span>
        </button>
      </div>

      {/* ALL SIDEBAR MENUS IN DASHBOARD GRID - Single Column for Mobile */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white tracking-tight">
              Akses Cepat Modul & Menu Administrasi Guru
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">12 Menu Lengkap</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {menuCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 active:scale-[0.99]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-extrabold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform pt-1">
                  <span>Buka Fitur</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts Section - Single Column Mobile Stack */}
      <div className="grid grid-cols-1 gap-4">
        {/* Attendance Trend Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Tren Kehadiran (7 Hari Terakhir)</h3>
              <p className="text-xs text-slate-500">Persentase kehadiran siswa harian</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-slate-200 dark:border-slate-700">
            {attendanceTrend.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600">
                  {item.pct}%
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-t-lg h-28 flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-blue-600 rounded-t-md transition-all duration-500 group-hover:bg-indigo-600"
                    style={{ height: `${Math.max(item.pct, 5)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 truncate max-w-full">
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Average Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Rata-rata Nilai per Mata Pelajaran</h3>
              <p className="text-xs text-slate-500">Nilai akumulasi akademik kelas</p>
            </div>
            <Star className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {subjectAverages.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Belum ada data nilai mata pelajaran.</p>
            ) : (
              subjectAverages.map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{sub.name}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{sub.avg} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(sub.avg, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Teaching Schedule Preview */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Jadwal Mengajar Terdaftar</h3>
          </div>
          <button
            onClick={() => onNavigate("jadwal")}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Lihat Semua &rarr;
          </button>
        </div>

        {jadwalList.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">Belum ada jadwal mengajar yang ditambahkan.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {jadwalList.slice(0, 3).map((j) => (
              <div
                key={j.id}
                className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>{j.hari}</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
                    {j.jam}
                  </span>
                </div>
                <p className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{j.mapel}</p>
                <p className="text-xs text-slate-500">Kelas: {j.kelas}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
