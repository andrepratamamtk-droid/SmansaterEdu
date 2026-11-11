import React, { useState } from "react";
import { Bot, Send, User, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { ChatMessage, Pengaturan } from "../types";

interface AsistenGuruAIViewProps {
  config: Pengaturan;
}

export const AsistenGuruAIView: React.FC<AsistenGuruAIViewProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: `Halo ${config.Nama_Guru ? `Bapak/Ibu ${config.Nama_Guru}` : "Bapak/Ibu Guru"}! 👋 Saya adalah GuruDigitalLab.id SmansaterPRO AI Assistant. Saya siap membantu menyusun soal HOTS, draft pesan ke orang tua, ide metode pembelajaran berdiferensiasi, maupun kalimat evaluasi untuk rapor siswa. Ada yang bisa saya bantu hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickPrompts = [
    "Buatkan 5 contoh soal HOTS pilihan ganda + kunci jawaban untuk siswa SMP.",
    "Draft pesan WhatsApp santun ke orang tua murid tentang kehadiran siswa.",
    "Beri 3 ide aktivitas pembelajaran berdiferensiasi yang seru di kelas.",
    "Buatkan contoh kalimat catatan wali kelas untuk rapor yang memotivasi."
  ];

  const cleanAiText = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/^`+|`+$/g, "")
      .trim();
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat-asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query.trim(),
          context: {
            guru: config.Nama_Guru,
            sekolah: config.Nama_Sekolah
          }
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: cleanAiText(data.reply),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.message || "Gagal mendapatkan respon.");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: "Maaf, terjadi kendala saat menghubungkan ke asisten AI. Silakan coba lagi.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col h-[82vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-bold shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-sm">GuruDigitalLab.id AI Assistant</h2>
            <p className="text-[11px] text-blue-200">Mitra Cerdas Administrasi & Pedagogi Guru</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            disabled={loading}
            className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-[11px] font-medium whitespace-nowrap shadow-xs cursor-pointer transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-100 dark:bg-slate-950/80">
        {messages.map((m) => {
          const isAsst = m.sender === "assistant";
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 max-w-3xl ${
                isAsst ? "mr-auto" : "ml-auto flex-row-reverse space-x-reverse"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isAsst ? "bg-blue-600 text-white" : "bg-amber-400 text-slate-950"
                }`}
              >
                {isAsst ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative group shadow-xs ${
                  isAsst
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                    : "bg-blue-600 text-white font-medium"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                  <span>{m.timestamp}</span>
                  {isAsst && (
                    <button
                      onClick={() => handleCopy(m.text, m.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Salin Teks"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs p-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>AI sedang merumuskan jawaban...</span>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ketik pertanyaan atau instruksi untuk AI Asisten Guru..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
