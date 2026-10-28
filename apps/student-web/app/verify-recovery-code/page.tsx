"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ArrowRight, ArrowLeft, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api/config";

function responseDetail(data: unknown): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof data.detail === "string"
  ) {
    return data.detail;
  }
  return null;
}

function VerifyRecoveryCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestId = searchParams.get("request_id") || "";
  const email = searchParams.get("email") || "";

  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = React.useState<string | null>(null);

  // Cooldown countdown (starts at 60 seconds on initial load)
  const [cooldown, setCooldown] = React.useState(60);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 8) {
      setError("Please enter the complete 8-digit verification code.");
      return;
    }

    if (!requestId) {
      setError("Recovery session is missing or invalid. Please request a new recovery code.");
      return;
    }

    setError(null);
    setResendSuccess(null);
    setLoading(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/password-reset/verify`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recovery_request_id: requestId,
          code: cleanCode,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(responseDetail(data) ?? "Invalid recovery code.");
        return;
      }

      const resetAuth = data?.reset_authorization;
      if (!resetAuth) {
        setError("Invalid response received from verification service.");
        return;
      }

      // Navigate to Reset Password page with authorization token
      router.push(`/reset-password?auth=${encodeURIComponent(resetAuth)}`);
    } catch {
      setError("Unable to connect to the recovery service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !requestId) return;

    setError(null);
    setResendSuccess(null);
    setResending(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/password-reset/resend`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recovery_request_id: requestId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(responseDetail(data) ?? "Unable to resend recovery code.");
        return;
      }

      setResendSuccess("A new recovery code has been sent to your email.");
      setCode("");
      setCooldown(60);
    } catch {
      setError("Unable to resend code right now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[var(--color-brand-orange)] selection:text-white">
      {/* Background radial accent glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <Image
              src="/degreelabs-logo.png"
              alt="DegreeLabs"
              width={160}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Fellow Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Verify Recovery Code
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm">
            {email ? (
              <>
                Enter the recovery code sent to{" "}
                <span className="font-semibold text-[var(--color-text-primary)]">{email}</span>.
              </>
            ) : (
              "Enter the recovery code sent to your registered email address."
            )}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resendSuccess}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-brand-orange)]">
                <KeyRound className="w-7 h-7" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 text-center">
                8-Digit Recovery Code
              </label>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCode(val);
                }}
                placeholder="12345678"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-xl font-mono tracking-[0.3em] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors disabled:opacity-60"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-2">
                This single-use code is valid for 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 8}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Code Action */}
          <div className="mt-5 text-center">
            {cooldown > 0 ? (
              <span className="text-xs text-[var(--color-text-muted)]">
                Didn't receive the email? Resend code in{" "}
                <span className="font-semibold text-[var(--color-text-secondary)]">{cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs font-semibold text-[var(--color-brand-orange)] hover:underline cursor-pointer inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Secondary Action */}
          <div className="mt-6 pt-5 border-t border-[var(--color-border-default)] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyRecoveryCodePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-bg-canvas)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-orange)]" />
        </div>
      }
    >
      <VerifyRecoveryCodeForm />
    </React.Suspense>
  );
}
