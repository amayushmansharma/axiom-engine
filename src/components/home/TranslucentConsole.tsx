"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export function TranslucentConsole() {
  // Handheld physics state
  const [theta, setTheta] = useState(30); // Incline angle in degrees
  const [pulseActive, setPulseActive] = useState(false);
  const [ledStatus, setLedStatus] = useState<"sync" | "pulse">("sync");

  // Mouse parallax rotation
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(4);
  const [rotateY, setRotateY] = useState(-6);

  // Screen canvas ref
  const screenCanvasRef = useRef<HTMLCanvasElement>(null);

  // Physics animation values
  const simState = useRef({
    s: 0, // distance along ramp
    v: 0,
    sphereAngle: 0,
    pulseOffset: 0,
  });

  // Handle D-Pad interactions
  const handleAngleChange = (delta: number) => {
    setTheta((prev) => {
      const next = Math.min(65, Math.max(10, prev + delta));
      return Math.round(next * 10) / 10;
    });
    setLedStatus("pulse");
    setTimeout(() => setLedStatus("sync"), 250);
  };

  // Handle Button A: Gravity Pulse
  const handleGravityPulse = () => {
    setPulseActive(true);
    simState.current.v = -1.8; // jump upward
    setLedStatus("pulse");
    setTimeout(() => {
      setPulseActive(false);
      setLedStatus("sync");
    }, 400);
  };

  // Handle Button B: Cycle standard angles
  const handleCycleAngle = () => {
    setTheta((prev) => (prev >= 45 ? 20 : prev >= 30 ? 45 : 30));
    setLedStatus("pulse");
    setTimeout(() => setLedStatus("sync"), 250);
  };

  // Parallax tracking (passive, non-blocking)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      // Subtle, tactile 3D tilt
      setRotateY(-4 + dx * 9);
      setRotateX(3 - dy * 7);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // 60 FPS CRT Screen Physics Render Loop
  useEffect(() => {
    const canvas = screenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // CRT Phosphor background
      const crtGrad = ctx.createLinearGradient(0, 0, 0, h);
      crtGrad.addColorStop(0, "#081018");
      crtGrad.addColorStop(1, "#03080e");
      ctx.fillStyle = crtGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle cyan grid lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      const grid = 18;
      for (let x = 0; x < w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Physics derivation constants for mini-screen
      const m = 5;
      const g = 9.81;
      const mu = 0.25;
      const thetaRad = (theta * Math.PI) / 180;
      const cosTheta = Math.cos(thetaRad);
      const sinTheta = Math.sin(thetaRad);

      const N = m * g * cosTheta;
      const fk = mu * N;
      const a = g * Math.max(0, sinTheta - mu * cosTheta);

      // Physics integration for sliding block
      const rampLength = 120;
      simState.current.v += a * dt * 2.2;
      simState.current.s += simState.current.v;

      if (simState.current.s >= rampLength) {
        simState.current.s = 0;
        simState.current.v = 0;
      }
      if (simState.current.s < 0) {
        simState.current.s = 0;
        simState.current.v = 0;
      }

      // Incline geometry on screen
      const originX = 35;
      const originY = h - 35;
      const topX = originX + rampLength * cosTheta;
      const topY = originY - rampLength * sinTheta;

      // Draw Incline Wedge
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(topX, topY);
      ctx.lineTo(topX, originY);
      ctx.closePath();
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Block coordinates
      const sFrac = simState.current.s / rampLength;
      const distFromOrigin = (1 - sFrac) * rampLength;
      const blockX = originX + distFromOrigin * cosTheta;
      const blockY = originY - distFromOrigin * sinTheta;

      // Block drawing
      ctx.save();
      ctx.translate(blockX, blockY);
      ctx.rotate(-thetaRad);

      ctx.fillStyle = pulseActive ? "#FFD500" : "#f59e0b";
      ctx.fillRect(-14, -18, 28, 18);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -18, 28, 18);

      ctx.restore();

      // Force Vectors
      const vScale = 0.9;
      // Normal N (cyan/blue)
      const nx = blockX + sinTheta * Math.min(38, N * vScale * 0.9);
      const ny = (blockY - 9) - cosTheta * Math.min(38, N * vScale * 0.9);
      drawVector(ctx, blockX, blockY - 9, nx, ny, "#38bdf8", "N");

      // Gravity mg (red/pink)
      const mgLen = Math.min(42, m * g * vScale * 0.8);
      drawVector(ctx, blockX, blockY - 9, blockX, blockY - 9 + mgLen, "#f43f5e", "mg");

      // Friction fk (orange)
      const fx = blockX + cosTheta * Math.min(30, fk * vScale * 1.5);
      const fy = (blockY - 9) - sinTheta * Math.min(30, fk * vScale * 1.5);
      drawVector(ctx, blockX, blockY - 9, fx, fy, "#fbbf24", "f_k");

      // Orbiting Sphere
      simState.current.sphereAngle += dt * 3.5;
      const sphereRadius = 26;
      const sx = topX + 15 + Math.cos(simState.current.sphereAngle) * sphereRadius;
      const sy = topY + 10 + Math.sin(simState.current.sphereAngle) * (sphereRadius * 0.55);

      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#34d399";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // CRT Scanline Overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      // HUD Telemetry overlay on screen
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "left";
      ctx.fillText(`θ: ${theta.toFixed(1)}°`, 10, 16);
      ctx.fillText(`N: ${N.toFixed(1)}N`, 10, 28);
      ctx.fillText(`f: ${fk.toFixed(1)}N`, 10, 40);

      ctx.textAlign = "right";
      ctx.fillStyle = "#34d399";
      ctx.fillText(`a: ${a.toFixed(2)}m/s²`, w - 10, 16);
      ctx.fillStyle = pulseActive ? "#FFD500" : "#94a3b8";
      ctx.fillText(pulseActive ? "PULSE!" : "ONLINE", w - 10, 28);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [theta, pulseActive]);

  // Vector drawing helper
  const drawVector = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    label: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLen = 5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLen * Math.cos(angle - Math.PI / 6), y2 - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - arrowLen * Math.cos(angle + Math.PI / 6), y2 - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.font = "bold 8px monospace";
    ctx.fillStyle = color;
    ctx.fillText(label, x2 + 3, y2 - 2);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-4 select-none"
      style={{
        perspective: "1200px",
      }}
    >
      {/* Handheld Console Casing */}
      <div
        className="relative w-[340px] sm:w-[380px] h-[510px] sm:h-[540px] rounded-[38px] p-5 flex flex-col justify-between transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(-3.5deg)`,
          background:
            "linear-gradient(145deg, rgba(28, 30, 38, 0.88), rgba(12, 13, 18, 0.94))",
          backdropFilter: "blur(16px)",
          border: "2px solid rgba(255, 255, 255, 0.28)",
          boxShadow:
            "0 30px 70px -15px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -3px 8px rgba(0,0,0,0.8)",
        }}
      >
        {/* Four Metallic Corner Screw Heads */}
        <div className="absolute top-3.5 left-4 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-600 flex items-center justify-center shadow-inner">
          <div className="w-2.5 h-[1.5px] bg-slate-700 rotate-45" />
        </div>
        <div className="absolute top-3.5 right-4 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-600 flex items-center justify-center shadow-inner">
          <div className="w-2.5 h-[1.5px] bg-slate-700 -rotate-12" />
        </div>
        <div className="absolute bottom-3.5 left-4 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-600 flex items-center justify-center shadow-inner">
          <div className="w-2.5 h-[1.5px] bg-slate-700 rotate-12" />
        </div>
        <div className="absolute bottom-3.5 right-4 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-600 flex items-center justify-center shadow-inner">
          <div className="w-2.5 h-[1.5px] bg-slate-700 rotate-60" />
        </div>

        {/* Visible Internal Gold/Copper PCB Circuit Traces (SVG Underlay) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none rounded-[38px] opacity-25"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50 40 L 50 180 L 90 220 M 330 40 L 330 200 L 290 240 M 120 480 L 120 430 L 160 390 M 240 480 L 240 420 L 210 390"
            stroke="#fbbf24"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="90" cy="220" r="3" fill="#fbbf24" />
          <circle cx="290" cy="240" r="3" fill="#fbbf24" />
          <rect x="170" y="440" width="36" height="24" rx="2" fill="#0B0B0B" stroke="#fbbf24" strokeWidth="1" />
          <line x1="170" y1="446" x2="162" y2="446" stroke="#fbbf24" strokeWidth="1" />
          <line x1="170" y1="452" x2="162" y2="452" stroke="#fbbf24" strokeWidth="1" />
          <line x1="170" y1="458" x2="162" y2="458" stroke="#fbbf24" strokeWidth="1" />
          <line x1="206" y1="446" x2="214" y2="446" stroke="#fbbf24" strokeWidth="1" />
          <line x1="206" y1="452" x2="214" y2="452" stroke="#fbbf24" strokeWidth="1" />
          <line x1="206" y1="458" x2="214" y2="458" stroke="#fbbf24" strokeWidth="1" />
        </svg>

        {/* Top Header Bar on Console */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                ledStatus === "sync"
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-amber-400 shadow-[0_0_10px_#fbbf24]"
              }`}
            />
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/70 font-bold">
              PWR // SYNC
            </span>
          </div>

          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-ax-yellow/90">
            AXIOM-HANDHELD 2.0
          </span>
        </div>

        {/* TOP SCREEN BEZEL & CRT CANVAS */}
        <div className="relative mt-2 p-2.5 rounded-2xl bg-black border-2 border-slate-700/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] z-10">
          <div className="flex items-center justify-between pb-1 px-1 text-[8px] font-mono text-cyan-400/80">
            <span>CRT MATRIX // 60 FPS</span>
            <span>VECTOR OVERLAY</span>
          </div>

          {/* CRT Screen Canvas */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <canvas
              ref={screenCanvasRef}
              width={320}
              height={190}
              className="w-full h-44 block bg-[#03080e]"
            />
          </div>
        </div>

        {/* BOTTOM HALF: PHYSICAL TACTILE CONTROLS */}
        <div className="mt-4 flex items-center justify-between px-3 py-2 z-10">
          {/* Metallic D-Pad Left */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* D-Pad Base Ring */}
            <div className="absolute inset-0 rounded-full bg-black/40 border border-white/10" />

            {/* Cross Shape */}
            <div className="relative w-20 h-20">
              {/* Up Button */}
              <button
                onClick={() => handleAngleChange(5)}
                className="absolute top-0 left-7 w-6 h-7 rounded-t-md bg-gradient-to-b from-slate-200 to-slate-400 hover:from-slate-100 hover:to-slate-300 active:scale-95 border-t border-x border-white/60 shadow-[0_3px_6px_rgba(0,0,0,0.4)] flex items-center justify-center text-slate-800 text-[10px] font-bold"
                title="Increase Incline Angle (D-Pad Up)"
              >
                ▲
              </button>

              {/* Down Button */}
              <button
                onClick={() => handleAngleChange(-5)}
                className="absolute bottom-0 left-7 w-6 h-7 rounded-b-md bg-gradient-to-t from-slate-400 to-slate-200 hover:from-slate-300 hover:to-slate-100 active:scale-95 border-b border-x border-slate-600 shadow-[0_3px_6px_rgba(0,0,0,0.4)] flex items-center justify-center text-slate-800 text-[10px] font-bold"
                title="Decrease Incline Angle (D-Pad Down)"
              >
                ▼
              </button>

              {/* Left Button */}
              <button
                onClick={() => handleAngleChange(-2)}
                className="absolute left-0 top-7 w-7 h-6 rounded-l-md bg-gradient-to-r from-slate-200 to-slate-400 hover:from-slate-100 hover:to-slate-300 active:scale-95 border-l border-y border-white/60 shadow-[0_3px_6px_rgba(0,0,0,0.4)] flex items-center justify-center text-slate-800 text-[10px] font-bold"
                title="Slight Decrease (D-Pad Left)"
              >
                ◀
              </button>

              {/* Right Button */}
              <button
                onClick={() => handleAngleChange(2)}
                className="absolute right-0 top-7 w-7 h-6 rounded-r-md bg-gradient-to-l from-slate-200 to-slate-400 hover:from-slate-100 hover:to-slate-300 active:scale-95 border-r border-y border-slate-600 shadow-[0_3px_6px_rgba(0,0,0,0.4)] flex items-center justify-center text-slate-800 text-[10px] font-bold"
                title="Slight Increase (D-Pad Right)"
              >
                ▶
              </button>

              {/* Center Pivot */}
              <div className="absolute top-7 left-7 w-6 h-6 bg-slate-300 rounded-none border border-slate-400 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-inner" />
              </div>
            </div>
          </div>

          {/* Speaker Perforation Dots Center */}
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-black/30 border border-white/5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-black shadow-inner" />
            ))}
          </div>

          {/* Angled Chrome Action Buttons Right (A / B) */}
          <div className="flex items-center gap-3.5 -rotate-12">
            {/* Button B */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleCycleAngle}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-rose-400 hover:from-rose-500 hover:to-rose-300 active:scale-90 border-2 border-white/50 shadow-[0_6px_12px_rgba(0,0,0,0.6)] flex items-center justify-center text-white font-mono text-sm font-black transition-transform"
                title="Button B: Cycle Angle"
              >
                B
              </button>
              <span className="font-mono text-[9px] font-bold text-white/50">CYCLE</span>
            </div>

            {/* Button A */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleGravityPulse}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 hover:from-amber-400 hover:to-yellow-200 active:scale-90 border-2 border-white/60 shadow-[0_6px_14px_rgba(0,0,0,0.6)] flex items-center justify-center text-black font-mono text-base font-black transition-transform"
                title="Button A: Gravity Pulse!"
              >
                A
              </button>
              <span className="font-mono text-[9px] font-bold text-white/50">PULSE</span>
            </div>
          </div>
        </div>

        {/* Bottom Console Label */}
        <div className="text-center pt-1 border-t border-white/10 z-10">
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
            TACTILE HARDWARE UNIT // INTERACTIVE PHYSICAL ENGINE
          </span>
        </div>
      </div>
    </div>
  );
}
