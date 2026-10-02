"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [stage, setStage] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [challengeToken, setChallengeToken] = React.useState("");

  const [code, setCode] = React.useState("");
  const [isRecoveryCode, setIsRecoveryCode] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "Invalid administrative credentials.");
        return;
      }

      if (data.access_token) {
        const success = await login(data.access_token);
        if (success) {
          router.push("/");
          return;
        } else {
          setError("Access Denied: Your account does not have Administrator privileges.");
          return;
        }
      }

      if (data.requires_2fa && data.challenge_token) {
        setChallengeToken(data.challenge_token);
        setStage(2);
      } else {
        setError("Unexpected response from authentication service.");
      }
    } catch {
      setError("Unable to connect to Admin API (port 8002). Please verify service is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_token: challengeToken,
          code: code.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "Invalid verification code.");
        return;
      }

      if (data.access_token) {
        const success = await login(data.access_token);
        if (success) {
          router.push("/");
        } else {
          setError("Access Denied: Your account does not have Administrator privileges.");
          setStage(1);
          setCode("");
        }
      }
    } catch {
      setError("Unable to complete 2FA verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col justify-center items-center p-6 selection:bg-[var(--color-brand-orange)] selection:text-white">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/15 via-red-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-orange)] flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[var(--color-text-primary)]">
              DegreeLabs
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Admin Operations Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {stage === 1 ? "Admin Authentication" : "Two-Factor Verification"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {stage === 1
              ? "Restricted area for platform administrators and cohort operators."
              : isRecoveryCode
                ? "Enter one of your emergency recovery codes."
                : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-7 shadow-xl">
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
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@degreelabs.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-orange)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Password
                </label>
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
                    <span>Verifying Credentials...</span>
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
        </div>

        <div className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          DLIF Platform • Port 3002 • Admin Operations Runtime :8002
        </div>
      </div>
    </div>
  );
}
