"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, StatusBadge, Avatar, EmptyState, ScoreGauge } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown";
import { JobApplication, STATUS_MAP, STATUS_IDS, ACTIVE_STATUSES, SOURCES, StatusId } from "@/lib/types";
import { daysAgo, formatDate } from "@/lib/utils";
import React, { useState } from "react";

/* ═══════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════ */
export function Dashboard({ apps, onAddClick, onAppClick, onViewAll }: {
  apps: JobApplication[]; onAddClick: () => void; onAppClick: (app: JobApplication) => void; onViewAll: () => void;
}) {
  const stats = {
    total: apps.length,
    active: apps.filter(a => ACTIVE_STATUSES.includes(a.status)).length,
    interview: apps.filter(a => a.status === "interview").length,
    offered: apps.filter(a => ["offered","accepted"].includes(a.status)).length,
  };

  const avgScore = apps.length > 0 ? Math.min(99, 60 + apps.length * 3) : 0;

  if (apps.length === 0) {
    return <EmptyState icon="🚀" title="Mulai tracking lamaranmu" desc="Tambah lamaranmu, biarkan AI bantu persiapan interview, tips CV, dan draft email follow-up." action="+ New Application" onAction={onAddClick} />;
  }

  const pipeline = ["applied","hr_screen","test","interview","offered"] as StatusId[];

  return (
    <div>
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }} className="greeting-title">Good morning, Alex.</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
          You have {stats.interview} interviews scheduled this week. Your overall pipeline health is strong. Let&apos;s keep the momentum going.
        </p>
      </motion.div>

      {/* AI Recommended Focus + ATS Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="responsive-grid-focus" style={{ marginBottom: 24 }}>
        {/* Focus Card */}
        <div style={{
          background: "linear-gradient(135deg, #F0FDF9 0%, #ECFDF5 50%, #F0FDFA 100%)",
          border: "1px solid rgba(0,186,157,0.15)", borderRadius: 16, padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Recommended Focus</span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: "var(--text-primary)", lineHeight: 1.3 }}>
            Prepare for Stripe Technical Interview
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            Your system design round is in 48 hours. Based on previous candidates, focusing on distributed caching strategies will yield the highest ROI.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" style={{ borderRadius: 20, padding: "10px 20px", fontSize: 13 }}>
              Launch Practice Session →
            </button>
            <button className="btn-ghost" style={{ borderRadius: 20, padding: "10px 20px", fontSize: 13 }}>
              Review Notes
            </button>
          </div>
        </div>

        {/* ATS Score */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            Average ATS Match
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </p>
          <ScoreGauge score={avgScore} size={130} />
          <p style={{ fontSize: 12, color: "var(--accent-dark)", fontWeight: 600, marginTop: 8 }}>+5% from last month.</p>
        </Card>
      </motion.div>

      {/* Active Pipeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Active Pipeline</h3>
          <button onClick={onViewAll} style={{ background: "none", border: "none", fontSize: 13, color: "var(--accent-dark)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font)" }}>
            View Board →
          </button>
        </div>
        <div className="responsive-flex-pipeline" style={{ marginBottom: 24 }}>
          {pipeline.map(id => {
            const count = apps.filter(a => a.status === id).length;
            const s = STATUS_MAP[id];
            return (
              <Card key={id} style={{ flex: "1 1 0", textAlign: "center", padding: "18px 12px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, color: count > 0 ? s.color : "var(--text-muted)" }}>{count}</p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: count > 0 ? s.color : "var(--text-muted)" }}>{s.label}</p>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Recent */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Recent Applications</p>
            <button onClick={onViewAll} style={{ background: "none", border: "none", fontSize: 13, color: "var(--accent-dark)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font)" }}>View all →</button>
          </div>
          {apps.slice(0, 5).map((app, i) => (
            <motion.div key={app.id} onClick={() => onAppClick(app)} whileHover={{ x: 4 }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
              <Avatar name={app.company} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="truncate" style={{ margin: "0 0 3px", fontWeight: 600, fontSize: 13 }}>{app.role}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{app.company} · {daysAgo(app.createdAt)}</p>
              </div>
              <StatusBadge status={app.status} size="sm" />
            </motion.div>
          ))}
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADD APPLICATION MODAL
   ═══════════════════════════════════════════════════ */
export function AddModal({ onClose, onSave }: {
  onClose: () => void; onSave: (data: Omit<JobApplication, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState({
    company: "", role: "", source: "Jobstreet",
    appliedDate: new Date().toISOString().slice(0, 10),
    jobDesc: "", notes: "", status: "applied" as StatusId,
  });
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const submit = () => { if (form.company.trim() && form.role.trim()) onSave(form); };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>New Application</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)", padding: "4px 8px" }}>✕</button>
        </div>

        <label className="label-text">Company Name *</label>
        <input className="input-field" value={form.company} onChange={e => setF("company", e.target.value)} placeholder="Gojek, Tokopedia, Stripe..." style={{ marginBottom: 14 }} />

        <label className="label-text">Position *</label>
        <input className="input-field" value={form.role} onChange={e => setF("role", e.target.value)} placeholder="Frontend Developer, Data Analyst..." style={{ marginBottom: 14 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label-text">Source</label>
            <select className="input-field" value={form.source} onChange={e => setF("source", e.target.value)}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Applied Date</label>
            <input className="input-field" type="date" value={form.appliedDate} onChange={e => setF("appliedDate", e.target.value)} />
          </div>
        </div>

        <label className="label-text">Initial Status</label>
        <select className="input-field" value={form.status} onChange={e => setF("status", e.target.value as StatusId)} style={{ marginBottom: 14 }}>
          {STATUS_IDS.map(id => <option key={id} value={id}>{STATUS_MAP[id].label}</option>)}
        </select>

        <label className="label-text">Job Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional — for better AI results)</span></label>
        <textarea className="input-field" value={form.jobDesc} onChange={e => setF("jobDesc", e.target.value)} rows={3} placeholder="Paste job description here..." style={{ marginBottom: 20 }} />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Save Application</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   APPLICATION LIST
   ═══════════════════════════════════════════════════ */
export function AppList({ apps, onAppClick, filter, setFilter }: {
  apps: JobApplication[]; onAppClick: (app: JobApplication) => void; filter: string; setFilter: (f: string) => void;
}) {
  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);
  const filterOptions: [string, string][] = [["all", "All"], ...STATUS_IDS.map(id => [id, STATUS_MAP[id].label] as [string, string])];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>My Pipeline</h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {filterOptions.map(([id, label]) => {
          const count = id === "all" ? apps.length : apps.filter(a => a.status === id).length;
          if (id !== "all" && count === 0) return null;
          const active = filter === id;
          return (
            <button key={id} onClick={() => setFilter(id)} className={`chip ${active ? "active" : ""}`}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📭" title="No applications" desc="No applications with this status." />
      ) : (
        <AnimatePresence>
          {filtered.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hover onClick={() => onAppClick(app)} style={{ marginBottom: 8, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar name={app.company} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="truncate" style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 15 }}>{app.role}</p>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-muted)" }}>{app.company} · {app.source}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <StatusBadge status={app.status} size="sm" />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>applied {daysAgo(app.appliedDate)}</span>
                    </div>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   APPLICATION DETAIL
   ═══════════════════════════════════════════════════ */
export function AppDetail({ app, onBack, onUpdate, onDelete }: {
  app: JobApplication; onBack: () => void; onUpdate: (id: number, patch: Partial<JobApplication>) => void; onDelete: (id: number) => void;
}) {
  const [ai, setAi] = useState<{ loading: boolean; mode: string | null; result: string }>({ loading: false, mode: null, result: "" });

  const callJobAI = async (mode: string) => {
    setAi({ loading: true, mode, result: "" });
    try {
      const res = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: `job_${mode}`, payload: { company: app.company, role: app.role, jobDesc: app.jobDesc || "", daysSince: String(Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / 86400000)) } }),
      });
      const data = await res.json();
      setAi({ loading: false, mode, result: data.result || "Failed to get response." });
    } catch { setAi({ loading: false, mode, result: "Connection error. Try again." }); }
  };

  const aiButtons = [
    { mode: "interview_prep", title: "Interview Prep", sub: "Predict questions + tips" },
    { mode: "cv_tips", title: "CV Optimization", sub: "Keywords & key skills" },
    { mode: "followup", title: "Follow-up Draft", sub: "Professional email" },
  ];

  const aiLabels: Record<string, string> = { interview_prep: "Interview Preparation", cv_tips: "CV Tips", followup: "Follow-up Draft" };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button onClick={onBack} className="btn-ghost" style={{ marginBottom: 16, fontSize: 13 }}>← Back to List</button>

      {/* Header */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          <Avatar name={app.company} size={54} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{app.role}</h2>
            <p style={{ margin: "0 0 8px", color: "var(--text-muted)", fontSize: 14 }}>{app.company} · {app.source}</p>
            <StatusBadge status={app.status} />
          </div>
        </div>
        <div className="responsive-grid-2col" style={{ padding: 14, background: "#F9FAFB", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          <div><p style={{ margin: "0 0 2px", color: "var(--text-muted)" }}>Applied Date</p><p style={{ margin: 0, fontWeight: 600 }}>{formatDate(app.appliedDate)}</p></div>
          <div><p style={{ margin: "0 0 2px", color: "var(--text-muted)" }}>Time Elapsed</p><p style={{ margin: 0, fontWeight: 600 }}>{daysAgo(app.appliedDate)}</p></div>
        </div>
        <label className="label-text">Update Status</label>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {STATUS_IDS.map(id => {
            const active = app.status === id;
            const s = STATUS_MAP[id];
            return (
              <button key={id} onClick={() => onUpdate(app.id, { status: id })}
                className={`chip ${active ? "active" : ""}`}
                style={active ? { background: s.color, borderColor: s.color, color: "#fff" } : {}}>
                {s.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* AI Help */}
      <Card style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14 }}>AI Assistant</p>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>Powered by CareerPath AI</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {aiButtons.map(btn => {
            const active = ai.mode === btn.mode && (ai.result || ai.loading);
            return (
              <button key={btn.mode} onClick={() => callJobAI(btn.mode)} disabled={ai.loading} style={{
                padding: 12, borderRadius: 10, textAlign: "left", fontFamily: "var(--font)", cursor: ai.loading ? "wait" : "pointer",
                border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "#F0FDF9" : "transparent", transition: "all 0.2s ease",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: active ? "var(--accent-dark)" : "var(--text-primary)" }}>{btn.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{btn.sub}</p>
              </button>
            );
          })}
        </div>
        {ai.loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20, background: "#F9FAFB", borderRadius: 10, marginTop: 14, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block", marginRight: 8 }}>⟳</motion.span>
            AI is preparing response...
          </motion.div>
        )}
        {!ai.loading && ai.result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: 18, background: "#F0FDF9", borderRadius: 10, borderLeft: "3px solid var(--accent)", marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{aiLabels[ai.mode!] || "AI"}</span>
              <button onClick={() => setAi(p => ({ ...p, result: "" }))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <MarkdownRenderer content={ai.result} />
          </motion.div>
        )}
      </Card>

      {/* Notes */}
      <Card style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>Personal Notes</p>
        <textarea className="input-field" key={app.id} defaultValue={app.notes || ""} onBlur={e => onUpdate(app.id, { notes: e.target.value })} rows={3} placeholder="Recruiter contacts, job links, things to remember..." />
      </Card>

      {/* Delete */}
      <button onClick={() => { if (confirm("Delete this application?")) onDelete(app.id); }} className="btn-danger" style={{ width: "100%" }}>
        Delete Application
      </button>
    </motion.div>
  );
}
