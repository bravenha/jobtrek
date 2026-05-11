"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, SectionHeader, LoadingSkeleton, ScoreGauge } from "@/components/ui";
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
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 20)));
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
    setMessages([{ role: "ai", content: `Welcome! Thanks for taking the time to speak with me today about the **${position}** role at **${company || "our company"}**. To kick things off, could you walk me through a recent complex problem you solved, focusing specifically on how you balanced user needs with technical constraints?` }]);
    try {
      const q = await callAI("interview_start", { position, company, jobDesc, questionNumber: "1" });
      setMessages(p => [...p, { role: "ai", content: q }]);
    } catch { setMessages(p => [...p, { role: "ai", content: "Sorry, failed to load question. Please restart." }]); }
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
        setMessages(p => [...p, { role: "ai", content: "✅ Interview simulation complete! Preparing final report..." }]);
        const evalData = newScores.map((sc, i) => `Q${i + 1}: score ${sc}/10`).join(", ");
        const rep = await callAI("interview_report", { position, company, evaluations: evalData });
        setReport(rep);
        setPhase("report");
        const finalMsgs = [...newMessages, { role: "ai" as const, content: "✅ Interview simulation complete!" }];
        saveSession(rep, newScores, finalMsgs);
      }
    } catch {
      setMessages(p => [...p, { role: "ai", content: "Error occurred. Please try again." }]);
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
  const currentScore = Math.round(avgScore * 10);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  /* ── Chat Bubble Component ─────────────────── */
  const ChatBubble = ({ msg }: { msg: InterviewMessage }) => (
    <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
      {msg.role === "ai" && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, marginTop: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
      )}
      <div style={{
        maxWidth: "72%", padding: "14px 18px", fontSize: 13, lineHeight: 1.7,
        borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: msg.role === "user" ? "var(--accent)" : "#F3F4F6",
        color: msg.role === "user" ? "#fff" : "var(--text-primary)",
      }}>
        <MarkdownRenderer content={msg.content} className={msg.role === "user" ? "chat-user" : ""} />
        {msg.score && (
          <div style={{ marginTop: 8, padding: "4px 10px", background: `rgba(${msg.score >= 7 ? "16,185,129" : msg.score >= 5 ? "245,158,11" : "239,68,68"},0.12)`, borderRadius: 8, display: "inline-block", fontSize: 11, fontWeight: 700, color: msg.score >= 7 ? "#10B981" : msg.score >= 5 ? "#F59E0B" : "#EF4444" }}>
            Score: {msg.score}/10
          </div>
        )}
      </div>
    </div>
  );

  // VIEWING PAST SESSION
  if (viewingHistory) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionHeader title="Session History" subtitle={`${viewingHistory.position} at ${viewingHistory.company || "Company"} — ${fmtDate(viewingHistory.createdAt)}`} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => setViewingHistory(null)} style={{ fontSize: 12 }}>← Back</button>
            <button className="btn-primary" onClick={() => { setPosition(viewingHistory.position); setCompany(viewingHistory.company); setViewingHistory(null); }}
              style={{ fontSize: 12, padding: "8px 14px" }}>🔄 Practice Again</button>
          </div>
        </div>
        <Card style={{ marginBottom: 14, padding: 0 }}>
          <div style={{ maxHeight: 400, overflowY: "auto", padding: 20 }}>
            {viewingHistory.messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
          </div>
        </Card>
        {viewingHistory.report && (
          <Card>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "var(--accent-dark)" }}>Final Report</p>
            <MarkdownRenderer content={viewingHistory.report} />
          </Card>
        )}
      </motion.div>
    );
  }

  // SETUP
  if (phase === "setup") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionHeader title="AI Interview Coach" subtitle="Live simulation with real-time feedback. Practice STAR method answers and get scored." />
          {history.length > 0 && (
            <button className="btn-outline-accent" onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 12 }}>
              History ({history.length})
            </button>
          )}
        </div>

        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 14 }}>
              <Card>
                <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Session History</p>
                {history.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `rgba(${s.avgScore >= 7 ? "16,185,129" : s.avgScore >= 5 ? "245,158,11" : "239,68,68"},0.1)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14,
                      color: s.avgScore >= 7 ? "#10B981" : s.avgScore >= 5 ? "#F59E0B" : "#EF4444",
                    }}>{s.avgScore}</div>
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => viewSession(s)}>
                      <p className="truncate" style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 13 }}>{s.position}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{s.company || "Company"} · {fmtDate(s.createdAt)}</p>
                    </div>
                    <button onClick={() => viewSession(s)} className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>View</button>
                    <button onClick={() => deleteSession(s.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "4px" }}>✕</button>
                  </div>
                ))}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card style={{ maxWidth: 500 }}>
          <label className="label-text">Position *</label>
          <input className="input-field" value={position} onChange={e => setPosition(e.target.value)} placeholder="Senior Product Designer, Frontend Developer..." style={{ marginBottom: 14 }} />
          <label className="label-text">Company</label>
          <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="TechCorp, Stripe, Gojek..." style={{ marginBottom: 14 }} />
          <label className="label-text">Job Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
          <textarea className="input-field" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3} placeholder="Paste job description for more relevant questions..." style={{ marginBottom: 20 }} />
          <button className="btn-primary" onClick={startInterview} disabled={!position.trim()} style={{ width: "100%", padding: 14, fontSize: 15 }}>
            Start Simulation
          </button>
        </Card>
      </motion.div>
    );
  }

  // INTERVIEW + REPORT
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="responsive-grid-sidebar">
        {/* Left - Chat */}
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Live Simulation</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700 }}>{position} at {company || "Company"}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Interview Started · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <button onClick={reset} style={{
              padding: "8px 16px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626",
              border: "1px solid #FCA5A5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} />
              End Session
            </button>
          </div>

          {/* Chat */}
          <Card style={{ padding: 0, marginBottom: phase === "report" ? 14 : 0 }}>
            <div ref={chatRef} style={{ maxHeight: 420, overflowY: "auto", padding: 20 }}>
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <ChatBubble msg={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div style={{ display: "flex", gap: 6, padding: "10px 0" }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            {phase === "interview" && (
              <div style={{ borderTop: "1px solid var(--border)", padding: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                </div>
                <input className="input-field" value={userInput} onChange={e => setUserInput(e.target.value)}
                  placeholder="Type your response or use voice..."
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); }}}
                  style={{ flex: 1 }} />
                <button className="btn-primary" onClick={submitAnswer} disabled={loading || !userInput.trim()}
                  style={{ width: 40, height: 40, borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Right - Score & Insights */}
        <div>
          {/* Current Score */}
          <Card style={{ marginBottom: 14, textAlign: "center", padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Current Score</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Based on STAR method and clarity.</p>
            <ScoreGauge score={currentScore || 85} size={110} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
              <div style={{ padding: "8px", background: "#F9FAFB", borderRadius: 8, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Structure</p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--accent-dark)" }}>Great</p>
              </div>
              <div style={{ padding: "8px", background: "#F9FAFB", borderRadius: 8, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Relevance</p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--accent-dark)" }}>Good</p>
              </div>
            </div>
          </Card>

          {/* Live Insights */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Live Insights</p>
            </div>
            {scores.length > 0 ? scores.map((s, i) => (
              <div key={i} style={{ padding: "10px 12px", background: s >= 7 ? "#F0FDF4" : "#FFFBEB", borderRadius: 8, marginBottom: 8 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: s >= 7 ? "#059669" : "#D97706" }}>
                  {s >= 7 ? "✓ Strong Answer" : "⚠ Needs Improvement"}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Q{i + 1}: Score {s}/10
                </p>
              </div>
            )) : (
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Insights will appear as you answer questions. Focus on using the STAR method for behavioral questions.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Report */}
      {phase === "report" && report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
          <Card>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16, color: "var(--accent-dark)" }}>Final Interview Report</p>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>Position: {position} at {company || "Company"}</p>
            <MarkdownRenderer content={report} />
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
