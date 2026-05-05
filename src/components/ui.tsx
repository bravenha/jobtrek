"use client";
import { motion } from "framer-motion";
import { StatusId, STATUS_MAP } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/markdown";
import React from "react";

/* ─── Glass Card ─────────────────────────────────── */
export function GlassCard({ children, className, hover, onClick, style }: {
  children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={hover ? "glass-card" : "glass-card-static"}
      onClick={onClick}
      style={{ padding: "20px", cursor: onClick ? "pointer" : "default", ...style }}
      whileHover={onClick ? { y: -2, transition: { duration: 0.2 } } : undefined}
      layout
    >
      {children}
    </motion.div>
  );
}

/* ─── Status Badge ───────────────────────────────── */
export function StatusBadge({ status, size }: { status: StatusId; size?: "sm" | "md" }) {
  const s = STATUS_MAP[status] || STATUS_MAP.applied;
  const small = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "2px 8px" : "4px 12px",
      borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600,
      color: s.color, background: `rgba(${s.glow},0.12)`,
      border: `1px solid rgba(${s.glow},0.2)`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px rgba(${s.glow},0.5)` }} />
      {s.label}
    </span>
  );
}

/* ─── Avatar ─────────────────────────────────────── */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const c = getAvatarColor(name);
  const initials = getInitials(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.15)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.36, color: c, flexShrink: 0,
      border: `1px solid rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.2)`,
    }}>
      {initials}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────── */
export function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginLeft: 34 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Loading Skeleton ───────────────────────────── */
export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${70 + Math.random() * 30}%`, borderRadius: 6 }} />
      ))}
    </div>
  );
}

/* ─── AI Response Panel ──────────────────────────── */
export function AIResponsePanel({ loading, result, label, onClose }: {
  loading: boolean; result: string; label: string; onClose: () => void;
}) {
  if (!loading && !result) return null;

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: 24, background: "rgba(13,148,136,0.06)", borderRadius: 12, border: "1px solid rgba(13,148,136,0.15)", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent-light)", fontSize: 13 }}>
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block" }}>⟳</motion.span>
          AI sedang menyiapkan jawaban...
        </div>
        <LoadingSkeleton lines={5} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 20, background: "rgba(13,148,136,0.06)", borderRadius: 12, border: "1px solid rgba(13,148,136,0.15)", borderLeft: "3px solid var(--accent)", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>✕</button>
      </div>
      <MarkdownRenderer content={result} />
    </motion.div>
  );
}

/* ─── Empty State ────────────────────────────────── */
export function EmptyState({ icon, title, desc, action, onAction }: {
  icon: string; title: string; desc: string; action?: string; onAction?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ textAlign: "center", padding: "48px 24px", border: "1.5px dashed rgba(13,148,136,0.3)", borderRadius: 16, background: "rgba(13,148,136,0.03)" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: action ? 24 : 0, maxWidth: 400, margin: "0 auto 24px" }}>{desc}</p>
      {action && onAction && <button className="btn-primary" onClick={onAction}>{action}</button>}
    </motion.div>
  );
}
