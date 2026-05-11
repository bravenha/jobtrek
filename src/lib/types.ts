// ─── Job Application Types ───────────────────────────────────────────────────

export type StatusId =
  | "wishlist"
  | "applied"
  | "hr_screen"
  | "test"
  | "interview"
  | "offered"
  | "accepted"
  | "rejected"
  | "ghosted";

export interface StatusMeta {
  label: string;
  color: string;
  glow: string;
}

export const STATUS_MAP: Record<StatusId, StatusMeta> = {
  wishlist:  { label: "Wishlist",   color: "#94A3B8", glow: "94,163,184" },
  applied:   { label: "Melamar",    color: "#3B82F6", glow: "59,130,246" },
  hr_screen: { label: "HR Screen",  color: "#8B5CF6", glow: "139,92,246" },
  test:      { label: "Tes",        color: "#F59E0B", glow: "245,158,11" },
  interview: { label: "Interview",  color: "#06B6D4", glow: "6,182,212" },
  offered:   { label: "Ditawari",   color: "#10B981", glow: "16,185,129" },
  accepted:  { label: "Diterima!",  color: "#059669", glow: "5,150,105" },
  rejected:  { label: "Ditolak",    color: "#EF4444", glow: "239,68,68" },
  ghosted:   { label: "Ghosted",    color: "#64748B", glow: "100,116,139" },
};

export const STATUS_IDS: StatusId[] = [
  "wishlist","applied","hr_screen","test","interview","offered","accepted","rejected","ghosted"
];

export const ACTIVE_STATUSES: StatusId[] = [
  "wishlist","applied","hr_screen","test","interview","offered"
];

export const SOURCES = [
  "Jobstreet","Glints","Kalibrr","LinkedIn","Indeed",
  "Loker.id","JobsDB","Website Perusahaan","Referral","Lainnya"
];

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  source: string;
  appliedDate: string;
  jobDesc: string;
  notes: string;
  status: StatusId;
  createdAt: string;
}

// ─── CV Optimizer Types ──────────────────────────────────────────────────────

export interface CVAnalysisResult {
  score: number;
  missingKeywords: string[];
  feedback: string;
}

// ─── Interview Coach Types ───────────────────────────────────────────────────

export interface InterviewMessage {
  role: "ai" | "user";
  content: string;
  score?: number;
}

export type InterviewPhase = "setup" | "interview" | "evaluation" | "report";

// ─── Cold Email Types ────────────────────────────────────────────────────────

export type EmailTone = "formal" | "semiformal";
export type EmailType = "cold_email" | "linkedin" | "followup";

// ─── AI Request Types ────────────────────────────────────────────────────────

export type AIMode =
  | "cv_optimize"
  | "interview_start"
  | "interview_evaluate"
  | "interview_report"
  | "cold_email"
  | "job_interview_prep"
  | "job_cv_tips"
  | "job_followup";

export interface AIRequest {
  mode: AIMode;
  payload: Record<string, string>;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type ViewId = "home" | "pipeline" | "ats" | "coach" | "outreach";
