"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  Loader2,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/lib/api/config";

const ONBOARDING_RESUME_KEY = "dlif_onboarding_resume";

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [
    { num: 1, label: "Set Password" },
    { num: 2, label: "Configure 2FA" },
    { num: 3, label: "Confirm Code" },
    { num: 4, label: "Save Recovery Codes" },
  ];

  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((s, idx) => {
        const isDone = currentStep > s.num;
        const isCurrent = currentStep === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone
                  ? "bg-[var(--color-success)] text-white"
                  : isCurrent
                    ? "bg-[var(--color-brand-orange)] text-white shadow-md ring-4 ring-orange-500/20"
                    : "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]"
                  }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wider uppercase hidden sm:block ${isCurrent
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)]"
                  }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-all ${currentStep > idx + 1
                  ? "bg-[var(--color-success)]"
                  : "bg-[var(--color-border-default)]"
                  }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StudentActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Step state
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [tokenInput, setTokenInput] = React.useState(searchParams.get("token") || "");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Intermediate auth state
  const [tempAccessToken, setTempAccessToken] = React.useState("");
  const [totpSecret, setTotpSecret] = React.useState("");
  const [otpauthUri, setOtpauthUri] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");

  // Step 4 state
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = React.useState(false);
  const [confirmedSaved, setConfirmedSaved] = React.useState(false);

  // Status
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const resumeAttempted = React.useRef(false);

  const beginTwoFactorSetup = React.useCallback(async (onboardingToken: string) => {
    const setupRes = await fetch(
      `${getApiBaseUrl()}/api/v1/auth/2fa/setup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${onboardingToken}`,
        },
      }
    );

    const setupData = await setupRes.json().catch(() => ({}));
    if (!setupRes.ok) {
      throw new Error("Unable to start two-factor authentication setup.");
    }

    setTempAccessToken(onboardingToken);
    setTotpSecret(setupData.secret);
    setOtpauthUri(setupData.totp_uri);
    setStep(2);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("resume") !== "1" || resumeAttempted.current) return;
    resumeAttempted.current = true;

    async function resumeOnboarding() {
      // Resume after the effect completes so initialization does not synchronously
      // cascade state updates from the effect body.
      await Promise.resolve();

      const onboardingToken = sessionStorage.getItem(ONBOARDING_RESUME_KEY);
      sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
      if (!onboardingToken) {
        setError("Your onboarding session is unavailable. Sign in again to resume setup.");
        return;
      }

      setLoading(true);
      try {
        await beginTwoFactorSetup(onboardingToken);
      } catch {
        setError("Unable to resume two-factor authentication setup. Sign in and try again.");
      } finally {
        setLoading(false);
      }
    }

    void resumeOnboarding();
  }, [beginTwoFactorSetup, searchParams]);

  // Step 1: Submit invitation token + password
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenInput.trim(),
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data.detail ||
          "Failed to activate invitation. Token may be invalid or expired."
        );
        return;
      }

      if (!data.onboarding_token) {
        setError(
          "Account activated, but no onboarding token was returned."
        );
        return;
      }

      const onboardingToken = data.onboarding_token;

      await beginTwoFactorSetup(onboardingToken);
    } catch {
      setError(
        "Could not reach Fellow Portal API. Please verify server status."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Confirm 2FA code & get recovery codes
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempAccessToken}`,
        },
        body: JSON.stringify({
          code: totpCode.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "Invalid 6-digit code. Please verify the code in your app.");
        return;
      }

      if (!data.access_token) {
        setError(
          "2FA was confirmed, but no access token was  returned."
        );
        return;
      }

      setTempAccessToken(data.access_token);

      setRecoveryCodes(data.recovery_codes || []);
      setStep(4);
    } catch {
      setError("Failed to verify 2FA code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyAllRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      const success = await login(tempAccessToken);
      if (success) {
        router.push("/");
      } else {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col justify-center items-center p-6 selection:bg-[var(--color-brand-orange)] selection:text-white">
      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Fellowship Account Activation
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Complete the 3-step security onboarding to access your fellowship workspace.
          </p>
        </div>

        {/* Stepper */}
        <StepIndicator currentStep={step} />

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-7 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Invitation Token
                </label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your invitation token here"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Create Password (8+ characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Invitation...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-[var(--color-brand-orange)] mb-3">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Add Account to Authenticator App
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                  Open Google Authenticator, 1Password, or Authy on your mobile device and add your DegreeLabs account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] space-y-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                    Manual Setup Key
                  </span>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)]">
                    <span className="font-mono text-sm tracking-widest text-[var(--color-text-primary)] select-all break-all">
                      {totpSecret}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(totpSecret)}
                      className="text-xs text-[var(--color-brand-orange)] hover:underline shrink-0 cursor-pointer"
                    >
                      Copy Key
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                    Authenticator URI
                  </span>
                  <p className="text-[11px] font-mono text-[var(--color-text-secondary)] break-all p-2 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] select-all">
                    {otpauthUri}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>I have configured the app → Verify Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-[var(--color-brand-orange)] mb-3">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Verify Authenticator Code
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Enter the 6-digit rolling code currently displayed in your authenticator app.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-xl font-mono tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold text-sm cursor-pointer"
                >
                  Back to Key
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="flex-2 py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Confirm & Activate</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Save Your Emergency Recovery Codes
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  These 8 one-time codes will ONLY be shown once. If you lose your phone or 2FA app, you will need one of these codes to sign in.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)]">
                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center text-[var(--color-text-primary)]">
                  {recoveryCodes.map((c, i) => (
                    <div
                      key={i}
                      className="py-1.5 px-2 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] select-all"
                    >
                      {c}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={copyAllRecoveryCodes}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-[var(--color-bg-canvas)] hover:border-[var(--color-brand-orange)] border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-primary)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedCodes ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Recovery Codes</span>
                    </>
                  )}
                </button>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedSaved}
                  onChange={(e) => setConfirmedSaved(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--color-border-default)] text-[var(--color-brand-orange)] focus:ring-[var(--color-brand-orange)]"
                />
                <span>
                  I have downloaded or copied these recovery codes and stored them safely.
                </span>
              </label>

              <button
                type="button"
                disabled={!confirmedSaved || loading}
                onClick={handleFinishOnboarding}
                className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading Fellow Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Fellow Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Back to Login link */}
          <div className="mt-6 pt-5 border-t border-[var(--color-border-default)] text-center">
            <Link
              href="/login"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Already activated your account? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentActivationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-bg-canvas)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--color-brand-orange)] animate-spin" />
        </div>
      }
    >
      <StudentActivationContent />
    </React.Suspense>
  );
}
