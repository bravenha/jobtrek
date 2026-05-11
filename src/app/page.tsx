"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewId, JobApplication } from "@/lib/types";
import { loadApplications, saveApplications } from "@/lib/storage";
import { Dashboard, AddModal, AppList, AppDetail } from "@/components/tracker";
import { CVOptimizer } from "@/components/cv-optimizer";
import { InterviewCoach } from "@/components/interview-coach";
import { ColdEmailGenerator } from "@/components/cold-email";
import { Icons } from "@/components/ui";

const NAV_ITEMS: { id: ViewId; icon: keyof typeof Icons; label: string }[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "pipeline", icon: "pipeline", label: "Pipeline" },
  { id: "ats", icon: "ats", label: "ATS" },
  { id: "coach", icon: "coach", label: "Coach" },
  { id: "outreach", icon: "outreach", label: "Outreach" },
];

const TOP_TABS: { id: ViewId; label: string }[] = [
  { id: "home", label: "Dashboard" },
  { id: "pipeline", label: "Tracker" },
  { id: "ats", label: "Optimizer" },
  { id: "coach", label: "Coach" },
  { id: "outreach", label: "Generator" },
];

export default function Home() {
  const [view, setView] = useState<ViewId>("home");
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setApps(loadApplications()); setMounted(true); }, []);

  const persist = useCallback((next: JobApplication[]) => {
    setApps(next);
    saveApplications(next);
  }, []);

  const addApp = (data: Omit<JobApplication, "id" | "createdAt">) => {
    const newApp: JobApplication = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
    persist([newApp, ...apps]);
    setShowAdd(false);
    setView("pipeline");
  };

  const updateApp = (id: number, patch: Partial<JobApplication>) => {
    const next = apps.map(a => a.id === id ? { ...a, ...patch } : a);
    persist(next);
    if (selectedApp?.id === id) setSelectedApp(p => p ? { ...p, ...patch } : p);
  };

  const deleteApp = (id: number) => {
    persist(apps.filter(a => a.id !== id));
    setSelectedApp(null);
    setShowDetail(false);
  };

  const goDetail = (app: JobApplication) => {
    setSelectedApp(app);
    setShowDetail(true);
  };

  const switchView = (id: ViewId) => {
    setView(id);
    setShowDetail(false);
    setSelectedApp(null);
  };

  if (!mounted) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Desktop Sidebar ──────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 17,
          }}>J</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", display: "block", lineHeight: 1.2 }}>JobTrek</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Career Intelligence</span>
          </div>
        </div>

        <div style={{ padding: "4px 12px 12px" }}>
          <button className="btn-primary" onClick={() => setShowAdd(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", borderRadius: 8, fontSize: 13 }}>
            {Icons.plus} New Application
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const active = view === item.id && !showDetail;
            return (
              <button key={item.id} onClick={() => switchView(item.id)}
                className={`nav-item ${active ? "active" : ""}`}>
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{Icons[item.icon]}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "8px 12px 16px", borderTop: "1px solid var(--border)" }}>
          <button className="nav-item" style={{ fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center" }}>{Icons.support}</span> Support
          </button>
          <button className="nav-item" style={{ fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center" }}>{Icons.archive}</span> Archive
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 4px", marginTop: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "#E5E7EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "var(--text-secondary)",
            }}>BH</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Braven Handoko</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: 0 }}>
        {/* Mobile Top Bar */}
        <header className="mobile-top-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 14,
            }}>J</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>JobTrek</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowAdd(true)} style={{
              width: 36, height: 36, borderRadius: "50%", background: "var(--accent)",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}>
              {Icons.plus}
            </button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 6 }}>
              {Icons.bell}
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 12,
            }}>BH</div>
          </div>
        </header>

        {/* Desktop Top Nav */}
        <header className="top-nav">
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 24 }}>
            {TOP_TABS.map(tab => (
              <button key={tab.id} onClick={() => switchView(tab.id)}
                className={`top-nav-tab ${view === tab.id && !showDetail ? "active" : ""}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid var(--border)",
              background: "transparent", fontSize: 12, fontWeight: 600,
              color: "var(--text-primary)", cursor: "pointer", fontFamily: "var(--font)",
            }}>Upgrade Pro</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 6 }}>{Icons.bell}</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 6 }}>{Icons.settings}</button>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>BH</div>
          </div>
        </header>

        {/* Content */}
        <main className="main-content" style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={showDetail ? "detail" : view}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}>
              {showDetail && selectedApp ? (
                <AppDetail app={selectedApp} onBack={() => { setShowDetail(false); setSelectedApp(null); }} onUpdate={updateApp} onDelete={deleteApp} />
              ) : view === "home" ? (
                <Dashboard apps={apps} onAddClick={() => setShowAdd(true)} onAppClick={goDetail} onViewAll={() => setView("pipeline")} />
              ) : view === "pipeline" ? (
                <AppList apps={apps} onAppClick={goDetail} filter={filter} setFilter={setFilter} />
              ) : view === "ats" ? (
                <CVOptimizer />
              ) : view === "coach" ? (
                <InterviewCoach />
              ) : view === "outreach" ? (
                <ColdEmailGenerator />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────── */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = view === item.id && !showDetail;
          return (
            <button key={item.id} onClick={() => switchView(item.id)}
              className={active ? "active" : ""}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons[item.icon]}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={addApp} />}
      </AnimatePresence>
    </div>
  );
}
