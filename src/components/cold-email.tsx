"use client";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, SectionHeader, LoadingSkeleton } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown";
import { EmailTone, EmailType } from "@/lib/types";
import { callAI } from "@/lib/utils";
import React, { useState, useEffect } from "react";

const HISTORY_KEY = "jobtrek-email-history";

interface EmailEntry {
  id: number;
  type: EmailType;
  company: string;
  position: string;
  hrdName: string;
  tone: EmailTone;
  result: string;
  createdAt: string;
}

function loadEmailHistory(): EmailEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function saveEmailHistory(entries: EmailEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 30))); // Keep last 30
}

export function ColdEmailGenerator() {
  const [hrdName, setHrdName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<EmailTone>("formal");
  const [type, setType] = useState<EmailType>("cold_email");
  const [daysSince, setDaysSince] = useState("7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<EmailEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<EmailEntry | null>(null);

  useEffect(() => { setHistory(loadEmailHistory()); }, []);

  const generate = async () => {
    if (!company.trim() || !position.trim()) return;
    setLoading(true); setResult(""); setViewingEntry(null);
    try {
      const text = await callAI("cold_email", { hrdName, company, position, context, tone, type, daysSince });
      setResult(text);
      // Auto-save to history
      const entry: EmailEntry = {
        id: Date.now(), type, company, position, hrdName, tone, result: text, createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...history];
      setHistory(updated);
      saveEmailHistory(updated);
    } catch { setResult("Terjadi kesalahan. Coba lagi."); }
    setLoading(false);
  };

  const copyToClipboard = (text?: string) => {
    navigator.clipboard.writeText(text || result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteEntry = (id: number) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveEmailHistory(updated);
    if (viewingEntry?.id === id) setViewingEntry(null);
  };

  const typeOptions: { id: EmailType; label: string; icon: string }[] = [
    { id: "cold_email", label: "Cold Email", icon: "✉️" },
    { id: "linkedin", label: "LinkedIn", icon: "💼" },
    { id: "followup", label: "Follow-up", icon: "🔄" },
  ];

  const typeLabel = (t: EmailType) => t === "linkedin" ? "LinkedIn" : t === "followup" ? "Follow-up" : "Cold Email";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const displayResult = viewingEntry ? viewingEntry.result : result;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeader icon="✉️" title="Cold Email & LinkedIn Generator" subtitle="Buat pesan outreach yang personal dan persuasif untuk HRD atau recruiter." />
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
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>📜 Riwayat Email</p>
              {history.map((entry, i) => (
                <div key={entry.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(13,148,136,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {entry.type === "linkedin" ? "💼" : entry.type === "followup" ? "🔄" : "✉️"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { setViewingEntry(entry); setShowHistory(false); }}>
                    <p className="truncate" style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 13 }}>
                      {typeLabel(entry.type)} — {entry.position}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>
                      {entry.company}{entry.hrdName ? ` · ${entry.hrdName}` : ""} · {fmtDate(entry.createdAt)}
                    </p>
                  </div>
                  <button onClick={() => copyToClipboard(entry.result)} className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>📋</button>
                  <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "4px" }}>✕</button>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "grid", gridTemplateColumns: displayResult || loading ? "1fr 1fr" : "1fr", gap: 14 }}>
        {/* Input Panel */}
        <div>
          {/* Type Selector */}
          <GlassCard style={{ marginBottom: 14 }}>
            <label className="label-text">Tipe Pesan</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {typeOptions.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding: "12px", borderRadius: 10, textAlign: "center", fontFamily: "var(--font)", cursor: "pointer",
                  border: `1.5px solid ${type === t.id ? "var(--accent)" : "var(--border)"}`,
                  background: type === t.id ? "rgba(13,148,136,0.08)" : "transparent",
                  transition: "all 0.2s ease",
                }}>
                  <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{t.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: type === t.id ? 700 : 400, color: type === t.id ? "var(--accent-light)" : "var(--text-muted)" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ marginBottom: 14 }}>
            <label className="label-text">Nama HRD / Recruiter <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(opsional)</span></label>
            <input className="input-glass" value={hrdName} onChange={e => setHrdName(e.target.value)} placeholder="Budi Santoso" style={{ marginBottom: 14 }} />

            <label className="label-text">Nama Perusahaan *</label>
            <input className="input-glass" value={company} onChange={e => setCompany(e.target.value)} placeholder="Gojek, Tokopedia..." style={{ marginBottom: 14 }} />

            <label className="label-text">Posisi yang Diincar *</label>
            <input className="input-glass" value={position} onChange={e => setPosition(e.target.value)} placeholder="Frontend Developer" style={{ marginBottom: 14 }} />

            <label className="label-text">Kenapa Tertarik? <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(konteks untuk personalisasi)</span></label>
            <textarea className="input-glass" value={context} onChange={e => setContext(e.target.value)} rows={3} placeholder="Saya tertarik karena produk GoFood yang membantu UMKM..." style={{ marginBottom: 14 }} />

            {type === "followup" && (
              <>
                <label className="label-text">Berapa Hari Sejak Melamar?</label>
                <input className="input-glass" type="number" value={daysSince} onChange={e => setDaysSince(e.target.value)} style={{ marginBottom: 14 }} />
              </>
            )}

            {/* Tone */}
            <label className="label-text">Nada Pesan</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["formal", "semiformal"] as EmailTone[]).map(t => (
                <button key={t} onClick={() => setTone(t)} style={{
                  flex: 1, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontFamily: "var(--font)", cursor: "pointer",
                  border: `1px solid ${tone === t ? "var(--accent)" : "var(--border)"}`,
                  background: tone === t ? "rgba(13,148,136,0.08)" : "transparent",
                  color: tone === t ? "var(--accent-light)" : "var(--text-muted)", fontWeight: tone === t ? 600 : 400,
                }}>
                  {t === "formal" ? "🏢 Formal" : "🤝 Semi-formal"}
                </button>
              ))}
            </div>
          </GlassCard>

          <button className="btn-primary" onClick={generate} disabled={loading || !company.trim() || !position.trim()}
            style={{ width: "100%", padding: 14, fontSize: 15 }}>
            {loading ? "⟳ Membuat draft..." : "✨ Generate Pesan"}
          </button>
        </div>

        {/* Result Panel */}
        {(displayResult || loading) && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={viewingEntry ? viewingEntry.id : "current"}>
            <GlassCard>
              {loading ? <LoadingSkeleton lines={8} /> : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {viewingEntry ? typeLabel(viewingEntry.type) : typeLabel(type)} Generated
                      </span>
                      {viewingEntry && (
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                          {fmtDate(viewingEntry.createdAt)} · {viewingEntry.company}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-accent-outline" onClick={() => copyToClipboard(displayResult)} style={{ fontSize: 12, padding: "6px 12px" }}>
                        {copied ? "✓ Tersalin!" : "📋 Salin"}
                      </button>
                      {!viewingEntry && (
                        <button className="btn-ghost" onClick={generate} style={{ fontSize: 12, padding: "6px 12px" }}>
                          🔄 Regenerate
                        </button>
                      )}
                      {viewingEntry && (
                        <button className="btn-ghost" onClick={() => setViewingEntry(null)} style={{ fontSize: 12, padding: "6px 12px" }}>
                          ← Kembali
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <MarkdownRenderer content={displayResult} />
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
