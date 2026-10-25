"use client";

import * as React from "react";
import { SerifHighlight } from "@/components/ui/serif-highlight";
import { Badge } from "@/components/ui/badge";
import { FellowUserSummary, CohortSummary } from "@/lib/api/types";

interface FellowshipHeroProps {
  fellow?: FellowUserSummary | null;
  cohort?: CohortSummary | null;
}

export function FellowshipHero({ fellow, cohort }: FellowshipHeroProps) {
  const firstName = fellow?.first_name ?? null;

  return (
    <section
      aria-label="Fellowship welcome"
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-brand-navy)] px-6 py-10 sm:px-10 sm:py-14"
    >
      {/* Decorative geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, var(--color-brand-orange) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, var(--color-brand-blue) 0%, transparent 70%)",
        }}
      />
      {/* Fine grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-brand-orange) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-orange) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-3xl space-y-5">
        {/* Cohort badge */}
        {cohort && (
          <div>
            <Badge variant="brand" size="sm">
              {cohort.name}
            </Badge>
          </div>
        )}

        {/* Eyebrow */}
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-brand-orange)] motion-reduce:transition-none">
          DegreeLabs Impact Fellowship
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          {firstName ? (
            <>
              Welcome,{" "}
              <SerifHighlight className="text-[var(--color-brand-orange)]">
                {firstName}
              </SerifHighlight>
              .
            </>
          ) : (
            <>
              Welcome to the{" "}
              <SerifHighlight className="text-[var(--color-brand-orange)]">
                Fellowship
              </SerifHighlight>
              .
            </>
          )}
        </h1>

        {/* Sub-heading */}
        <p className="max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          A strategic problem-solving fellowship built around real company
          challenges. Investigate, reason, make choices, build evidence and work
          towards company-ready recommendations and measurable business impact.
        </p>

        {/* Tagline */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span
            className="font-mono text-sm font-bold tracking-widest text-white sm:text-base"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            THINK
          </span>
          <span className="text-[var(--color-brand-orange)] font-bold">→</span>
          <span
            className="font-mono text-sm font-bold tracking-widest text-white sm:text-base"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            PROVE
          </span>
          <span className="text-[var(--color-brand-orange)] font-bold">→</span>
          <span
            className="font-mono text-sm font-bold tracking-widest text-white sm:text-base"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            DELIVER
          </span>
        </div>

        {/* Motto */}
        <p
          className="text-sm text-white/50"
          style={{ fontFamily: "var(--font-serif-accent)", fontStyle: "italic" }}
        >
          Where learning ends, solving begins.
        </p>
      </div>
    </section>
  );
}
