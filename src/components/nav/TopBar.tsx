"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AxisCrossLogo } from "./AxisCrossLogo";
import { StripedGlobe } from "./StripedGlobe";

export function TopBar() {
  const pathname = usePathname();

  const isLabActive = pathname?.startsWith("/workspace");
  const isProfileActive = pathname?.startsWith("/profile");
  const isContactActive = pathname?.startsWith("/contact");

  // Determine top bar appearance based on route
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between pointer-events-auto backdrop-blur-md bg-opacity-70 transition-colors duration-300">
      {/* Brand logo top-left */}
      <Link
        href="/"
        className="flex items-center gap-2.5 group cursor-pointer"
        aria-label="Axiom Engine Home"
      >
        <AxisCrossLogo
          size={30}
          className="text-ax-ink group-hover:rotate-45 transition-transform duration-300"
        />
        <div className="flex flex-col">
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight leading-none text-ax-ink">
            AXIOM
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ax-ink opacity-70 leading-none">
            ENGINE
          </span>
        </div>
      </Link>

      {/* Rotating globe center */}
      <div className="hidden sm:flex items-center justify-center">
        <StripedGlobe size={26} className="text-ax-ink opacity-80" />
      </div>

      {/* Navigation Pills Top-Right */}
      <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main Navigation">
        <Link
          href="/workspace"
          className={`px-3.5 sm:px-5 py-1.5 rounded-full border-2 border-ax-ink font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ax-ink focus:ring-offset-2 ${
            isLabActive
              ? "bg-ax-ink text-ax-white shadow-sm"
              : "text-ax-ink bg-transparent hover:bg-ax-ink hover:text-ax-white"
          }`}
        >
          LAB
        </Link>
        <Link
          href="/profile"
          className={`px-3.5 sm:px-5 py-1.5 rounded-full border-2 border-ax-ink font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ax-ink focus:ring-offset-2 ${
            isProfileActive
              ? "bg-ax-ink text-ax-white shadow-sm"
              : "text-ax-ink bg-transparent hover:bg-ax-ink hover:text-ax-white"
          }`}
        >
          PROFILE
        </Link>
        <Link
          href="/contact"
          className={`px-3.5 sm:px-5 py-1.5 rounded-full border-2 border-ax-ink font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ax-ink focus:ring-offset-2 ${
            isContactActive
              ? "bg-ax-ink text-ax-white shadow-sm"
              : "text-ax-ink bg-transparent hover:bg-ax-ink hover:text-ax-white"
          }`}
        >
          CONTACT
        </Link>
      </nav>
    </header>
  );
}
