const KEY = "photo-english-stats";

export interface Stats {
  wordsSaved: number;
  photosAnalyzed: number;
  reviewSessions: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

const DEFAULT: Stats = {
  wordsSaved: 0,
  photosAnalyzed: 0,
  reviewSessions: 0,
  streakDays: 0,
  lastActiveDate: "",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function loadStats(): Stats {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT };
  }
}

function save(stats: Stats) {
  localStorage.setItem(KEY, JSON.stringify(stats));
}

function touchStreak(stats: Stats): Stats {
  const t = today();
  if (stats.lastActiveDate === t) return stats; // already active today
  const streak =
    stats.lastActiveDate === yesterday() ? stats.streakDays + 1 : 1;
  return { ...stats, streakDays: streak, lastActiveDate: t };
}

export function recordPhotoAnalyzed() {
  const s = touchStreak(loadStats());
  save({ ...s, photosAnalyzed: s.photosAnalyzed + 1 });
}

export function recordWordsSaved(count: number) {
  const s = touchStreak(loadStats());
  save({ ...s, wordsSaved: s.wordsSaved + count });
}

export function recordReviewSession() {
  const s = touchStreak(loadStats());
  save({ ...s, reviewSessions: s.reviewSessions + 1 });
}
