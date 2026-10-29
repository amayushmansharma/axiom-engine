"use client";

import React, { useEffect, useState, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
  r: number;
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse state
  const mouse = useRef({ x: -200, y: -200 });
  const lastMouse = useRef({ x: -200, y: -200 });
  const velocity = useRef(0);
  const angle = useRef(0);
  const isHovered = useRef(false);
  const isMouseDown = useRef(false);
  const rAF = useRef<number | null>(null);

  // Spring physics trail (8 points for gooey metaball fusion)
  const trail = useRef<TrailPoint[]>([
    { x: -200, y: -200, r: 24 },
    { x: -200, y: -200, r: 22 },
    { x: -200, y: -200, r: 19 },
    { x: -200, y: -200, r: 16 },
    { x: -200, y: -200, r: 13 },
    { x: -200, y: -200, r: 10 },
    { x: -200, y: -200, r: 8 },
    { x: -200, y: -200, r: 5 },
  ]);

  // DOM node refs for direct GPU transforms
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const dotRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    // Respect touch devices and reduced-motion settings
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Check for clickable/interactive target underneath cursor
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("button") ||
        target?.closest("a") ||
        target?.closest("input") ||
        target?.closest("textarea") ||
        target?.closest("[role='button']") ||
        target?.closest(".interactive")
      ) {
        isHovered.current = true;
      } else {
        isHovered.current = false;
      }
    };

    const onMouseDown = () => {
      isMouseDown.current = true;
    };

    const onMouseUp = () => {
      isMouseDown.current = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });

    // Smooth 60FPS fluid physics loop
    const animate = () => {
      // Calculate cursor velocity and direction angle
      const dx = mouse.current.x - lastMouse.current.x;
      const dy = mouse.current.y - lastMouse.current.y;
      const currentSpeed = Math.sqrt(dx * dx + dy * dy);

      // Smooth velocity easing
      velocity.current += (currentSpeed - velocity.current) * 0.2;

      if (currentSpeed > 0.5) {
        angle.current = Math.atan2(dy, dx);
      }

      lastMouse.current.x = mouse.current.x;
      lastMouse.current.y = mouse.current.y;

      // Base radius calculation with velocity dilation & hover reaction
      let baseRadius = 20;
      if (isHovered.current) baseRadius = 38;
      if (isMouseDown.current) baseRadius = 14;

      // Dynamic expansion proportional to velocity
      const velocityBonus = Math.min(28, velocity.current * 0.7);
      const headRadius = baseRadius + velocityBonus;

      // Update Head Node (Trail 0)
      const head = trail.current[0];
      head.x += (mouse.current.x - head.x) * 0.45;
      head.y += (mouse.current.y - head.y) * 0.45;
      head.r += (headRadius - head.r) * 0.25;

      // Update Trailing Nodes (Progressive spring lag)
      for (let i = 1; i < trail.current.length; i++) {
        const prev = trail.current[i - 1];
        const curr = trail.current[i];
        const lagRate = 0.38 - i * 0.02;

        curr.x += (prev.x - curr.x) * lagRate;
        curr.y += (prev.y - curr.y) * lagRate;

        // Tapered radius along the tail
        const targetRadius = Math.max(3, head.r * (1 - (i / trail.current.length) * 0.75));
        curr.r += (targetRadius - curr.r) * 0.2;
      }

      // Apply transforms directly to SVG elements
      trail.current.forEach((pt, idx) => {
        const node = nodeRefs.current[idx];
        if (node) {
          node.setAttribute("cx", pt.x.toFixed(1));
          node.setAttribute("cy", pt.y.toFixed(1));
          node.setAttribute("r", pt.r.toFixed(1));
        }
      });

      // Update pinpoint center dot
      if (dotRef.current) {
        dotRef.current.setAttribute("cx", mouse.current.x.toFixed(1));
        dotRef.current.setAttribute("cy", mouse.current.y.toFixed(1));
      }

      rAF.current = requestAnimationFrame(animate);
    };

    rAF.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      if (rAF.current) cancelAnimationFrame(rAF.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
      style={{
        mixBlendMode: "difference",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full pointer-events-none block"
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <defs>
          {/* Buttermax SVG Gooey Fusion Filter */}
          <filter id="buttermax-liquid-goo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -13"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>

        {/* Gooey Liquid Metaball Trail (Pure White with difference blend mode inverts text & backgrounds) */}
        <g filter="url(#buttermax-liquid-goo)">
          {trail.current.map((_, i) => (
            <circle
              key={i}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              cx="-200"
              cy="-200"
              r="15"
              fill="#FFFFFF"
            />
          ))}
        </g>

        {/* Sharp Center Pointer Dot */}
        <circle
          ref={dotRef}
          cx="-200"
          cy="-200"
          r="3"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
