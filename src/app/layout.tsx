import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobTrek AI — Career Companion untuk Fresh Graduate Indonesia",
  description: "Track lamaran kerja, optimasi CV dengan AI, simulasi interview, dan buat cold email profesional. Didesain khusus untuk mahasiswa dan fresh graduate Indonesia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
