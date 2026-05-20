"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { ConversationResult } from "@/app/api/conversation/route";

interface ConversationCardProps {
  result: ConversationResult;
  isPremium: boolean;
  onUnlock: () => void;
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function SpeakerBtn({ text }: { text: string }) {
  return (
    <button
      onClick={() => speak(text)}
      className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 active:scale-90 transition-all flex-shrink-0"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );
}

export default function ConversationCard({ result, isPremium, onUnlock }: ConversationCardProps) {
  const [tab, setTab] = useState<"story" | "smalltalk">("story");
  const [showChinese, setShowChinese] = useState(false);

  const handleUnlock = () => {
    track("conversation_unlock_clicked", { tab });
    onUnlock();
  };

  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
      >
        <div>
          <p className="text-white font-bold text-base">Conversation Practice</p>
          <p className="text-blue-200 text-xs mt-0.5">Ready-to-use English for daily life</p>
        </div>
        <button
          onClick={() => setShowChinese((v) => !v)}
          className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full transition-colors"
        >
          {showChinese ? "Hide 中文" : "Show 中文"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {(["story", "smalltalk"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={
              tab === t
                ? { color: "#6366f1", borderBottom: "2px solid #6366f1" }
                : { color: "#94a3b8" }
            }
          >
            {t === "story" ? "📖 My Story" : "💬 Small Talk"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`px-5 py-4 relative ${!isPremium ? "select-none" : ""}`}>
        {tab === "story" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <p className="text-slate-700 text-sm leading-relaxed flex-1">
                {result.story.english}
              </p>
              <SpeakerBtn text={result.story.english} />
            </div>
            {showChinese && (
              <p className="text-slate-400 text-sm leading-relaxed">{result.story.chinese}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {result.smalltalk.map((line, i) => (
              <div key={i} className={`flex gap-2 ${line.speaker === "Me" ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                  style={{
                    background: line.speaker === "Me"
                      ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                      : "#e2e8f0",
                    color: line.speaker === "Me" ? "#fff" : "#64748b",
                  }}
                >
                  {line.speaker === "Me" ? "Me" : "F"}
                </div>
                <div className={`flex-1 ${line.speaker === "Me" ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  <div
                    className="px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[85%]"
                    style={
                      line.speaker === "Me"
                        ? { background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff" }
                        : { background: "#f1f5f9", color: "#334155" }
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="flex-1">{line.english}</span>
                      <SpeakerBtn text={line.english} />
                    </div>
                  </div>
                  {showChinese && (
                    <p className="text-xs text-slate-400 px-1">{line.chinese}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blur overlay for free users */}
        {!isPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-b-3xl"
            style={{ backdropFilter: "blur(6px)", background: "rgba(248,250,252,0.7)" }}
          >
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-slate-700 font-semibold text-sm mb-1">Premium feature</p>
            <p className="text-slate-400 text-xs mb-3 text-center px-4">
              Unlock to practice real conversations
            </p>
            <button
              onClick={handleUnlock}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
              }}
            >
              Unlock Unlimited
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
