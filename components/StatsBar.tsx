"use client";

import { Stats } from "@/lib/stats";

interface StatsBarProps {
  stats: Stats;
}

const ITEMS = [
  { key: "streakDays",       icon: "🔥", label: "Day streak" },
  { key: "wordsSaved",       icon: "📚", label: "Words saved" },
  { key: "reviewSessions",   icon: "🎯", label: "Reviews done" },
  { key: "photosAnalyzed",   icon: "📷", label: "Photos" },
] as const;

export default function StatsBar({ stats }: StatsBarProps) {
  const hasAny = ITEMS.some(({ key }) => stats[key] > 0);
  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-4 gap-2">
      {ITEMS.map(({ key, icon, label }) => (
        <div
          key={key}
          className="bg-white rounded-2xl py-3 px-1 flex flex-col items-center gap-0.5 shadow-sm border border-slate-100"
        >
          <span className="text-xl">{icon}</span>
          <span className="text-lg font-bold text-slate-800 leading-tight">
            {stats[key]}
          </span>
          <span className="text-[10px] text-slate-400 text-center leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
