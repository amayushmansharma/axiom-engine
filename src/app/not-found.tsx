import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="w-full min-h-[85vh] bg-ax-yellow flex flex-col items-center justify-center p-6 text-center">
      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60 mb-2">
        ERROR 404 // COORDINATES UNDEFINED
      </span>

      <h1 className="display-title text-[clamp(5rem,16vw,14rem)] text-ax-ink tracking-tight leading-[0.8] mb-6">
        404
      </h1>

      <p className="max-w-md font-sans text-base sm:text-lg text-ax-ink/80 mb-8 font-medium">
        This trajectory does not exist in our physical universe. The page you are looking
        for was moved or never derived.
      </p>

      <Link
        href="/"
        className="px-8 py-3.5 rounded-full bg-ax-ink text-ax-yellow font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> RETURN TO ORIGIN
      </Link>
    </main>
  );
}
