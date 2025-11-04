"use client";

import React, { useState, useEffect, useRef } from "react";
import { analyzeWithEnhancedPrompt } from "@/lib/enhanced-gemini";
import { formatAIResponse, createErrorState } from "@/lib/ai-response-formatter";

import { Highlight } from "@/components/ui/hero-highlight";
import { WavyBackground } from "@/components/ui/wavy-background";

interface ChatMessage {
  role: "user" | "assistant";
  content: string; // stored as HTML for assistant, plain for user
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll ke bawah setiap ada pesan baru atau saat loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Helper: salin teks jawaban AI (hilangkan HTML)
  const copyAssistant = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = div.innerText;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  // Indikator mengetik (animasi titik)
  const TypingDots = () => (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
    </div>
  );

  // Quick prompt sender for shiny buttons
  const sendQuickPrompt = async (prompt: string) => {
    const query = prompt.trim();
    if (!query) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const result = await analyzeWithEnhancedPrompt(query, {
        maxContextSize: 8000,
        useSmartRetrieval: true,
        includeRecommendations: true,
      });
      const formatted = formatAIResponse(result.response).html;
      setMessages((prev) => [...prev, { role: "assistant", content: formatted }]);
    } catch (error) {
      const html = createErrorState(
        error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pertanyaan."
      );
      setMessages((prev) => [...prev, { role: "assistant", content: html }]);
    } finally {
      setLoading(false);
    }
  };
  const sendMessage = async () => {
    const query = input.trim();
    if (!query) return;

    // push user message
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const result = await analyzeWithEnhancedPrompt(query, {
        maxContextSize: 8000,
        useSmartRetrieval: true,
        includeRecommendations: true,
      });
      const formatted = formatAIResponse(result.response).html;
      setMessages((prev) => [...prev, { role: "assistant", content: formatted }]);
    } catch (error) {
      const html = createErrorState(
        error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pertanyaan."
      );
      setMessages((prev) => [...prev, { role: "assistant", content: html }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    // Full screen area (di bawah navbar) dengan WavyBackground
    <WavyBackground
      containerClassName="h-full"
      className="h-full flex flex-col"
      colors={["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]}
      waveWidth={40}
      backgroundFill="#f8fafc"
      blur={12}
      speed="slow"
      waveOpacity={0.4}
    >


      {/* Area chat memenuhi sisa layar */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-slate-600 text-sm">
            <Highlight className="bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20">
              Mulai percakapan dengan mengetik pertanyaan di bawah.
            </Highlight>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl bg-blue-600 text-white px-4 py-2 shadow-sm">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            ) : (
              <div className="group max-w-[85%] rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                <div
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
                <div className="mt-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyAssistant(msg.content)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Salin
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <TypingDots />
              <span className="text-sm text-slate-600">AI sedang menulis jawaban…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input anchor di bawah, full width */}
      <div className="border-t bg-transparent px-4 sm:px-6 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pertanyaan Anda..."
            rows={1}
            className="flex-1 px-3 py-2 resize-none rounded-md bg-white/70 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="h-10 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kirim
          </button>
          <button
            onClick={() => sendQuickPrompt("Buat ringkasan singkat kondisi kelas, siswa yang perlu perhatian, dan rekomendasi berdasarkan data terbaru.")}
            className="relative h-10 overflow-hidden rounded-md px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 shadow-lg transition hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 before:absolute before:inset-0 before:bg-white/20 before:opacity-0 hover:before:opacity-40 before:transition"
            aria-label="Ringkas Data"
          >
            <Highlight className="bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20">
              Ringkas Data
            </Highlight>
          </button>
        </div>
      </div>
    </WavyBackground>
  );
}