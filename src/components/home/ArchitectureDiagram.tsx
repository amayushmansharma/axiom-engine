"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronRight, Layers, ShieldCheck, Terminal, Cpu } from "lucide-react";

interface LayerData {
  id: string;
  number: string;
  name: string;
  tagline: string;
  tech: string[];
  plainLanguage: string;
  deepDive: string;
}

const ARCH_LAYERS: LayerData[] = [
  {
    id: "layer-1",
    number: "LAYER 01",
    name: "Multimodal Ingestion & OCR Preprocessing",
    tagline: "Client-side image processing, vector stylus capture, and LaTeX tokenizer.",
    tech: ["HTML5 Canvas API", "PointerEvents API", "Bilinear Downscaling", "Base64"],
    plainLanguage:
      "When a student writes on the canvas or uploads notebook photos, the browser immediately scales the image to a maximum of 1280px, runs grayscale and contrast normalisation (levels histogram) right in memory, and produces a clean payload under 4 MB without sending massive raw blobs.",
    deepDive:
      "Eliminates mobile capture artefacts, uneven lighting, and page shadowing before OCR. Supports stylus pressure, touch events, undo/redo buffers, and direct typed LaTeX mode.",
  },
  {
    id: "layer-2",
    number: "LAYER 02",
    name: "Semantic Compiler & Symbolic Verification (The Brain)",
    tagline: "Deterministic mathematical truth authority overriding LLM hallucinations.",
    tech: ["Zod Strict Schema", "mathjs AST Walk", "Monte Carlo 24-pt Sample", "Dimensional Analysis"],
    plainLanguage:
      "The AI proposes parsed LaTeX equations and symbol mappings. Then, our deterministic engine takes over: it performs dimensional analysis on each formula [M, L, T], tests equivalence against physical first principles over 24 randomized parameter points, and runs a single-mutation AST search to pinpoint the exact student bug (e.g. sin/cos swap, inverted ratio, sign flip).",
    deepDive:
      "Important Hallucination Policy: The LLM only reads handwriting and proposes structure. The deterministic engine (math.js numeric/symbolic checks, dimensional analysis, physics solvers) is the single source of truth. If the LLM and the engine disagree, the engine wins.",
  },
  {
    id: "layer-3",
    number: "LAYER 03",
    name: "Deterministic Simulation & Telemetry Runtime",
    tagline: "60 FPS fixed-timestep numerical solvers and live reactive state sync.",
    tech: ["Fixed Timestep (1/120s)", "RK4 Integrator", "Matter.js / Impulse", "Zustand"],
    plainLanguage:
      "Equations aren't dead text — they compile directly into executable physical worlds. Drag an incline angle handle and watch normal force recalculate live; change mass and observe force vectors double while acceleration stays constant because mass cancels.",
    deepDive:
      "Uses a ring-buffer history of 600 points (~10 s at 60 FPS) rendering live kinetic, potential, and total mechanical energy charts on HTML5 canvas with zero React re-render lag.",
  },
  {
    id: "layer-4",
    number: "LAYER 04",
    name: "Zero-Latency Socratic Voice Loop",
    tagline: "Instant local speech synthesis with Web Speech API.",
    tech: ["Web Speech API (speechSynthesis)", "Web Speech Recognition", "Groq / ElevenLabs (Optional)"],
    plainLanguage:
      "When a bug is diagnosed, Axiom speaks a pedagogical Socratic hint locally with zero network delay (under 50 ms). The student gets guided questioning in either English or Hinglish without giving away the final answer until they explicitly press Reveal.",
    deepDive:
      "Works 100% offline using native browser speech engines. When cloud keys (Groq/ElevenLabs) are provided, it upgrades seamlessly, but never blocks offline functionality.",
  },
];

