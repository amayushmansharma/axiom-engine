import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { StatementSection } from "@/components/home/StatementSection";
import { FeatureColumns } from "@/components/home/FeatureColumns";
import { PresetGallery } from "@/components/home/PresetGallery";
import { ArchitectureDiagram } from "@/components/home/ArchitectureDiagram";
import { FooterSection } from "@/components/home/FooterSection";

export const metadata = {
  title: "Axiom Engine — Write the math. Watch the physics. Catch the bug.",
  description:
    "A physics learning engine where handwritten derivations are parsed to LaTeX, verified step-by-step by a deterministic symbolic engine, and tied live to a running simulation in real time.",
};

export default function HomePage() {
  return (
    <main className="w-full min-h-screen bg-ax-yellow flex flex-col">
      <HeroSection />
      <StatementSection />
      <FeatureColumns />
      <PresetGallery />
      <ArchitectureDiagram />
      <FooterSection />
    </main>
  );
}
