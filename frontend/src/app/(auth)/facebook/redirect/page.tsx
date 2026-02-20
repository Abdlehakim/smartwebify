/* ------------------------------------------------------------------
   src/app/(auth)/facebook/redirect/page.tsx
   Handles mobile full-page OAuth redirect: reads #access_token,
   posts it to /signin/facebook, then redirects to the original page.
------------------------------------------------------------------ */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchData } from "@/lib/fetchData";
import LoadingDots from "@/components/LoadingDots";

export default function FacebookRedirect() {
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const hash =
          typeof window !== "undefined"
            ? window.location.hash.replace(/^#/, "")
            : "";
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const err = params.get("error");
        const stateRaw = params.get("state");

        let redirectTo = "/";
        if (stateRaw) {
          try {
            const parsed = JSON.parse(decodeURIComponent(stateRaw));
            if (parsed?.redirectTo) redirectTo = parsed.redirectTo;
          } catch {
            // ignore malformed state
          }
        }

        if (err) {
          setError("Connexion Facebook refusée.");
          return;
        }

        if (!accessToken) {
          setError("Aucun access_token reçu de Facebook.");
          return;
        }

        // Finish auth by calling your existing backend endpoint
        document.cookie = "token_FrontEnd_exp=; Max-Age=0; path=/";
        await fetchData("/signin/facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accessToken }),
        });

        window.location.replace(redirectTo);
      } catch {
        setError("Erreur pendant la redirection Facebook.");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 rounded-lg border bg-white/90">
          <p className="text-red-600 mb-2 font-semibold">{error}</p>
          <Link href="/signin" className="text-primary underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingDots />
    </div>
  );
}
