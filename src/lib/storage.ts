import { JobApplication } from "./types";

const STORAGE_KEY = "jobtrek-v2";
const LEGACY_KEY = "jobtrek-v1";

export function loadApplications(): JobApplication[] {
  if (typeof window === "undefined") return [];
  try {
    // Try new key first
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Migrate from legacy (the old jobtrek.jsx used window.storage)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const data = JSON.parse(legacy);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.error("Failed to load applications:", e);
  }
  return [];
}

export function saveApplications(apps: JobApplication[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return true;
  } catch (e) {
    console.error("Failed to save applications:", e);
    return false;
  }
}

export function createEmptyApplication(): Omit<JobApplication, "id" | "createdAt"> {
  return {
    company: "",
    role: "",
    source: "Jobstreet",
    appliedDate: new Date().toISOString().slice(0, 10),
    jobDesc: "",
    notes: "",
    status: "applied",
  };
}
