"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { track } from "@vercel/analytics";

interface PaywallModalProps {
  used: number;
  limit: number;
  onClose: () => void;
}

export default function PaywallModal({ used, limit, onClose }: PaywallModalProps) {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    track("upgrade_clicked", { used, limit });
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setCheckoutError("Network error. Please try again.");
      setLoading(false);
    }
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
          <div className="text-5xl mb-3 relative z-10">🚀</div>
          <h2 className="text-white text-2xl font-bold relative z-10">Unlock PhotoWords Pro</h2>
          <p className="text-blue-200 text-sm mt-1 relative z-10">
            {used >= limit
              ? `You've used all ${limit} free analyses today`
              : "Unlock all premium features"}
          </p>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5">
          <div className="flex flex-col gap-3 mb-5">
            {[
              "Unlimited photo analyses",
              "Conversation Practice (My Story + Small Talk)",
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

          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-slate-800">$4.99</span>
            <span className="text-slate-400 text-sm"> / month</span>
            <p className="text-xs text-slate-400 mt-0.5">Cancel anytime</p>
          </div>

          {checkoutError && (
            <p className="text-red-500 text-xs text-center mb-3">{checkoutError}</p>
          )}

          {isSignedIn ? (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-base mb-3 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                boxShadow: "0 8px 25px rgba(99,102,241,0.35)",
              }}
            >
              {loading ? "Redirecting…" : "Unlock Pro · $4.99/mo"}
            </button>
          ) : (
            <SignInButton mode="modal" fallbackRedirectUrl="/?payment=start">
              <button
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-base mb-3"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  boxShadow: "0 8px 25px rgba(99,102,241,0.35)",
                }}
                onClick={() => track("signin_for_upgrade_clicked")}
              >
                Sign in to Unlock Pro
              </button>
            </SignInButton>
          )}

          <p className="text-xs text-slate-400 text-center mb-3">
            Secure payment via Stripe · Cancel anytime
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
