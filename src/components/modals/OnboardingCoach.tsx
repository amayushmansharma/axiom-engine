"use client";

import React, { useEffect } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import { Check, X, ArrowRight } from "lucide-react";

const COACH_STEPS = [
  {
    step: 0,
    title: "1. The Handwritten AST Board",
    desc: "Draw mathematical derivations or click 'USE SAMPLE HANDWRITING'. Each step is converted to LaTeX and verified by our symbolic engine.",
    position: "left-[10%] top-[25%]",
  },
  {
    step: 1,
    title: "2. The Step Debugger",
    desc: "Planted bugs are flagged with precise diagnosis (e.g. sin/cos swap, sign flip). Click 'Show me why' for Socratic hints.",
    position: "left-[15%] top-[55%]",
  },
  {
    step: 2,
    title: "3. Live Two-Way Sync",
    desc: "Drag the incline handle or scrub the mass slider. The simulation and equation numbers recalculate in real-time.",
    position: "left-[50%] top-[45%]",
  },
  {
    step: 3,
    title: "4. 60 FPS Telemetry & Voice Orb",
    desc: "Live energy graphs stream at 60 FPS. Click the Voice Orb to hear spoken Socratic guidance locally via Web Speech.",
    position: "right-[10%] top-[30%]",
  },
];

export function OnboardingCoach() {
  const { activeCoachStep, setCoachStep } = useEngineStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("axiom_coach_seen");
      if (!seen) {
        setCoachStep(0);
      }
    }
  }, [setCoachStep]);

  if (activeCoachStep === null || activeCoachStep >= COACH_STEPS.length) {
    return null;
  }

  const current = COACH_STEPS[activeCoachStep];

  const handleNext = () => {
    if (activeCoachStep < COACH_STEPS.length - 1) {
      setCoachStep(activeCoachStep + 1);
    } else {
      sessionStorage.setItem("axiom_coach_seen", "true");
      setCoachStep(null);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("axiom_coach_seen", "true");
    setCoachStep(null);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* Background Dim */}
      <div className="absolute inset-0 bg-ax-ink/40 pointer-events-auto backdrop-blur-[2px]" onClick={handleSkip} />

      {/* Floating Card */}
      <div className="relative pointer-events-auto w-full max-w-sm p-6 rounded-2xl bg-ax-white border-2 border-ax-ink shadow-[8px_8px_0px_0px_#FFD500] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ax-incline">
            TOUR {activeCoachStep + 1} OF {COACH_STEPS.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-ax-ink/50 hover:text-ax-ink p-1"
            aria-label="Skip onboarding tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="font-display font-black text-xl text-ax-ink mb-2">
          {current.title}
        </h4>
        <p className="font-sans text-xs sm:text-sm text-ax-ink/80 leading-relaxed mb-6 font-normal">
          {current.desc}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-ax-ink/10">
          <button
            onClick={handleSkip}
            className="text-xs font-mono text-ax-ink/60 hover:text-ax-ink underline"
          >
            SKIP TOUR
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-full bg-ax-ink text-ax-yellow font-mono text-xs font-bold uppercase hover:bg-black transition-colors flex items-center gap-1.5"
          >
            {activeCoachStep < COACH_STEPS.length - 1 ? (
              <>
                NEXT <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                FINISH <Check className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
