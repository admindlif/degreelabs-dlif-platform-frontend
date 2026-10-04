"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/config";

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
  refreshUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = React.useCallback(async (): Promise<boolean> => {
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        setUser(null);
        setError(null);
        return false;
      }

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        setUser(null);
        setError(
          responseDetail(data) ??
            "Unable to verify your Fellow Portal session. Please try again."
        );
        return false;
      }

      const profile: AuthUser = await res.json();
      const role = profile.role.toLowerCase();
      if (role !== "fellow" && role !== "student") {
        setUser(null);
        setError(
          "Access denied: Your account role does not have access to the Fellow Portal."
        );
        return false;
      }

      setUser(profile);
      setError(null);
      return true;
    } catch {
      setUser(null);
      setError(
        "Unable to connect to the Fellow Portal service. Please try again shortly."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    async function initializeSession() {
      await Promise.resolve();
      await refreshUser();
    }

    void initializeSession();
  }, [refreshUser]);

  const logout = React.useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          responseDetail(data) ??
          "Unable to sign out. Please try again before closing this browser.";
        setError(message);
        throw new Error(message);
      }

      setUser(null);
      setError(null);
      router.push("/login");
    } catch (caught) {
      if (caught instanceof Error) {
        setError(caught.message);
        throw caught;
      }

      const message =
        "Unable to connect to the Fellow Portal service. Please try signing out again.";
      setError(message);
      throw new Error(message);
    }
  }, [router]);

  React.useEffect(() => {
    if (loading) return;

    const publicPaths = ["/login", "/activate"];
    const isPublic = publicPaths.some((path) => pathname.startsWith(path));

    if (!user && !isPublic) {
      router.push("/login");
    } else if (user && pathname.startsWith("/login")) {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
