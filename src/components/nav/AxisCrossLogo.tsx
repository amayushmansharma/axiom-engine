import React from "react";

export function AxisCrossLogo({
  size = 32,
  className = "",
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Axiom Engine Axis Cross Logo"
    >
      {/* Central intersection circle */}
      <circle cx="20" cy="20" r="3" fill={color} />

      {/* Horizontal Axis line */}
      <line x1="5" y1="20" x2="35" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Left Arrow Tip */}
      <path d="M 9 16 L 4 20 L 9 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right Arrow Tip */}
      <path d="M 31 16 L 36 20 L 31 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Vertical Axis line */}
      <line x1="20" y1="5" x2="20" y2="35" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Top Arrow Tip */}
      <path d="M 16 9 L 20 4 L 24 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bottom Arrow Tip */}
      <path d="M 16 31 L 20 36 L 24 31" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
