"use client";

import React, { useEffect, useRef } from "react";

interface InkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export function FluidInkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize, { passive: true });

    const particles: InkParticle[] = [];
    let lastX = -1;
    let lastY = -1;
    let lastTime = performance.now();

    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = lastX === -1 ? 0 : e.clientX - lastX;
      const dy = lastY === -1 ? 0 : e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;

      // Add fluid particles along path
      const count = Math.min(8, Math.max(2, Math.floor(speed * 3)));
      for (let i = 0; i < count; i++) {
        const ratio = i / count;
        const px = (lastX === -1 ? e.clientX : lastX + dx * ratio) + (Math.random() - 0.5) * 6;
        const py = (lastY === -1 ? e.clientY : lastY + dy * ratio) + (Math.random() - 0.5) * 6;

        particles.push({
          x: px,
          y: py,
          vx: dx * 0.05 + (Math.random() - 0.5) * 1.5,
          vy: dy * 0.05 + (Math.random() - 0.5) * 1.5,
          radius: Math.max(3, Math.min(22, 14 - speed * 4 + Math.random() * 6)),
          alpha: 0.85,
          maxLife: 45 + Math.random() * 25,
          life: 0,
        });
      }

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect and draw particles like liquid ink
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;

        const progress = p.life / p.maxLife;
        const currentAlpha = Math.max(0, (1 - progress) * p.alpha);

        if (progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(11, 11, 11, ${currentAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
