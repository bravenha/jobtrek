"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, SectionHeader, LoadingSkeleton } from "@/components/ui";
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
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 30)));
}

const TONE_OPTIONS = [
  { id: "formal", label: "Confident & Direct" },
  { id: "semiformal", label: "Curious & Humble" },
];

const CREATIVE_CHIPS = ["Data-Driven", "Creative Flair"];

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
      const entry: EmailEntry = {
        id: Date.now(), type, company, position, hrdName, tone, result: text, createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...history];
      setHistory(updated);
      saveEmailHistory(updated);
    } catch { setResult("An error occurred. Please try again."); }
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

  const typeOptions: { id: EmailType; label: string }[] = [
    { id: "cold_email", label: "Direct Application Follow-up" },
    { id: "linkedin", label: "LinkedIn Connection" },
    { id: "followup", label: "Follow-up Email" },
  ];

  const typeLabel = (t: EmailType) => t === "linkedin" ? "LinkedIn" : t === "followup" ? "Follow-up" : "Cold Email";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const displayResult = viewingEntry ? viewingEntry.result : result;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Cold Email Generator</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Craft high-agency outreach messages tailored to your specific role and target company. Our AI ensures a professional, yet striking tone.
        </p>
      </div>

      {/* History Toggle */}
      {history.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button className="btn-outline-accent" onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 12 }}>
            History ({history.length})
          </button>
        </div>
      )}

      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 14 }}>
            <Card>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Email History</p>
              {history.map((entry, i) => (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F0FDF9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--accent-dark)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={displayResult || loading ? "responsive-grid-sidebar-left" : ""}>
        {/* Left - Parameters */}
        <div>
          <Card>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>
              Parameters
            </h3>

            <label className="label-text">Message Intent</label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value as EmailType)} style={{ marginBottom: 16 }}>
              {typeOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            <label className="label-text">Target Role / Context</label>
            <input className="input-field" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Senior Product Designer" style={{ marginBottom: 16 }} />

            <label className="label-text">Company</label>
            <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Stripe, TechCorp..." style={{ marginBottom: 16 }} />

            {type === "followup" && (
              <>
                <label className="label-text">Days Since Application</label>
                <input className="input-field" type="number" value={daysSince} onChange={e => setDaysSince(e.target.value)} style={{ marginBottom: 16 }} />
              </>
            )}

            <label className="label-text">Professional Tone</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {TONE_OPTIONS.map(t => (
                <button key={t.id} onClick={() => setTone(t.id as EmailTone)}
                  className={`chip ${tone === t.id ? "active" : ""}`}>
                  {t.label}
                </button>
              ))}
              {CREATIVE_CHIPS.map(label => (
                <button key={label} className="chip">{label}</button>
              ))}
            </div>

            <button className="btn-primary" onClick={generate} disabled={loading || !company.trim() || !position.trim()}
              style={{ width: "100%", padding: 14, fontSize: 15, borderRadius: 10 }}>
              {loading ? "⟳ Generating..." : "Generate Draft"}
            </button>
          </Card>
        </div>

        {/* Right - Result */}
        {(displayResult || loading) && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={viewingEntry ? viewingEntry.id : "current"}>
            <Card>
              {loading ? <LoadingSkeleton lines={10} /> : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        AI Draft Ready
                      </span>
                      {viewingEntry && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{fmtDate(viewingEntry.createdAt)}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-outline-accent" onClick={() => copyToClipboard(displayResult)} style={{ fontSize: 12, padding: "6px 14px" }}>
                        {copied ? "✓ Copied!" : "Copy"}
                      </button>
                      {!viewingEntry && (
                        <button className="btn-ghost" onClick={generate} style={{ fontSize: 12, padding: "6px 14px" }}>
                          Regenerate
                        </button>
                      )}
                      {viewingEntry && (
                        <button className="btn-ghost" onClick={() => setViewingEntry(null)} style={{ fontSize: 12, padding: "6px 14px" }}>
                          ← Back
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: 20, background: "#F9FDFB", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <MarkdownRenderer content={displayResult} />
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
