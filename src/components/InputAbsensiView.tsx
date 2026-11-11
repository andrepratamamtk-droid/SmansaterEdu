import React, { useState, useEffect, useRef } from "react";
import { ClipboardCheck, Camera, CheckCircle2, Save, UserCheck, AlertCircle, History, BarChart3, Pencil, Trash2, Search, Filter, X, Check } from "lucide-react";
import jsQR from "jsqr";
import { Siswa, Mapel, LogAbsensi, Pengaturan } from "../types";
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

interface InputAbsensiViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: LogAbsensi[];
  config: Pengaturan;
}

export const InputAbsensiView: React.FC<InputAbsensiViewProps> = ({
  siswaList,
  mapelList,
  absensiList,
  config
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"input" | "rekap">("input");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState<string>("");
  const [mode, setMode] = useState<"manual" | "scan">("manual");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Local attendance state mapping: studentId -> status
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'>>({});

  // Rekapitulasi & Riwayat Filter and Edit states
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>("");
  const [rekapMapelFilter, setRekapMapelFilter] = useState<string>("");
  const [rekapTanggalFilter, setRekapTanggalFilter] = useState<string>("");
  const [rekapSearchFilter, setRekapSearchFilter] = useState<string>("");

  const [editingAbsensiId, setEditingAbsensiId] = useState<string | null>(null);
  const [editAbsensiData, setEditAbsensiData] = useState<LogAbsensi | null>(null);

  // QR Scanner refs & state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanStatus, setScanStatus] = useState<string>("Siap melakukan scan kartu...");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [manualScanNisn, setManualScanNisn] = useState<string>("");
  const isScanningRef = useRef<boolean>(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();
  const studentsInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  // Load existing records for selected Date + Class + Mapel
  useEffect(() => {
    if (tanggal && selectedKelas && selectedMapel) {
      const existingRecords = absensiList.filter(
        (a) =>
          (a.waktu === tanggal || a.tanggal === tanggal) &&
          a.kelas === selectedKelas &&
          a.mapel === selectedMapel
      );

      const stateMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'> = {};
      studentsInClass.forEach((s) => {
        const found = existingRecords.find((rec) => rec.idSiswa === s.id || rec.idSiswa === s.nisn);
        stateMap[s.id] = found ? found.status : "Hadir";
      });

      setAttendanceState(stateMap);
    }
  }, [tanggal, selectedKelas, selectedMapel, absensiList, siswaList]);

  // Set All Hadir
  const handleSetHadirSemua = () => {
    const updated: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'> = {};
    studentsInClass.forEach((s) => {
      updated[s.id] = "Hadir";
    });
    setAttendanceState(updated);
  };

  // Change individual status
  const handleStatusChange = (studentId: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  // Save batch attendance to Firestore
  const handleSaveAbsensi = async () => {
    if (!tanggal || !selectedKelas || !selectedMapel) {
      notifySimpanError("Silakan pilih Tanggal, Kelas, dan Mata Pelajaran.");
      return;
    }

    if (studentsInClass.length === 0) {
      notifySimpanError("Belum ada siswa di kelas ini.");
      return;
    }

    const yearMonth = tanggal.split("-");
    const thn = yearMonth[0] || "2026";
    const bln = yearMonth[1] || "01";

    const itemsToSave: LogAbsensi[] = studentsInClass.map((s) => {
      const docId = `${tanggal}_${selectedKelas}_${selectedMapel}_${s.id}`;
      return {
        id: docId,
        waktu: tanggal,
        tanggal: tanggal,
        kelas: selectedKelas,
        mapel: selectedMapel,
        idSiswa: s.id,
        namaSiswa: s.nama,
        status: attendanceState[s.id] || "Hadir",
        bulan: bln,
        tahun: thn,
        namaGuru: config.Nama_Guru || "Guru"
      };
    });

    try {
      await batchSaveDocuments(COLLECTIONS.LOG_ABSENSI, itemsToSave);
      notifySimpanSuccess(`Absensi kelas ${selectedKelas} (${itemsToSave.length} siswa) tersimpan ke Firebase!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan absensi.");
    }
  };

  // Start Editing Absensi Item
  const handleStartEditAbsensi = (item: LogAbsensi) => {
    setEditingAbsensiId(item.id);
    setEditAbsensiData({ ...item });
  };

  // Save Edited Absensi Item
  const handleSaveEditedAbsensi = async (id: string) => {
    if (!editAbsensiData) return;
    try {
      await saveDocument(COLLECTIONS.LOG_ABSENSI, id, editAbsensiData);
      setEditingAbsensiId(null);
      setEditAbsensiData(null);
      notifyEditSuccess("Data absensi berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui data absensi.");
    }
  };

  // Delete Absensi Item
  const handleDeleteAbsensi = async (id: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Data Absensi?", "Apakah Anda yakin ingin menghapus data presensi siswa ini?");
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.LOG_ABSENSI, id);
        notifyHapusSuccess("Data absensi berhasil dihapus.");
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus data absensi.");
      }
    }
  };

  // Filtered Absensi List for Rekapitulasi
  const filteredAbsensiList = absensiList.filter((item) => {
    const matchKelas = !rekapKelasFilter || item.kelas === rekapKelasFilter;
    const matchMapel = !rekapMapelFilter || item.mapel === rekapMapelFilter;
    const itemTanggal = item.tanggal || item.waktu || "";
    const matchTanggal = !rekapTanggalFilter || itemTanggal === rekapTanggalFilter;
    const matchSearch = !rekapSearchFilter || item.namaSiswa.toLowerCase().includes(rekapSearchFilter.toLowerCase());
    return matchKelas && matchMapel && matchTanggal && matchSearch;
  });

  // Rekap Statistics
  const totalRekap = filteredAbsensiList.length;
  const countHadir = filteredAbsensiList.filter((a) => a.status === "Hadir").length;
  const countIzin = filteredAbsensiList.filter((a) => a.status === "Izin").length;
  const countSakit = filteredAbsensiList.filter((a) => a.status === "Sakit").length;
  const countAlpa = filteredAbsensiList.filter((a) => a.status === "Alpa").length;

  // Manual Scan Submit
  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualScanNisn.trim()) return;

    const val = manualScanNisn.trim();
    const matched = siswaList.find((s) => s.nisn === val || s.id === val);

    if (matched) {
      setAttendanceState((prev) => ({ ...prev, [matched.id]: "Hadir" }));
      const statusText = `BERHASIL: ${matched.nama} (NISN: ${matched.nisn}) -> HADIR`;
      setScanStatus(statusText);
      notifySimpanSuccess(statusText);

      const docId = `${tanggal}_${selectedKelas || matched.kelas}_${selectedMapel || 'Scan'}_${matched.id}`;
      saveDocument(COLLECTIONS.LOG_ABSENSI, docId, {
        id: docId,
        waktu: tanggal,
        tanggal: tanggal,
        kelas: selectedKelas || matched.kelas,
        mapel: selectedMapel || "Absensi QR",
        idSiswa: matched.id,
        namaSiswa: matched.nama,
        status: "Hadir",
        bulan: tanggal.split("-")[1] || "01",
        tahun: tanggal.split("-")[0] || "2026",
        namaGuru: config.Nama_Guru || "Guru"
      });
      setManualScanNisn("");
    } else {
      const errorText = `NISN/Kode '${val}' tidak ditemukan dalam database siswa.`;
      setScanStatus(errorText);
      notifySimpanError(errorText);
    }
  };

  // Start Camera Process
  const startCameraProcess = async () => {
    setCameraError("");
    setScanStatus("Mengaktifkan kamera...");

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraActive(false);
      isScanningRef.current = false;
      const errMsg = "Browser atau lingkungan ini tidak mendukung akses kamera langsung. Silakan gunakan Scan NISN Manual atau buka aplikasi di Tab Baru.";
      setCameraError(errMsg);
      setScanStatus("Kamera tidak didukung.");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn("Camera ideal constraints failed, falling back to basic video:", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        setScanStatus("Kamera aktif. Arahkan QR Code Kartu Pelajar...");
        scanLoop();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraActive(false);
      isScanningRef.current = false;

      const errName = err?.name || "";
      const errString = String(err?.message || err || "").toLowerCase();

      let errMsg = "Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain.";
      if (
        errName === "NotAllowedError" ||
        errName === "PermissionDeniedError" ||
        errName === "PermissionDismissedError" ||
        errString.includes("dismissed") ||
        errString.includes("denied") ||
        errString.includes("permission")
      ) {
        errMsg = "Izin kamera ditolak atau ditutup. Silakan izinkan akses kamera pada ikon gembok di address bar, atau gunakan fitur Scan/Input NISN Manual di bawah.";
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        errMsg = "Kamera tidak ditemukan pada perangkat Anda. Silakan gunakan Scan NISN Manual.";
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        errMsg = "Kamera sedang digunakan oleh aplikasi atau tab lain. Tutup aplikasi yang menggunakan kamera lalu coba lagi.";
      }

      setCameraError(errMsg);
      setScanStatus("Kamera tidak aktif.");
    }
  };

  const stopCameraProcess = () => {
    isScanningRef.current = false;
    setCameraActive(false);
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const codeVal = code.data.trim();
          const matchedSiswa = siswaList.find(
            (s) => s.nisn === codeVal || s.id === codeVal
          );

          if (matchedSiswa) {
            setAttendanceState((prev) => ({ ...prev, [matchedSiswa.id]: "Hadir" }));
            const successText = `BERHASIL: ${matchedSiswa.nama} (NISN: ${matchedSiswa.nisn}) -> HADIR`;
            setScanStatus(successText);
            setStatusMsg({ type: "success", text: successText });

            const docId = `${tanggal}_${selectedKelas || matchedSiswa.kelas}_${selectedMapel || 'Scan'}_${matchedSiswa.id}`;
            saveDocument(COLLECTIONS.LOG_ABSENSI, docId, {
              id: docId,
              waktu: tanggal,
              tanggal: tanggal,
              kelas: selectedKelas || matchedSiswa.kelas,
              mapel: selectedMapel || "Scan QR",
              idSiswa: matchedSiswa.id,
              namaSiswa: matchedSiswa.nama,
              status: "Hadir",
              bulan: tanggal.split("-")[1] || "01",
              tahun: tanggal.split("-")[0] || "2026",
              namaGuru: config.Nama_Guru || "Guru"
            });
          } else {
            setScanStatus(`QR Terbaca: '${codeVal}' (Data siswa tidak ditemukan)`);
          }
        }
      }
    }

    if (isScanningRef.current) {
      requestAnimationFrame(scanLoop);
    }
  };

  // Camera lifecycle trigger when mode changes
  useEffect(() => {
    if (activeSubTab === "input" && mode === "scan") {
      startCameraProcess();
    } else {
      stopCameraProcess();
    }

    return () => {
      stopCameraProcess();
    };
  }, [mode, activeSubTab]);

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
          <ClipboardCheck className="w-4 h-4" />
          <span>Input Absensi Harian</span>
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
          <span>Riwayat & Rekapitulasi Absensi</span>
          {absensiList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold">
              {absensiList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "input" ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          {/* Header and mode toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                Input Absensi Harian Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Catat presensi harian secara manual atau otomatis menggunakan QR Scanner Kamera.
              </p>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                onClick={() => setMode("manual")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  mode === "manual"
                    ? "bg-white dark:bg-slate-800 text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Input Manual
              </button>
              <button
                onClick={() => setMode("scan")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1 transition-colors cursor-pointer ${
                  mode === "scan"
                    ? "bg-white dark:bg-slate-800 text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR Kamera</span>
              </button>
            </div>
          </div>

          {/* Filter Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>

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

          {/* Manual Attendance Mode */}
          {mode === "manual" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={handleSetHadirSemua}
                  disabled={studentsInClass.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Hadir Semua</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 text-center w-12">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3 text-center w-24">Hadir</th>
                      <th className="p-3 text-center w-24">Izin</th>
                      <th className="p-3 text-center w-24">Sakit</th>
                      <th className="p-3 text-center w-24">Alpa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {!selectedKelas || !selectedMapel ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Silakan pilih Tanggal, Kelas, dan Mata Pelajaran terlebih dahulu.
                        </td>
                      </tr>
                    ) : studentsInClass.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Tidak ada siswa di Kelas {selectedKelas}.
                        </td>
                      </tr>
                    ) : (
                      studentsInClass.map((s, idx) => {
                        const currentStatus = attendanceState[s.id] || "Hadir";
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{s.nama}</td>

                            {/* Status Options */}
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`status_${s.id}`}
                                checked={currentStatus === "Hadir"}
                                onChange={() => handleStatusChange(s.id, "Hadir")}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`status_${s.id}`}
                                checked={currentStatus === "Izin"}
                                onChange={() => handleStatusChange(s.id, "Izin")}
                                className="w-4 h-4 accent-amber-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`status_${s.id}`}
                                checked={currentStatus === "Sakit"}
                                onChange={() => handleStatusChange(s.id, "Sakit")}
                                className="w-4 h-4 accent-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`status_${s.id}`}
                                checked={currentStatus === "Alpa"}
                                onChange={() => handleStatusChange(s.id, "Alpa")}
                                className="w-4 h-4 accent-red-600 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveAbsensi}
                  disabled={studentsInClass.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Absensi ke Firebase</span>
                </button>
              </div>
            </div>
          )}

          {/* Scan Mode */}
          {mode === "scan" && (
            <div className="space-y-5 text-center py-4">
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Arahkan QR Code Kartu Pelajar siswa ke kamera atau masukkan NISN secara manual/barcode reader di bawah.
              </p>

              {cameraError && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold max-w-md mx-auto space-y-2">
                  <div className="flex items-center justify-center space-x-1.5 text-amber-700 dark:text-amber-400 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Akses Kamera Dibatasi</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{cameraError}</p>
                </div>
              )}

              <div className="relative w-full max-w-sm mx-auto aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden shadow-lg border-2 border-blue-600 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {cameraActive && (
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none animate-pulse m-8" />
                )}
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={cameraActive ? stopCameraProcess : startCameraProcess}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer shadow-xs ${
                    cameraActive
                      ? "bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{cameraActive ? "Hentikan Kamera" : "Aktifkan Kamera"}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 text-xs font-bold max-w-md mx-auto">
                {scanStatus}
              </div>

              {/* Alternative Manual Barcode / NISN Input */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                  Atau Input / Scan NISN Manual
                </p>
                <form onSubmit={handleManualScanSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ketik NISN atau scan barcode..."
                    value={manualScanNisn}
                    onChange={(e) => setManualScanNisn(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                  >
                    Proses
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Riwayat & Rekapitulasi Absensi View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Riwayat & Rekapitulasi Presensi Siswa
            </h2>
            <p className="text-xs text-slate-500">
              Kelola, edit, dan rekap seluruh data presensi harian siswa yang tersimpan di database.
            </p>
          </div>

          {/* Rekap Statistics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Data</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{totalRekap}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Hadir</p>
              <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200">{countHadir}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Izin</p>
              <p className="text-lg font-extrabold text-amber-800 dark:text-amber-200">{countIzin}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60">
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Sakit</p>
              <p className="text-lg font-extrabold text-blue-800 dark:text-blue-200">{countSakit}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-800/60 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">Alpa</p>
              <p className="text-lg font-extrabold text-red-800 dark:text-red-200">{countAlpa}</p>
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Tanggal</label>
              <input
                type="date"
                value={rekapTanggalFilter}
                onChange={(e) => setRekapTanggalFilter(e.target.value)}
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
                  <th className="p-3">Tanggal</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAbsensiList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada riwayat absensi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAbsensiList.map((item, idx) => {
                    const isEditing = editingAbsensiId === item.id;
                    const dateVal = item.tanggal || item.waktu || "";

                    if (isEditing && editAbsensiData) {
                      return (
                        <tr key={item.id} className="bg-blue-50/70 dark:bg-blue-950/40">
                          <td className="p-3 text-center font-bold text-blue-600">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={editAbsensiData.tanggal || editAbsensiData.waktu || ""}
                              onChange={(e) =>
                                setEditAbsensiData({
                                  ...editAbsensiData,
                                  tanggal: e.target.value,
                                  waktu: e.target.value
                                })
                              }
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-32"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editAbsensiData.kelas}
                              onChange={(e) => setEditAbsensiData({ ...editAbsensiData, kelas: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none text-center w-20"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editAbsensiData.mapel}
                              onChange={(e) => setEditAbsensiData({ ...editAbsensiData, mapel: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editAbsensiData.namaSiswa}
                              onChange={(e) => setEditAbsensiData({ ...editAbsensiData, namaSiswa: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={editAbsensiData.status}
                              onChange={(e) =>
                                setEditAbsensiData({
                                  ...editAbsensiData,
                                  status: e.target.value as 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'
                                })
                              }
                              className="px-2 py-1 text-xs font-black border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none text-center"
                            >
                              <option value="Hadir">Hadir</option>
                              <option value="Izin">Izin</option>
                              <option value="Sakit">Sakit</option>
                              <option value="Alpa">Alpa</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveEditedAbsensi(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAbsensiId(null);
                                  setEditAbsensiData(null);
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
                        <td className="p-3 font-semibold whitespace-nowrap">{dateVal}</td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{item.kelas}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{item.mapel}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.namaSiswa}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              item.status === "Hadir"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : item.status === "Izin"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : item.status === "Sakit"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleStartEditAbsensi(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAbsensi(item.id)}
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

