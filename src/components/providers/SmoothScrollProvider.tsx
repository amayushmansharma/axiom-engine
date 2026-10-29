"use client";

import React from "react";

/**
 * Native smooth scrolling provider.
 * Lenis has been removed to guarantee uninhibited two-finger trackpad gestures
 * and mouse wheel scrolling on all Mac trackpads, mice, and mobile touchscreens.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
