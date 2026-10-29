"use client";

import React from "react";
import Link from "next/link";
import { TranslucentConsole } from "./TranslucentConsole";
import { FluidInkCanvas } from "../cursor/FluidInkCanvas";
import { ArrowDown, Play, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[92vh] flex flex-col justify-between items-center px-4 sm:px-8 pt-6 pb-12 bg-ax-yellow">
      {/* Interactive Black Fluid Ink Cursor Trail Canvas */}
      <FluidInkCanvas />

      {/* Drifting subtle ink glow in background */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-ax-ink/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-ax-incline/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Title & Console Container */}
      <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center pt-6 sm:pt-10 z-10 pointer-events-auto">
        {/* Subtitle Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ax-ink/20 bg-ax-ink/5 backdrop-blur-sm shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-ax-ink" />
          <span className="font-mono text-xs sm:text-sm font-bold tracking-widest uppercase text-ax-ink">
            WRITE THE MATH. WATCH THE PHYSICS. CATCH THE BUG.
          </span>
        </div>

        {/* Headline with Overlapping Brush Script */}
        <div className="relative text-center select-none w-full">
          <h1
            className="display-title text-[clamp(4.2rem,16vw,17rem)] text-ax-ink tracking-tighter leading-[0.8] mb-0"
            style={{ textShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            AXIOM
          </h1>
          <span
            className="script-accent absolute right-[2%] sm:right-[10%] -bottom-4 sm:bottom-0 text-[clamp(3rem,11vw,11rem)] text-ax-incline rotate-[-6deg] drop-shadow-md pointer-events-none z-0 opacity-90"
          >
            engine
          </span>
        </div>

        {/* Centerpiece Translucent Handheld Hardware Console Overlapping Headline */}
        <div className="w-full max-w-lg -mt-16 sm:-mt-28 z-20">
          <TranslucentConsole />
        </div>

        {/* One-Liner Description */}
        <p className="max-w-2xl text-center font-sans text-base sm:text-xl font-medium text-ax-ink/80 mt-6 px-4 leading-relaxed z-20">
          A physics learning engine where handwritten derivations are parsed to LaTeX,
          verified step-by-step by a deterministic symbolic engine, and tied live to a
          running simulation in real time.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 z-20">
          <Link
            href="/workspace"
            className="px-8 py-3.5 rounded-full bg-ax-ink text-ax-yellow font-mono text-sm sm:text-base font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A55F0] hover:bg-black hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-ax-ink"
          >
            OPEN THE LAB
          </Link>
          <Link
            href="/workspace?demo=1"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ax-white text-ax-ink font-mono text-sm sm:text-base font-bold uppercase tracking-wider border-2 border-ax-ink shadow-[4px_4px_0px_0px_#0B0B0B] hover:bg-ax-ink hover:text-ax-white hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Play className="w-4 h-4 fill-current" />
            WATCH AUTO DEMO
          </Link>
        </div>
      </div>

      {/* Bouncing Scroll Down Indicator */}
      <div className="mt-12 flex flex-col items-center justify-center gap-1 z-20">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ax-ink/60 font-bold">
          SCROLL TO EXPLORE
        </span>
        <ArrowDown className="w-5 h-5 text-ax-ink animate-bounce" />
      </div>
    </section>
  );
}
