import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobTrek — Career Intelligence Platform",
  description: "Track job applications, optimize your CV with AI, practice interviews with real-time feedback, and generate professional outreach emails. Your all-in-one career companion.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JobTrek",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
