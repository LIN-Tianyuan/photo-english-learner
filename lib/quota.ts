const KEY = "photo-english-quota";
const FREE_LIMIT = 3;

interface QuotaData {
  date: string;
  count: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getQuota(): { used: number; limit: number; exceeded: boolean } {
  if (typeof window === "undefined") return { used: 0, limit: FREE_LIMIT, exceeded: false };
  try {
    const raw = localStorage.getItem(KEY);
    const data: QuotaData = raw ? JSON.parse(raw) : { date: "", count: 0 };
    const used = data.date === today() ? data.count : 0;
    return { used, limit: FREE_LIMIT, exceeded: used >= FREE_LIMIT };
  } catch {
    return { used: 0, limit: FREE_LIMIT, exceeded: false };
  }
}

export function incrementQuota() {
  if (typeof window === "undefined") return;
  const t = today();
  try {
    const raw = localStorage.getItem(KEY);
    const data: QuotaData = raw ? JSON.parse(raw) : { date: t, count: 0 };
    const count = (data.date === t ? data.count : 0) + 1;
    localStorage.setItem(KEY, JSON.stringify({ date: t, count }));
  } catch {}
}
