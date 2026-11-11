import React, { useState } from "react";
import { GraduationCap, ShieldCheck, AlertCircle, Sun, Moon, Sparkles, CheckCircle2, Database, Lock, ArrowRight, UserCheck } from "lucide-react";
import { signInWithGoogle, getFirebaseConnectionInfo } from "../lib/firebase";

interface LoginViewProps {
  onLoginSuccess: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    getFirebaseConnectionInfo().isConfigured
      ? null
      : "Konfigurasi Firebase belum lengkap. Pastikan firebase-applet-config.json atau variabel environment Firebase tersedia."
  );

  const handleGoogleSignIn = async () => {
    if (!getFirebaseConnectionInfo().isConfigured) {
      setErrorMsg("Konfigurasi Firebase belum lengkap. Silakan lengkapi firebase-applet-config.json terlebih dahulu.");
      return;
    }
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Jendela login Google ditutup sebelum selesai. Silakan coba klik tombol login kembali.");
      } else if (err?.code === "auth/cancelled-popup-request") {
        setErrorMsg("Proses autentikasi Google dibatalkan.");
      } else if (err?.code === "auth/popup-blocked") {
        setErrorMsg("Popup login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba masuk lagi.");
      } else if (err?.code === "auth/unauthorized-domain") {
        const currentHost = typeof window !== "undefined" ? window.location.hostname : "domain ini";
        setErrorMsg(
          `Domain "${currentHost}" belum masuk Authorized Domains di Firebase Authentication. Tambahkan domain tersebut pada Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else if (err?.code === "auth/operation-not-allowed") {
        setErrorMsg("Provider login Google belum diaktifkan di Firebase Console → Authentication → Sign-in method.");
      } else if (err?.code === "auth/network-request-failed") {
        setErrorMsg("Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.");
      } else {
        setErrorMsg(err?.message || "Gagal masuk dengan Akun Google. Pastikan popup tidak diblokir browser.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 transition-colors font-sans relative overflow-hidden">
      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header (Theme Toggle + App Badge) */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              GuruDigitalLab.id
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
              SmansaterPRO
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-xs flex items-center space-x-2 text-xs font-semibold cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Tema Gelap</span>
            </>
          )}
        </button>
      </header>

      {/* Main Login Card Container */}
      <main className="w-full max-w-md mx-auto z-10 my-auto py-6 space-y-6">
        {/* Brand Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/25 transform hover:scale-105 transition-transform">
            <GraduationCap className="w-9 h-9 text-slate-950" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Portal Masuk Guru
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Sistem Administrasi Guru, Perangkat Ajar & Asisten AI
            </p>
          </div>
        </div>

        {/* Dedicated Google Auth Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Autentikasi Khusus Akun Google</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-1">
              Masuk dengan Akun Google
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              API Database Firestore & layanan aplikasi terhubung otomatis langsung ke Akun Google Anda.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 rounded-xl flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* GOOGLE SIGN-IN PRIMARY BUTTON */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
            >
              {googleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Menghubungkan Akun Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">Lanjutkan dengan Google</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform ml-auto" />
                </>
              )}
            </button>

            {/* Feature & Security Highlights */}
            <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-2 font-bold text-blue-900 dark:text-blue-300 text-xs">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Integrasi Kunci API & Akun Google:</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Database Cloud Firestore:</strong> Tersinkron otomatis ke cloud Firebase dengan Spark Plan aktif.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Kunci API Terproteksi:</strong> Akses data terenkripsi dan terikat penuh ke token autentikasi Google Anda.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Multi-Device:</strong> Data siswa, nilai, & modul tersimpan aman dan dapat dibuka dari perangkat mana pun.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Security Badge */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Terproteksi Firebase Auth & Google Identity Services</span>
          </div>
        </div>
      </main>

      {/* Footer Credit Section */}
      <footer className="w-full max-w-md mx-auto text-center z-10 py-3 space-y-1">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          GuruDigitalLab.id SmansaterPRO &bull; Created By <span className="text-blue-600 dark:text-blue-400 font-bold">Hengki Guslau,S.Pd.,Gr</span>
        </p>
        <span className="inline-flex items-center text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
          HG_Educreator
        </span>
      </footer>
    </div>
  );
};

