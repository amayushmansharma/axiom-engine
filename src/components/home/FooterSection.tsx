"use client";

import React from "react";
import Link from "next/link";
import { TEAM, REPO_URL } from "@/data/team";
import { Github, Linkedin, Instagram, Mail, ArrowUpRight } from "lucide-react";
import { AxisCrossLogo } from "../nav/AxisCrossLogo";

export function FooterSection() {
  return (
    <footer className="w-full bg-ax-yellow pt-20 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col justify-between">
        {/* Giant Call to Action */}
        <div className="border-b-2 border-ax-ink pb-16 mb-16">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ax-ink/60">
            CONNECT WITH THE CREATORS
          </span>
          <h2 className="display-title text-[clamp(3.5rem,12vw,12rem)] text-ax-ink tracking-tight leading-[0.85] mt-2 mb-8">
            LET&apos;S TALK.
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-full bg-ax-ink text-ax-yellow font-mono text-sm sm:text-base font-bold uppercase tracking-wider hover:bg-black transition-all duration-200"
            >
              SEND A MESSAGE
            </Link>
            <Link
              href="/profile"
              className="px-8 py-3.5 rounded-full border-2 border-ax-ink text-ax-ink font-mono text-sm sm:text-base font-bold uppercase tracking-wider hover:bg-ax-ink hover:text-ax-white transition-all duration-200"
            >
              VIEW PROFILE &amp; CREDITS
            </Link>
          </div>
        </div>

        {/* Team Monograms & Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-16 border-b border-ax-ink/20">
          {TEAM.map((member) => (
            <div key={member.name} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-ax-ink bg-ax-ink text-ax-yellow font-display font-black text-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#0B0B0B]">
                {member.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h3 className="font-display font-black text-2xl text-ax-ink">
                  {member.name}
                </h3>
                <p className="font-mono text-xs uppercase tracking-wider text-ax-ink/60 mb-2">
                  {member.role}
                </p>

                <div className="flex items-center gap-2">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name}'s GitHub Profile`}
                      className="p-2 rounded-full border border-ax-ink hover:bg-ax-ink hover:text-ax-white transition-colors duration-150 focus:ring-2 focus:ring-ax-ink focus:outline-none"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name}'s LinkedIn Profile`}
                      className="p-2 rounded-full border border-ax-ink hover:bg-ax-ink hover:text-ax-white transition-colors duration-150 focus:ring-2 focus:ring-ax-ink focus:outline-none"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.instagram && (
                    <a
                      href={member.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name}'s Instagram Profile`}
                      className="p-2 rounded-full border border-ax-ink hover:bg-ax-ink hover:text-ax-white transition-colors duration-150 focus:ring-2 focus:ring-ax-ink focus:outline-none"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      aria-label={`Email ${member.name}`}
                      className="p-2 rounded-full border border-ax-ink hover:bg-ax-ink hover:text-ax-white transition-colors duration-150 focus:ring-2 focus:ring-ax-ink focus:outline-none"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ax-ink/70">
          <div className="flex items-center gap-2">
            <AxisCrossLogo size={20} color="#0B0B0B" />
            <span className="font-bold text-ax-ink">AXIOM ENGINE</span>
            <span>— Designed and developed by Priya &amp; Anurag</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-2.5 py-0.5 rounded bg-ax-ink text-ax-yellow font-bold text-[10px] tracking-wider uppercase">
              Built for hackathon demo
            </span>
            <span>&copy; 2026 Axiom Engine. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
