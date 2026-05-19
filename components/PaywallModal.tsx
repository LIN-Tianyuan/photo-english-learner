"use client";

import { track } from "@vercel/analytics";

interface PaywallModalProps {
  used: number;
  limit: number;
  onClose: () => void;
}

export default function PaywallModal({ used, limit, onClose }: PaywallModalProps) {
  const handleUpgradeClick = () => {
    track("upgrade_clicked", { used, limit });
  };

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
        {/* Header */}
        <div
          className="px-6 py-7 relative overflow-hidden text-center"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="text-5xl mb-3 relative z-10">🔒</div>
          <h2 className="text-white text-2xl font-bold relative z-10">Daily limit reached</h2>
          <p className="text-blue-200 text-sm mt-1 relative z-10">
            You've used all {limit} free analyses today
          </p>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5">
          <div className="flex flex-col gap-3 mb-5">
            {[
              "Unlimited photo analyses",
              "No daily restrictions",
              "Support further development",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgradeClick}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-base mb-3"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              boxShadow: "0 8px 25px rgba(99,102,241,0.35)",
            }}
          >
            Unlock Unlimited
          </button>

          <p className="text-xs text-slate-400 text-center mb-3">
            Resets tomorrow · Come back then for 3 more free analyses
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
