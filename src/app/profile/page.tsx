import React from "react";
import { TEAM } from "@/data/team";
import { Github, Linkedin, Instagram, Mail, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Profile & Creators — Axiom Engine",
  description: "Meet the creators and developers behind Axiom Engine.",
};

export default function ProfilePage() {
  return (
    <main className="w-full min-h-screen bg-ax-paper py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-ax-ink pb-8 mb-16">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60">
            CREATOR CREDITS &amp; PROJECT STORY
          </span>
          <h1 className="display-title text-[clamp(3.5rem,10vw,9rem)] text-ax-ink tracking-tight mt-2">
            THE CREATORS
          </h1>
        </div>

        {/* Project Story Paragraph */}
        <div className="p-8 sm:p-12 rounded-3xl border-2 border-ax-ink bg-ax-white shadow-[6px_6px_0px_0px_#0B0B0B] mb-16">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ax-incline mb-3 block">
            PROJECT STORY
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-ax-ink tracking-tight mb-4">
            Why We Built Axiom Engine
          </h2>
          <p className="font-sans text-base sm:text-lg text-ax-ink/80 leading-relaxed font-normal">
            Axiom Engine was created to solve a fundamental disconnect in modern STEM education:
            equations in textbooks are static, while physical reality is dynamic and interconnected.
            Students frequently memorize formulas without seeing how changing a single variable
            alters physical trajectories and forces in real time.
          </p>
          <p className="font-sans text-base sm:text-lg text-ax-ink/80 leading-relaxed font-normal mt-4">
            By combining client-side computer vision with a strict deterministic symbolic verification
            engine and 60 FPS physics solvers, Axiom allows students to write rough handwritten math,
            get immediate step-by-step verification without hallucination, and see their equations
            spring to life in a running physical simulation.
          </p>
        </div>

        {/* Developer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="p-8 sm:p-10 rounded-3xl border-2 border-ax-ink bg-ax-white shadow-[6px_6px_0px_0px_#0B0B0B] flex flex-col justify-between"
            >
              <div>
                {/* Monogram Tile */}
                <div className="w-24 h-24 rounded-2xl border-2 border-ax-ink bg-ax-ink text-ax-yellow font-display font-black text-4xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A55F0] mb-8">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>

                <h3 className="display-title text-4xl sm:text-5xl text-ax-ink tracking-tight mb-2">
                  {member.name}
                </h3>
                <p className="font-mono text-sm uppercase tracking-wider text-ax-incline font-bold mb-4">
                  {member.role}
                </p>

                {/* Key Contributions List */}
                <div className="mb-6 flex flex-col gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-black/50 font-black">
                    KEY CONTRIBUTIONS:
                  </span>
                  <ul className="flex flex-col gap-1.5 font-sans text-xs sm:text-sm text-black/80">
                    {member.contributions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contact and Social Links */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-ax-ink/15">
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s GitHub`}
                    className="px-4 py-2 rounded-full border-2 border-ax-ink text-xs font-mono font-bold uppercase flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors focus:ring-2 focus:ring-ax-ink focus:outline-none"
                  >
                    <Github className="w-4 h-4" /> GITHUB <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s LinkedIn`}
                    className="px-4 py-2 rounded-full border-2 border-ax-ink text-xs font-mono font-bold uppercase flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors focus:ring-2 focus:ring-ax-ink focus:outline-none"
                  >
                    <Linkedin className="w-4 h-4" /> LINKEDIN <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s Instagram`}
                    className="px-4 py-2 rounded-full border-2 border-ax-ink text-xs font-mono font-bold uppercase flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors focus:ring-2 focus:ring-ax-ink focus:outline-none"
                  >
                    <Instagram className="w-4 h-4" /> INSTAGRAM <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    aria-label={`Email ${member.name}`}
                    className="px-4 py-2 rounded-full border-2 border-ax-ink text-xs font-mono font-bold uppercase flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors focus:ring-2 focus:ring-ax-ink focus:outline-none"
                  >
                    <Mail className="w-4 h-4" /> EMAIL
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
