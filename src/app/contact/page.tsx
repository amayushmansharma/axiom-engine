"use client";

import React, { useState } from "react";
import { TEAM, REPO_URL } from "@/data/team";
import { useEngineStore } from "@/state/useEngineStore";
import { Mail, Copy, Check, Github, Linkedin, Instagram, ArrowUpRight } from "lucide-react";

export default function ContactPage() {
  const { addToast } = useEngineStore();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = (email: string, name: string) => {
    navigator.clipboard
      .writeText(email)
      .then(() => {
        setCopiedEmail(email);
        addToast(`Copied ${name}'s email to clipboard!`, "success");
        setTimeout(() => setCopiedEmail(null), 2500);
      })
      .catch(() => {
        addToast("Failed to copy email.", "error");
      });
  };

  return (
    <main className="w-full min-h-screen bg-ax-paper py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-ax-ink pb-8 mb-16">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60">
            GET IN TOUCH
          </span>
          <h1 className="display-title text-[clamp(3.5rem,10vw,9.5rem)] text-ax-ink tracking-tight mt-2">
            LET&apos;S BUILD.
          </h1>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {TEAM.map((member) => {
            const isCopied = copiedEmail === member.email;
            return (
              <div
                key={member.name}
                className="p-8 sm:p-10 rounded-3xl border-2 border-ax-ink bg-ax-white shadow-[6px_6px_0px_0px_#0B0B0B] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-ax-incline">
                      {member.role}
                    </span>
                    <span className="font-mono text-xs text-ax-ink/40">AVAILABLE</span>
                  </div>

                  <h3 className="display-title text-4xl sm:text-5xl text-ax-ink tracking-tight mb-2">
                    {member.name}
                  </h3>
                  <p className="font-mono text-sm text-ax-ink/70 mb-8 select-all">
                    {member.email}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Email Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleCopyEmail(member.email, member.name)}
                      className="px-5 py-2.5 rounded-full border-2 border-ax-ink text-xs font-mono font-bold uppercase flex items-center gap-2 hover:bg-ax-ink hover:text-ax-white transition-colors"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-ax-valid" /> : <Copy className="w-4 h-4" />}
                      {isCopied ? "COPIED!" : "COPY EMAIL"}
                    </button>

                    <a
                      href={`mailto:${member.email}`}
                      className="px-5 py-2.5 rounded-full bg-ax-ink text-ax-yellow text-xs font-mono font-bold uppercase flex items-center gap-2 hover:bg-black transition-colors"
                    >
                      <Mail className="w-4 h-4" /> OPEN MAIL APP
                    </a>
                  </div>

                  {/* Social links */}
                  <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-ax-ink/15">
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s GitHub`}
                        className="px-3.5 py-1.5 rounded-full border border-ax-ink text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" /> GITHUB <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s LinkedIn`}
                        className="px-3.5 py-1.5 rounded-full border border-ax-ink text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors"
                      >
                        <Linkedin className="w-3.5 h-3.5" /> LINKEDIN <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                    {member.instagram && (
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s Instagram`}
                        className="px-3.5 py-1.5 rounded-full border border-ax-ink text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-ax-ink hover:text-ax-white transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" /> INSTAGRAM <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Repository Link (hidden when empty) */}
        {REPO_URL && (
          <div className="p-8 rounded-2xl border-2 border-ax-ink bg-ax-white shadow-[6px_6px_0px_0px_#0B0B0B] flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-xl text-ax-ink">Open Source Codebase</h4>
              <p className="font-sans text-xs sm:text-sm text-ax-ink/70">
                Inspect the deterministic mathematical solvers, AST parser, and WebGL components.
              </p>
            </div>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-ax-ink text-ax-yellow font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-black transition-colors"
            >
              <Github className="w-4 h-4" /> VIEW ON GITHUB
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
