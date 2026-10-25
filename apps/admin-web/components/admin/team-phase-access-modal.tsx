"use client";

import * as React from "react";
import { AdminTeam } from "@/lib/api/admin";
import { FellowshipPhaseAccessControl } from "./fellowship-phase-access-control";

interface TeamPhaseAccessModalProps {
  team: AdminTeam;
  onClose: () => void;
  onChanged?: () => Promise<void> | void;
}

export function TeamPhaseAccessModal({
  team,
  onClose,
  onChanged,
}: TeamPhaseAccessModalProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-xs sm:p-4 animate-in fade-in">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-border-default)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-brand-orange)] uppercase tracking-wider">
                Team Phase Management
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)]">
                Team {team.name}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] mt-1">
              Phase Progression & Access Control
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Review and manage access gates for Phase 02 (VALIDATE) and Phase 03 (GROW).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close phase access modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ×
          </button>
        </div>

        {/* Phase Access Control Section */}
        <FellowshipPhaseAccessControl team={team} onChanged={onChanged} />

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[var(--color-border-default)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
