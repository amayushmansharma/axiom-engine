"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import { X, Play, FastForward, Check } from "lucide-react";

export function AutoDemoController() {
  const {
    autoDemoActive,
    loadPreset,
    setSelectedStepIndex,
    setParam,
    stopAutoDemo,
    addToast,
    steps,
  } = useEngineStore();

  const [currentStepText, setCurrentStepText] = useState("");
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!autoDemoActive) {
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
      return;
    }

    addToast("Auto Demo started. Press ESC anytime to take control.", "info");

    // Scripted 60-second automated tour
    const schedule = [
      {
        delay: 500,
        fn: () => {
          loadPreset("incline");
          setCurrentStepText("1/5: Loaded Incline Friction scenario.");
        },
      },
      {
        delay: 3500,
        fn: () => {
          setSelectedStepIndex(1); // Step 2 error
          setCurrentStepText("2/5: Identified trig error at Step 2 (sin used where cos belongs).");
        },
      },
      {
        delay: 7500,
        fn: () => {
          // Scrub mass from 5 to 10
          setParam("m", 10);
          setCurrentStepText("3/5: Scrubbed mass m from 5kg to 10kg — arrows double, acceleration unchanged!");
        },
      },
      {
        delay: 13000,
        fn: () => {
          // Drag theta from 30 to 45
          setParam("theta", 45);
          setCurrentStepText("4/5: Dragged incline angle θ from 30° to 45° — acceleration increases to 5.20 m/s².");
        },
      },
      {
        delay: 20000,
        fn: () => {
          loadPreset("atwood");
          setCurrentStepText("5/5: Switched to Atwood Pulley scenario with coupled friction.");
        },
      },
      {
        delay: 28000,
        fn: () => {
          loadPreset("projectile_collision");
          setCurrentStepText("Bonus: Observing projectile interception at t = 2.0s.");
        },
      },
      {
        delay: 38000,
        fn: () => {
          loadPreset("shm");
          setCurrentStepText("Bonus: Observing damped harmonic oscillator RK4 energy dissipation.");
        },
      },
      {
        delay: 48000,
        fn: () => {
          loadPreset("incline");
          setCurrentStepText("Tour complete! You now have full manual control of Axiom.");
          setTimeout(() => {
            stopAutoDemo();
          }, 4000);
        },
      },
    ];

    timerRef.current = schedule.map((s) => setTimeout(s.fn, s.delay));

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopAutoDemo();
        addToast("Auto Demo exited.", "info");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [autoDemoActive, loadPreset, setSelectedStepIndex, setParam, stopAutoDemo, addToast]);

  if (!autoDemoActive) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto">
      <div className="p-4 rounded-2xl bg-ax-ink text-ax-yellow border-2 border-ax-yellow shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-ax-yellow animate-ping shrink-0" />
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-ax-paper/60 block">
              AUTOMATED SHOWCASE TOUR
            </span>
            <p className="font-sans text-xs sm:text-sm font-semibold text-ax-white line-clamp-1">
              {currentStepText}
            </p>
          </div>
        </div>

        <button
          onClick={stopAutoDemo}
          className="px-3.5 py-1.5 rounded-full bg-ax-yellow text-ax-ink font-mono text-xs font-bold uppercase hover:bg-yellow-400 shrink-0 transition-colors"
        >
          EXIT (ESC)
        </button>
      </div>
    </div>
  );
}
