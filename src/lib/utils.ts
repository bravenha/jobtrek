"use client";

import { AIMode } from "@/lib/types";

export async function callAI(mode: AIMode, payload: Record<string, string>): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data.result;
}

export function formatDate(d: string): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function daysAgo(d: string): string {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "hari ini";
  if (days === 1) return "kemarin";
  return `${days} hari lalu`;
}

export function daysCount(d: string): number {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

const AVATAR_COLORS = ["#0D9488","#3B82F6","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899","#10B981"];

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}
