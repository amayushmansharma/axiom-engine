"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FeatureColumns() {
  const features = [
    {
      id: "ast-debugger",
      title: "Handwritten AST Debugger",
      description:
        "Draw or upload rough derivations. Each line becomes verified LaTeX. The symbolic engine locates the exact bug and provides targeted Socratic hints without spoiling the answer.",
      accent: "#1A55F0",
      link: "/workspace",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none" strokeWidth="2.5">
          <rect x="6" y="8" width="36" height="32" rx="4" className="stroke-ax-ink" />
          <path d="M 12 18 L 22 18" className="stroke-ax-incline" />
          <path d="M 12 26 L 36 26" className="stroke-ax-ink" strokeDasharray="3 3" />
          <path d="M 12 34 L 28 34" className="stroke-ax-error" />
          <circle cx="34" cy="34" r="3" className="fill-ax-error stroke-none" />
        </svg>
      ),
    },
    {
      id: "compiler",
      title: "Text-to-Physics Compiler",
      description:
        "The system reads problem statements and handwritten notes, generating strictly structured physics scenes that instantly execute in the browser with live force vectors and telemetry.",
      accent: "#18B26B",
      link: "/workspace?preset=projectile_collision",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none" strokeWidth="2.5">
          <circle cx="24" cy="24" r="18" className="stroke-ax-ink" />
          <path d="M 14 24 L 34 24" className="stroke-ax-projectile" />
          <path d="M 26 16 L 34 24 L 26 32" className="stroke-ax-projectile" />
          <circle cx="34" cy="24" r="4" className="fill-ax-projectile stroke-none" />
        </svg>
      ),
    },
    {
      id: "sync",
      title: "Two-Way Live Sync",
      description:
        "A single source of truth connects equations and simulation. Scrub mass in an equation pill and vectors rescale; drag the incline angle handle in the viewport and equations recalculate live.",
      accent: "#FF3D8B",
      link: "/workspace?preset=incline",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none" strokeWidth="2.5">
          <path d="M 8 20 C 8 13 18 10 24 10 C 32 10 40 16 40 24" className="stroke-ax-shm" />
          <path d="M 36 18 L 40 24 L 44 18" className="stroke-ax-shm" />
          <path d="M 40 28 C 40 35 30 38 24 38 C 16 38 8 32 8 24" className="stroke-ax-ink" />
          <path d="M 12 30 L 8 24 L 4 30" className="stroke-ax-ink" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-ax-yellow py-20 px-4 sm:px-8 border-b-2 border-ax-ink">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-ax-ink border-2 border-ax-ink bg-ax-yellow/50 shadow-[6px_6px_0px_0px_#0B0B0B]">
          {features.map((f, i) => (
            <div
              key={f.id}
              className="p-8 sm:p-10 flex flex-col justify-between group hover:bg-ax-white/40 transition-colors duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs font-bold text-ax-ink/50">
                    0{i + 1} {"//"} CAPABILITY
                  </span>
                  <div className="p-3 bg-ax-ink/5 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    {f.icon}
                  </div>
                </div>

                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-ax-ink tracking-tight mb-4">
                  {f.title}
                </h3>

                <p className="font-sans text-base text-ax-ink/80 leading-relaxed font-normal">
                  {f.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-ax-ink/15">
                <Link
                  href={f.link}
                  className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ax-ink group-hover:translate-x-1 transition-transform duration-200"
                >
                  TEST IN LAB <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
