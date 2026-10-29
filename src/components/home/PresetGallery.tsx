"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface PresetCardInfo {
  id: string;
  title: string;
  domain: string;
  themeColor: string;
  tags: string[];
  bugHighlight: string;
}

const PRESETS_LIST: PresetCardInfo[] = [
  {
    id: "incline",
    title: "Block on Rough Incline",
    domain: "INCLINE",
    themeColor: "#1A55F0",
    tags: ["Kinetic Friction", "Normal Force", "Trig Bug"],
    bugHighlight: "Step 2: Used sin(θ) instead of cos(θ) for normal force",
  },
  {
    id: "atwood",
    title: "Pulley-Block System",
    domain: "ATWOOD",
    themeColor: "#5B8CC9",
    tags: ["Coupled Masses", "String Tension", "Sign Bug"],
    bugHighlight: "Step 3: Denominator sign flip (m1 - m2) instead of (m1 + m2)",
  },
  {
    id: "projectile_collision",
    title: "Target Interception",
    domain: "PROJECTILE",
    themeColor: "#18B26B",
    tags: ["Ballistics", "Conservation of Momentum", "Timing Bug"],
    bugHighlight: "Step 2: Used vertical velocity component for horizontal flight time",
  },
  {
    id: "shm",
    title: "Damped Harmonic Oscillator",
    domain: "SHM",
    themeColor: "#FF3D8B",
    tags: ["Viscous Damping", "RK4 Numerical Solver", "Dimensional Bug"],
    bugHighlight: "Step 2: Inverted ratio √(m/k) produces time [T] instead of frequency [T^-1]",
  },
];

function MiniSimCanvas({ domain, color }: { domain: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.025;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background subtle grid
      ctx.strokeStyle = "rgba(11,11,11,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (domain === "INCLINE") {
        // Draw ramp
        ctx.beginPath();
        ctx.moveTo(30, h - 30);
        ctx.lineTo(w - 30, 40);
        ctx.lineTo(w - 30, h - 30);
        ctx.closePath();
        ctx.fillStyle = "rgba(11,11,11,0.12)";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Sliding block
        const loopT = (t % 3) / 3;
        const bx = 30 + loopT * (w - 90);
        const by = h - 30 - loopT * (h - 70);

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(-Math.atan2(h - 70, w - 60));
        ctx.fillStyle = color;
        ctx.fillRect(-15, -20, 30, 20);
        ctx.restore();
      } else if (domain === "ATWOOD") {
        // Table line
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(w - 70, 60);
        ctx.lineTo(w - 70, h - 20);
        ctx.strokeStyle = "rgba(11,11,11,0.3)";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Pulley
        ctx.beginPath();
        ctx.arc(w - 70, 60, 14, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Motion loop
        const loopT = (t % 3) / 3;
        const b1x = 40 + loopT * (w - 140);
        const b2y = 80 + loopT * (h - 120);

        // String
        ctx.beginPath();
        ctx.moveTo(b1x + 20, 45);
        ctx.lineTo(w - 70, 45);
        ctx.lineTo(w - 56, b2y);
        ctx.strokeStyle = "#0B0B0B";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Block 1 (table)
        ctx.fillStyle = color;
        ctx.fillRect(b1x, 30, 28, 28);

        // Block 2 (hanging)
        ctx.fillStyle = "#FF9F0A";
        ctx.fillRect(w - 68, b2y, 24, 24);
      } else if (domain === "PROJECTILE") {
        const loopT = (t % 3) / 3;

        // Projectile trajectory arc
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(24, 178, 107, 0.4)";
        ctx.moveTo(30, h - 30);
        ctx.quadraticCurveTo(w * 0.4, 20, w - 50, h * 0.45);
        ctx.stroke();
        ctx.setLineDash([]);

        // Projectile position
        const px = 30 + loopT * (w - 80);
        const py = (h - 30) - Math.sin(loopT * Math.PI) * (h - 60);

        // Target falling from top right
        const tx = w - 50;
        const ty = 40 + loopT * (h * 0.45 - 40);

        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(tx, ty, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#FF3B30";
        ctx.fill();

        if (loopT > 0.9) {
          // Collision burst
          ctx.beginPath();
          ctx.arc(tx, ty, 18, 0, Math.PI * 2);
          ctx.strokeStyle = "#FFD500";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else if (domain === "SHM") {
        // Wall
        ctx.beginPath();
        ctx.moveTo(30, 30);
        ctx.lineTo(30, h - 30);
        ctx.strokeStyle = "rgba(11,11,11,0.4)";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Damped oscillation
        const decay = Math.exp(-((t % 6) * 0.4));
        const disp = Math.cos(t * 5) * 60 * decay;
        const massX = w * 0.55 + disp;

        // Spring coils
        ctx.beginPath();
        ctx.moveTo(30, h * 0.5);
        const coils = 10;
        for (let i = 0; i <= coils; i++) {
          const cx = 30 + (i / coils) * (massX - 50);
          const cy = h * 0.5 + (i % 2 === 0 ? -12 : 12);
          ctx.lineTo(cx, cy);
        }
        ctx.lineTo(massX, h * 0.5);
        ctx.strokeStyle = "#0B0B0B";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Mass
        ctx.fillStyle = color;
        ctx.fillRect(massX, h * 0.5 - 20, 36, 40);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [domain, color]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={150}
      className="w-full h-36 rounded-lg bg-ax-paper/80 border border-ax-ink/10"
    />
  );
}

export function PresetGallery() {
  return (
    <section className="w-full bg-ax-yellow py-24 px-4 sm:px-8 border-b-2 border-ax-ink">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div>
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60">
              OFFLINE DEMO PRESETS
            </span>
            <h2 className="display-title text-4xl sm:text-6xl text-ax-ink tracking-tight mt-2">
              SELECT YOUR SCENARIO
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm sm:text-base text-ax-ink/80 mt-4 md:mt-0">
            Four pre-baked physical scenarios with authentic student derivations.
            No sign-in, no API keys, and 100% offline verifiable.
          </p>
        </div>

        {/* 4 Big Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRESETS_LIST.map((preset) => (
            <Link
              key={preset.id}
              href={`/workspace?preset=${preset.id}`}
              className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl border-2 border-ax-ink bg-ax-white shadow-[6px_6px_0px_0px_#0B0B0B] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#0B0B0B] transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-ax-white"
                    style={{ backgroundColor: preset.themeColor }}
                  >
                    {preset.domain}
                  </span>
                  <div className="w-8 h-8 rounded-full border border-ax-ink/20 flex items-center justify-center group-hover:bg-ax-ink group-hover:text-ax-white transition-colors duration-200">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-ax-ink tracking-tight mb-2">
                  {preset.title}
                </h3>

                <p className="font-sans text-xs sm:text-sm text-ax-error font-medium mb-4">
                  ⚠️ {preset.bugHighlight}
                </p>

                {/* Mini Simulation Preview Canvas */}
                <MiniSimCanvas domain={preset.domain} color={preset.themeColor} />
              </div>

              {/* Tags & Action */}
              <div className="mt-6 pt-4 border-t border-ax-ink/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {preset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] px-2.5 py-0.5 rounded-md bg-ax-ink/5 text-ax-ink/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-xs font-bold uppercase text-ax-ink group-hover:underline">
                  LAUNCH RUNTIME →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
