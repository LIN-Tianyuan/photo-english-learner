"use client";

import { useState } from "react";
import { WordItem } from "@/app/api/analyze/route";
import ReviewMode from "./ReviewMode";

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

interface WordBookProps {
  words: WordItem[];
  onClose: () => void;
  onRemove: (word: string) => void;
}

export default function WordBook({ words, onClose, onRemove }: WordBookProps) {
  const [reviewing, setReviewing] = useState(false);

  if (reviewing) {
    return <ReviewMode words={words} onClose={() => setReviewing(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header */}
      <div
        className="relative px-5 pt-5 pb-5 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">My Word Book</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {words.length === 0 ? "No saved words yet" : `${words.length} word${words.length > 1 ? "s" : ""} collected`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {words.length >= 2 && (
              <button
                onClick={() => setReviewing(true)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold px-3 py-1.5 rounded-full"
              >
                <span>🎯</span>
                <span>Review</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-4xl">
            📖
          </div>
          <p className="text-slate-700 font-semibold text-lg">No words yet</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Upload a photo, tap a word label, and save it here to build your vocabulary.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {words.map((w) => (
            <li
              key={w.word}
              className="bg-white rounded-2xl px-4 py-4 shadow-sm flex items-start gap-4 border border-slate-100"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                {w.word[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-800">{w.word}</span>
                  <span className="text-xs text-slate-400">{w.pronunciation}</span>
                  <button
                    onClick={() => speak(w.word)}
                    className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 active:scale-90 transition-all flex-shrink-0"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm font-medium text-blue-500 mt-0.5">{w.translation}</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{w.example}</p>
                {w.exampleTranslation && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{w.exampleTranslation}</p>
                )}
              </div>
              <button
                onClick={() => onRemove(w.word)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-400 transition-colors text-base flex-shrink-0 mt-0.5"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
