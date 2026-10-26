"use client";

import React, { useState, useEffect } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import { X, Key, Shield, Sparkles } from "lucide-react";

export function SettingsModal() {
  const {
    settingsModalOpen,
    userApiKey,
    setSettingsModalOpen,
    setUserApiKey,
    addToast,
  } = useEngineStore();

  const [inputKey, setInputKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("axiom_user_gemini_key");
      if (stored) {
        setInputKey(stored);
        setUserApiKey(stored);
      }
    }
  }, [setUserApiKey]);

  if (!settingsModalOpen) return null;

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (trimmed) {
      sessionStorage.setItem("axiom_user_gemini_key", trimmed);
      setUserApiKey(trimmed);
      addToast("Gemini API key saved for this session (AI mode active).", "success");
    } else {
      sessionStorage.removeItem("axiom_user_gemini_key");
      setUserApiKey(null);
      addToast("Returned to offline Demo mode.", "info");
    }
    setSettingsModalOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ax-ink/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-ax-white border-2 border-ax-ink shadow-[8px_8px_0px_0px_#0B0B0B] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b-2 border-ax-ink mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-ax-incline" />
            <h3 id="settings-title" className="font-display font-extrabold text-xl sm:text-2xl text-ax-ink tracking-tight">
              AI ENGINE SETTINGS
            </h3>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1 rounded-lg border border-ax-ink/20 hover:bg-ax-ink/10 transition-colors"
            aria-label="Close settings modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-xl bg-ax-yellow/20 border border-ax-ink/20 text-xs font-sans text-ax-ink/90 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Shield className="w-3.5 h-3.5 text-ax-ink" />
              <span>Bring Your Own Key (BYOK)</span>
            </div>
            Axiom runs 100% offline with zero keys. To enable live OCR for camera uploads and
            freeform handwritten math, supply a Google Gemini API Key. Your key is kept only in
            this browser session.
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-ax-ink">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-xl border-2 border-ax-ink bg-ax-paper focus:outline-none focus:ring-2 focus:ring-ax-incline"
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-ax-ink/15 flex items-center justify-end gap-3">
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2.5 rounded-full border border-ax-ink text-xs font-mono font-bold uppercase hover:bg-ax-paper transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-ax-ink text-ax-yellow text-xs font-mono font-bold uppercase hover:bg-black transition-colors"
          >
            SAVE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
}
