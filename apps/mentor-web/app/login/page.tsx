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
  RefreshCw,
  Smartphone,
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

interface LoginResponseData {
  requires_2fa?: boolean;
  available_methods?: ("authenticator" | "email_otp")[];
  default_method?: "authenticator" | "email_otp";
  masked_email?: string;
}

export default function MentorLoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // Stage 1 = Credentials, Stage 2 = 2FA (Email OTP or Authenticator)
  const [stage, setStage] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Stage 2 state
  const [verificationMethod, setVerificationMethod] = React.useState<"email_otp" | "authenticator">("authenticator");
  const [availableMethods, setAvailableMethods] = React.useState<("authenticator" | "email_otp")[]>(["authenticator"]);
  const [maskedEmail, setMaskedEmail] = React.useState<string | null>(null);

  // Email OTP inputs & cooldown
  const [otpCode, setOtpCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const [otpSending, setOtpSending] = React.useState(false);

  // Authenticator app inputs
  const [totpCode, setTotpCode] = React.useState("");
  const [isRecoveryCode, setIsRecoveryCode] = React.useState(false);

  // Status
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getBaseUrl = React.useCallback(() => {
    return getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  }, []);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const sendEmailOtp = React.useCallback(async () => {
    setOtpSending(true);
    setError(null);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/auth/email-otp/send`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "login" }),
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
        typeof (data as Record<string, unknown>).masked_email === "string"
      ) {
        setMaskedEmail((data as Record<string, string>).masked_email);
      }
      setCooldown(60);
      return true;
    } catch {
      setError("Unable to connect to the authentication service. Please check your connection.");
      return false;
    } finally {
      setOtpSending(false);
    }
  }, [getBaseUrl]);

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

      const loginData = (data ?? {}) as LoginResponseData;

      if (loginData.requires_2fa === false) {
        const ok = await refreshUser();
        if (ok) {
          router.push("/home");
          return;
        } else {
          setError("Access denied: Your account does not have Mentor Portal access.");
          return;
        }
      }

      if (loginData.requires_2fa === true) {
        const methods = loginData.available_methods ?? ["authenticator"];
        const chosenMethod =
          loginData.default_method ??
          (methods.includes("email_otp") ? "email_otp" : "authenticator");

        setAvailableMethods(methods);
        setVerificationMethod(chosenMethod);
        if (loginData.masked_email) {
          setMaskedEmail(loginData.masked_email);
        }
        setStage(2);

        // If chosen method is email_otp, send code immediately
        if (chosenMethod === "email_otp") {
          void sendEmailOtp();
        }
      } else {
        setError("Unexpected response from authentication service.");
      }
    } catch {
      setError("Unable to connect to the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Verify Email OTP
  async function handleVerifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter your 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/auth/email-otp/verify`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode.trim(), purpose: "login" }),
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
          setOtpCode("");
          setError("Your verification session has expired. Please sign in again.");
          return;
        }

        setError(detail ?? "Invalid or expired verification code.");
        return;
      }

      const ok = await refreshUser();
      if (ok) {
        router.push("/home");
      } else {
        setError("Authentication succeeded, but Mentor Portal access could not be confirmed.");
        setStage(1);
        setOtpCode("");
      }
    } catch {
      setError("Unable to connect to the authentication service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // Verify Authenticator TOTP or recovery code
  async function handleStage2TotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCode.trim()) {
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
        body: JSON.stringify({ code: totpCode.trim() }),
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
          setTotpCode("");
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
        setTotpCode("");
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
            {stage === 1
              ? "Sign in to Mentor Portal"
              : verificationMethod === "email_otp"
              ? "Check Your Email"
              : "Two-Factor Verification"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {stage === 1
              ? "Guide cohorts, review evidence, and collaborate on Working Boards."
              : verificationMethod === "email_otp"
              ? `Enter the 6-digit code sent to ${maskedEmail ?? "your email"}`
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
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : verificationMethod === "email_otp" ? (
            /* EMAIL OTP FORM */
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div className="flex items-center justify-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-brand-orange)]">
                  <Mail className="w-7 h-7" />
                </div>
              </div>

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
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-2xl font-mono tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-1.5">
                  Valid for 5 minutes. Single-use only.
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
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify and Sign In</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                {availableMethods.includes("authenticator") ? (
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationMethod("authenticator");
                      setError(null);
                    }}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-orange)] inline-flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Use Authenticator App instead</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStage(1);
                    setOtpCode("");
                    setError(null);
                  }}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              </div>
            </form>
          ) : (
            /* AUTHENTICATOR APP FORM */
            <form onSubmit={handleStage2TotpSubmit} className="space-y-4">
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
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.trim())}
                  placeholder={isRecoveryCode ? "e.g. 1a2b-3c4d" : "123456"}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-lg font-mono tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || totpCode.trim().length === 0}
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

              <div className="flex flex-col gap-2 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryCode(!isRecoveryCode);
                      setTotpCode("");
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
                      setTotpCode("");
                      setError(null);
                    }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                </div>

                {availableMethods.includes("email_otp") && (
                  <div className="pt-2 border-t border-[var(--color-border-default)] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationMethod("email_otp");
                        setError(null);
                        void sendEmailOtp();
                      }}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-orange)] inline-flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send code to email instead</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
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
