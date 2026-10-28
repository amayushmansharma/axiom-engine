"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import {
  Volume2,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Activity,
  Sliders,
} from "lucide-react";

export function TelemetryDock() {
  const {
    telemetry,
    steps,
    selectedStepIndex,
    hintLang,
    enabledSeries,
    isTelemetryFrozen,
    isPlaying,
    simSpeed,
    toggleSeries,
    toggleTelemetryFreeze,
    clearTelemetry,
    addToast,
  } = useEngineStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);

  // Check Web Speech API availability
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSupported("speechSynthesis" in window);
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
      setRecognitionSupported(!!SpeechRecognition);
    }
  }, []);

  // Audio frequency oscillator tick for EQ bars
  useEffect(() => {
    let animId: number;
    const updatePulse = () => {
      if (isPlaying || isSpeaking) {
        setPulseTick((prev) => (prev + 1) % 360);
      }
      animId = requestAnimationFrame(updatePulse);
    };
    animId = requestAnimationFrame(updatePulse);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isSpeaking]);

  // Dynamic LED Bar heights based on real-time physics telemetry
  const latestTelemetry = telemetry[telemetry.length - 1];
  const eqBars = useMemo(() => {
    const barsCount = 14;
    const ke = latestTelemetry?.ke ?? 10;
    const pe = latestTelemetry?.pe ?? 5;
    const vel = Math.abs(latestTelemetry?.velocity ?? 2);
    const speedMultiplier = isPlaying ? simSpeed : 0.15;

    return Array.from({ length: barsCount }).map((_, i) => {
      const freqFactor = (i + 1) / barsCount;
      const wave = Math.sin((pulseTick * 0.1) + i * 0.6);
      const wave2 = Math.cos((pulseTick * 0.08) - i * 0.4);

      let energyContribution = (ke * 0.04 + pe * 0.03 + vel * 0.05);
      if (isSpeaking) energyContribution += 0.4 + Math.random() * 0.3;

      let level = Math.min(
        1,
        Math.max(
          0.08,
          (energyContribution * (0.5 + 0.5 * wave) * (1 - freqFactor * 0.3) + wave2 * 0.15) *
            speedMultiplier
        )
      );

      if (!isPlaying && !isSpeaking) {
        level = 0.08 + Math.sin(pulseTick * 0.03 + i) * 0.03;
      }

      return Math.min(1, Math.max(0.05, level));
    });
  }, [latestTelemetry, isPlaying, simSpeed, pulseTick, isSpeaking]);

  // Speak Current Socratic Hint via Web Speech API
  const handleVoiceOrbClick = () => {
    if (!speechSupported) {
      addToast("Speech synthesis is not supported in this browser.", "warning");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentStep = steps[selectedStepIndex] || steps[0];
    const hintText =
      hintLang === "hinglish" && currentStep?.socratic_hint_hinglish
        ? currentStep.socratic_hint_hinglish
        : currentStep?.socratic_hint ||
          currentStep?.verifiedExplanation ||
          "Review your derivation steps carefully.";

    const utterance = new SpeechSynthesisUtterance(hintText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    addToast("Speaking Socratic hint...", "info");
  };

  // Optional Voice Input (SpeechRecognition)
  const handleMicToggle = () => {
    if (!recognitionSupported) {
      addToast("Microphone input is not supported in this browser.", "info");
      return;
    }

    setIsListening(!isListening);
    addToast(isListening ? "Microphone stopped." : "Listening for voice queries...", "info");
  };

  // 60 FPS Telemetry Canvas Draw in High-Contrast Light Neo-Brutalist theme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clean off-white canvas backdrop
    ctx.fillStyle = "#FCFBF7";
    ctx.fillRect(0, 0, w, h);

    if (telemetry.length < 2) {
      ctx.fillStyle = "rgba(11, 11, 11, 0.4)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("WAITING FOR SIMULATION TELEMETRY STREAM...", w / 2, h / 2);
      return;
    }

    // Graph bounds
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;
    const plotW = w - paddingLeft - paddingRight;
    const plotH = h - paddingTop - paddingBottom;

    // Determine max value for Y-axis scaling
    let maxY = 1;
    for (const pt of telemetry) {
      if (enabledSeries.totalEnergy && pt.totalEnergy > maxY) maxY = pt.totalEnergy;
      if (enabledSeries.ke && pt.ke > maxY) maxY = pt.ke;
      if (enabledSeries.pe && pt.pe > maxY) maxY = pt.pe;
      if (enabledSeries.velocity && Math.abs(pt.velocity) > maxY) maxY = Math.abs(pt.velocity);
      if (enabledSeries.acceleration && Math.abs(pt.acceleration) > maxY) maxY = Math.abs(pt.acceleration);
      if (enabledSeries.momentum && pt.momentum && pt.momentum > maxY) maxY = pt.momentum;
    }
    maxY = Math.max(1, maxY * 1.15);

    // Draw Subtle Grid Lines & Y-axis labels
    ctx.strokeStyle = "rgba(11, 11, 11, 0.08)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(11, 11, 11, 0.6)";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";

    const yDivisions = 4;
    for (let i = 0; i <= yDivisions; i++) {
      const yVal = (maxY / yDivisions) * i;
      const yPos = paddingTop + plotH - (i / yDivisions) * plotH;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(paddingLeft + plotW, yPos);
      ctx.stroke();

      ctx.fillText(yVal.toFixed(1), paddingLeft - 6, yPos + 3);
    }

    // X-axis divisions
    const xDivisions = 5;
    for (let i = 0; i <= xDivisions; i++) {
      const xPos = paddingLeft + (i / xDivisions) * plotW;
      ctx.beginPath();
      ctx.moveTo(xPos, paddingTop);
      ctx.lineTo(xPos, paddingTop + plotH);
      ctx.stroke();
    }

    // Time axis label
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 10px monospace";
    ctx.fillText("TIME STREAM (LAST 10s)", paddingLeft + plotW / 2, h - 8);

    // Helper to plot a bold high-contrast line series
    const plotLine = (
      getValue: (pt: (typeof telemetry)[0]) => number,
      color: string
    ) => {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < telemetry.length; i++) {
        const val = getValue(telemetry[i]);
        const x = paddingLeft + (i / (telemetry.length - 1)) * plotW;
        const y = paddingTop + plotH - (val / maxY) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    };

    if (enabledSeries.totalEnergy) plotLine((pt) => pt.totalEnergy, "#000000");
    if (enabledSeries.ke) plotLine((pt) => pt.ke, "#1A55F0");
    if (enabledSeries.pe) plotLine((pt) => pt.pe, "#16A34A");
    if (enabledSeries.velocity) plotLine((pt) => pt.velocity, "#D97706");
    if (enabledSeries.acceleration) plotLine((pt) => pt.acceleration, "#DB2777");
    if (enabledSeries.momentum) plotLine((pt) => pt.momentum ?? 0, "#64748B");

    // Crosshair hover readout
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < telemetry.length) {
      const pt = telemetry[hoverIndex];
      const hx = paddingLeft + (hoverIndex / (telemetry.length - 1)) * plotW;

      ctx.beginPath();
      ctx.moveTo(hx, paddingTop);
      ctx.lineTo(hx, paddingTop + plotH);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip HUD banner
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#000000";
      ctx.fillRect(hx + 8, paddingTop + 6, 136, 80);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`TIME: ${pt.t.toFixed(2)}s`, hx + 14, paddingTop + 20);
      ctx.fillText(`TOTAL E: ${pt.totalEnergy.toFixed(2)} J`, hx + 14, paddingTop + 34);
      ctx.fillText(`KE: ${pt.ke.toFixed(2)} J`, hx + 14, paddingTop + 47);
      ctx.fillText(`v: ${pt.velocity.toFixed(2)} m/s`, hx + 14, paddingTop + 60);
      ctx.fillText(`a: ${pt.acceleration.toFixed(2)} m/s²`, hx + 14, paddingTop + 73);
    }
  }, [telemetry, enabledSeries, hoverIndex]);

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] border-l-2 border-ax-ink text-ax-ink overflow-y-auto relative select-none">
      {/* Top Header */}
      <div className="px-4 py-3 border-b-2 border-ax-ink bg-[#FFFFFF] flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A55F0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1A55F0] border border-black shadow-sm"></span>
            </span>
            <h3 className="font-display font-extrabold text-sm sm:text-base text-black tracking-wider">
              AUDIO-PHYS // TELEMETRY
            </h3>
          </div>
          <span className="font-mono text-[9px] text-black/60 uppercase tracking-widest font-bold block mt-0.5">
            60 FPS DYNAMIC STATE STREAM
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTelemetryFreeze}
            className={`p-1.5 rounded-lg border-2 border-black transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              isTelemetryFrozen
                ? "bg-rose-500 text-white"
                : "bg-white text-black hover:bg-slate-100"
            }`}
            title="Freeze/Unfreeze graph stream"
          >
            {isTelemetryFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={clearTelemetry}
            className="p-1.5 rounded-lg border-2 border-black bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Clear graph buffer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Studio EQ Multi-Bar LED Frequency Visualizer */}
      <div className="p-4 border-b-2 border-ax-ink bg-[#FFFFFF]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold text-black tracking-wider flex items-center gap-1.5 uppercase">
            <Activity className="w-3.5 h-3.5 text-[#1A55F0]" /> KINETIC SPECTRUM EQ
          </span>
          <span className="font-mono text-[9px] text-black font-black bg-[#FFD500] px-2 py-0.5 rounded border border-black shadow-sm">
            {isPlaying ? "ACTIVE VU" : "STANDBY"}
          </span>
        </div>

        {/* 14 Multi-Segment LED Meters */}
        <div className="h-16 flex items-end justify-between gap-1 p-2 rounded-xl bg-[#F1EFEA] border-2 border-black shadow-inner">
          {eqBars.map((val, idx) => {
            const totalSegments = 10;
            const litSegments = Math.round(val * totalSegments);

            return (
              <div key={idx} className="flex-1 flex flex-col-reverse gap-0.5 h-full justify-start items-center">
                {Array.from({ length: totalSegments }).map((_, segIdx) => {
                  const isLit = segIdx < litSegments;
                  // Colors: Top 2 red, next 2 amber, bottom green
                  let litClass = "bg-emerald-600 shadow-sm";
                  if (segIdx >= 8) litClass = "bg-rose-600 shadow-sm";
                  else if (segIdx >= 6) litClass = "bg-amber-500 shadow-sm";

                  return (
                    <div
                      key={segIdx}
                      className={`w-full h-1 rounded-sm transition-all duration-75 ${
                        isLit ? litClass : "bg-slate-300/80"
                      }`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Socratic Voice Orb: Tactile Synthesizer Speaker Button */}
      <div className="p-5 border-b-2 border-ax-ink bg-[#FFFBEB] flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-4">
          {/* Tactile Speaker Orb with Perforations */}
          <button
            onClick={handleVoiceOrbClick}
            className={`relative w-20 h-20 rounded-full border-2 border-black transition-all duration-300 flex items-center justify-center shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              isSpeaking
                ? "bg-[#1A55F0] text-white scale-105 shadow-[0_0_20px_#1A55F0]"
                : "bg-[#FFD500] text-black hover:bg-yellow-400"
            }`}
            title="Speak Current Socratic Hint"
          >
            {/* Speaker Perforation Rings */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="34" fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="2 3" />
              <circle cx="50" cy="50" r="26" fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>

            {isSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-[#1A55F0] animate-ping opacity-75" />
            )}

            <Volume2
              className={`w-8 h-8 transition-transform ${
                isSpeaking ? "text-white scale-110" : "text-black"
              }`}
            />
          </button>

          {/* Optional Mic Button */}
          {recognitionSupported && (
            <button
              onClick={handleMicToggle}
              className={`p-3.5 rounded-full border-2 border-black transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-white text-black hover:bg-slate-100"
              }`}
              title="Voice Input (SpeechRecognition)"
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-black/60" />}
            </button>
          )}
        </div>

        <div className="text-center">
          <span className="font-mono text-xs font-black text-black block tracking-wide">
            {isSpeaking ? "SPEAKING SOCRATIC HINT..." : "CLICK SPEAKER TO HEAR HINT"}
          </span>
          <span className="font-mono text-[10px] text-black/60 font-semibold">
            Native Web Speech API (zero cloud latency)
          </span>
        </div>
      </div>

      {/* Telemetry Canvas Frame */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="relative border-2 border-black rounded-xl bg-[#FCFBF7] overflow-hidden mb-4 shadow-[4px_4px_0px_#000000]">
          <canvas
            ref={canvasRef}
            width={400}
            height={220}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - 45;
              const w = rect.width - 60;
              const idx = Math.round((x / w) * (telemetry.length - 1));
              setHoverIndex(idx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
            className="w-full h-52 cursor-crosshair relative z-0"
          />
        </div>

        {/* Series Toggles & Legend */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] font-black text-black uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#1A55F0]" /> TELEMETRY CHANNELS
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <button
              onClick={() => toggleSeries("totalEnergy")}
              className={`p-2 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                enabledSeries.totalEnergy
                  ? "bg-[#0B0B0B] text-white shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black/40 opacity-60"
              }`}
            >
              <span>Total Energy (E)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-white ml-2 border border-black shadow-sm" />
            </button>

            <button
              onClick={() => toggleSeries("ke")}
              className={`p-2 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                enabledSeries.ke
                  ? "bg-[#1A55F0] text-white shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black/40 opacity-60"
              }`}
            >
              <span>Kinetic (KE)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-200 ml-2 border border-black shadow-sm" />
            </button>

            <button
              onClick={() => toggleSeries("pe")}
              className={`p-2 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                enabledSeries.pe
                  ? "bg-[#16A34A] text-white shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black/40 opacity-60"
              }`}
            >
              <span>Potential (PE)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 ml-2 border border-black shadow-sm" />
            </button>

            <button
              onClick={() => toggleSeries("velocity")}
              className={`p-2 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                enabledSeries.velocity
                  ? "bg-[#D97706] text-white shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black/40 opacity-60"
              }`}
            >
              <span>Velocity (v)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200 ml-2 border border-black shadow-sm" />
            </button>

            <button
              onClick={() => toggleSeries("acceleration")}
              className={`p-2 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                enabledSeries.acceleration
                  ? "bg-[#DB2777] text-white shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black/40 opacity-60"
              }`}
            >
              <span>Accel (a)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-200 ml-2 border border-black shadow-sm" />
            </button>

            <button
              onClick={() => toggleSeries("momentum")}
              className={`p-2 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                enabledSeries.momentum
                  ? "bg-[#64748B] text-white shadow-[2px_2px_0px_#000000]"
                  : "bg-white text-black/40 opacity-60"
              }`}
            >
              <span>Momentum (p)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 ml-2 border border-black shadow-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
