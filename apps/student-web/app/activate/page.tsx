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
  ArrowLeft,
  AlertCircle,
  Loader2,
  QrCode,
  Mail,
  RefreshCw,
  Smartphone,
} from "lucide-react";
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

function recoveryCodesFrom(data: unknown): string[] | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "recovery_codes" in data &&
    Array.isArray(data.recovery_codes) &&
    data.recovery_codes.every((code) => typeof code === "string")
  ) {
    return data.recovery_codes;
  }
  return null;
}

function StepIndicator({
  currentStep,
  method,
}: {
  currentStep: 1 | 2 | 3 | 4;
  method: "email_otp" | "authenticator";
}) {
  const steps =
    method === "email_otp"
      ? [
          { num: 1, label: "Set Password" },
          { num: 2, label: "Verify Email" },
        ]
      : [
          { num: 1, label: "Set Password" },
          { num: 2, label: "Configure 2FA" },
          { num: 3, label: "Confirm Code" },
          { num: 4, label: "Recovery Codes" },
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-[var(--color-success,#16a34a)] text-white"
                    : isCurrent
                    ? "bg-[var(--color-brand-orange,#ea580c)] text-white shadow-md ring-4 ring-orange-500/20"
                    : "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wider uppercase hidden sm:block ${
                  isCurrent
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-all ${
                  currentStep > idx + 1
                    ? "bg-[var(--color-success,#16a34a)]"
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
  const { refreshUser } = useAuth();
  const isResume = searchParams.get("resume") === "1";

  // Step state: 1 = Password, 2 = Verify (Email OTP or Authenticator QR), 3 = Authenticator Confirm, 4 = Recovery Codes
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(isResume ? 2 : 1);
  const [invitationToken] = React.useState(
    () => searchParams.get("token")?.trim() ?? ""
  );
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Verification method selection: default to email_otp for Fellow convenience
  const [method, setMethod] = React.useState<"email_otp" | "authenticator">("email_otp");

  // Email OTP state
  const [maskedEmail, setMaskedEmail] = React.useState<string | null>(null);
  const [otpCode, setOtpCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const [otpSending, setOtpSending] = React.useState(false);

  // Authenticator state
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = React.useState(false);
  const [confirmedSaved, setConfirmedSaved] = React.useState(false);

  // Status
  const [loading, setLoading] = React.useState(isResume);
  const [error, setError] = React.useState<string | null>(null);
  const resumeAttempted = React.useRef(false);
  const qrCodeUrlRef = React.useRef<string | null>(null);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const replaceQrCodeUrl = React.useCallback((nextUrl: string) => {
    if (qrCodeUrlRef.current) {
      URL.revokeObjectURL(qrCodeUrlRef.current);
    }
    qrCodeUrlRef.current = nextUrl;
    setQrCodeUrl(nextUrl);
  }, []);

  React.useEffect(() => {
    return () => {
      if (qrCodeUrlRef.current) {
        URL.revokeObjectURL(qrCodeUrlRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!searchParams.has("token")) return;

    const visibleParams = new URLSearchParams(searchParams.toString());
    visibleParams.delete("token");
    const query = visibleParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `/activate?${query}` : "/activate"
    );
  }, [searchParams]);

  const sendEmailOtp = React.useCallback(async () => {
    setOtpSending(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/email-otp/send`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "activation" }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(responseDetail(data) ?? "Failed to send verification code. Please try again.");
        return false;
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "masked_email" in data &&
        typeof data.masked_email === "string"
      ) {
        setMaskedEmail(data.masked_email);
      }
      setCooldown(60);
      return true;
    } catch {
      setError("Unable to connect to the authentication service. Please check your connection.");
      return false;
    } finally {
      setOtpSending(false);
    }
  }, []);

  const beginTwoFactorSetup = React.useCallback(async () => {
    const setupRes = await fetch(
      `${getApiBaseUrl()}/api/v1/auth/2fa/setup`,
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }
    );

    const setupData: unknown = await setupRes.json().catch(() => null);
    if (!setupRes.ok) {
      throw new Error(
        responseDetail(setupData) ??
          "Unable to start two-factor authentication setup."
      );
    }

    const qrRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/qr`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!qrRes.ok) {
      const qrError: unknown = await qrRes.json().catch(() => null);
      throw new Error(
        responseDetail(qrError) ?? "Unable to load your QR code. Please try again."
      );
    }

    const qrBlob = await qrRes.blob();
    replaceQrCodeUrl(URL.createObjectURL(qrBlob));
    setStep(2);
  }, [replaceQrCodeUrl]);

  // Handle resume flow
  React.useEffect(() => {
    if (!isResume || resumeAttempted.current) return;
    resumeAttempted.current = true;

    async function resumeOnboarding() {
      try {
        setMethod("email_otp");
        await sendEmailOtp();
      } catch {
        setError(
          "Your onboarding session has expired. Sign in again to continue setup."
        );
      } finally {
        setLoading(false);
      }
    }

    void resumeOnboarding();
  }, [isResume, sendEmailOtp]);

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

    if (!invitationToken) {
      setError(
        "This invitation link is missing its activation token. Please reopen the link from your invitation email."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/activate`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: invitationToken,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          responseDetail(data) ??
          "Failed to activate invitation. Token may be invalid or expired."
        );
        return;
      }

      setStep(2);
      setMethod("email_otp");
      await sendEmailOtp();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to connect to the Fellow Portal service. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 (Email OTP): Verify 6-digit OTP code & activate account
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/email-otp/verify`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: otpCode.trim(),
          purpose: "activation",
        }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          responseDetail(data) ??
          "Invalid or expired verification code. Please check your code and try again."
        );
        return;
      }

      const success = await refreshUser();
      if (success) {
        router.push("/home");
      } else {
        setError(
          "Account activated successfully, but unable to load session. Please sign in to continue."
        );
      }
    } catch {
      setError("Unable to connect to the authentication service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 (Authenticator): Confirm 2FA code & get recovery codes
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/confirm`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: totpCode.trim(),
        }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          responseDetail(data) ??
            "That authentication code is invalid or has expired."
        );
        return;
      }

      const codes = recoveryCodesFrom(data);
      if (!codes || codes.length === 0) {
        setError("Your account was activated, but recovery codes could not be displayed.");
        return;
      }

      setRecoveryCodes(codes);
      setStep(4);
    } catch {
      setError("Failed to verify 2FA code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyAllRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 3000);
    } catch {
      setError("Unable to copy recovery codes. Please save them manually.");
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await refreshUser();
      if (success) {
        setRecoveryCodes([]);
        router.push("/home");
      } else {
        setError(
          "Your account is active, but the authenticated session could not be loaded. Please sign in again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToAuthenticator = async () => {
    setError(null);
    setLoading(true);
    try {
      await beginTwoFactorSetup();
      setMethod("authenticator");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start Authenticator setup. You can continue with Email OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchToEmailOtp = async () => {
    setError(null);
    setMethod("email_otp");
    setStep(2);
    await sendEmailOtp();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[var(--color-brand-orange)] selection:text-white">
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
            Complete security onboarding to access your fellowship workspace.
          </p>
        </div>

        {/* Stepper */}
        <StepIndicator currentStep={step} method={method} />

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-7 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Set Password */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {!invitationToken && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs">
                  This invitation link is incomplete. Reopen the activation link from your invitation email.
                </div>
              )}

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
                disabled={loading || !invitationToken}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting up your account... This may take a moment.</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Email OTP Method */}
          {step === 2 && method === "email_otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-[var(--color-brand-orange)] mb-3">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Verify Your Email Address
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                  A 6-digit verification code was sent to{" "}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {maskedEmail ?? "your registered email"}
                  </span>
                  .
                </p>
              </div>

              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 text-center">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-2xl font-mono tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-1.5">
                    Valid for 5 minutes. Code can only be used once.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[var(--color-text-muted)]">Didn&apos;t receive a code?</span>
                  <button
                    type="button"
                    disabled={cooldown > 0 || otpSending}
                    onClick={() => void sendEmailOtp()}
                    className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-brand-orange)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${otpSending ? "animate-spin" : ""}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter Fellow Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Authenticator App */}
              <div className="pt-4 border-t border-[var(--color-border-default)] text-center">
                <button
                  type="button"
                  onClick={() => void switchToAuthenticator()}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Prefer an app? Set up Authenticator App instead</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Authenticator QR Code Setup */}
          {step === 2 && method === "authenticator" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-[var(--color-brand-orange)] mb-3">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Set up two-factor authentication
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                  Open your authenticator app and scan this QR code.
                </p>
              </div>

              <ol className="space-y-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4 text-xs text-[var(--color-text-secondary)]">
                <li>1. Open a compatible authenticator app.</li>
                <li>2. Tap + or Add account.</li>
                <li>3. Scan the QR code below.</li>
                <li>4. Continue and enter the generated 6-digit code.</li>
              </ol>

              <div className="flex min-h-52 items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-white p-4">
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt="DegreeLabs two-factor authentication QR code"
                    width={224}
                    height={224}
                    unoptimized
                    className="h-56 w-56 object-contain"
                  />
                ) : loading ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-orange)]" />
                    <span>Loading your secure QR code...</span>
                  </div>
                ) : (
                  <p className="max-w-xs text-center text-xs text-[var(--color-text-muted)]">
                    Your QR code is unavailable. Return to sign in and resume onboarding.
                  </p>
                )}
              </div>

              <p className="text-center text-[11px] text-[var(--color-text-muted)]">
                Supported apps: Google Authenticator, Microsoft Authenticator, Authy, and 1Password.
              </p>

              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!qrCodeUrl || loading}
                className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>I&apos;ve scanned the QR code</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Switch to Email OTP */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => void switchToEmailOtp()}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Verify with email code instead</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Authenticator Code Confirmation */}
          {step === 3 && method === "authenticator" && (
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

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold text-sm cursor-pointer"
                >
                  Back to QR code
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

          {/* STEP 4: Recovery Codes (Authenticator Only) */}
          {step === 4 && method === "authenticator" && (
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
