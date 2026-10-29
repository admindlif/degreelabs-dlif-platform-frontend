"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api/config";
import { useAuth } from "@/lib/auth-context";

function responseDetail(data: unknown): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof (data as Record<string, unknown>).detail === "string"
  ) {
    return (data as Record<string, string>).detail;
  }
  return null;
}

function requiresTwoFactor(data: unknown): boolean | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "requires_2fa" in data &&
    typeof (data as Record<string, unknown>).requires_2fa === "boolean"
  ) {
    return (data as Record<string, unknown>).requires_2fa as boolean;
  }
  return null;
}

function requiresMfaSetup(data: unknown): boolean {
  return typeof data === "object" && data !== null &&
    "requires_2fa_setup" in data &&
    (data as Record<string, unknown>).requires_2fa_setup === true;
}

function getRecoveryCodes(data: unknown): string[] | null {
  if (typeof data !== "object" || data === null || !("recovery_codes" in data)) return null;
  const codes = (data as { recovery_codes: unknown }).recovery_codes;
  return Array.isArray(codes) && codes.every((value) => typeof value === "string") ? codes : null;
}

export default function MentorLoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // 1 = credentials, 2 = existing MFA, 3 = privileged MFA enrollment, 4 = recovery codes
  const [stage, setStage] = React.useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Stage 2 state
  const [code, setCode] = React.useState("");
  const [isRecoveryCode, setIsRecoveryCode] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
  const [issuedRecoveryCodes, setIssuedRecoveryCodes] = React.useState<string[]>([]);
  const [codesSaved, setCodesSaved] = React.useState(false);

  // Status
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getBaseUrl = React.useCallback(() => {
    return getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  }, []);

  React.useEffect(() => () => {
    if (qrCodeUrl) URL.revokeObjectURL(qrCodeUrl);
  }, [qrCodeUrl]);

  async function beginMfaEnrollment(base: string) {
    const setup = await fetch(`${base}/api/v1/auth/2fa/setup`, {
      method: "POST", credentials: "include", cache: "no-store",
    });
    const setupData: unknown = await setup.json().catch(() => null);
    if (!setup.ok) throw new Error(responseDetail(setupData) ?? "Unable to initialize MFA enrollment.");

    const qr = await fetch(`${base}/api/v1/auth/2fa/qr`, {
      method: "GET", credentials: "include", cache: "no-store",
    });
    if (!qr.ok) {
      const qrData: unknown = await qr.json().catch(() => null);
      throw new Error(responseDetail(qrData) ?? "Unable to load the authenticator QR code.");
    }
    const objectUrl = URL.createObjectURL(await qr.blob());
    setQrCodeUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return objectUrl;
    });
    setCode("");
    setStage(3);
  }

  async function handleStage1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 403) {
          const resumeRes = await fetch(`${base}/api/v1/auth/onboarding/resume`, {
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

      if (requiresMfaSetup(data)) {
        await beginMfaEnrollment(base);
        return;
      }

      const needsTwoFactor = requiresTwoFactor(data);
      if (needsTwoFactor === true) {
        setStage(2);
        return;
      }

      const ok = await refreshUser();
      if (ok) {
        router.push("/home");
      } else {
        setError("Access denied: Your account does not have Mentor Portal access.");
      }
    } catch {
      setError("Unable to connect to the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnrollmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/auth/2fa/confirm`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(responseDetail(data) ?? "The authenticator code could not be confirmed.");
        return;
      }
      const recoveryCodes = getRecoveryCodes(data);
      if (!recoveryCodes?.length) {
        setError("MFA was enabled, but recovery codes were not returned. Contact support before continuing.");
        return;
      }
      setIssuedRecoveryCodes(recoveryCodes);
      setCodesSaved(false);
      setCode("");
      setStage(4);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to confirm MFA enrollment.");
    } finally {
      setLoading(false);
    }
  }

  async function finishEnrollment() {
    setLoading(true);
    const ok = await refreshUser();
    if (ok) {
      setIssuedRecoveryCodes([]);
      router.replace("/home");
    } else {
      setError("MFA succeeded, but Mentor Portal access could not be confirmed.");
    }
    setLoading(false);
  }

  async function handleStage2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter your verification code.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/auth/2fa/verify`, {
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

        setError(detail ?? "That authentication code is invalid or has expired.");
        return;
      }

      const ok = await refreshUser();
      if (ok) {
        router.push("/home");
      } else {
        setError("Authentication succeeded, but Mentor Portal access could not be confirmed.");
        setStage(1);
        setCode("");
      }
    } catch {
      setError("Unable to connect to the authentication service. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

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
              Mentor Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {stage === 1 ? "Sign in to Mentor Portal" : stage === 2 ? "Two-Factor Verification" : stage === 3 ? "Secure Your Account" : "Save Recovery Codes"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {stage === 1
              ? "Guide cohorts, review evidence, and collaborate on Working Boards."
              : stage === 3
              ? "MFA is mandatory for Program Manager accounts. Scan the QR code, then confirm a code."
              : stage === 4
              ? "These codes are shown once. Store them securely before continuing."
              : isRecoveryCode
              ? "Enter one of your emergency recovery codes."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {stage === 1 ? (
            <form onSubmit={handleStage1Submit} className="space-y-4">
              <div>
                <label
                  htmlFor="mentor-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5"
                >
                  Mentor Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="mentor-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mentor@degreelabs.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="mentor-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[var(--color-brand-orange)] hover:underline transition-all cursor-pointer"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="mentor-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
          ) : stage === 2 ? (
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
                  onChange={(e) => setCode(e.target.value.trim())}
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
          ) : stage === 3 ? (
            <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
              <div className="mx-auto flex min-h-52 w-52 items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-white p-3">
                {qrCodeUrl ? <img src={qrCodeUrl} alt="Authenticator enrollment QR code" className="h-auto w-full" /> : <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-orange)]" />}{/* eslint-disable-line @next/next/no-img-element -- authenticated blob URL cannot use the Next image optimizer */}
              </div>
              <div>
                <label className="mb-1.5 block text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Authenticator Code</label>
                <input type="text" required autoFocus autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="123456" className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 py-3 text-center font-mono text-lg tracking-widest text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none" />
              </div>
              <button type="submit" disabled={loading || !code.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-orange)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm and Enable MFA"}
              </button>
              <p className="text-center text-xs text-[var(--color-text-muted)]">Do not share this QR code or authenticator code.</p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4" aria-label="Recovery codes">
                {issuedRecoveryCodes.map((recoveryCode) => <code key={recoveryCode} className="text-center text-sm text-[var(--color-text-primary)]">{recoveryCode}</code>)}
              </div>
              <label className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={codesSaved} onChange={(e) => setCodesSaved(e.target.checked)} className="mt-1" /><span>I have stored these one-time recovery codes in a secure location.</span></label>
              <button type="button" disabled={!codesSaved || loading} onClick={() => void finishEnrollment()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-orange)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Continue to Mentor Portal
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-border-default)] text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              Experiencing access difficulties? Contact your DLIF Program Manager.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[var(--color-brand-orange)] font-semibold animate-dlif-pulse">
          DLIF ThinkProveDeliver
        </div>
      </div>
    </div>
  );
}
