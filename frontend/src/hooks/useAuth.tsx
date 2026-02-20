/* ------------------------------------------------------------------
   src/hooks/useAuth.tsx
------------------------------------------------------------------ */
"use client";

import * as React from "react";
import { fetchData } from "@/lib/fetchData";

/* ───────── types ───────── */
export interface User {
  _id: string;
  email: string;
  username?: string;
  phone?: string;
  isGoogleAccount: boolean;
}
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/* ───────── context ───────── */
const AuthContext = React.createContext<AuthContextValue | null>(null);

/** RequestInit without Next.js `next` field (avoids prefetch/cache quirks) */
type APIInit = Omit<RequestInit, "next">;

const withAuthOpts = (opts?: APIInit): APIInit => ({
  ...(opts ?? {}),
  credentials: "include",
  cache: "no-store",
  headers: { ...(opts?.headers ?? {}) },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  /** De-dupe concurrent refresh calls (prevents double `/auth/me`) */
  const inflightRef = React.useRef<Promise<void> | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;
    inflightRef.current = (async () => {
      try {
        const t = Date.now(); // cache-buster
        const data = await fetchData<{ user: User | null }>(
          `/auth/me?t=${t}`,
          withAuthOpts()
        );
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        inflightRef.current = null;
      }
    })();
    return inflightRef.current;
  }, []);

  /** POST /api/signin → then single refresh */
  const login = React.useCallback(
    async (email: string, password: string) => {
      await fetchData(
        "/signin",
        withAuthOpts({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
      );
      // Clear any stale client timer cookie (avoids immediate auto-logout races)
      document.cookie = "token_FrontEnd_exp=; Max-Age=0; path=/";
      await refresh();
    },
    [refresh]
  );

  /** POST /api/auth/logout */
  const logout = React.useCallback(async () => {
    try {
      await fetchData(
        "/auth/logout",
        withAuthOpts({
          method: "POST",
        })
      );
    } finally {
      setUser(null);
    }
  }, []);

  /** Initial refresh (guarded to run once per mount; de-duped anyway) */
  const didInit = React.useRef(false);
  React.useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const ctx: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

/* ───────── consumer hook ───────── */
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
