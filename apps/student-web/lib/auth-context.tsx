"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
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
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (accessToken: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "dlif_student_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = React.useCallback(async (authToken: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        const detail = data.detail || "Access denied to Fellow Portal.";
        setError(detail);
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const profile: AuthUser = await res.json();
      const role = profile.role.toLowerCase();
      if (role !== "fellow" && role !== "student") {
        setError("Access denied: Your account role does not have access to the Fellow Portal.");
        return null;
      }

      return profile;
    } catch {
      setError("Unable to connect to Fellow Portal API runtime.");
      return null;
    }
  }, []);

  React.useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);
        const profile = await fetchProfile(storedToken);
        if (profile) {
          setUser(profile);
          setError(null);
        } else {
          // Token invalid or wrong portal role
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [fetchProfile]);

  const login = async (accessToken: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchProfile(accessToken);
      if (!profile) {
        return false;
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);
      setUser(profile);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
    router.push("/login");
  }, [router]);

  const refreshUser = async () => {
    if (!token) return;
    const profile = await fetchProfile(token);
    if (profile) {
      setUser(profile);
    }
  };

  // Route protection
  React.useEffect(() => {
    if (loading) return;

    const publicPaths = ["/login", "/activate"];
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    if (!user && !isPublic) {
      router.push("/login");
    } else if (user && isPublic && !pathname.startsWith("/activate")) {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        refreshUser,
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
