"use client";

import React, { useMemo } from "react";
import katex from "katex";

export function KaTeXBlock({
  math,
  block = false,
  className = "",
}: {
  math: string;
  block?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`inline-block select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
