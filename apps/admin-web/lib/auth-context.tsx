"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminSessionLifecycle } from "@/components/auth/admin-session-lifecycle";
import { adminApiClient, ApiError } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";
import { clearAdminDrafts } from "@/lib/auth/drafts";
import { adminSessionClient, SessionNetworkError } from "@/lib/auth/session-client";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  account_status: string;
  two_factor_enabled: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<{ serverRevoked: boolean }>;
  refreshUser: (triggerLoader?: boolean) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function responseDetail(data: unknown): string | null {
  if (typeof data === "object" && data !== null && "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string") {
    return (data as { detail: string }).detail;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [verifiedUnauthenticated, setVerifiedUnauthenticated] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = React.useCallback(async (triggerLoader = false): Promise<boolean> => {
    if (triggerLoader) setLoading(true);
    try {
      const session = await adminSessionClient.getStatus();
      if (!session.authenticated) {
        setUser(null);
        setError(null);
        setVerifiedUnauthenticated(true);
        return false;
      }
      const profile = await adminApiClient<AuthUser>("/api/v1/auth/me");
      const role = profile.role.toLowerCase();
      if (role !== "admin" && role !== "super_admin") {
        setUser(null);
        setVerifiedUnauthenticated(true);
        setError("Access denied: Your account role does not have Administrator privileges.");
        return false;
      }
      setUser(profile);
      setError(null);
      setVerifiedUnauthenticated(false);
      return true;
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setUser(null);
        setVerifiedUnauthenticated(true);
        setError("Access denied: Your account role does not have Administrator privileges.");
        return false;
      }
      if (caught instanceof ApiError && caught.status === 401) {
        setUser(null);
        setVerifiedUnauthenticated(true);
        setError(null);
        return false;
      }
      if (!(caught instanceof SessionNetworkError) && !(caught instanceof ApiError)) throw caught;
      setError("Unable to connect to the Admin Operations service. Please try again shortly.");
      setVerifiedUnauthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (pathname.startsWith("/login") && user) {
      router.replace("/");
      return;
    }
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshUser();
    }
  }, [pathname, user, refreshUser, router]);

  const clearLocalSession = React.useCallback((currentUserId?: string | null) => {
    setUser(null);
    setError(null);
    setVerifiedUnauthenticated(true);
    if (typeof window !== "undefined") clearAdminDrafts(window.sessionStorage, currentUserId);
  }, []);

  const logout = React.useCallback(async (): Promise<{ serverRevoked: boolean }> => {
    setError(null);
    let serverRevoked = false;
    let failureDetail: string | null = null;
    const currentUserId = user?.id;
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
        method: "POST", credentials: "include", cache: "no-store",
      });
      if (response.ok || response.status === 401) serverRevoked = true;
      else {
        const data: unknown = await response.json().catch(() => null);
        failureDetail = responseDetail(data) ?? "Server failed to revoke session.";
      }
    } catch (caught) {
      failureDetail = caught instanceof Error ? caught.message : "Network error reaching logout service.";
    }
    clearLocalSession(currentUserId);
    adminSessionClient.announce({ type: "logout" });
    if (!serverRevoked) {
      setError(`Logged out locally. Warning: Server-side revocation could not be confirmed (${failureDetail}).`);
    }
    router.replace("/login");
    return { serverRevoked };
  }, [clearLocalSession, router, user?.id]);

  const handleRemoteLogout = React.useCallback(() => {
    clearLocalSession(user?.id);
    router.replace("/login");
  }, [clearLocalSession, router, user?.id]);

  React.useEffect(() => {
    if (loading) return;
    const isLogin = pathname.startsWith("/login");
    if (!user && verifiedUnauthenticated && !isLogin) router.replace("/login");
    else if (user && isLogin) router.replace("/");
  }, [user, loading, pathname, router, verifiedUnauthenticated]);

  const isLogin = pathname.startsWith("/login");
  if (loading && !isLogin) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-canvas)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-orange)]" />
    </div>;
  }
  if (!user && !isLogin) {
    if (error && !verifiedUnauthenticated) {
      return <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-canvas)] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-default)] bg-white p-6 text-center shadow-lg">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Unable to verify your session</h1>
          <p className="mt-2 text-sm text-[var(--color-text-body)]">{error}</p>
          <button type="button" onClick={() => { setLoading(true); void refreshUser(); }}
            className="mt-5 rounded-full bg-[var(--color-brand-orange)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
            Try Again
          </button>
        </div>
      </div>;
    }
    return null;
  }

  return <AuthContext.Provider value={{ user, loading, error, logout, refreshUser }}>
    {children}
    <AdminSessionLifecycle active={Boolean(user)} onLogout={logout} onRemoteLogout={handleRemoteLogout} />
  </AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
