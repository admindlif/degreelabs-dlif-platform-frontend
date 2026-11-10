"use client";

import { Clock3, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSessionCountdown } from "@/lib/auth/session-policy";

interface SessionExpiryModalProps {
  open: boolean;
  expired: boolean;
  canExtend?: boolean;
  remainingSeconds: number;
  busy: boolean;
  onStaySignedIn: () => void;
  onLogout: () => void;
}
export function SessionExpiryModal({
  open,
  expired,
  canExtend = true,
  remainingSeconds,
  busy,
  onStaySignedIn,
  onLogout,
}: SessionExpiryModalProps) {
  if (!open) return null;

  const showExtendAction = !expired && canExtend;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-brand-navy)]/55 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
      aria-describedby="session-expiry-description"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-2xl">
        <div className="border-b border-[var(--color-border-default)] bg-gradient-to-r from-orange-50 to-white p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]">
            {expired ? <Clock3 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h2
            id="session-expiry-title"
            className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]"
          >
            {expired ? "Your Session Has Expired" : "Your Session Is About to Expire"}
          </h2>
          <p
            id="session-expiry-description"
            className="mt-2 text-sm leading-relaxed text-[var(--color-text-body)]"
          >
            {expired
              ? "This session reached its inactivity or maximum sign-in limit. Sign in again to continue securely."
              : !canExtend
              ? "Your maximum sign-in duration has been reached. Save your work and sign in again to continue."
              : "Your session will expire soon. Save your work or continue your session."}
          </p>
        </div>

        <div className="space-y-5 p-6">
          {!expired && (
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Time remaining
              </div>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-[var(--color-brand-navy)]">
                {formatSessionCountdown(remainingSeconds)}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant={showExtendAction ? "secondary" : "primary"}
              onClick={onLogout}
              disabled={busy}
            >
              <LogOut className="h-4 w-4" />
              {expired || !canExtend ? "Sign In Again" : "Log Out"}
            </Button>
            {showExtendAction && (
              <Button type="button" onClick={onStaySignedIn} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Stay Signed In
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
