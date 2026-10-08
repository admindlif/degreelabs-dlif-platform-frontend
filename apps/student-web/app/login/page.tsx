"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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

function requiresTwoFactor(data: unknown): boolean | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "requires_2fa" in data &&
    typeof data.requires_2fa === "boolean"
  ) {
    return data.requires_2fa;
  }
  return null;
}

export default function StudentLoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // Stage: 1 = Email + Password, 2 = 2FA TOTP / Recovery Code
  const [stage, setStage] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Stage 2 inputs
  const [code, setCode] = React.useState("");
  const [isRecoveryCode, setIsRecoveryCode] = React.useState(false);

  // Status
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 403) {
          const resumeRes = await fetch(`${apiBaseUrl}/api/v1/auth/onboarding/resume`, {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password }),
          });
          if (resumeRes.ok) {
            router.push("/activate?resume=1");
            return;
          }
        }
        setError(responseDetail(data) ?? "Invalid email or password.");
        return;
      }

      const needsTwoFactor = requiresTwoFactor(data);
      if (needsTwoFactor === false) {
        const success = await refreshUser();
        if (success) {
          router.push("/");
          return;
        } else {
          setError("Your account does not have Fellow access for this portal.");
          return;
        }
      }

      if (needsTwoFactor === true) {
        setStage(2);
      } else {
        setError("Unexpected response from authentication service.");
      }
    } catch {
      setError("Unable to connect to the Fellow Portal API. Please ensure the service is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/verify`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = responseDetail(data);
        const challengeExpired =
          res.status === 401 &&
          detail !== null &&
          (detail.toLowerCase().includes("challenge") ||
            detail.toLowerCase().includes("expired"));

        if (challengeExpired) {
          setStage(1);
          setCode("");
          setError("Your 2FA session has expired. Please sign in again.");
          return;
        }

        setError(
          detail ?? "That authentication code is invalid or has expired."
        );
        return;
      }

      const success = await refreshUser();
      if (success) {
        router.push("/");
      } else {
        setError(
          "Authentication succeeded, but your Fellow session could not be loaded. Please sign in again."
        );
        setStage(1);
        setCode("");
      }
    } catch {
      setError(
        "Unable to connect to the Fellow Portal service. Please try again shortly."
      );
    } finally {
      setLoading(false);
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
            {stage === 1 ? "Sign in to your Fellowship" : "Two-Factor Verification"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {stage === 1
              ? "Access your DISCOVER phase, cohorts, and learning roadmaps."
              : isRecoveryCode
                ? "Enter one of your one-time emergency recovery codes."
                : "Enter the 6-digit code from your authenticator app."}
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

          {stage === 1 ? (
            <form onSubmit={handleStage1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Fellow Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fellow@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStage2Submit} className="space-y-4">
              <div className="flex items-center justify-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-brand-orange)]">
                  {isRecoveryCode ? <KeyRound className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 text-center">
                  {isRecoveryCode ? "Emergency Recovery Code" : "6-Digit Authenticator Code"}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={isRecoveryCode ? 16 : 8}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={isRecoveryCode ? "e.g. 1a2b-3c4d" : "123456"}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-lg font-mono tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.trim().length === 0}
                className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Verify and Sign In</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryCode(!isRecoveryCode);
                    setCode("");
                    setError(null);
                  }}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-orange)] underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {isRecoveryCode ? "Use Authenticator app code" : "Use a backup recovery code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStage(1);
                    setCode("");
                    setError(null);
                  }}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              </div>
            </form>
          )}

          {/* Invitation Activation Footer */}
          <div className="mt-6 pt-5 border-t border-[var(--color-border-default)] text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              Received a fellowship invitation link?{" "}
              <Link
                href="/activate"
                className="text-[var(--color-brand-orange)] font-semibold hover:underline"
              >
                Activate Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          DLIF ThinkProveDeliver
        </div>
      </div>
    </div>
  );
}
