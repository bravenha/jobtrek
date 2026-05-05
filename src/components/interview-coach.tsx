"use client";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, SectionHeader, LoadingSkeleton } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown";
import { InterviewMessage, InterviewPhase } from "@/lib/types";
import { callAI } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

const HISTORY_KEY = "jobtrek-interview-history";

interface InterviewSession {
  id: number;
  position: string;
  company: string;
  avgScore: number;
  scores: number[];
  messages: InterviewMessage[];
  report: string;
  createdAt: string;
}

function loadHistory(): InterviewSession[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function saveHistory(sessions: InterviewSession[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 20))); // Keep last 20
}

export function InterviewCoach() {
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [qNum, setQNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [report, setReport] = useState("");
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [viewingHistory, setViewingHistory] = useState<InterviewSession | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const saveSession = (finalReport: string, finalScores: number[], finalMessages: InterviewMessage[]) => {
    const avg = finalScores.length > 0 ? Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length * 10) / 10 : 0;
    const session: InterviewSession = {
      id: Date.now(), position, company, avgScore: avg, scores: finalScores,
      messages: finalMessages, report: finalReport, createdAt: new Date().toISOString(),
    };
    const updated = [session, ...history];
    setHistory(updated);
    saveHistory(updated);
  };

  const startInterview = async () => {
    if (!position.trim()) return;
    setPhase("interview"); setLoading(true); setQNum(1); setViewingHistory(null); setShowHistory(false);
    setMessages([{ role: "ai", content: `Baik, saya akan menjadi interviewer untuk posisi **${position}** di **${company || "perusahaan"}**. Mari kita mulai!\n\nSaya akan mengajukan 5 pertanyaan: 3 teknis dan 2 behavioral. Jawab sebaik mungkin.` }]);
    try {
      const q = await callAI("interview_start", { position, company, jobDesc, questionNumber: "1" });
      setMessages(p => [...p, { role: "ai", content: q }]);
    } catch { setMessages(p => [...p, { role: "ai", content: "Maaf, gagal memuat pertanyaan. Coba mulai ulang." }]); }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!userInput.trim() || loading) return;
    const answer = userInput; setUserInput("");
    setMessages(p => [...p, { role: "user", content: answer }]);
    setLoading(true);

    try {
      const lastAI = [...messages].reverse().find(m => m.role === "ai")?.content || "";
      const evaluation = await callAI("interview_evaluate", { question: lastAI, answer, position });
      const scoreMatch = evaluation.match(/(\d{1,2})\/10/);
      const s = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const newScores = [...scores, s];
      setScores(newScores);
      const newMessages = [...messages, { role: "user" as const, content: answer }, { role: "ai" as const, content: evaluation, score: s }];
      setMessages(p => [...p, { role: "ai", content: evaluation, score: s }]);

      const nextQ = qNum + 1;
      if (nextQ <= 5) {
        setQNum(nextQ);
        const nextQuestion = await callAI("interview_start", { position, company, jobDesc, questionNumber: String(nextQ) });
        setMessages(p => [...p, { role: "ai", content: nextQuestion }]);
      } else {
        setPhase("evaluation");
        setMessages(p => [...p, { role: "ai", content: "✅ Simulasi interview selesai! Saya sedang menyiapkan laporan akhir..." }]);
        const evalData = newScores.map((sc, i) => `Q${i + 1}: skor ${sc}/10`).join(", ");
        const rep = await callAI("interview_report", { position, company, evaluations: evalData });
        setReport(rep);
        setPhase("report");
        // Save to history
        const finalMsgs = [...newMessages, { role: "ai" as const, content: "✅ Simulasi interview selesai!" }];
        saveSession(rep, newScores, finalMsgs);
      }
    } catch {
      setMessages(p => [...p, { role: "ai", content: "Terjadi kesalahan. Coba kirim jawaban lagi." }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setPhase("setup"); setMessages([]); setQNum(1); setScores([]); setReport(""); setUserInput(""); setViewingHistory(null);
  };

  const viewSession = (session: InterviewSession) => {
    setViewingHistory(session);
    setShowHistory(false);
  };

  const deleteSession = (id: number) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
    if (viewingHistory?.id === id) setViewingHistory(null);
  };

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // VIEWING A PAST SESSION
  if (viewingHistory) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionHeader icon="📜" title="Riwayat Interview" subtitle={`${viewingHistory.position} di ${viewingHistory.company || "Perusahaan"} — ${fmtDate(viewingHistory.createdAt)}`} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => setViewingHistory(null)} style={{ fontSize: 12 }}>← Kembali</button>
            <button className="btn-primary" onClick={() => { setPosition(viewingHistory.position); setCompany(viewingHistory.company); setViewingHistory(null); }}
              style={{ fontSize: 12, padding: "8px 14px" }}>🔄 Latihan Ulang</button>
          </div>
        </div>

        {/* Score summary */}
        <GlassCard style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: viewingHistory.avgScore >= 7 ? "#10B981" : viewingHistory.avgScore >= 5 ? "#F59E0B" : "#EF4444", margin: "0 0 2px" }}>{viewingHistory.avgScore}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Rata-rata</p>
            </div>
            <div style={{ flex: 1, display: "flex", gap: 6 }}>
              {viewingHistory.scores.map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 8, background: `rgba(${s >= 7 ? "16,185,129" : s >= 5 ? "245,158,11" : "239,68,68"},0.1)`, border: `1px solid rgba(${s >= 7 ? "16,185,129" : s >= 5 ? "245,158,11" : "239,68,68"},0.2)` }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: s >= 7 ? "#10B981" : s >= 5 ? "#F59E0B" : "#EF4444" }}>{s}</p>
                  <p style={{ margin: 0, fontSize: 9, color: "var(--text-muted)" }}>Q{i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Chat replay */}
        <GlassCard style={{ marginBottom: 14, padding: 0 }}>
          <div style={{ maxHeight: 400, overflowY: "auto", padding: 20 }}>
            {viewingHistory.messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{
                  maxWidth: "80%", padding: "12px 16px", borderRadius: 14, fontSize: 13, lineHeight: 1.7,
                  background: msg.role === "user" ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${msg.role === "user" ? "rgba(13,148,136,0.25)" : "var(--border)"}`,
                }}>
                  {msg.role === "ai" && <span style={{ fontSize: 10, color: "var(--accent-light)", fontWeight: 700, display: "block", marginBottom: 4 }}>CareerPath AI</span>}
                  <MarkdownRenderer content={msg.content} />
                  {msg.score && (
                    <div style={{ marginTop: 8, padding: "4px 10px", background: `rgba(${msg.score >= 7 ? "16,185,129" : msg.score >= 5 ? "245,158,11" : "239,68,68"},0.12)`, borderRadius: 8, display: "inline-block", fontSize: 11, fontWeight: 700, color: msg.score >= 7 ? "#10B981" : msg.score >= 5 ? "#F59E0B" : "#EF4444" }}>
                      Skor: {msg.score}/10
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Report */}
        {viewingHistory.report && (
          <GlassCard>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "var(--accent-light)" }}>📋 Laporan Akhir</p>
            <MarkdownRenderer content={viewingHistory.report} />
          </GlassCard>
        )}
      </motion.div>
    );
  }

  // SETUP
  if (phase === "setup") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionHeader icon="🎙️" title="Interview Coach" subtitle="Simulasi interview AI. Jawab pertanyaan, dapatkan evaluasi real-time dengan metode STAR." />
          {history.length > 0 && (
            <button className="btn-accent-outline" onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 12 }}>
              📜 Riwayat ({history.length})
            </button>
          )}
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 14 }}>
              <GlassCard>
                <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>📜 Riwayat Interview</p>
                {history.map((s, i) => (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `rgba(${s.avgScore >= 7 ? "16,185,129" : s.avgScore >= 5 ? "245,158,11" : "239,68,68"},0.12)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14,
                      color: s.avgScore >= 7 ? "#10B981" : s.avgScore >= 5 ? "#F59E0B" : "#EF4444",
                    }}>{s.avgScore}</div>
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => viewSession(s)}>
                      <p className="truncate" style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 13 }}>{s.position}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{s.company || "Perusahaan"} · {fmtDate(s.createdAt)}</p>
                    </div>
                    <button onClick={() => viewSession(s)} className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>Lihat</button>
                    <button onClick={() => deleteSession(s.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "4px" }}>✕</button>
                  </div>
                ))}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard style={{ maxWidth: 500 }}>
          <label className="label-text">Posisi yang Dilamar *</label>
          <input className="input-glass" value={position} onChange={e => setPosition(e.target.value)} placeholder="Frontend Developer, Data Analyst..." style={{ marginBottom: 14 }} />
          <label className="label-text">Nama Perusahaan</label>
          <input className="input-glass" value={company} onChange={e => setCompany(e.target.value)} placeholder="Gojek, Tokopedia..." style={{ marginBottom: 14 }} />
          <label className="label-text">Deskripsi Pekerjaan <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(opsional)</span></label>
          <textarea className="input-glass" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3} placeholder="Paste job desc untuk pertanyaan lebih relevan..." style={{ marginBottom: 20 }} />
          <button className="btn-primary" onClick={startInterview} disabled={!position.trim()} style={{ width: "100%", padding: 14, fontSize: 15 }}>
            🚀 Mulai Simulasi Interview
          </button>
          <div style={{ marginTop: 16, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text-secondary)" }}>Format:</strong> 3 pertanyaan teknis + 2 pertanyaan behavioral. Setiap jawaban dinilai 1-10 menggunakan metode STAR.
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // INTERVIEW + REPORT
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionHeader icon="🎙️" title="Interview Coach" subtitle={phase === "report" ? "Laporan akhir simulasi" : `Pertanyaan ${Math.min(qNum, 5)} dari 5`} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {scores.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--accent-light)", fontWeight: 600, background: "rgba(13,148,136,0.1)", padding: "4px 12px", borderRadius: 20 }}>
              Rata-rata: {avgScore}/10
            </span>
          )}
          <button className="btn-ghost" onClick={reset} style={{ fontSize: 12 }}>↩ Mulai Ulang</button>
        </div>
      </div>

      {/* Chat Area */}
      <GlassCard style={{ marginBottom: phase === "report" ? 14 : 0, padding: 0 }}>
        <div ref={chatRef} style={{ maxHeight: 420, overflowY: "auto", padding: 20 }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{
                  maxWidth: "80%", padding: "12px 16px", borderRadius: 14, fontSize: 13, lineHeight: 1.7,
                  background: msg.role === "user" ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${msg.role === "user" ? "rgba(13,148,136,0.25)" : "var(--border)"}`,
                }}>
                  {msg.role === "ai" && <span style={{ fontSize: 10, color: "var(--accent-light)", fontWeight: 700, display: "block", marginBottom: 4 }}>CareerPath AI</span>}
                  <MarkdownRenderer content={msg.content} />
                  {msg.score && (
                    <div style={{ marginTop: 8, padding: "4px 10px", background: `rgba(${msg.score >= 7 ? "16,185,129" : msg.score >= 5 ? "245,158,11" : "239,68,68"},0.12)`, borderRadius: 8, display: "inline-block", fontSize: 11, fontWeight: 700, color: msg.score >= 7 ? "#10B981" : msg.score >= 5 ? "#F59E0B" : "#EF4444" }}>
                      Skor: {msg.score}/10
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <LoadingSkeleton lines={3} />}
        </div>

        {/* Input */}
        {phase === "interview" && (
          <div style={{ borderTop: "1px solid var(--border)", padding: 16, display: "flex", gap: 10 }}>
            <textarea className="input-glass" value={userInput} onChange={e => setUserInput(e.target.value)} rows={2}
              placeholder="Ketik jawaban kamu di sini..."
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); }}}
              style={{ flex: 1, minHeight: 44 }} />
            <button className="btn-primary" onClick={submitAnswer} disabled={loading || !userInput.trim()} style={{ alignSelf: "flex-end", padding: "10px 20px" }}>
              {loading ? "⟳" : "Kirim →"}
            </button>
          </div>
        )}
      </GlassCard>

      {/* Report */}
      {phase === "report" && report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "var(--accent-light)" }}>📋 Laporan Akhir Interview</p>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>Posisi: {position} di {company || "Perusahaan"}</p>
            <MarkdownRenderer content={report} />
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
