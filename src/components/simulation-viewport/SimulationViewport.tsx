"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import {
  createScene,
  PhysicsSceneRuntime,
  computeInclineDerived,
  computeAtwoodDerived,
  computeProjectileDerived,
  computeSHMDerived,
} from "@/core-engine/physics-runtime";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Eye,
  Activity,
  Grid,
  Sliders,
} from "lucide-react";

export function SimulationViewport() {
  const {
    preset,
    symbols,
    params,
    steps,
    isPlaying,
    simSpeed,
    showVectors,
    showTrails,
    showGrid,
    resetSignal,
    setParam,
    togglePlay,
    resetSimulation,
    setSimSpeed,
    toggleVectors,
    toggleTrails,
    toggleGrid,
    addTelemetryPoint,
  } = useEngineStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<PhysicsSceneRuntime | null>(null);
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  // Dragging state for interactive viewport handles
  const [isDraggingInclineHandle, setIsDraggingInclineHandle] = useState(false);

  // Initialize or re-create physics runtime when preset or resetSignal changes
  useEffect(() => {
    try {
      runtimeRef.current = createScene(preset);
      trailRef.current = [];
    } catch {
      runtimeRef.current = null;
    }
  }, [preset, resetSignal]);

  // Update runtime parameters when params change
  useEffect(() => {
    if (runtimeRef.current) {
      for (const [k, v] of Object.entries(params)) {
        runtimeRef.current.setParam(k, v);
      }
    }
  }, [params]);

  // Main 60 FPS animation render loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_DT = 1 / 120; // 120 Hz fixed timestep

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Advance physics simulation
      if (isPlaying && runtimeRef.current) {
        accumulator += Math.min(0.1, dt * simSpeed);
        while (accumulator >= FIXED_DT) {
          runtimeRef.current.step(FIXED_DT);
          accumulator -= FIXED_DT;
        }

        // Collect telemetry
        const pt = runtimeRef.current.getTelemetryPoint();
        addTelemetryPoint(pt);
      }

      // Draw simulation scene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawScene(ctx, canvas.width, canvas.height);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, simSpeed, showVectors, showTrails, showGrid, params, preset]);

  // Canvas drawing routine (High-contrast bright Neo-Brutalist theme)
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const domain = preset.problem_metadata.domain;
    const themeColor = preset.problem_metadata.theme_color || "#1A55F0";

    // Clean, crisp off-white viewport background
    ctx.fillStyle = "#FCFBF7";
    ctx.fillRect(0, 0, width, height);

    // Subtle coordinate grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(11, 11, 11, 0.07)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    const state = runtimeRef.current ? runtimeRef.current.state() : {};

    // 1. INCLINE SCENE
    if (domain === "incline") {
      const theta = params.theta ?? 30;
      const thetaRad = (theta * Math.PI) / 180;

      // Base coordinates of the incline wedge
      const originX = width * 0.15;
      const originY = height * 0.76;
      const rampLengthPx = width * 0.68;

      const topX = originX + rampLengthPx * Math.cos(thetaRad);
      const topY = originY - rampLengthPx * Math.sin(thetaRad);

      // Draw Ramp Wedge with bold black border and soft warm fill
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(topX, topY);
      ctx.lineTo(topX, originY);
      ctx.closePath();

      ctx.fillStyle = "#F1EFEA";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Hatching inside the wedge for architectural depth
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 1.5;
      for (let hx = originX - height; hx < topX + height; hx += 16) {
        ctx.beginPath();
        ctx.moveTo(hx, originY + 10);
        ctx.lineTo(hx + height, originY - height);
        ctx.stroke();
      }
      ctx.restore();

      // Ground line with bold black border
      ctx.beginPath();
      ctx.moveTo(width * 0.05, originY);
      ctx.lineTo(width * 0.95, originY);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Ground hatching
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 1.5;
      for (let gx = width * 0.05; gx < width * 0.95; gx += 14) {
        ctx.beginPath();
        ctx.moveTo(gx, originY);
        ctx.lineTo(gx - 8, originY + 10);
        ctx.stroke();
      }

      // Interactive Handle at Top of Incline (drag angle)
      ctx.beginPath();
      ctx.arc(topX, topY, 13, 0, Math.PI * 2);
      ctx.fillStyle = isDraggingInclineHandle ? "#FFD500" : "#FFE600";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Handle center dot
      ctx.beginPath();
      ctx.arc(topX, topY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      // Angle Arc at the base
      ctx.beginPath();
      ctx.arc(originX, originY, 45, -thetaRad, 0);
      ctx.strokeStyle = "#1A55F0";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Angle readout pill
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.fillRect(originX + 50, originY - 26, 74, 20);
      ctx.strokeRect(originX + 50, originY - 26, 74, 20);
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.fillText(`θ = ${theta.toFixed(1)}°`, originX + 87, originY - 12);

      // Block Position along ramp
      const sMeters = (state.s as number) || 0;
      const totalMeters = 5.0;
      const sFraction = Math.min(1, sMeters / totalMeters);

      // Block slides down from top:
      const blockDist = (1 - sFraction) * rampLengthPx;
      const blockX = originX + blockDist * Math.cos(thetaRad);
      const blockY = originY - blockDist * Math.sin(thetaRad);

      // Motion Trail
      if (showTrails) {
        trailRef.current.push({ x: blockX, y: blockY });
        if (trailRef.current.length > 50) trailRef.current.shift();

        ctx.beginPath();
        for (let i = 0; i < trailRef.current.length; i++) {
          const pt = trailRef.current[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "rgba(26, 85, 240, 0.45)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw Block (Vibrant with bold black outline)
      const blockW = 48;
      const blockH = 32;

      ctx.save();
      ctx.translate(blockX, blockY);
      ctx.rotate(-thetaRad);

      ctx.fillStyle = themeColor;
      ctx.fillRect(-blockW / 2, -blockH, blockW, blockH);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-blockW / 2, -blockH, blockW, blockH);

      // Mass label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${params.m}kg`, 0, -blockH / 2 + 4);

      ctx.restore();

      // Draw Force Vectors (FBD)
      if (showVectors) {
        const d = computeInclineDerived({
          m: params.m ?? 5,
          g: params.g ?? 9.81,
          theta: params.theta ?? 30,
          mu: params.mu ?? 0.25,
        });

        const N = d.normalForce ?? 42.48;
        const f = d.frictionForce ?? 10.62;
        const mg = (params.m ?? 5) * (params.g ?? 9.81);
        const a = d.acceleration ?? 2.78;

        const scale = 1.4; // px per Newton

        // 1. Weight: mg straight down (Crimson Red)
        drawArrow(
          ctx,
          blockX,
          blockY - blockH / 2,
          blockX,
          blockY - blockH / 2 + Math.min(100, mg * scale),
          "#DC2626",
          `mg = ${mg.toFixed(1)}N`
        );

        // 2. Normal Force: N perpendicular to ramp (Vibrant Blue)
        const nx = blockX + Math.sin(thetaRad) * Math.min(100, N * scale);
        const ny = (blockY - blockH / 2) - Math.cos(thetaRad) * Math.min(100, N * scale);
        drawArrow(ctx, blockX, blockY - blockH / 2, nx, ny, "#2563EB", `N = ${N.toFixed(1)}N`);

        // 3. Friction Force: f up the ramp (Deep Amber)
        const fx = blockX + Math.cos(thetaRad) * Math.min(80, f * scale);
        const fy = (blockY - blockH / 2) - Math.sin(thetaRad) * Math.min(80, f * scale);
        drawArrow(ctx, blockX, blockY - blockH / 2, fx, fy, "#D97706", `f_k = ${f.toFixed(1)}N`);

        // 4. Net Acceleration: a down the ramp (Emerald Green)
        if (a > 0.01) {
          const ax = blockX - Math.cos(thetaRad) * Math.min(70, a * 12);
          const ay = (blockY - blockH / 2) + Math.sin(thetaRad) * Math.min(70, a * 12);
          drawArrow(ctx, blockX, blockY - blockH / 2, ax, ay, "#059669", `a = ${a.toFixed(2)}m/s²`);
        }
      }
    }

    // 2. ATWOOD SCENE
    else if (domain === "atwood") {
      const tableX = width * 0.15;
      const tableY = height * 0.42;
      const tableW = width * 0.55;

      // Table body with solid outline
      ctx.fillStyle = "#F1EFEA";
      ctx.fillRect(tableX, tableY, tableW, 20);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeRect(tableX, tableY, tableW, 20);

      // Table legs
      ctx.fillStyle = "#E5E7EB";
      ctx.fillRect(tableX + 15, tableY + 20, 16, height * 0.4);
      ctx.strokeRect(tableX + 15, tableY + 20, 16, height * 0.4);
      ctx.fillRect(tableX + tableW - 30, tableY + 20, 16, height * 0.4);
      ctx.strokeRect(tableX + tableW - 30, tableY + 20, 16, height * 0.4);

      // Pulley
      const pulleyX = tableX + tableW;
      const pulleyY = tableY;
      const pulleyR = 19;

      ctx.beginPath();
      ctx.arc(pulleyX, pulleyY, pulleyR, 0, Math.PI * 2);
      ctx.fillStyle = "#FFE600";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pulley central pin
      ctx.beginPath();
      ctx.arc(pulleyX, pulleyY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      // Motion
      const sMeters = (state.s as number) || 0;
      const maxMeters = 4.0;
      const sFraction = Math.min(1, sMeters / maxMeters);

      const b1x = tableX + 30 + sFraction * (tableW - 85);
      const b1y = tableY - 34;

      const b2x = pulleyX + pulleyR;
      const b2y = tableY + 45 + sFraction * (height * 0.35);

      // Rope (Bold black)
      ctx.beginPath();
      ctx.moveTo(b1x + 36, tableY - 17);
      ctx.lineTo(pulleyX, tableY - 17);
      ctx.arc(pulleyX, pulleyY, 17, -Math.PI / 2, 0);
      ctx.lineTo(b2x, b2y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Block 1 (Table)
      ctx.fillStyle = themeColor;
      ctx.fillRect(b1x, b1y, 46, 34);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(b1x, b1y, 46, 34);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${params.m1}kg`, b1x + 23, b1y + 21);

      // Block 2 (Hanging)
      ctx.fillStyle = "#EA580C";
      ctx.fillRect(b2x - 18, b2y, 36, 36);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(b2x - 18, b2y, 36, 36);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${params.m2}kg`, b2x, b2y + 22);

      // Vectors for Atwood
      if (showVectors) {
        const d = computeAtwoodDerived({
          m1: params.m1 ?? 5,
          m2: params.m2 ?? 3,
          mu: params.mu ?? 0.2,
          g: params.g ?? 9.81,
        });

        const T = d.tension ?? 22.07;
        const fk = d.frictionForce ?? 9.81;

        // Tension on Block 1 (Right - Blue)
        drawArrow(ctx, b1x + 46, b1y + 17, b1x + 46 + Math.min(65, T * 1.5), b1y + 17, "#2563EB", `T=${T.toFixed(1)}N`);
        // Friction on Block 1 (Left - Amber)
        drawArrow(ctx, b1x, b1y + 17, b1x - Math.min(50, fk * 1.5), b1y + 17, "#D97706", `f=${fk.toFixed(1)}N`);
        // Tension on Block 2 (Up - Blue)
        drawArrow(ctx, b2x, b2y, b2x, b2y - Math.min(65, T * 1.5), "#2563EB", `T=${T.toFixed(1)}N`);
        // Weight on Block 2 (Down - Red)
        const w2 = (params.m2 ?? 3) * (params.g ?? 9.81);
        drawArrow(ctx, b2x, b2y + 36, b2x, b2y + 36 + Math.min(65, w2 * 1.5), "#DC2626", `m2g=${w2.toFixed(1)}N`);
      }
    }

    // 3. PROJECTILE SCENE
    else if (domain === "projectile_collision") {
      const groundY = height * 0.80;
      const scaleX = (width * 0.75) / 30; // 30m range
      const scaleY = (height * 0.65) / 35; // 35m height

      // Ground
      ctx.beginPath();
      ctx.moveTo(width * 0.05, groundY);
      ctx.lineTo(width * 0.95, groundY);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Ground hatch marks
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 1.5;
      for (let gx = width * 0.05; gx < width * 0.95; gx += 14) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx - 8, groundY + 10);
        ctx.stroke();
      }

      const xA = (state.xA as number) || 0;
      const yA = (state.yA as number) || 0;
      const xB = (state.xB as number) || 24;
      const yB = (state.yB as number) || 32;

      const pxA = width * 0.12 + xA * scaleX;
      const pyA = groundY - yA * scaleY;

      const pxB = width * 0.12 + xB * scaleX;
      const pyB = groundY - yB * scaleY;

      // Projectile Trail
      if (showTrails) {
        trailRef.current.push({ x: pxA, y: pyA });
        if (trailRef.current.length > 70) trailRef.current.shift();

        ctx.beginPath();
        for (let i = 0; i < trailRef.current.length; i++) {
          const pt = trailRef.current[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "rgba(16, 163, 74, 0.5)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw Projectile A (Vibrant green with black border)
      ctx.beginPath();
      ctx.arc(pxA, pyA, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#16A34A";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Target B (Vibrant red with black border)
      ctx.beginPath();
      ctx.arc(pxB, pyB, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#DC2626";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Collision Flash
      if (state.collided) {
        ctx.beginPath();
        ctx.arc(pxB, pyB, 30, 0, Math.PI * 2);
        ctx.strokeStyle = "#EAB308";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#000000";
        ctx.fillRect(pxB - 45, pyB - 45, 90, 22);
        ctx.fillStyle = "#FFE600";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("COLLISION!", pxB, pyB - 30);
      }
    }

    // 4. SHM SCENE
    else if (domain === "shm") {
      const groundY = height * 0.65;
      const wallX = width * 0.15;
      const neutralX = width * 0.52;

      // Wall & Base
      ctx.beginPath();
      ctx.moveTo(wallX, height * 0.25);
      ctx.lineTo(wallX, groundY);
      ctx.lineTo(width * 0.85, groundY);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Wall hatching
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 1.5;
      for (let wy = height * 0.25; wy < groundY; wy += 14) {
        ctx.beginPath();
        ctx.moveTo(wallX, wy);
        ctx.lineTo(wallX - 10, wy + 8);
        ctx.stroke();
      }

      const xDisp = (state.x as number) ?? params.x0 ?? 0.5;
      const blockPx = neutralX + xDisp * 120;
      const blockY = groundY - 42;

      // Spring Coils (Bold black)
      ctx.beginPath();
      ctx.moveTo(wallX, groundY - 21);
      const coils = 12;
      const springLen = blockPx - wallX;
      for (let i = 0; i <= coils; i++) {
        const cx = wallX + (i / coils) * springLen;
        const cy = groundY - 21 + (i % 2 === 0 ? -16 : 16);
        ctx.lineTo(cx, cy);
      }
      ctx.lineTo(blockPx, groundY - 21);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mass Block
      ctx.fillStyle = themeColor;
      ctx.fillRect(blockPx, blockY, 52, 42);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(blockPx, blockY, 52, 42);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${params.m}kg`, blockPx + 26, blockY + 25);

      // Equilibrium dashed line
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(neutralX, height * 0.35);
      ctx.lineTo(neutralX, groundY);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.font = "bold 11px monospace";
      ctx.fillText("x = 0", neutralX, height * 0.32);

      // Vectors for SHM
      if (showVectors) {
        const k = params.k ?? 50;
        const F_spring = -k * xDisp;
        const scaleF = 0.8;
        drawArrow(
          ctx,
          blockPx + 26,
          blockY - 12,
          blockPx + 26 + Math.min(80, Math.max(-80, F_spring * scaleF)),
          blockY - 12,
          "#DC2626",
          `F_s = ${F_spring.toFixed(1)}N`
        );
      }
    }
  };

  // Helper function to draw high-contrast arrows with readable label pills
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string
  ) => {
    const headLen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    // Arrow line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle - Math.PI / 6),
      toY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLen * Math.cos(angle + Math.PI / 6),
      toY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Label Pill Box for maximum legibility on light background
    ctx.save();
    ctx.font = "bold 11px monospace";
    const textWidth = ctx.measureText(label).width;
    const pillX = toX + 6;
    const pillY = toY - 18;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillRect(pillX, pillY, textWidth + 8, 16);
    ctx.strokeRect(pillX, pillY, textWidth + 8, 16);

    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(label, pillX + 4, pillY + 12);
    ctx.restore();
  };

  // Dragging event handlers for the canvas handles
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (preset.problem_metadata.domain === "incline") {
      const theta = params.theta ?? 30;
      const thetaRad = (theta * Math.PI) / 180;
      const originX = canvas.width * 0.15;
      const originY = canvas.height * 0.76;
      const rampLengthPx = canvas.width * 0.68;
      const topX = originX + rampLengthPx * Math.cos(thetaRad);
      const topY = originY - rampLengthPx * Math.sin(thetaRad);

      const dist = Math.hypot(x - topX, y - topY);
      if (dist < 26) {
        setIsDraggingInclineHandle(true);
        canvas.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingInclineHandle && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const originX = canvasRef.current.width * 0.15;
      const originY = canvasRef.current.height * 0.76;

      const dy = originY - y;
      const dx = x - originX;
      if (dx > 20) {
        const rad = Math.atan2(dy, dx);
        const deg = (rad * 180) / Math.PI;
        setParam("theta", deg, "incline_handle");
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingInclineHandle) {
      setIsDraggingInclineHandle(false);
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-[#F8F8F5] text-ax-ink border-x-2 border-ax-ink overflow-y-auto">
      {/* Dual Angled Metallic Telemetry Antennas (Top Left & Top Right) */}
      <div className="relative w-full h-9 bg-[#FFFFFF] border-b-2 border-ax-ink flex items-center justify-between px-6 z-20 shadow-sm">
        {/* Left Antenna Base & Tip */}
        <div className="relative flex items-center gap-1.5 -top-5">
          <div className="w-2.5 h-6 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm transform -rotate-12 origin-bottom border-2 border-black">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FFD500] -mt-2 -ml-0.5 shadow-sm border-2 border-black" />
          </div>
          <span className="font-mono text-[9px] font-extrabold text-ax-ink uppercase tracking-widest pl-1 mt-6">
            ANT-L // 2.4GHz
          </span>
        </div>

        {/* Central Neo-Brutalist Hardware Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD500] border-2 border-black shadow-[2px_2px_0px_#000000]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-black" />
          <span className="font-mono text-[10px] font-black tracking-widest text-black uppercase">
            AXIOM-MAX // TELEMETRY LINK ACTIVE
          </span>
        </div>

        {/* Right Antenna Base & Tip */}
        <div className="relative flex items-center gap-1.5 -top-5">
          <span className="font-mono text-[9px] font-extrabold text-ax-ink uppercase tracking-widest pr-1 mt-6">
            ANT-R // 5.8GHz
          </span>
          <div className="w-2.5 h-6 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm transform rotate-12 origin-bottom border-2 border-black">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 -mt-2 -ml-0.5 shadow-sm border-2 border-black" />
          </div>
        </div>
      </div>

      {/* Viewport Control Bar */}
      <div className="p-3 border-b-2 border-ax-ink bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-black uppercase flex items-center gap-1.5 transition-all border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              isPlaying
                ? "bg-[#FFE600] text-black"
                : "bg-emerald-500 text-white"
            }`}
            title="Toggle Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? "PAUSE" : "RUN"}
          </button>

          {/* Reset Button */}
          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-full border-2 border-black bg-white hover:bg-slate-100 text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            title="Reset Simulation (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Presets */}
          <div className="flex items-center p-0.5 rounded-full border-2 border-black bg-[#F1EFEA]">
            {[0.25, 0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold transition-colors ${
                  simSpeed === s
                    ? "bg-black text-[#FFD500]"
                    : "text-black/70 hover:text-black"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleVectors}
            className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold flex items-center gap-1 border-2 border-black transition-all ${
              showVectors
                ? "bg-[#1A55F0] text-white shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-slate-100"
            }`}
            title="Toggle Force Vectors FBD (V)"
          >
            <Eye className="w-3 h-3" /> FBD
          </button>

          <button
            onClick={toggleTrails}
            className={`p-1.5 rounded-full border-2 border-black transition-all ${
              showTrails
                ? "bg-black text-[#FFD500] shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-slate-100"
            }`}
            title="Toggle Motion Trail"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleGrid}
            className={`p-1.5 rounded-full border-2 border-black transition-all ${
              showGrid
                ? "bg-black text-[#FFD500] shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-slate-100"
            }`}
            title="Toggle Coordinate Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recessed Bezel Screen Frame (Neo-Brutalist Light Frame) */}
      <div className="relative flex-1 w-full bg-[#F8F8F5] p-3.5 flex flex-col items-center justify-center z-10">
        <div className="relative w-full h-full max-h-[520px] rounded-2xl p-1 bg-[#FFFFFF] border-2 border-black shadow-[4px_4px_0px_#000000]">
          {/* Bezel Title Strip */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#F0EFEA] text-[10px] font-mono text-black border-b-2 border-black rounded-t-xl font-bold">
            <span className="text-[#1A55F0]">RECESSED BEZEL // HIGH-CONTRAST VIEWPORT</span>
            <span className="text-black/80 font-mono">FIXED TIMESTEP: 120Hz</span>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-[calc(100%-28px)] rounded-b-xl bg-[#FCFBF7] cursor-crosshair block"
            style={{ touchAction: "pan-y" }}
          />
        </div>
      </div>

      {/* Physical Control Deck (Bottom Parameters Panel) */}
      <div className="p-4 border-t-2 border-black bg-[#FFFFFF] z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A55F0] border border-black shadow-sm" />
            <h4 className="font-mono text-xs uppercase font-black tracking-widest text-black">
              PHYSICAL CONTROL DECK // TWO-WAY SYNC
            </h4>
          </div>
          <span className="font-mono text-[10px] text-black/60 tracking-wider font-bold">
            ROTARY DIALS &amp; METALLIC SLIDERS
          </span>
        </div>

        {/* Slider & Rotary Knob Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {symbols.map((sym) => (
            <div
              key={sym.name}
              className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#F8F8F5] border-2 border-black shadow-[2px_2px_0px_#000000]"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-black">
                  {sym.name} <span className="text-[10px] font-normal text-black/60">({sym.label})</span>
                </span>
                <span className="font-black text-black bg-[#FFD500] px-1.5 py-0.5 rounded border border-black shadow-sm">
                  {params[sym.name]} {sym.unit}
                </span>
              </div>

              {/* Rotary Knob Style Visual Indicator + Metallic Slider */}
              <div className="flex items-center gap-2.5 mt-1">
                {/* Tactile Rotary Dial Knob */}
                <div
                  className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-slate-300 via-slate-100 to-white border-2 border-black shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                  style={{
                    transform: `rotate(${((params[sym.name] - sym.min) / (sym.max - sym.min)) * 260 - 130}deg)`,
                  }}
                  title={`Dial for ${sym.label}`}
                >
                  <div className="w-1 h-3 bg-[#1A55F0] rounded-full -mt-2 shadow-sm border border-black/40" />
                </div>

                {/* Metallic Track Slider */}
                <input
                  type="range"
                  min={sym.min}
                  max={sym.max}
                  step={sym.step}
                  value={params[sym.name] ?? sym.value}
                  onChange={(e) => setParam(sym.name, parseFloat(e.target.value), "slider")}
                  className="w-full accent-black cursor-pointer h-2 bg-slate-200 rounded-lg border border-black shadow-inner"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Metal Meta Bar */}
      <div className="px-5 py-2.5 bg-[#F0EFEA] text-black flex flex-wrap items-center justify-between gap-4 text-xs font-mono z-10 border-t-2 border-black">
        <div className="flex items-center gap-4">
          <span>DOMAIN: <strong className="text-[#1A55F0] uppercase font-black">{preset.problem_metadata.domain}</strong></span>
          <span>GRAVITY g: <strong className="text-black font-black">{params.g ?? 9.81} m/s²</strong></span>
        </div>

        <div>
          <span>
            DIAGNOSTICS:{" "}
            <strong className="text-black font-black bg-[#FFD500] px-2 py-0.5 rounded border border-black">
              {steps.filter((s) => s.verifiedStatus !== "VALID").length} of {steps.length} steps require correction
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
