/* ------------------------------------------------------------------
   src/components/ClientShell.tsx
------------------------------------------------------------------ */
"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import useAutoLogout from "@/hooks/useAutoLogout";
import LoadingDots from "@/components/LoadingDots";

interface Props {
  children: ReactNode;
  requireAuth?: boolean;    // default public
  redirectTo?: string;      // signin page
}

export default function ClientShell({
  children,
  requireAuth = false,
  redirectTo = "/signin",
}: Props) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Only run auto-logout on protected views once user state is known
  useAutoLogout(requireAuth && isAuthenticated && !loading);

  // If protection is ON and user isn't authed, redirect to signin with return URL
  React.useEffect(() => {
    if (!requireAuth) return;
    if (!loading && !isAuthenticated) {
      const loc = typeof window !== "undefined" ? window.location : null;
      const target =
        loc ? `${loc.pathname}${loc.search || ""}` : "/";
      router.replace(`${redirectTo}?redirectTo=${encodeURIComponent(target)}`);
    }
  }, [requireAuth, loading, isAuthenticated, router, redirectTo]);

  if (requireAuth && loading) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <LoadingDots />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) return null; // will redirect

  return <>{children}</>;
}
