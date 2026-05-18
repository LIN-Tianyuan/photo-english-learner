"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { WordItem } from "@/app/api/analyze/route";
import WordCard from "@/components/WordCard";
import WordBook from "@/components/WordBook";
import StatsBar from "@/components/StatsBar";
import { loadStats, recordPhotoAnalyzed, recordWordsSaved, Stats } from "@/lib/stats";

type DifficultyLevel = "any" | "beginner" | "intermediate" | "advanced";

const STORAGE_KEY = "photo-english-wordbook";

const LOADING_STEPS = [
  "Scanning your photo…",
  "Identifying objects…",
  "Looking up English words…",
  "Almost done…",
];

function loadSavedWords(): WordItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Home() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
  const [savedWords, setSavedWords] = useState<WordItem[]>([]);
  const [showWordBook, setShowWordBook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAll, setSavedAll] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("any");
  const [loadingStep, setLoadingStep] = useState(0);
  const [stats, setStats] = useState<Stats>(() => ({ wordsSaved: 0, photosAnalyzed: 0, reviewSessions: 0, streakDays: 0, lastActiveDate: "" }));

  useEffect(() => {
    setSavedWords(loadSavedWords());
    setStats(loadStats());
  }, []);

  // Reset "saved all" state when words change
  useEffect(() => {
    setSavedAll(false);
  }, [words]);

  const handleFileChange = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setWords([]);
    setError(null);
    setMimeType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileChange(file);
      // Reset so same file can be selected again
      e.target.value = "";
    },
    [handleFileChange]
  );

  const analyzeImage = useCallback(async () => {
    if (!imageBase64) return;
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setWords([]);

    const stepTimer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        const isNetworkLike = res.status >= 500;
        throw new Error(
          isNetworkLike
            ? "Server error, please try again."
            : data.error || "Analysis failed"
        );
      }
      setWords(data.words);
      recordPhotoAnalyzed();
      setStats(loadStats());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      const isOffline = !navigator.onLine;
      setError(isOffline ? "No internet connection. Please check your network." : msg);
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  }, [imageBase64, mimeType, difficulty]);

  const saveWord = useCallback((word: WordItem) => {
    setSavedWords((prev) => {
      if (prev.find((w) => w.word === word.word)) return prev;
      const updated = [...prev, word];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      recordWordsSaved(1);
      setStats(loadStats());
      return updated;
    });
  }, []);

  const saveAllWords = useCallback(() => {
    setSavedWords((prev) => {
      const newWords = words.filter((w) => !prev.find((p) => p.word === w.word));
      if (newWords.length === 0) return prev;
      const updated = [...prev, ...newWords];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      recordWordsSaved(newWords.length);
      setStats(loadStats());
      return updated;
    });
    setSavedAll(true);
  }, [words]);

  const removeWord = useCallback((wordStr: string) => {
    setSavedWords((prev) => {
      const updated = prev.filter((w) => w.word !== wordStr);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isSaved = (word: string) => savedWords.some((w) => w.word === word);
  const allSaved = words.length > 0 && words.every((w) => isSaved(w.word));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-sm">📸</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PhotoWords
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 pl-10">Learn English from your world</p>
        </div>
        <button
          onClick={() => setShowWordBook(true)}
          className="relative flex items-center gap-2 bg-white text-slate-600 px-3.5 py-2 rounded-2xl text-sm font-medium shadow-sm shadow-slate-200 border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all"
        >
          <span className="text-base">📖</span>
          <span>My Words</span>
          {savedWords.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
              {savedWords.length}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 flex flex-col px-4 pb-8 gap-4 max-w-lg mx-auto w-full">
        <StatsBar stats={stats} />

        {/* Upload area */}
        {!imageUrl ? (
          <div className="w-full flex flex-col gap-3">
            {/* Two upload buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 bg-white border-2 border-dashed border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📷</span>
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-semibold text-sm">Take photo</p>
                  <p className="text-slate-400 text-xs mt-0.5">Open camera</p>
                </div>
              </button>

              <button
                onClick={() => albumInputRef.current?.click()}
                className="flex-1 aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 bg-white border-2 border-dashed border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🖼️</span>
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-semibold text-sm">From album</p>
                  <p className="text-slate-400 text-xs mt-0.5">Choose a photo</p>
                </div>
              </button>
            </div>

            {/* Scene tags */}
            <div className="flex gap-2 justify-center">
              {["🌿 Plants", "🏠 Home", "🍜 Food", "🏙 City"].map((tag) => (
                <span key={tag} className="text-xs bg-white text-slate-400 px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full relative rounded-3xl overflow-hidden shadow-xl shadow-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Uploaded" className="w-full object-contain max-h-[60vh] bg-black" />

            {/* Word overlays */}
            {words.map((w) => (
              <button
                key={w.word}
                onClick={() => setSelectedWord(w)}
                className="word-label absolute transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-colors whitespace-nowrap border-2 border-white/80 backdrop-blur-sm text-white"
                style={{
                  left: `${w.x}%`,
                  top: `${w.y}%`,
                  animationDelay: `${words.indexOf(w) * 120}ms`,
                  background: isSaved(w.word)
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #3b82f6, #6366f1)",
                  boxShadow: isSaved(w.word)
                    ? "0 4px 15px rgba(34,197,94,0.4)"
                    : "0 4px 15px rgba(99,102,241,0.4)",
                }}
              >
                {isSaved(w.word) ? "✓ " : ""}{w.word}
              </button>
            ))}

            {/* Overlay gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

            {/* Change photo — top right */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors border border-white/20"
              >
                📷
              </button>
              <button
                onClick={() => albumInputRef.current?.click()}
                className="bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors border border-white/20"
              >
                🖼️
              </button>
            </div>

            {/* Word count badge */}
            {words.length > 0 && (
              <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                {words.length} words found · tap to learn
              </div>
            )}
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Error */}
        {error && (
          <div className="w-full bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={analyzeImage}
              className="text-xs font-semibold text-white bg-red-400 hover:bg-red-500 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Difficulty selector */}
        {imageUrl && (
          <div className="flex gap-2">
            {(
              [
                { value: "any", label: "不限" },
                { value: "beginner", label: "初级" },
                { value: "intermediate", label: "中级" },
                { value: "advanced", label: "高级" },
              ] as { value: DifficultyLevel; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  difficulty === value
                    ? {
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                      }
                    : { background: "#fff", color: "#94a3b8", border: "1.5px solid #e2e8f0" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons after analysis */}
        {imageUrl && (
          <div className="flex flex-col gap-3">
            {/* Save all — only shown when words exist and not all saved */}
            {words.length > 0 && !allSaved && (
              <button
                onClick={saveAllWords}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: savedAll ? "#f0fdf4" : "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: savedAll ? "#16a34a" : "#fff",
                  boxShadow: savedAll ? "none" : "0 6px 20px rgba(34,197,94,0.3)",
                }}
              >
                <span>{savedAll ? "✓" : "📖"}</span>
                <span>Save all {words.length} words</span>
              </button>
            )}

            {/* Analyze button */}
            <button
              onClick={analyzeImage}
              disabled={loading || !imageBase64}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 disabled:cursor-not-allowed"
              style={
                loading || !imageBase64
                  ? { background: "#e2e8f0", color: "#94a3b8" }
                  : {
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      boxShadow: "0 8px 25px rgba(99,102,241,0.35)",
                      color: "#fff",
                    }
              }
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="transition-all">{LOADING_STEPS[loadingStep]}</span>
                </>
              ) : (
                <>
                  <span className="text-lg">✨</span>
                  <span>{words.length > 0 ? "Analyze again" : "Find English words"}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* How it works — shown only before first upload */}
        {!imageUrl && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">How it works</p>
            <div className="flex flex-col gap-3">
              {[
                { icon: "📷", step: "Take a photo or choose from your album" },
                { icon: "🤖", step: "AI identifies objects around you" },
                { icon: "💬", step: "Tap any word to see its meaning" },
                { icon: "📖", step: "Save words to your word book" },
              ].map(({ icon, step }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-base flex-shrink-0">
                    {icon}
                  </div>
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedWord && (
        <WordCard
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onSave={saveWord}
          isSaved={isSaved(selectedWord.word)}
        />
      )}
      {showWordBook && (
        <WordBook
          words={savedWords}
          onClose={() => setShowWordBook(false)}
          onRemove={removeWord}
        />
      )}
    </div>
  );
}
