"use client";

import { useState, useCallback } from "react";
import { WordItem } from "@/app/api/analyze/route";
import { recordReviewSession } from "@/lib/stats";

interface ReviewModeProps {
  words: WordItem[];
  onClose: () => void;
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewMode({ words, onClose }: ReviewModeProps) {
  const [deck] = useState(() => shuffle(words));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [done, setDone] = useState(false);

  const current = deck[index];

  const advance = useCallback(
    (didKnow: boolean) => {
      if (didKnow) setKnown((k) => k + 1);
      else setUnknown((u) => u + 1);

      if (index + 1 >= deck.length) {
        recordReviewSession();
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [index, deck.length]
  );

  const restart = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
    setDone(false);
  }, []);

  if (done) {
    const total = known + unknown;
    const pct = Math.round((known / total) * 100);
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
        <Header onClose={onClose} title="Review complete" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            {pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{pct}%</p>
            <p className="text-slate-400 mt-1">
              {known} known · {unknown} to review
            </p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
              }}
            />
          </div>
          <p className="text-slate-500 text-sm text-center leading-relaxed">
            {pct >= 80
              ? "Excellent! You know most of these words."
              : pct >= 50
              ? "Good progress! Keep reviewing the ones you missed."
              : "Keep going — review often and you'll get there!"}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={restart}
              className="flex-1 py-3.5 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 8px 25px rgba(99,102,241,0.3)" }}
            >
              Review again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-semibold bg-slate-100 text-slate-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      <Header onClose={onClose} title={`${index + 1} / ${deck.length}`} />

      {/* Progress bar */}
      <div className="h-1 bg-slate-200 mx-5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((index) / deck.length) * 100}%`,
            background: "linear-gradient(90deg, #3b82f6, #6366f1)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
        {/* Card */}
        <div
          className="w-full max-w-sm cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => {
            if (!flipped) {
              setFlipped(true);
              speak(current.word);
            }
          }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: 240,
            }}
          >
            {/* Front — Chinese */}
            <div
              className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center px-6 gap-3 bg-white shadow-lg border border-slate-100"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">What's this in English?</p>
              <p className="text-4xl font-bold text-slate-800 text-center">{current.translation}</p>
              <p className="text-sm text-slate-400 mt-2">Tap to reveal</p>
            </div>

            {/* Back — English */}
            <div
              className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center px-6 gap-2 shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              }}
            >
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold text-white">{current.word}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(current.word); }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-200 text-sm">{current.pronunciation}</p>
              <p className="text-white/80 text-sm text-center leading-relaxed mt-1 px-2">
                {current.example}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons — only shown after flip */}
        <div
          className="flex gap-3 w-full max-w-sm transition-all duration-300"
          style={{ opacity: flipped ? 1 : 0, pointerEvents: flipped ? "auto" : "none" }}
        >
          <button
            onClick={() => advance(false)}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-white border-2 border-red-100 text-red-400 hover:bg-red-50 active:scale-95 transition-all shadow-sm"
          >
            Still learning
          </button>
          <button
            onClick={() => advance(true)}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 6px 20px rgba(34,197,94,0.3)" }}
          >
            Got it ✓
          </button>
        </div>

        {!flipped && (
          <p className="text-slate-400 text-sm">Tap the card to reveal the answer</p>
        )}
      </div>
    </div>
  );
}

function Header({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <button
        onClick={onClose}
        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <div className="w-9" />
    </div>
  );
}
