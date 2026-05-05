"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewId, JobApplication } from "@/lib/types";
import { loadApplications, saveApplications } from "@/lib/storage";
import { Dashboard, AddModal, AppList, AppDetail } from "@/components/tracker";
import { CVOptimizer } from "@/components/cv-optimizer";
import { InterviewCoach } from "@/components/interview-coach";
import { ColdEmailGenerator } from "@/components/cold-email";

const NAV_ITEMS: { id: ViewId; icon: string; label: string }[] = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "tracker", icon: "📋", label: "Lamaran" },
  { id: "cv", icon: "📄", label: "CV Optimizer" },
  { id: "interview", icon: "🎙️", label: "Interview" },
  { id: "email", icon: "✉️", label: "Cold Email" },
];

export default function Home() {
  const [view, setView] = useState<ViewId>("dashboard");
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
    setView("tracker");
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

  if (!mounted) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, borderRight: "1px solid var(--border)",
        background: "rgba(6,11,24,0.8)", backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--gradient-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 16,
              boxShadow: "var(--shadow-glow)",
            }}>J</div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>JobTrek</span>
              <span style={{
                display: "block", fontSize: 10, fontWeight: 600, color: "var(--accent-light)",
                letterSpacing: "0.05em",
              }}>AI Career Companion</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = view === item.id && !showDetail;
            return (
              <button key={item.id} onClick={() => { setView(item.id); setShowDetail(false); setSelectedApp(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? "var(--accent-light)" : "var(--text-secondary)",
                  background: active ? "rgba(13,148,136,0.1)" : "transparent",
                  border: "none", cursor: "pointer", fontFamily: "var(--font)",
                  textAlign: "left", marginBottom: 4, transition: "all 0.2s ease",
                  position: "relative",
                }}>
                {active && (
                  <motion.div layoutId="nav-indicator" style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20, background: "var(--accent)", borderRadius: "0 3px 3px 0",
                  }} />
                )}
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
                {item.id === "tracker" && apps.length > 0 && (
                  <span style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 600,
                    background: "rgba(13,148,136,0.15)", color: "var(--accent-light)",
                    padding: "2px 8px", borderRadius: 10,
                  }}>{apps.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Add Button */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
          <button className="btn-primary" onClick={() => setShowAdd(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12 }}>
            <span style={{ fontSize: 16 }}>+</span> Tambah Lamaran
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "24px 28px", minHeight: "100vh", overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div key={showDetail ? "detail" : view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {showDetail && selectedApp ? (
              <AppDetail app={selectedApp} onBack={() => { setShowDetail(false); setSelectedApp(null); }} onUpdate={updateApp} onDelete={deleteApp} />
            ) : view === "dashboard" ? (
              <Dashboard apps={apps} onAddClick={() => setShowAdd(true)} onAppClick={goDetail} onViewAll={() => setView("tracker")} />
            ) : view === "tracker" ? (
              <AppList apps={apps} onAppClick={goDetail} filter={filter} setFilter={setFilter} />
            ) : view === "cv" ? (
              <CVOptimizer />
            ) : view === "interview" ? (
              <InterviewCoach />
            ) : view === "email" ? (
              <ColdEmailGenerator />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={addApp} />}
      </AnimatePresence>
    </div>
  );
}
