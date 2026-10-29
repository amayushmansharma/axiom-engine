import React from "react";
import Link from "next/link";

export function StripedGlobe({
  size = 28,
  className = "",
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Axiom Engine Home"
      className="inline-flex items-center justify-center p-1 rounded-full hover:scale-110 transition-transform duration-200"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-[spin_12s_linear_infinite] ${className}`}
      >
        <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1.8" />
        <ellipse cx="16" cy="16" rx="8" ry="14" stroke={color} strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="2" y1="16" x2="30" y2="16" stroke={color} strokeWidth="1.2" />
        <line x1="5" y1="10" x2="27" y2="10" stroke={color} strokeWidth="1" strokeDasharray="3 2" />
        <line x1="5" y1="22" x2="27" y2="22" stroke={color} strokeWidth="1" strokeDasharray="3 2" />
      </svg>
    </Link>
  );
}
