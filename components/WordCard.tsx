"use client";

import { useState, useCallback } from "react";
import { WordItem } from "@/app/api/analyze/route";

interface WordCardProps {
  word: WordItem;
  onClose: () => void;
  onSave: (word: WordItem) => void;
  isSaved: boolean;
}

function speak(text: string, onStart: () => void, onEnd: () => void) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  utter.onstart = onStart;
  utter.onend = onEnd;
  utter.onerror = onEnd;
  window.speechSynthesis.speak(utter);
}

export default function WordCard({ word, onClose, onSave, isSaved }: WordCardProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    speak(
      word.word,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );
  }, [word.word]);

  const handleSpeakExample = useCallback(() => {
    speak(
      word.example,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );
  }, [word.example]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card header */}
        <div
          className="px-6 py-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/10" />

          {/* Pronunciation row */}
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <p className="text-blue-200 text-sm font-medium tracking-wide">
              {word.pronunciation}
            </p>
            <button
              onClick={handleSpeak}
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-all"
              title="Play pronunciation"
            >
              {speaking ? (
                <span className="text-white text-xs animate-pulse">♪</span>
              ) : (
                <SpeakerIcon />
              )}
            </button>
          </div>

          <h2 className="text-white text-4xl font-bold relative z-10 leading-tight">
            {word.word}
          </h2>
          <p className="text-blue-100 text-lg mt-1.5 relative z-10 font-medium">
            {word.translation}
          </p>
        </div>

        {/* Card body */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Example sentence
            </p>
            <button
              onClick={handleSpeakExample}
              className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all"
              title="Play example"
            >
              <SpeakerIcon small />
            </button>
          </div>
          <p className="text-slate-700 text-base leading-relaxed">{word.example}</p>
          {word.exampleTranslation && (
            <p className="text-slate-400 text-sm leading-relaxed mt-1.5">{word.exampleTranslation}</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white px-6 pb-6 flex gap-3">
          <button
            onClick={() => onSave(word)}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={
              isSaved
                ? { background: "#f0fdf4", color: "#16a34a" }
                : {
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
                  }
            }
          >
            {isSaved ? "✓ Saved" : "Save to word book"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SpeakerIcon({ small }: { small?: boolean }) {
  const size = small ? 12 : 14;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
