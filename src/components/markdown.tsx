"use client";
import { marked } from "marked";
import React, { useMemo } from "react";

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return marked.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`ai-content ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-primary)" }}
    />
  );
}
