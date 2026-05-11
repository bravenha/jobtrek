"use client";
import { motion } from "framer-motion";
import { StatusId, STATUS_MAP } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/markdown";
import React from "react";

/* ─── Card ─────────────────────────────────────── */
export function Card({ children, hover, onClick, style }: {
  children: React.ReactNode; hover?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`card ${hover ? "card-hover" : ""}`}
      onClick={onClick}
      style={{ padding: 20, cursor: onClick ? "pointer" : "default", ...style }}
      whileHover={onClick ? { y: -2, transition: { duration: 0.2 } } : undefined}
    >
      {children}
    </motion.div>
  );
}

/* ─── Status Badge ─────────────────────────────── */
export function StatusBadge({ status, size }: { status: StatusId; size?: "sm" | "md" }) {
  const s = STATUS_MAP[status] || STATUS_MAP.applied;
  const small = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "2px 8px" : "4px 12px",
      borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600,
      color: s.color, background: `rgba(${s.glow},0.1)`,
      border: `1px solid rgba(${s.glow},0.2)`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

/* ─── Avatar ───────────────────────────────────── */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const c = getAvatarColor(name);
  const initials = getInitials(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.12)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.36, color: c, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ─── Score Gauge (circular) ───────────────────── */
export function ScoreGauge({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const color = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";
  const labelText = score >= 70 ? "Great" : score >= 40 ? "Fair" : "Critical";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 10px" }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.32, fontWeight: 800, color }}>{score}</span>
        </div>
      </div>
      <span style={{
        display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        color, background: `${color}15`,
      }}>{labelText}</span>
      {label && <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{label}</p>}
    </div>
  );
}

/* ─── Section Header ───────────────────────────── */
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{title}</h2>
      {subtitle && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────── */
export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${70 + Math.random() * 30}%`, borderRadius: 6 }} />
      ))}
    </div>
  );
}

/* ─── AI Response Panel ────────────────────────── */
export function AIResponsePanel({ loading, result, label, onClose }: {
  loading: boolean; result: string; label: string; onClose: () => void;
}) {
  if (!loading && !result) return null;

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: 24, background: "#F0FDF9", borderRadius: 12, border: "1px solid rgba(0,186,157,0.15)", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent-dark)", fontSize: 13 }}>
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block" }}>⟳</motion.span>
          AI sedang menyiapkan jawaban...
        </div>
        <LoadingSkeleton lines={5} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 20, background: "#F0FDF9", borderRadius: 12, border: "1px solid rgba(0,186,157,0.15)", borderLeft: "3px solid var(--accent)", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>✕</button>
      </div>
      <MarkdownRenderer content={result} />
    </motion.div>
  );
}

/* ─── Empty State ──────────────────────────────── */
export function EmptyState({ icon, title, desc, action, onAction }: {
  icon: string; title: string; desc: string; action?: string; onAction?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ textAlign: "center", padding: "48px 24px", border: "1.5px dashed rgba(0,186,157,0.3)", borderRadius: 16, background: "#F0FDF9" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: action ? 24 : 0, maxWidth: 400, margin: "0 auto 24px" }}>{desc}</p>
      {action && onAction && <button className="btn-primary" onClick={onAction}>{action}</button>}
    </motion.div>
  );
}

/* ─── SVG Icons ────────────────────────────────── */
export const Icons = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  pipeline: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  ats: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  coach: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  outreach: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  support: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  archive: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// Re-export old names for compatibility
export const GlassCard = Card;
