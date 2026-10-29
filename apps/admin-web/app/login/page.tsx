"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2,
  Lock, Mail, Shield, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/lib/api/config";

type LoginStage = "password" | "verify" | "enroll" | "recovery";

function responseDetail(data: unknown): string | null {
  if (typeof data === "object" && data !== null && "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string") {
    return (data as { detail: string }).detail;
  }
  return null;
}

function booleanField(data: unknown, field: "requires_2fa" | "requires_2fa_setup"): boolean | null {
  if (typeof data === "object" && data !== null && field in data &&
      typeof (data as Record<string, unknown>)[field] === "boolean") {
    return (data as Record<string, boolean>)[field];
  }
  return null;
}

function recoveryCodes(data: unknown): string[] | null {
  if (typeof data !== "object" || data === null || !("recovery_codes" in data)) return null;
  const codes = (data as { recovery_codes: unknown }).recovery_codes;
  return Array.isArray(codes) && codes.every((code) => typeof code === "string") ? codes : null;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const apiUrl = getApiBaseUrl();
  const sessionExpired = searchParams.get("session_expired") === "1";

  const [stage, setStage] = React.useState<LoginStage>("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [isRecoveryCode, setIsRecoveryCode] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
  const [issuedRecoveryCodes, setIssuedRecoveryCodes] = React.useState<string[]>([]);
  const [codesSaved, setCodesSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => () => {
    if (qrCodeUrl) URL.revokeObjectURL(qrCodeUrl);
  }, [qrCodeUrl]);

  const finishSignIn = React.useCallback(async () => {
    const success = await refreshUser();
    if (success) {
      setIssuedRecoveryCodes([]);
      router.replace("/");
      return true;
    }
    setError("Access denied: Your account does not have Administrator privileges.");
    return false;
  }, [refreshUser, router]);

  const beginMfaEnrollment = async () => {
    const setup = await fetch(`${apiUrl}/api/v1/auth/2fa/setup`, {
      method: "POST", credentials: "include", cache: "no-store",
    });
    const setupData: unknown = await setup.json().catch(() => null);
    if (!setup.ok) throw new Error(responseDetail(setupData) ?? "Unable to initialize MFA enrollment.");

    const qr = await fetch(`${apiUrl}/api/v1/auth/2fa/qr`, {
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
    setStage("enroll");
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(responseDetail(data) ?? "Invalid administrative credentials.");
        return;
      }

      if (booleanField(data, "requires_2fa_setup") === true) {
        await beginMfaEnrollment();
      } else if (booleanField(data, "requires_2fa") === true) {
        setStage("verify");
      } else if (booleanField(data, "requires_2fa") === false) {
        await finishSignIn();
      } else {
        setError("Unexpected response from authentication service.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to connect to the Admin API.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/2fa/verify`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = responseDetail(data);
        if (response.status === 401 && detail && /challenge|expired/i.test(detail)) {
          setStage("password");
          setCode("");
          setError("Your 2FA session has expired. Please sign in again.");
        } else setError(detail ?? "Invalid verification code.");
        return;
      }
      await finishSignIn();
    } catch {
      setError("Unable to complete 2FA verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/2fa/confirm`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(responseDetail(data) ?? "The authenticator code could not be confirmed.");
        return;
      }
      const codes = recoveryCodes(data);
      if (!codes?.length) {
        setError("MFA was enabled, but recovery codes were not returned. Contact support before continuing.");
        return;
      }
      setIssuedRecoveryCodes(codes);
      setCodesSaved(false);
      setCode("");
      setStage("recovery");
    } catch {
      setError("Unable to confirm MFA enrollment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const title = stage === "password" ? "Admin Authentication"
    : stage === "verify" ? "Two-Factor Verification"
    : stage === "enroll" ? "Secure Your Account"
    : "Save Recovery Codes";

  return <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[var(--color-brand-orange)] selection:text-white">
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-30">
      <div className="w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/15 via-red-500/5 to-transparent rounded-full blur-3xl" />
    </div>
    <div className="w-full max-w-md relative z-10">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-[var(--color-brand-orange)] flex items-center justify-center text-white shadow-md"><ShieldAlert className="w-6 h-6" /></div><span className="font-bold text-2xl tracking-tight text-[var(--color-text-primary)]">DegreeLabs</span></div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] mb-2"><span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)]" /><span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Admin Operations Portal</span></div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {stage === "password" ? "Restricted area for platform administrators and cohort operators."
            : stage === "verify" ? (isRecoveryCode ? "Enter one of your emergency recovery codes." : "Enter the code from your authenticator app.")
            : stage === "enroll" ? "MFA is mandatory for privileged accounts. Scan the QR code, then confirm a code."
            : "These codes are shown once. Store them securely before continuing."}
        </p>
      </div>
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-7 shadow-xl">
        {sessionExpired && !error && stage === "password" && <Notice>Your session has expired. Please sign in again to continue.</Notice>}
        {error && <Notice error>{error}</Notice>}

        {stage === "password" && <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Field label="Administrator Email" icon={<Mail className="w-4 h-4" />}><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@degreelabs.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-orange)]" /></Field>
          <Field label="Password" icon={<Lock className="w-4 h-4" />}><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-orange)]" /></Field>
          <PrimaryButton loading={loading} label="Continue securely" />
        </form>}

        {stage === "verify" && <form onSubmit={handleVerifySubmit} className="space-y-4">
          <AuthIcon recovery={isRecoveryCode} />
          <CodeInput recovery={isRecoveryCode} code={code} setCode={setCode} />
          <PrimaryButton loading={loading} label="Verify and sign in" />
          <div className="flex items-center justify-between pt-2 text-xs">
            <button type="button" onClick={() => { setIsRecoveryCode(!isRecoveryCode); setCode(""); setError(null); }} className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-orange)] underline underline-offset-2">{isRecoveryCode ? "Use authenticator code" : "Use a recovery code"}</button>
            <BackButton onClick={() => { setStage("password"); setCode(""); setError(null); }} />
          </div>
        </form>}

        {stage === "enroll" && <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
          <div className="mx-auto w-52 min-h-52 rounded-xl border border-[var(--color-border-default)] bg-white p-3 flex items-center justify-center">
            {qrCodeUrl ? <img src={qrCodeUrl} alt="Authenticator enrollment QR code" className="w-full h-auto" /> : <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-orange)]" />}{/* eslint-disable-line @next/next/no-img-element -- authenticated blob URL cannot use the Next image optimizer */}
          </div>
          <CodeInput recovery={false} code={code} setCode={setCode} />
          <PrimaryButton loading={loading} label="Confirm and enable MFA" />
          <p className="text-xs text-center text-[var(--color-text-muted)]">Do not share this QR code or authenticator code.</p>
        </form>}

        {stage === "recovery" && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4" aria-label="Recovery codes">
            {issuedRecoveryCodes.map((recoveryCode) => <code key={recoveryCode} className="text-center text-sm text-[var(--color-text-primary)]">{recoveryCode}</code>)}
          </div>
          <label className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={codesSaved} onChange={(e) => setCodesSaved(e.target.checked)} className="mt-1" /><span>I have stored these one-time recovery codes in a secure location.</span></label>
          <button type="button" disabled={!codesSaved || loading} onClick={() => { setLoading(true); void finishSignIn().finally(() => setLoading(false)); }} className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Continue to Admin Portal
          </button>
        </div>}
      </div>
      <div className="mt-6 text-center text-xs text-[var(--color-text-muted)]">DLIF Platform • Admin Operations Portal</div>
    </div>
  </div>;
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${error ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-600"}`}><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{children}</span></div>;
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">{label}</label><div className="relative"><span className="text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>{children}</div></div>;
}

function PrimaryButton({ loading, label }: { loading: boolean; label: string }) {
  return <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-xl bg-[var(--color-brand-orange)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>{label}</span><ArrowRight className="w-4 h-4" /></>}</button>;
}

function AuthIcon({ recovery }: { recovery: boolean }) {
  return <div className="flex items-center justify-center py-2"><div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-brand-orange)]">{recovery ? <KeyRound className="w-7 h-7" /> : <Shield className="w-7 h-7" />}</div></div>;
}

function CodeInput({ recovery, code, setCode }: { recovery: boolean; code: string; setCode: (code: string) => void }) {
  return <div><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 text-center">{recovery ? "Emergency Recovery Code" : "Authenticator Code"}</label><input type="text" required autoFocus autoComplete="one-time-code" maxLength={recovery ? 16 : 8} value={code} onChange={(e) => setCode(e.target.value)} placeholder={recovery ? "e.g. 1a2b-3c4d" : "123456"} className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-center text-lg font-mono tracking-widest text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-orange)]" /></div>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1"><ArrowLeft className="w-3 h-3" /><span>Back</span></button>;
}

export default function AdminLoginPage() {
  return <React.Suspense fallback={null}><AdminLoginForm /></React.Suspense>;
}
