import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { TopBar } from "@/components/nav/TopBar";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import { Preloader } from "@/components/preloader/Preloader";
import { InkTransition } from "@/components/transition/InkTransition";
import { ToastContainer } from "@/components/toasts/ToastContainer";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export const viewport: Viewport = {
  themeColor: "#FFD500",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Axiom Engine — Write the math. Watch the physics. Catch the bug.",
  description:
    "A physics learning engine where handwritten derivations are parsed to LaTeX, verified step-by-step by a deterministic symbolic engine, and tied live to a running simulation in real time.",
  authors: [{ name: "Priya Kumari" }, { name: "Anurag Tiwari" }],
  creator: "Priya & Anurag",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Axiom Engine — Write the math. Watch the physics. Catch the bug.",
    description:
      "Deterministic symbolic mathematics meets 60 FPS interactive physics simulations.",
    type: "website",
    siteName: "Axiom Engine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiom Engine",
    description: "Write the math. Watch the physics. Catch the bug.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ax-yellow text-ax-ink antialiased selection:bg-ax-ink selection:text-ax-yellow font-sans">
        <SmoothScrollProvider>
          <Preloader />
          <CustomCursor />
          <InkTransition />
          <TopBar />
          {children}
          <ToastContainer />
        </SmoothScrollProvider>

        {/* Screen Reader Live Region for Accessibility */}
        <div id="sr-announcements" aria-live="polite" className="sr-only" />
      </body>
    </html>
  );
}
