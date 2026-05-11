"use client";
import { motion } from "framer-motion";
import { Card, SectionHeader, LoadingSkeleton, ScoreGauge } from "@/components/ui";
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
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
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
        const text = await file.text();
        setCv(text);
      }
    } catch (err) {
      console.error("File read error:", err);
      setCv("");
      setFileName("");
      alert("Failed to read file. Make sure it's a valid PDF or TXT.");
    }
    setFileLoading(false);
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
    } catch { setResult("An error occurred. Please try again."); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>ATS Optimization Engine</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Align your resume&apos;s DNA with the target job description to bypass automated filters and reach human eyes.
          </p>
        </div>
        <button className="btn-primary" onClick={analyze} disabled={loading || !cv.trim() || !jobDesc.trim()}
          style={{ borderRadius: 8, padding: "12px 24px", fontSize: 14, flexShrink: 0 }}>
          {loading ? "⟳ Scanning..." : "Scan & Optimize"}
        </button>
      </div>

      <div className={result || loading ? "responsive-grid-sidebar" : ""} style={result || loading ? {} : {}}>
        {/* Left Column - Input */}
        <div>
          {/* Upload/Paste Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
            {(["upload", "paste"] as const).map(mode => (
              <button key={mode} onClick={() => setInputMode(mode)} style={{
                padding: "10px 24px", fontSize: 13, fontWeight: inputMode === mode ? 700 : 500,
                color: inputMode === mode ? "var(--accent-dark)" : "var(--text-muted)",
                background: "transparent", border: "none", borderBottom: `2px solid ${inputMode === mode ? "var(--accent)" : "transparent"}`,
                cursor: "pointer", fontFamily: "var(--font)", textTransform: "capitalize",
              }}>
                {mode === "upload" ? "Upload CV" : "Paste Text"}
              </button>
            ))}
          </div>

          {/* Source Document Card */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Source Document</span>
              {fileName && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent-dark)", background: "#F0FDF9", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
                  📎 {fileName}
                </span>
              )}
            </div>

            {inputMode === "upload" ? (
              <div className="drop-zone" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".pdf,.txt,.text" onChange={handleFile} style={{ display: "none" }} />
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {fileLoading ? "Reading file..." : "Drag & drop your CV here"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF, DOCX, or TXT up to 5MB</p>
              </div>
            ) : (
              <textarea className="input-field" value={cv} onChange={e => setCv(e.target.value)} rows={10}
                placeholder="Paste your entire CV text here..." />
            )}
          </Card>

          {/* Target Job Description */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Target Job Description</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "var(--accent-dark)", background: "#F0FDF9", padding: "3px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Required</span>
            </div>
            <textarea className="input-field" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={6}
              placeholder="Paste the exact job description here to calibrate the engine..." />
          </Card>
        </div>

        {/* Right Column - Results */}
        {(result || loading) && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Score */}
            {score !== null && (
              <Card style={{ marginBottom: 16, padding: 24 }}>
                <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Match Score</p>
                <ScoreGauge score={score} size={140} />
                <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.6 }}>
                  {score >= 70 ? "Strong match! Your CV aligns well." : score >= 40 ? "Moderate match. Some improvements needed." : "High risk of automated rejection. Major keyword gaps detected."}
                </p>
              </Card>
            )}

            {/* Analysis */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83"/></svg>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Optimization Protocol</span>
              </div>
              {loading ? <LoadingSkeleton lines={8} /> : (
                <MarkdownRenderer content={result} />
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
