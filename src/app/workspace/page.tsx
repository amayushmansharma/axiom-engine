"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEngineStore, encodeStateToHash, decodeHashToState } from "@/state/useEngineStore";
import { CanvasBoard } from "@/components/canvas-board/CanvasBoard";
import { SimulationViewport } from "@/components/simulation-viewport/SimulationViewport";
import { TelemetryDock } from "@/components/telemetry-dock/TelemetryDock";
import { ShortcutsModal } from "@/components/modals/ShortcutsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { OnboardingCoach } from "@/components/modals/OnboardingCoach";
import { AutoDemoController } from "@/components/modals/AutoDemoController";
import {
  Share2,
  Printer,
  HelpCircle,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

export default function WorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-screen bg-ax-paper flex items-center justify-center">
          <div className="font-mono text-sm uppercase font-bold text-ax-ink/60 animate-pulse">
            INITIALIZING AXIOM LAB RUNTIME...
          </div>
        </div>
      }
    >
      <WorkspaceContent />
    </React.Suspense>
  );
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const {
    preset,
    params,
    mode,
    loadPreset,
    setParam,
    togglePlay,
    resetSimulation,
    toggleVectors,
    setShortcutsModalOpen,
    setSettingsModalOpen,
    startAutoDemo,
    addToast,
  } = useEngineStore();

  // Mobile layout tab: "work" | "sim" | "graphs"
  const [mobileTab, setMobileTab] = useState<"work" | "sim" | "graphs">("sim");

  // Load preset or demo mode from query params or URL hash on mount
  useEffect(() => {
    // Check URL hash first for shared state
    if (typeof window !== "undefined" && window.location.hash) {
      const decoded = decodeHashToState(window.location.hash);
      if (decoded) {
        loadPreset(decoded.presetId);
        for (const [k, v] of Object.entries(decoded.params)) {
          setParam(k, v);
        }
        addToast(`Restored state from shared link.`, "info");
        return;
      }
    }

    const presetParam = searchParams.get("preset");
    if (presetParam) {
      loadPreset(presetParam);
    }

    const demoParam = searchParams.get("demo");
    if (demoParam === "1") {
      startAutoDemo();
    }
  }, [searchParams, loadPreset, setParam, startAutoDemo, addToast]);

  // Global Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in input or textarea
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "r" || e.key === "R") {
        resetSimulation();
      } else if (e.key === "v" || e.key === "V") {
        toggleVectors();
      } else if (e.key === "1") {
        loadPreset("incline");
      } else if (e.key === "2") {
        loadPreset("atwood");
      } else if (e.key === "3") {
        loadPreset("projectile_collision");
      } else if (e.key === "4") {
        loadPreset("shm");
      } else if (e.key === "?") {
        setShortcutsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, resetSimulation, toggleVectors, loadPreset, setShortcutsModalOpen]);

  // Share link action: encode state to URL hash
  const handleCopyShareLink = () => {
    const hash = encodeStateToHash(preset.problem_metadata.domain, params);
    const fullUrl = `${window.location.origin}/workspace#${hash}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      addToast("Share link copied to clipboard!", "success");
    }).catch(() => {
      addToast("Failed to copy link.", "error");
    });
  };

  // Export report PDF (print stylesheet)
  const handleExportPDF = () => {
    addToast("Preparing print report...", "info");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const themeAccent = preset.problem_metadata.theme_color;

  return (
    <div
      className="flex flex-col min-h-screen bg-ax-paper"
      style={{
        // Smoothly adapt accents to active preset
        ["--ax-accent" as string]: themeAccent,
      }}
    >
      {/* Top Preset Trigger Strip & Tools */}
      <section className="no-print border-b-2 border-ax-ink bg-ax-white px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-12 z-30 shadow-sm">
        {/* 4 Instant Preset Trigger Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase font-extrabold text-ax-ink/50 mr-1 hidden sm:inline">
            PRESETS:
          </span>

          <button
            onClick={() => loadPreset("incline")}
            className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-150 border-2 ${
              preset.problem_metadata.domain === "incline"
                ? "bg-ax-incline text-ax-white border-ax-ink shadow-[2px_2px_0px_0px_#0B0B0B]"
                : "border-ax-ink/30 hover:border-ax-ink text-ax-ink bg-transparent"
            }`}
          >
            [1] Incline Friction Bug
          </button>

          <button
            onClick={() => loadPreset("atwood")}
            className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-150 border-2 ${
              preset.problem_metadata.domain === "atwood"
                ? "bg-ax-pulley text-ax-white border-ax-ink shadow-[2px_2px_0px_0px_#0B0B0B]"
                : "border-ax-ink/30 hover:border-ax-ink text-ax-ink bg-transparent"
            }`}
          >
            [2] Pulley-Block Bug
          </button>

          <button
            onClick={() => loadPreset("projectile_collision")}
            className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-150 border-2 ${
              preset.problem_metadata.domain === "projectile_collision"
                ? "bg-ax-projectile text-ax-white border-ax-ink shadow-[2px_2px_0px_0px_#0B0B0B]"
                : "border-ax-ink/30 hover:border-ax-ink text-ax-ink bg-transparent"
            }`}
          >
            [3] Projectile Collision
          </button>

          <button
            onClick={() => loadPreset("shm")}
            className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-150 border-2 ${
              preset.problem_metadata.domain === "shm"
                ? "bg-ax-shm text-ax-white border-ax-ink shadow-[2px_2px_0px_0px_#0B0B0B]"
                : "border-ax-ink/30 hover:border-ax-ink text-ax-ink bg-transparent"
            }`}
          >
            [4] SHM Energy Damping
          </button>
        </div>

        {/* Action Pills Right: Share, Print, Settings, Shortcuts, Mode Badge */}
        <div className="flex items-center gap-2">
          {/* Mode Badge */}
          <span
            className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider border border-ax-ink ${
              mode === "ai"
                ? "bg-ax-incline text-ax-white"
                : "bg-ax-yellow text-ax-ink"
            }`}
          >
            {mode === "ai" ? "AI MODE (GEMINI)" : "DEMO MODE (OFFLINE)"}
          </span>

          <button
            onClick={handleCopyShareLink}
            className="p-1.5 sm:px-3 sm:py-1 rounded-full border border-ax-ink/40 hover:bg-ax-ink/10 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors"
            title="Copy shareable link with current parameters"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SHARE LINK</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="p-1.5 sm:px-3 sm:py-1 rounded-full border border-ax-ink/40 hover:bg-ax-ink/10 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors"
            title="Save as PDF / Print report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXPORT PDF</span>
          </button>

          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="p-1.5 rounded-full border border-ax-ink/40 hover:bg-ax-ink/10 text-ax-ink transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-1.5 rounded-full border border-ax-ink/40 hover:bg-ax-ink/10 text-ax-ink transition-colors"
            title="AI Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Mobile Tab Selector (Visible on small screens only) */}
      <div className="lg:hidden flex items-center justify-around border-b-2 border-ax-ink bg-ax-white p-2 no-print">
        <button
          onClick={() => setMobileTab("work")}
          className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase ${
            mobileTab === "work" ? "bg-ax-ink text-ax-white" : "text-ax-ink/70"
          }`}
        >
          1. Work / Steps
        </button>
        <button
          onClick={() => setMobileTab("sim")}
          className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase ${
            mobileTab === "sim" ? "bg-ax-ink text-ax-white" : "text-ax-ink/70"
          }`}
        >
          2. Simulation
        </button>
        <button
          onClick={() => setMobileTab("graphs")}
          className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase ${
            mobileTab === "graphs" ? "bg-ax-ink text-ax-white" : "text-ax-ink/70"
          }`}
        >
          3. Telemetry
        </button>
      </div>

      {/* Main 3-Zone Workspace Grid */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Zone 1: Canvas Board & Derivation AST Debugger (Left) */}
        <section
          className={`lg:col-span-4 h-auto lg:h-[calc(100vh-100px)] ${
            mobileTab === "work" ? "block" : "hidden lg:block"
          }`}
        >
          <CanvasBoard />
        </section>

        {/* Zone 2: Simulation Viewport (Center) */}
        <section
          className={`lg:col-span-5 h-auto lg:h-[calc(100vh-100px)] border-b-2 lg:border-b-0 ${
            mobileTab === "sim" ? "block" : "hidden lg:block"
          }`}
        >
          <SimulationViewport />
        </section>

        {/* Zone 3: Telemetry Dock & Socratic Voice Orb (Right) */}
        <section
          className={`lg:col-span-3 h-auto lg:h-[calc(100vh-100px)] ${
            mobileTab === "graphs" ? "block" : "hidden lg:block"
          }`}
        >
          <TelemetryDock />
        </section>
      </main>

      {/* Modals & Helpers */}
      <ShortcutsModal />
      <SettingsModal />
      <OnboardingCoach />
      <AutoDemoController />
    </div>
  );
}
