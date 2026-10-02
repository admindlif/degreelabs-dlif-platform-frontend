"use client";

import * as React from "react";

import { getFellowContext } from "@/lib/api/fellow";
import { FellowContext, SessionSummary } from "@/lib/api/types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface PortalShellProps {
  children: React.ReactNode;
  breadcrumbItems?: string[];
  nextSession?: SessionSummary | null;
  context?: FellowContext | null;
}

export function PortalShell({
  children,
  breadcrumbItems = [],
  nextSession,
  context,
}: PortalShellProps) {
  const [loadedContext, setLoadedContext] =
    React.useState<FellowContext | null>(context ?? null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (context !== undefined) {
      return;
    }

    let active = true;

    getFellowContext()
      .then((data) => {
        if (active) setLoadedContext(data);
      })
      .catch((error) => {
        console.warn("Unable to load Fellow context:", error);
      });

    return () => {
      active = false;
    };
  }, [context]);

  const resolvedContext = context !== undefined ? context : loadedContext;

  const breadcrumbs = resolvedContext
    ? [
        resolvedContext.cohort.name,
        `${resolvedContext.current_phase.name} (${resolvedContext.current_phase.development_role})`,
        ...breadcrumbItems,
      ]
    : ["Fellow Portal", ...breadcrumbItems];

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex text-[var(--color-text-primary)]">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        context={resolvedContext}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          breadcrumbs={breadcrumbs}
          roleTitle="Fellow Portal"
          nextSession={nextSession}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
