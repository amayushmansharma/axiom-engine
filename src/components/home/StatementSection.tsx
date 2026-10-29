"use client";

import React, { useEffect, useState, useRef } from "react";

export function StatementSection() {
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      const dt = Math.max(1, now - lastTime.current);
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      const speed = Math.min(6, (dy / dt) * 3);

      setScrollSpeed(speed);
      lastScrollY.current = window.scrollY;
      lastTime.current = now;

      // Update CSS variables for RGB split
      document.documentElement.style.setProperty("--split-x", `${speed}px`);
      document.documentElement.style.setProperty("--split-y", `${speed * 0.4}px`);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Decay speed smoothly
    const interval = setInterval(() => {
      setScrollSpeed((prev) => {
        if (prev <= 0.1) return 0;
        const next = prev * 0.85;
        document.documentElement.style.setProperty("--split-x", `${next}px`);
        document.documentElement.style.setProperty("--split-y", `${next * 0.4}px`);
        return next;
      });
    }, 50);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(interval);
    };
  }, []);

  const isGlitching = scrollSpeed > 0.5;

  return (
    <section className="relative w-full py-24 sm:py-36 px-4 sm:px-8 border-y-2 border-ax-ink bg-ax-yellow">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60 mb-6">
          THE AXIOM GUARANTEE
        </span>

        <h2 className="display-title text-[clamp(2.5rem,7vw,7.5rem)] text-ax-ink tracking-tight leading-[0.9]">
          <span
            className={`rgb-split ${isGlitching ? "active-split" : ""}`}
            data-text="EVERY STEP VERIFIED."
          >
            EVERY STEP VERIFIED.
          </span>
          <br />
          <span
            className={`rgb-split text-ax-ink ${isGlitching ? "active-split" : ""}`}
            data-text="EVERY EQUATION ALIVE."
          >
            EVERY EQUATION ALIVE.
          </span>
        </h2>

        <p className="mt-8 max-w-3xl font-sans text-lg sm:text-2xl text-ax-ink/80 leading-relaxed font-normal">
          No black boxes. No hallucinated math. When you change an equation,
          the simulation moves. When you drag a physical body, the equations recalculate.
          Rigorous mathematics meets interactive physics.
        </p>
      </div>
    </section>
  );
}
