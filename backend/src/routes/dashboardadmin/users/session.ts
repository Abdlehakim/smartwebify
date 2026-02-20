import jwt from "jsonwebtoken";
import type { Response, CookieOptions } from "express";
import { COOKIE_OPTS, isProd } from "@/app";

const JWT_SECRET = process.env.JWT_SECRET!;

/** ── Session policy (2 minutes) ───────────────────────────────── */
export const SESSION_TTL_MIN = 5 * 60;                  
export const SESSION_TTL_MS  = SESSION_TTL_MIN * 60 * 1000;
export const REFRESH_THRESHOLD_MS = 10 * 60 * 1000;

/** ── Helpers ─────────────────────────────────────────────────── */
export function issueToken(id: string) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: `${SESSION_TTL_MIN}m` });
}

export function setSessionCookies(res: Response, token: string) {
  const { exp } = jwt.decode(token) as { exp: number };
  const expMs = exp * 1000;
  const maxAge = Math.max(0, expMs - Date.now());
  const opts: CookieOptions = { ...COOKIE_OPTS, path: "/", maxAge };
  if (!isProd) delete (opts as Partial<CookieOptions>).domain;
  res.cookie("token_FrontEndAdmin", token, { ...opts, httpOnly: true });
  res.cookie("token_FrontEndAdmin_exp", expMs, { ...opts, httpOnly: false });
}

export function clearSessionCookies(res: Response) {
  const base: CookieOptions = { ...COOKIE_OPTS, path: "/", maxAge: 0 };
  if (!isProd) delete (base as Partial<CookieOptions>).domain;
  res.cookie("token_FrontEndAdmin", "", { ...base, httpOnly: true });
  res.cookie("token_FrontEndAdmin_exp", "", { ...base, httpOnly: false });
}