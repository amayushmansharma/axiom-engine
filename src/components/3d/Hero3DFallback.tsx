import React from "react";

export function Hero3DFallback() {
  return (
    <div className="relative w-full h-[400px] sm:h-[500px] flex items-center justify-center pointer-events-none select-none">
      <svg
        viewBox="0 0 500 400"
        className="w-full h-full max-w-[500px] max-h-[400px] drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="chromeRamp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#94a3b8" />
            <stop offset="60%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="goldBlock" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Tilted Incline Ramp */}
        <polygon
          points="80,320 420,180 420,240 80,380"
          fill="url(#chromeRamp)"
          filter="url(#shadow)"
        />

        {/* Gold & Glass Block Resting on Ramp */}
        <polygon
          points="200,245 280,212 300,250 220,283"
          fill="url(#goldBlock)"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.95"
        />

        {/* Vector Arrows */}
        {/* Weight: mg pointing down */}
        <line x1="250" y1="248" x2="250" y2="330" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
        <polygon points="245,325 250,340 255,325" fill="#FF3B30" />
        <text x="258" y="325" fill="#FF3B30" fontSize="13" fontWeight="bold" fontFamily="monospace">mg</text>

        {/* Normal: N pointing perpendicular */}
        <line x1="250" y1="248" x2="280" y2="178" stroke="#1A55F0" strokeWidth="3" strokeLinecap="round" />
        <polygon points="273,184 285,166 288,187" fill="#1A55F0" />
        <text x="290" y="172" fill="#1A55F0" fontSize="13" fontWeight="bold" fontFamily="monospace">N</text>

        {/* Friction: f pointing up ramp */}
        <line x1="250" y1="248" x2="310" y2="223" stroke="#FF9F0A" strokeWidth="3" strokeLinecap="round" />
        <polygon points="302,230 320,218 307,218" fill="#FF9F0A" />
        <text x="325" y="222" fill="#FF9F0A" fontSize="13" fontWeight="bold" fontFamily="monospace">f_k</text>

        {/* Small Orbiting Sphere */}
        <circle cx="340" cy="140" r="14" fill="#18B26B" filter="url(#shadow)" />
      </svg>
    </div>
  );
}
