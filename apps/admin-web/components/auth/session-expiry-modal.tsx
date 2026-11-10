"use client";

import { Clock3, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSessionCountdown } from "@/lib/auth/session-policy";

interface SessionExpiryModalProps {
  open: boolean;
  expired: boolean;
  canExtend: boolean;
  remainingSeconds: number;
  busy: boolean;
  onStaySignedIn: () => void;
  onLogout: () => void;
}

export function SessionExpiryModal(props: SessionExpiryModalProps) {
  if (!props.open) return null;
  const showExtend = !props.expired && props.canExtend;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-brand-navy)]/60 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-session-expiry-title"
      aria-describedby="admin-session-expiry-description"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-2xl">
        <div className="border-b border-[var(--color-border-default)] bg-gradient-to-r from-orange-50 to-white p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)]">
            {props.expired ? <Clock3 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h2 id="admin-session-expiry-title" className="text-xl font-extrabold text-[var(--color-text-primary)]">
            {props.expired ? "Your Session Has Expired" : "Your Session Is About to Expire"}
          </h2>
          <p id="admin-session-expiry-description" className="mt-2 text-sm leading-relaxed text-[var(--color-text-body)]">
            {props.expired
              ? "This privileged session reached its inactivity or maximum sign-in limit. Sign in again to continue securely."
              : !props.canExtend
                ? "Your maximum sign-in duration has been reached. Save your work and sign in again to continue."
                : "For your security, your session will expire soon. Save your work or continue your session."}
          </p>
        </div>
        <div className="space-y-5 p-6">
          {!props.expired && (
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Time remaining</div>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-[var(--color-brand-navy)]">
                {formatSessionCountdown(props.remainingSeconds)}
              </div>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button type="button" variant={showExtend ? "secondary" : "primary"} onClick={props.onLogout} disabled={props.busy}>
              <LogOut className="h-4 w-4" />
              {props.expired || !props.canExtend ? "Sign In Again" : "Log Out"}
            </Button>
            {showExtend && (
              <Button type="button" onClick={props.onStaySignedIn} disabled={props.busy}>
                {props.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Stay Signed In
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
