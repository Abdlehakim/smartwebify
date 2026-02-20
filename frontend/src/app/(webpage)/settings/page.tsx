/* ------------------------------------------------------------------
   src/app/settings/page.tsx
------------------------------------------------------------------ */
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import ProfileDetails from "@/components/settings/ProfileDetails";
import AddressList     from "@/components/settings/AddressList";

export default function SettingsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  /* ---------- auth ---------- */
  const { isAuthenticated, loading } = useAuth();

  /* ---------- redirection si non connecté ---------- */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const redirectTo = searchParams.get("redirectTo") || "/";
      router.push(`/signin?redirectTo=${redirectTo}`);
    }
  }, [loading, isAuthenticated, router, searchParams]);

  /* ---------- rendu ---------- */
  return (
    <div className="py-4 flex flex-col items-center justify-center w-[90%] gap-4 h-fit mx-auto">
      <ProfileDetails />
      <AddressList />
    </div>
  );
}
