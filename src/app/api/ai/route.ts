import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Kamu adalah "CareerPath AI", konsultan karier profesional dan pakar rekrutmen (HR Tech).
Tujuan: Membantu mahasiswa dan fresh graduates mendapatkan pekerjaan pertama.
Instruksi: Gunakan standar ATS untuk CV, metode STAR untuk interview, identifikasi skill gap.
Gaya: Profesional, suportif, praktis. Berikan actionable items. Output Markdown rapi. Bahasa Indonesia.`;

function buildPrompt(mode: string, p: Record<string, string>): string {
  switch (mode) {
    case "cv_optimize":
      return `Analisis CV vs Job Desc.\n\n=== CV ===\n${p.cv}\n\n=== JOB DESC ===\n${p.jobDesc}\n\nBerikan:\n## 📊 Skor ATS\nAngka persentase di baris pertama (misal: 72)\n## 🔑 Kata Kunci Hilang\n## ✅ Kata Kunci Cocok\n## 📝 Analisis Per Bagian (Summary, Pengalaman, Skills, Pendidikan)\n## 🎯 3-5 Actionable Items\n## ✍️ Contoh Summary Optimal\nBahasa Indonesia.`;
    case "interview_start":
      return `Peran: HRD di ${p.company||"perusahaan"}.\nPosisi: ${p.position}\n${p.jobDesc?`Job desc: ${p.jobDesc}`:""}\nBuat 1 pertanyaan interview nomor ${p.questionNumber||"1"} dari 5.\n${parseInt(p.questionNumber||"1")<=3?"Pertanyaan TEKNIS.":"Pertanyaan BEHAVIORAL."}\nFormat:\n**[Tipe]**\n[Pertanyaan]\nHanya pertanyaan, tanpa jawaban.`;
    case "interview_evaluate":
      return `Evaluasi jawaban interview.\nPertanyaan: ${p.question}\nJawaban: ${p.answer}\nPosisi: ${p.position}\nBerikan:\n## 📊 Skor: [1-10]/10\n## ✅ Kelebihan\n## ⚠️ Perlu Diperbaiki\n## 💡 Contoh Jawaban Ideal (STAR)\nMaks 200 kata. Bahasa Indonesia.`;
    case "interview_report":
      return `Buat laporan akhir interview.\nPosisi: ${p.position}, Perusahaan: ${p.company}\nData: ${p.evaluations}\nBerikan:\n## 📋 Ringkasan\n## 📊 Skor Rata-rata\n## 💪 Area Kuat (3)\n## 🎯 Perlu Ditingkatkan (3)\n## 📚 Rekomendasi\nBahasa Indonesia.`;
    case "cold_email":
      return `Buat ${p.type==="linkedin"?"pesan LinkedIn":p.type==="followup"?"email follow-up":"cold email"}.\nHRD: ${p.hrdName||"(tidak diketahui)"}\nPerusahaan: ${p.company}\nPosisi: ${p.position}\nKonteks: ${p.context||"Fresh graduate tertarik posisi ini"}\nNada: ${p.tone==="semiformal"?"Semi-formal":"Formal"}\n${p.type==="followup"?`Sudah melamar ${p.daysSince||"7"} hari lalu.`:""}\nFormat: ${p.type!=="linkedin"?"**Subject:** [subject]\n\n":""} [Isi pesan]\nBahasa Indonesia. Personal, persuasif.`;
    case "job_interview_prep":
      return `Career coach untuk fresh grad.\nPerusahaan: ${p.company}\nPosisi: ${p.role}\n${p.jobDesc?`Job Desc: ${p.jobDesc}`:""}\nBerikan:\n1. 5 PERTANYAAN + tips jawaban\n2. 2 PERTANYAAN UNTUK INTERVIEWER\n3. TIPS TERPENTING\nBahasa Indonesia.`;
    case "job_cv_tips":
      return `CV consultant untuk fresh grad.\nPerusahaan: ${p.company}\nPosisi: ${p.role}\n${p.jobDesc?`Job Desc: ${p.jobDesc}`:""}\nBerikan:\n1. KEYWORD PENTING\n2. SKILL yang ditonjolkan\n3. CARA MENULIS SUMMARY\n4. KESALAHAN UMUM\nBahasa Indonesia.`;
    case "job_followup":
      return `Email follow-up sopan.\nPerusahaan: ${p.company}\nPosisi: ${p.role}\nSudah melamar: ${p.daysSince||"7"} hari lalu\nFormat:\nSubject: [subject]\n[isi email]\nMaks 120 kata. Bahasa Indonesia.`;
    default:
      return p.message || "Saran karier untuk fresh graduate Indonesia.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mode, payload } = await request.json();
    if (!mode || !payload) return NextResponse.json({ error: "Missing mode/payload" }, { status: 400 });

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(mode, payload) },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return NextResponse.json({ result: completion.choices[0]?.message?.content || "Tidak ada respons." });
  } catch (error: unknown) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Gagal mendapat respons AI.", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
