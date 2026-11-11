import React, { useState, useEffect, useRef } from "react";
import { Settings, Save, ShieldCheck, School, UserCheck, Trash2, ShieldAlert, KeyRound, Eye, EyeOff, Globe, Upload, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";
import { Pengaturan } from "../types";
import { savePengaturan, MAX_LOGO_LENGTH } from "../lib/firebase";
import { notifySimpanSuccess, notifySimpanError } from "../lib/swal";

interface PengaturanViewProps {
  config: Pengaturan;
  onNavigateToReset?: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({ config, onNavigateToReset }) => {
  const [showPassword, setShowPassword] = useState(false);
  const logoDinasInputRef = useRef<HTMLInputElement>(null);
  const logoSekolahInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Pengaturan>({
    Nama_Guru: "",
    NIP_Guru: "",
    Pemerintah: "PEMERINTAH PROVINSI",
    Nama_Sekolah: "",
    Alamat_Sekolah: "",
    Nama_Kepsek: "",
    NIP_Kepsek: "",
    Tempat_Tanda_Tangan: "",
    Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    username: "HG_Educreator",
    password: "123456"
  });

  useEffect(() => {
    if (config) {
      setForm({
        Nama_Guru: config.Nama_Guru || "",
        NIP_Guru: config.NIP_Guru || "",
        Pemerintah: config.Pemerintah || "PEMERINTAH PROVINSI",
        Nama_Sekolah: config.Nama_Sekolah || "",
        Alamat_Sekolah: config.Alamat_Sekolah || "",
        Nama_Kepsek: config.Nama_Kepsek || "",
        NIP_Kepsek: config.NIP_Kepsek || "",
        Tempat_Tanda_Tangan: config.Tempat_Tanda_Tangan || "",
        Logo_Kiri: config.Logo_Kiri || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
        Logo_Kanan: config.Logo_Kanan || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
        username: config.username || "HG_Educreator",
        password: config.password || "123456"
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleUploadLogo = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "Logo_Kiri" | "Logo_Kanan",
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notifySimpanError("File harus berupa gambar (PNG, JPG, JPEG, WEBP, atau SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const applyLogoIfValid = (candidate: string) => {
        if (candidate.length > MAX_LOGO_LENGTH) {
          notifySimpanError(`Ukuran ${label} melebihi batas maksimal database (~300KB). Silakan pilih gambar dengan resolusi lebih kecil.`);
          return false;
        }
        setForm((prev) => ({ ...prev, [field]: candidate }));
        notifySimpanSuccess(`${label} berhasil diunggah!`);
        return true;
      };

      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          let compressed = canvas.toDataURL(mimeType, 0.88);
          if (compressed.length > MAX_LOGO_LENGTH) {
            compressed = canvas.toDataURL("image/jpeg", 0.78);
          }
          applyLogoIfValid(compressed);
        } else {
          applyLogoIfValid(src);
        }
      };
      img.onerror = () => {
        applyLogoIfValid(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePengaturan(form);
      notifySimpanSuccess("Pengaturan profil & kredensial akun tersimpan ke Firebase!");
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan pengaturan.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Profil Guru & Kop Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Data ini digunakan secara otomatis pada Kop Surat Laporan PDF, Kartu Pelajar, dan Nama Penandatangan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Identitas Guru */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b pb-2">
                <ShieldCheck className="w-4 h-4" />
                Identitas Guru Pengampu
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Guru Lengkap & Gelar</label>
                <input
                  type="text"
                  id="Nama_Guru"
                  value={form.Nama_Guru}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso, S.Pd., M.Pd."
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NIP Guru</label>
                <input
                  type="text"
                  id="NIP_Guru"
                  value={form.NIP_Guru}
                  onChange={handleChange}
                  placeholder="19900101 201501 1 002"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Box 2: Identitas Kepsek */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b pb-2">
                <UserCheck className="w-4 h-4" />
                Identitas Kepala Sekolah
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  id="Nama_Kepsek"
                  value={form.Nama_Kepsek}
                  onChange={handleChange}
                  placeholder="Nama & Gelar Kepala Sekolah"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  id="NIP_Kepsek"
                  value={form.NIP_Kepsek}
                  onChange={handleChange}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Box 3: Identitas Sekolah & Kop Surat */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b pb-2">
              <School className="w-4 h-4" />
              Identitas Sekolah & Kop Surat Laporan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pemerintah Prov / Kab / Kota</label>
                <input
                  type="text"
                  id="Pemerintah"
                  value={form.Pemerintah}
                  onChange={handleChange}
                  placeholder="PEMERINTAH PROVINSI / KABUPATEN"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  id="Nama_Sekolah"
                  value={form.Nama_Sekolah}
                  onChange={handleChange}
                  placeholder="SMA NEGERI 1 KOTA"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Alamat Lengkap & Telepon Sekolah</label>
                <input
                  type="text"
                  id="Alamat_Sekolah"
                  value={form.Alamat_Sekolah}
                  onChange={handleChange}
                  placeholder="Jalan Pendidikan No. 1, Telp: 021-xxxxxx"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kota / Tempat Tanda Tangan Dokumen</label>
                <input
                  type="text"
                  id="Tempat_Tanda_Tangan"
                  value={form.Tempat_Tanda_Tangan}
                  onChange={handleChange}
                  placeholder="Contoh: Terentang / Pontianak"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Sub-Section: Upload Logo Dinas & Logo Sekolah */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Upload Logo Kop Surat Resmi
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload file gambar langsung dari perangkat Anda (PNG, JPG, WEBP). Logo otomatis dioptimasi untuk Kop Surat.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Upload Logo Dinas Pendidikan (Logo Kiri) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Logo Dinas Pendidikan / Pemda (Kiri Kop)
                    </span>
                    {form.Logo_Kiri && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Terpasang
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {form.Logo_Kiri ? (
                        <img 
                          src={form.Logo_Kiri} 
                          alt="Logo Dinas Pendidikan" 
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={logoDinasInputRef}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={(e) => handleUploadLogo(e, "Logo_Kiri", "Logo Dinas Pendidikan")}
                        className="hidden"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => logoDinasInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih / Upload Logo</span>
                        </button>

                        {form.Logo_Kiri && (
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, Logo_Kiri: "" }))}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs transition cursor-pointer"
                            title="Hapus Logo Dinas"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        PNG transparan atau JPG (maks. 5MB)
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Atau Masukkan URL Logo Dinas (Opsional)
                    </label>
                    <input
                      type="text"
                      id="Logo_Kiri"
                      value={form.Logo_Kiri}
                      onChange={handleChange}
                      placeholder="https://... (Link gambar HTTPS)"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 font-mono"
                    />
                  </div>
                </div>

                {/* 2. Upload Logo Sekolah (Logo Kanan) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Logo Resmi Sekolah (Kanan Kop)
                    </span>
                    {form.Logo_Kanan && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Terpasang
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {form.Logo_Kanan ? (
                        <img 
                          src={form.Logo_Kanan} 
                          alt="Logo Sekolah" 
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={logoSekolahInputRef}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={(e) => handleUploadLogo(e, "Logo_Kanan", "Logo Sekolah")}
                        className="hidden"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => logoSekolahInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih / Upload Logo</span>
                        </button>

                        {form.Logo_Kanan && (
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, Logo_Kanan: "" }))}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs transition cursor-pointer"
                            title="Hapus Logo Sekolah"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        PNG transparan atau JPG (maks. 5MB)
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Atau Masukkan URL Logo Sekolah (Opsional)
                    </label>
                    <input
                      type="text"
                      id="Logo_Kanan"
                      value={form.Logo_Kanan}
                      onChange={handleChange}
                      placeholder="https://... (Link gambar HTTPS)"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Live Kop Surat Real-Time Preview */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pratinjau Kop Surat Resmi Dokumen & PDF
                </span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white text-slate-900">
                  <div className="flex items-center justify-between gap-3 text-center">
                    <div className="w-14 h-14 flex items-center justify-center shrink-0">
                      {form.Logo_Kiri ? (
                        <img src={form.Logo_Kiri} alt="Logo Dinas" className="max-h-12 max-w-12 object-contain" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          Logo Dinas
                        </div>
                      )}
                    </div>
                    <div className="flex-1 leading-tight py-1">
                      <p className="text-[11px] font-bold tracking-tight text-slate-900 uppercase">
                        {form.Pemerintah || "PEMERINTAH PROVINSI KALIMANTAN BARAT"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-800 uppercase">
                        DINAS PENDIDIKAN DAN KEBUDAYAAN
                      </p>
                      <p className="text-[13px] font-black tracking-tight text-blue-900 uppercase mt-0.5">
                        {form.Nama_Sekolah || "SMA NEGERI 1 TERENTANG"}
                      </p>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {form.Alamat_Sekolah || "Jl. Terentang, Kec. Terentang, Kab. Kubu Raya"}
                      </p>
                    </div>
                    <div className="w-14 h-14 flex items-center justify-center shrink-0">
                      {form.Logo_Kanan ? (
                        <img src={form.Logo_Kanan} alt="Logo Sekolah" className="max-h-12 max-w-12 object-contain" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          Logo Sekolah
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-b-2 border-slate-900 mt-2" />
                  <div className="border-b border-slate-900 mt-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Box 4: Akses Keamanan & Akun Google */}
          <div className="p-5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2 border-b border-blue-200 dark:border-blue-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Status Autentikasi Akun Google & Database Cloud API
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Autentikasi aplikasi terhubung khusus via <strong>Akun Google & Firebase Auth</strong>. Seluruh kunci API database, kuota Firebase Spark Plan, dan sinkronisasi real-time secara otomatis diikat ke identitas akun Google aktif Anda.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Metode Login Aktif</span>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Google Identity & Firebase Auth (OAuth 2.0)</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Koneksi Database Cloud</span>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Firestore Spark Plan (Auto-Sync)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 5: Informasi & Kredit Pengembang */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Informasi Aplikasi & Kredit Pengembang
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">GuruDigitalLab.id SmansaterPRO</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Platform Administrasi Guru, Generator Perangkat Ajar AI, Modul Kokurikuler, & Asisten AI Terpadu
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full font-bold text-[11px]">
                  Created By Hengki Guslau,S.Pd.,Gr
                </span>
                <div className="mt-1">
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
                    HG_Educreator
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan ke Firebase</span>
            </button>
          </div>
        </form>

        {/* Zona Bahaya / Reset Total */}
        {onNavigateToReset && (
          <div className="pt-6 border-t border-red-200 dark:border-red-900/50 space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/40">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-900 dark:text-red-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  ZONA BAHAYA: Hapus / Kosongkan Semua Isi Database
                </h4>
                <p className="text-[11px] text-red-700 dark:text-red-300 font-medium">
                  Hapus secara permanen seluruh siswa, absensi, nilai, agenda, bimbingan, dan data sekolah untuk digunakan dari nol.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToReset}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shrink-0 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Buka Menu Hapus Database</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
