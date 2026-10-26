"use client";

import React, { useEffect } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import { X, Command } from "lucide-react";

export function ShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useEngineStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && shortcutsModalOpen) {
        setShortcutsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutsModalOpen, setShortcutsModalOpen]);

  if (!shortcutsModalOpen) return null;

  const shortcuts = [
    { key: "Space", desc: "Toggle simulation Play / Pause" },
    { key: "R", desc: "Reset simulation to initial state" },
    { key: "V", desc: "Toggle Free Body Diagram force vectors" },
    { key: "1", desc: "Run Incline Friction Bug preset" },
    { key: "2", desc: "Run Pulley-Block Bug preset" },
    { key: "3", desc: "Run Projectile Collision preset" },
    { key: "4", desc: "Run SHM Energy Damping preset" },
    { key: "?", desc: "Open / Close this shortcuts guide" },
    { key: "Esc", desc: "Close modals or stop Auto Demo tour" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ax-ink/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-ax-white border-2 border-ax-ink shadow-[8px_8px_0px_0px_#0B0B0B] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b-2 border-ax-ink mb-6">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-ax-incline" />
            <h3 id="shortcuts-title" className="font-display font-extrabold text-xl sm:text-2xl text-ax-ink tracking-tight">
              KEYBOARD SHORTCUTS
            </h3>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1 rounded-lg border border-ax-ink/20 hover:bg-ax-ink/10 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-ax-paper border border-ax-ink/10"
            >
              <span className="font-sans text-xs sm:text-sm text-ax-ink/80 font-medium">
                {sc.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded bg-ax-ink text-ax-yellow font-mono text-xs font-bold border border-ax-ink shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-ax-ink/15 text-center">
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-6 py-2 rounded-full bg-ax-ink text-ax-yellow font-mono text-xs font-bold uppercase hover:bg-black transition-colors"
          >
            GOT IT (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