export function ArchitectureDiagram() {
  const [activeLayer, setActiveLayer] = useState(1);

  return (
    <section className="w-full bg-ax-paper py-24 px-4 sm:px-8 border-b-2 border-ax-ink">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col mb-12">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60">
            SYSTEM ARCHITECTURE &amp; VERIFICATION PIPELINE
          </span>
          <h2 className="display-title text-4xl sm:text-6xl text-ax-ink tracking-tight mt-2">
            HOW AXIOM VERIFIES TRUTH
          </h2>
          <p className="max-w-2xl font-sans text-sm sm:text-base text-ax-ink/80 mt-3">
            An interactive breakdown of the 4-layer pipeline for hackathon judges, engineers,
            and educators.
          </p>
        </div>

        {/* Hallucination Policy Callout */}
        <div className="mb-12 p-6 rounded-xl border-2 border-ax-ink bg-ax-yellow/20 flex items-start gap-4 shadow-[4px_4px_0px_0px_#0B0B0B]">
          <ShieldCheck className="w-8 h-8 text-ax-ink shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-ax-ink uppercase tracking-wide">
              Hallucination Policy
            </h3>
            <p className="font-sans text-sm sm:text-base text-ax-ink/90 mt-1 font-medium leading-relaxed">
              The LLM only reads handwriting and proposes structure. The deterministic engine
              (math.js numeric/symbolic checks, dimensional analysis, physics solvers) is the
              single source of truth. If the LLM and the engine disagree, the engine wins.
            </p>
          </div>
        </div>

        {/* 4 Interactive Layers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Layer Selector Left */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {ARCH_LAYERS.map((layer, index) => {
              const isSelected = activeLayer === index;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(index)}
                  className={`text-left p-5 rounded-xl border-2 border-ax-ink transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-ax-ink text-ax-yellow shadow-[6px_6px_0px_0px_#1A55F0] translate-x-2"
                      : "bg-ax-white text-ax-ink hover:bg-ax-yellow/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`font-mono text-xs font-bold tracking-wider ${
                        isSelected ? "text-ax-yellow" : "text-ax-ink/60"
                      }`}
                    >
                      {layer.number}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? "rotate-90 text-ax-yellow" : "text-ax-ink/40"
                      }`}
                    />
                  </div>
                  <h4 className="font-display font-extrabold text-lg sm:text-xl leading-snug">
                    {layer.name}
                  </h4>
                  <p
                    className={`font-sans text-xs sm:text-sm mt-1 line-clamp-2 ${
                      isSelected ? "text-ax-paper/80" : "text-ax-ink/70"
                    }`}
                  >
                    {layer.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Expanded Detail Panel Right */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border-2 border-ax-ink bg-ax-white shadow-[8px_8px_0px_0px_#0B0B0B]">
            <div className="flex items-center justify-between pb-4 border-b border-ax-ink/15 mb-6">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-ax-incline">
                {ARCH_LAYERS[activeLayer].number} SPECIFICATION
              </span>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-ax-ink text-ax-yellow font-bold">
                DETERMINISTIC
              </span>
            </div>

            <h3 className="font-display font-black text-2xl sm:text-3xl text-ax-ink tracking-tight mb-4">
              {ARCH_LAYERS[activeLayer].name}
            </h3>

            <div className="mb-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ax-ink/60 font-bold mb-2">
                Tech Stack &amp; Libraries
              </h4>
              <div className="flex flex-wrap gap-2">
                {ARCH_LAYERS[activeLayer].tech.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-xs font-semibold px-3 py-1 rounded-full border border-ax-ink bg-ax-paper text-ax-ink"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ax-ink/60 font-bold mb-1.5">
                Plain-Language Overview
              </h4>
              <p className="font-sans text-base text-ax-ink/90 leading-relaxed font-normal">
                {ARCH_LAYERS[activeLayer].plainLanguage}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ax-paper/60 border border-ax-ink/10">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ax-ink/60 font-bold mb-1.5">
                Engineering Details
              </h4>
              <p className="font-sans text-xs sm:text-sm text-ax-ink/80 leading-relaxed">
                {ARCH_LAYERS[activeLayer].deepDive}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
