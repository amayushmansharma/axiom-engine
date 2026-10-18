import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ax-yellow": "#FFD500",
        "ax-ink": "#0B0B0B",
        "ax-paper": "#ECECEC",
        "ax-white": "#FFFFFF",
        "ax-incline": "#1A55F0",
        "ax-pulley": "#5B8CC9",
        "ax-projectile": "#18B26B",
        "ax-shm": "#FF3D8B",
        "ax-valid": "#18B26B",
        "ax-error": "#FF3B30",
        "ax-warning": "#FF9F0A",
        "ax-propagated": "#8E8E93",
      },
      fontFamily: {
        display: ["var(--font-inter-tight)", "Inter", "system-ui", "sans-serif"],
        script: ["var(--font-caveat)", "cursive"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.04em",
      },
      lineHeight: {
        compact: "0.85",
      },
    },
  },
  plugins: [],
};

export default config;
