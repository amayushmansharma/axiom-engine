"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly
    console.error("Runtime error caught by boundary:", error);
  }, [error]);

  return (
    <main className="w-full min-h-[85vh] bg-ax-paper flex flex-col items-center justify-center p-6 text-center">
      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-error mb-2">
        SYSTEM ANOMALY // EXECUTION INTERRUPTED
      </span>

      <h1 className="display-title text-[clamp(3.5rem,10vw,8rem)] text-ax-ink tracking-tight leading-[0.9] mb-6">
        RUNTIME FAULT
      </h1>

      <p className="max-w-md font-sans text-sm sm:text-base text-ax-ink/80 mb-8 font-normal">
        An unexpected mathematical divergence occurred. The deterministic engine has isolated
        the fault.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-full bg-ax-ink text-ax-yellow font-mono text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> RETRY SOLVER
        </button>

        <Link
          href="/"
          className="px-6 py-3 rounded-full border-2 border-ax-ink text-ax-ink font-mono text-xs font-bold uppercase tracking-wider hover:bg-ax-ink hover:text-ax-white transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> HOME
        </Link>
      </div>
    </main>
  );
}
