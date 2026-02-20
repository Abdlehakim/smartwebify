/* ------------------------------------------------------------------
   src/hooks/useAutoLogout.ts
------------------------------------------------------------------ */
"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchData } from "@/lib/fetchData";

const TIMER_COOKIE = "token_FrontEnd_exp";
const LOGOUT_PATH  = "/auth/logout";
const MAX_DELAY    = 2_147_483_647;

// guard against instant logout races
const MIN_DELAY_MS     = 5_000;
const EXPIRED_GRACE_MS = 5_000;

export default function useAutoLogout(enabled: boolean = true) {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<number | null>(null);
  const bcRef       = useRef<BroadcastChannel | null>(null);
  const didLogout   = useRef(false);

  useEffect(() => {
    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      bcRef.current?.close();
      timerRef.current = null;
      intervalRef.current = null;
      bcRef.current = null;
      didLogout.current = false;
    };

    if (!enabled) { cleanup(); return; }
    cleanup();

    const raw = Cookies.get(TIMER_COOKIE);
    if (!raw) return;

    const expMs = Number(raw);
    if (!Number.isFinite(expMs)) return;

    const now   = Date.now();
    const delta = expMs - now;

    const doClientLogout = async (callBackend = true) => {
      if (didLogout.current) return;
      didLogout.current = true;
      try {
        if (callBackend) {
          await fetchData<void>(LOGOUT_PATH, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
      } finally {
        Cookies.remove(TIMER_COOKIE, { path: "/" });
        bcRef.current?.postMessage({ type: "logout" });
        window.location.replace("/signin");
      }
    };

    const delay = Math.min(Math.max(delta, MIN_DELAY_MS), MAX_DELAY);
    timerRef.current = setTimeout(() => { doClientLogout(true); }, delay);

    intervalRef.current = window.setInterval(() => {
      if (didLogout.current) return;
      const r = Cookies.get(TIMER_COOKIE);
      if (!r) return;
      const t = Number(r);
      if (!Number.isFinite(t)) return;
      if (Date.now() - t >= EXPIRED_GRACE_MS) {
        doClientLogout(true);
      }
    }, 15_000);

    bcRef.current =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth-client") : null;

    if (bcRef.current) {
      bcRef.current.onmessage = (e) => {
        if (e.data?.type === "logout") doClientLogout(false);
        if (e.data?.type === "refresh-exp" && typeof e.data.exp === "number") {
          Cookies.set(TIMER_COOKIE, String(e.data.exp), { path: "/", sameSite: "Lax" });
          window.location.reload();
        }
      };
    }

    const storageHandler = (ev: StorageEvent) => {
      if (ev.key === TIMER_COOKIE && ev.newValue) window.location.reload();
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("storage", storageHandler);
      cleanup();
    };
  }, [enabled]);
}
