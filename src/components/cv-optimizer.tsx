"use client";
import { motion } from "framer-motion";
import { GlassCard, SectionHeader, LoadingSkeleton } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown";
import React, { useState, useRef } from "react";
import { callAI } from "@/lib/utils";

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => (item.str || ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

export function CVOptimizer() {
  const [cv, setCv] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setFileName(file.name);

    try {
      if (file.name.endsWith(".pdf")) {
        const text = await extractTextFromPDF(file);
        setCv(text);
      } else {
        // .txt, .doc (plain text)
        const text = await file.text();
        setCv(text);
      }
    } catch (err) {
      console.error("File read error:", err);
      setCv("");
      setFileName("");
      alert("Gagal membaca file. Pastikan file PDF atau TXT yang valid.");
    }
    setFileLoading(false);
    // Reset the input so the same file can be re-uploaded
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = async () => {
    if (!cv.trim() || !jobDesc.trim()) return;
    setLoading(true); setResult(""); setScore(null);
    try {
      const text = await callAI("cv_optimize", { cv, jobDesc });
      setResult(text);
      const m = text.match(/(\d{1,3})/);
      if (m) setScore(Math.min(100, parseInt(m[1])));
    } catch { setResult("Terjadi kesalahan. Coba lagi."); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader icon="📄" title="CV Optimizer" subtitle="Bandingkan CV kamu dengan job description. Dapatkan skor ATS dan saran perbaikan." />

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 14 }}>
        {/* Input Panel */}
        <div>
          <GlassCard style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label className="label-text" style={{ margin: 0 }}>📋 Teks CV Kamu</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {fileName && (
                  <span style={{ fontSize: 11, color: "var(--accent-light)", background: "rgba(13,148,136,0.1)", padding: "3px 10px", borderRadius: 12 }}>
                    📎 {fileName}
                  </span>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.txt,.text" onChange={handleFile} style={{ display: "none" }} id="cv-upload" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={fileLoading}
                  className="btn-accent-outline"
                  style={{ fontSize: 11, padding: "5px 12px" }}
                >
                  {fileLoading ? "⟳ Membaca..." : "📂 Upload CV"}
                </button>
              </div>
            </div>
            <textarea className="input-glass" value={cv} onChange={e => setCv(e.target.value)} rows={8}
              placeholder="Paste seluruh isi CV kamu di sini, atau klik 'Upload CV' untuk upload file PDF/TXT..." />
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
              Mendukung file PDF dan TXT. Teks akan diekstrak secara otomatis.
            </p>
          </GlassCard>

          <GlassCard style={{ marginBottom: 14 }}>
            <label className="label-text">💼 Deskripsi Pekerjaan (Job Description)</label>
            <textarea className="input-glass" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={6}
              placeholder="Paste job description dari lowongan yang kamu incar..." />
          </GlassCard>

          <button className="btn-primary" onClick={analyze} disabled={loading || !cv.trim() || !jobDesc.trim()}
            style={{ width: "100%", padding: 14, fontSize: 15 }}>
            {loading ? "⟳ Menganalisis..." : "🔍 Analisis CV vs Job Description"}
          </button>
        </div>

        {/* Result Panel */}
        {(result || loading) && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Score Circle */}
            {score !== null && (
              <GlassCard style={{ marginBottom: 14, textAlign: "center", padding: 28 }}>
                <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 14px" }}>
                  <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle cx="60" cy="60" r="52" fill="none"
                      stroke={score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - score / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      style={{ filter: `drop-shadow(0 0 8px ${score >= 70 ? "rgba(16,185,129,0.4)" : score >= 40 ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)"})` }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444" }}>{score}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>/ 100</span>
                  </div>
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Skor Kecocokan ATS</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {score >= 70 ? "CV kamu sudah cukup baik! 🎉" : score >= 40 ? "Masih perlu perbaikan ⚠️" : "Perlu banyak penyesuaian ❌"}
                </p>
              </GlassCard>
            )}

            {/* AI Analysis */}
            <GlassCard>
              {loading ? <LoadingSkeleton lines={8} /> : (
                <MarkdownRenderer content={result} />
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
