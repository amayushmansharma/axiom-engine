"use client";

import React from "react";
import { useEngineStore } from "@/state/useEngineStore";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useEngineStore();

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl border-2 border-ax-ink flex items-start gap-3 shadow-[4px_4px_0px_0px_#0B0B0B] transition-all duration-200 bg-ax-white ${
            toast.type === "success"
              ? "border-ax-valid"
              : toast.type === "error"
              ? "border-ax-error"
              : toast.type === "warning"
              ? "border-ax-warning"
              : "border-ax-ink"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="w-5 h-5 text-ax-valid shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-ax-error shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-ax-warning shrink-0" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-ax-incline shrink-0" />}

          <p className="flex-1 font-sans text-xs sm:text-sm text-ax-ink font-medium leading-snug">
            {toast.message}
          </p>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-ax-ink/40 hover:text-ax-ink p-0.5 rounded"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
