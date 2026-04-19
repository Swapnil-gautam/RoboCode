const STORAGE_KEY = "robocode-progress";
const CODE_KEY = "robocode-code";

export interface ProgressData {
  solvedSlugs: string[];
}

export function getProgress(): ProgressData {
  if (typeof window === "undefined") return { solvedSlugs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { solvedSlugs: [] };
    return JSON.parse(raw);
  } catch {
    return { solvedSlugs: [] };
  }
}

export function markSolved(slug: string) {
  const progress = getProgress();
  if (!progress.solvedSlugs.includes(slug)) {
    progress.solvedSlugs.push(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

export function isSolved(slug: string): boolean {
  return getProgress().solvedSlugs.includes(slug);
}

export function getSavedCode(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CODE_KEY);
    if (!raw) return null;
    const codes = JSON.parse(raw);
    return codes[slug] || null;
  } catch {
    return null;
  }
}

export function saveCode(slug: string, code: string) {
  try {
    const raw = localStorage.getItem(CODE_KEY);
    const codes = raw ? JSON.parse(raw) : {};
    codes[slug] = code;
    localStorage.setItem(CODE_KEY, JSON.stringify(codes));
  } catch {
    // ignore storage errors
  }
}
