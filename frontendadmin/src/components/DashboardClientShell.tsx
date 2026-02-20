// src/components/DashboardClientShell.tsx
"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuthDashboard";
import useAutoLogout from "@/hooks/useAutoLogout";
import LoadingDots from "@/components/LoadingDots";

interface Props { children: ReactNode; }

export default function DashboardClientShell({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Run auto-logout ONLY once auth state is known and the user is authenticated
  useAutoLogout(isAuthenticated && !loading);

  // If not authenticated once loading finishes, bounce to signin
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  // While we don't yet know, or while redirecting, render a small loader (or null)
  if (loading) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <LoadingDots />
      </div>
    );
  }

  if (!isAuthenticated) return null; // will redirect

  return <>{children}</>;
}
