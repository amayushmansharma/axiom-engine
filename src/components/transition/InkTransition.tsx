"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function InkTransition() {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [pathname, mounted]);

  if (!isAnimating) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-ax-ink animate-[inkWipe_700ms_cubic-bezier(0.77,0,0.175,1)_forwards]" />
    </div>
  );
}
