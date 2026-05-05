"use client";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, StatusBadge, Avatar, EmptyState } from "@/components/ui";
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

  const statCards = [
    { label: "Total Lamaran", value: stats.total, color: "#3B82F6", icon: "📋" },
    { label: "Sedang Proses", value: stats.active, color: "#8B5CF6", icon: "⚡" },
    { label: "Interview", value: stats.interview, color: "#06B6D4", icon: "🎙️" },
    { label: "Penawaran", value: stats.offered, color: "#10B981", icon: "🎉" },
  ];

  const pipeline = ["applied","hr_screen","test","interview","offered"] as StatusId[];

  if (apps.length === 0) {
    return <EmptyState icon="🚀" title="Mulai tracking lamaranmu" desc="Tambah lamaranmu, biarkan AI bantu persiapan interview, tips CV, dan draft email follow-up — semuanya dalam Bahasa Indonesia." action="+ Tambah Lamaran Pertama" onAction={onAddClick} />;
  }

  return (
    <div>
      {/* Stats */}
      <div className="bento-grid bento-grid-4" style={{ marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlassCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Pipeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14 }}>Pipeline Lamaran</p>
          <div style={{ display: "flex", gap: 8 }}>
            {pipeline.map(id => {
              const count = apps.filter(a => a.status === id).length;
              const s = STATUS_MAP[id];
              return (
                <div key={id} style={{
                  flex: "1 1 0", textAlign: "center", padding: "14px 8px", borderRadius: 10,
                  background: count > 0 ? `rgba(${s.glow},0.08)` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${count > 0 ? `rgba(${s.glow},0.2)` : "var(--border)"}`,
                  transition: "all 0.2s ease",
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: count > 0 ? s.color : "var(--text-muted)" }}>{count}</p>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: count > 0 ? s.color : "var(--text-muted)" }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Recent */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <GlassCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Terbaru</p>
            <button onClick={onViewAll} style={{ background: "none", border: "none", fontSize: 13, color: "var(--accent-light)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font)" }}>Lihat semua →</button>
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
        </GlassCard>
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
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>✨ Tambah Lamaran Baru</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)", padding: "4px 8px" }}>✕</button>
        </div>

        <label className="label-text">Nama Perusahaan *</label>
        <input className="input-glass" value={form.company} onChange={e => setF("company", e.target.value)} placeholder="Gojek, Tokopedia, Bank BCA..." style={{ marginBottom: 14 }} />

        <label className="label-text">Posisi yang Dilamar *</label>
        <input className="input-glass" value={form.role} onChange={e => setF("role", e.target.value)} placeholder="Frontend Developer, Data Analyst..." style={{ marginBottom: 14 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label-text">Sumber</label>
            <select className="input-glass" value={form.source} onChange={e => setF("source", e.target.value)}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Tanggal Melamar</label>
            <input className="input-glass" type="date" value={form.appliedDate} onChange={e => setF("appliedDate", e.target.value)} />
          </div>
        </div>

        <label className="label-text">Status Awal</label>
        <select className="input-glass" value={form.status} onChange={e => setF("status", e.target.value as StatusId)} style={{ marginBottom: 14 }}>
          {STATUS_IDS.map(id => <option key={id} value={id}>{STATUS_MAP[id].label}</option>)}
        </select>

        <label className="label-text">Deskripsi Pekerjaan <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(opsional — untuk AI lebih akurat)</span></label>
        <textarea className="input-glass" value={form.jobDesc} onChange={e => setF("jobDesc", e.target.value)} rows={3} placeholder="Paste job description di sini..." style={{ marginBottom: 20 }} />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={submit}>💾 Simpan Lamaran</button>
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
  const filterOptions: [string, string][] = [["all", "Semua"], ...STATUS_IDS.map(id => [id, STATUS_MAP[id].label] as [string, string])];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {filterOptions.map(([id, label]) => {
          const count = id === "all" ? apps.length : apps.filter(a => a.status === id).length;
          if (id !== "all" && count === 0) return null;
          const active = filter === id;
          return (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              background: active ? "rgba(13,148,136,0.12)" : "transparent",
              color: active ? "var(--accent-light)" : "var(--text-muted)",
              cursor: "pointer", fontWeight: active ? 700 : 400,
            }}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📭" title="Tidak ada lamaran" desc="Tidak ada lamaran dengan status ini." />
      ) : (
        <AnimatePresence>
          {filtered.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => onAppClick(app)} whileHover={{ x: 4 }}>
              <GlassCard hover onClick={() => onAppClick(app)} style={{ marginBottom: 8, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar name={app.company} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="truncate" style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 15 }}>{app.role}</p>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-muted)" }}>{app.company} · {app.source}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <StatusBadge status={app.status} size="sm" />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>melamar {daysAgo(app.appliedDate)}</span>
                    </div>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
                </div>
              </GlassCard>
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
      setAi({ loading: false, mode, result: data.result || "Gagal mendapat respons." });
    } catch { setAi({ loading: false, mode, result: "Terjadi kesalahan koneksi." }); }
  };

  const aiButtons = [
    { mode: "interview_prep", title: "🎙️ Persiapan Interview", sub: "Prediksi pertanyaan + tips" },
    { mode: "cv_tips", title: "📄 Tips Sesuaikan CV", sub: "Keyword & skill penting" },
    { mode: "followup", title: "✉️ Draft Follow-up", sub: "Email tindak lanjut" },
  ];

  const aiLabels: Record<string, string> = { interview_prep: "Persiapan Interview", cv_tips: "Tips CV", followup: "Draft Follow-up" };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button onClick={onBack} className="btn-ghost" style={{ marginBottom: 16, fontSize: 13 }}>← Kembali ke Daftar</button>

      {/* Header */}
      <GlassCard style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          <Avatar name={app.company} size={54} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{app.role}</h2>
            <p style={{ margin: "0 0 8px", color: "var(--text-muted)", fontSize: 14 }}>{app.company} · {app.source}</p>
            <StatusBadge status={app.status} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          <div><p style={{ margin: "0 0 2px", color: "var(--text-muted)" }}>Tanggal Melamar</p><p style={{ margin: 0, fontWeight: 600 }}>{formatDate(app.appliedDate)}</p></div>
          <div><p style={{ margin: "0 0 2px", color: "var(--text-muted)" }}>Sudah Berlalu</p><p style={{ margin: 0, fontWeight: 600 }}>{daysAgo(app.appliedDate)}</p></div>
        </div>
        <label className="label-text">Update Status</label>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {STATUS_IDS.map(id => {
            const active = app.status === id;
            const s = STATUS_MAP[id];
            return (
              <button key={id} onClick={() => onUpdate(app.id, { status: id })} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11, fontFamily: "var(--font)",
                border: `1px solid ${active ? s.color : "var(--border)"}`,
                background: active ? `rgba(${s.glow},0.12)` : "transparent",
                color: active ? s.color : "var(--text-muted)",
                cursor: "pointer", fontWeight: active ? 700 : 400,
              }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* AI Help */}
      <GlassCard style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14 }}>🤖 Bantuan AI</p>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>Powered by CareerPath AI · Bahasa Indonesia</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {aiButtons.map(btn => {
            const active = ai.mode === btn.mode && (ai.result || ai.loading);
            return (
              <button key={btn.mode} onClick={() => callJobAI(btn.mode)} disabled={ai.loading} style={{
                padding: "12px", borderRadius: 10, textAlign: "left", fontFamily: "var(--font)", cursor: ai.loading ? "wait" : "pointer",
                border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "rgba(13,148,136,0.08)" : "transparent",
                transition: "all 0.2s ease",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: active ? "var(--accent-light)" : "var(--text-primary)" }}>{btn.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{btn.sub}</p>
              </button>
            );
          })}
        </div>
        {ai.loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20, background: "rgba(13,148,136,0.05)", borderRadius: 10, marginTop: 14, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block", marginRight: 8 }}>⟳</motion.span>
            AI sedang menyiapkan jawaban...
          </motion.div>
        )}
        {!ai.loading && ai.result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: 18, background: "rgba(13,148,136,0.05)", borderRadius: 10, borderLeft: "3px solid var(--accent)", marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{aiLabels[ai.mode!] || "AI"}</span>
              <button onClick={() => setAi(p => ({ ...p, result: "" }))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <MarkdownRenderer content={ai.result} />
          </motion.div>
        )}
      </GlassCard>

      {/* Notes */}
      <GlassCard style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>📝 Catatan Pribadi</p>
        <textarea className="input-glass" key={app.id} defaultValue={app.notes || ""} onBlur={e => onUpdate(app.id, { notes: e.target.value })} rows={3} placeholder="Kontak recruiter, link job post, hal yang perlu diingat..." />
      </GlassCard>

      {/* Delete */}
      <button onClick={() => { if (confirm("Hapus lamaran ini?")) onDelete(app.id); }}
        style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#EF4444", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "var(--font)" }}>
        🗑️ Hapus Lamaran Ini
      </button>
    </motion.div>
  );
}
