// src/hooks/useAutoLogout.ts
"use client";
import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

const TIMER_COOKIE = "token_FrontEndAdmin_exp";
const LOGOUT_PATH  = "/dashboardAuth/logout";
const MAX_DELAY    = 2_147_483_647;

// 👇 new: grace so we don't instantly logout on fresh login or clock jitter
const MIN_DELAY_MS       = 5_000;  // never schedule sooner than 5s
const EXPIRED_GRACE_MS   = 5_000;  // consider cookie "really expired" if >5s past

export default function useAutoLogout(enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<number | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      bcRef.current?.close();
      timerRef.current = null;
      intervalRef.current = null;
      bcRef.current = null;
    };

    if (!enabled) { cleanup(); return; }
    cleanup();

    const raw = Cookies.get(TIMER_COOKIE);
    if (!raw) return;

    const expMs = Number(raw);
    if (!Number.isFinite(expMs)) return;

    const now = Date.now();
    const delta = expMs - now;

    const doClientLogout = async (callBackend = true) => {
      try {
        if (callBackend) {
          await fetchFromAPI<void>(LOGOUT_PATH, {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirm: true }),
          }).catch(() => {});
        }
      } finally {
        Cookies.remove(TIMER_COOKIE, { path: "/" });
        bcRef.current?.postMessage({ type: "logout" });
        window.location.replace("/");
      }
    };

    // ✅ Never schedule immediate 0ms timeouts
    const delay = Math.min(
      Math.max(delta, MIN_DELAY_MS),  // at least MIN_DELAY_MS
      MAX_DELAY
    );

    timerRef.current = setTimeout(() => { doClientLogout(true); }, delay);

    // Poller: only logout if cookie has been expired for a bit (avoid instant logout)
    intervalRef.current = window.setInterval(() => {
      const r = Cookies.get(TIMER_COOKIE);
      if (!r) return;
      const t = Number(r);
      if (!Number.isFinite(t)) return;
      if (Date.now() - t >= EXPIRED_GRACE_MS) {
        doClientLogout(true);
      }
    }, 15_000);

    // BroadcastChannel sync
    bcRef.current = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;
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
