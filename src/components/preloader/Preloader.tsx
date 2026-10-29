"use client";

import React, { useEffect, useState } from "react";
import { AxisCrossLogo } from "../nav/AxisCrossLogo";

export function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    // Only show preloader once per session
    if (typeof window !== "undefined") {
      const alreadyLoaded = sessionStorage.getItem("axiom_preloader_seen");
      if (alreadyLoaded) {
        onComplete?.();
        return;
      }
      setVisible(true);

      const interval = setInterval(() => {
        setPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsWiping(true);
              sessionStorage.setItem("axiom_preloader_seen", "true");
              setTimeout(() => {
                setVisible(false);
                onComplete?.();
              }, 700);
            }, 200);
            return 100;
          }
          // Increment smoothly
          return prev + Math.floor(Math.random() * 8) + 4;
        });
      }, 35);

      return () => clearInterval(interval);
    }
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-ax-ink text-ax-yellow transition-transform duration-700 ease-in-out ${
        isWiping ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing Logo */}
        <div className="animate-pulse">
          <AxisCrossLogo size={64} color="#FFD500" />
        </div>

        {/* Brand Name */}
        <div className="text-center">
          <h1 className="font-display font-black text-3xl tracking-tight text-ax-yellow">
            AXIOM ENGINE
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-ax-paper/60 mt-1">
            DETERMINISTIC PHYSICS COMPILER
          </p>
        </div>

        {/* Counter */}
        <div className="font-mono text-2xl font-bold tracking-wider mt-4">
          {Math.min(100, percent)}%
        </div>
      </div>
    </div>
  );
}
