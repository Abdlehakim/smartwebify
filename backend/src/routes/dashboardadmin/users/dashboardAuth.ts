// src/routes/dashboardadmin/users/dashboardAuth.ts
import { Router, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";
import {
  issueToken,
  setSessionCookies,
  clearSessionCookies,
  REFRESH_THRESHOLD_MS,
} from "./session";

const router = Router();

/* ───────── headers to avoid caching /me ───────── */
function setNoStore(res: Response) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
  });
}

/* ───────── GET /api/dashboardAuth/me ───────── */
const getMe: RequestHandler = async (req, res) => {
  try {
    setNoStore(res);

    const token = req.cookies?.token_FrontEndAdmin;
    if (!token) return void res.status(200).json({ user: null });

    // Verify JWT
    let decoded: { id: string; exp: number };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; exp: number };
    } catch {
      clearSessionCookies(res);
      return void res.status(200).json({ user: null });
    }

    // Load user
    const user = await DashboardUser.findById(decoded.id)
      .select("-password")
      .populate("role", "name permissions")
      .lean();

    if (!user) {
      clearSessionCookies(res);
      return void res.status(200).json({ user: null });
    }

    // Sliding session: rotate when close to expiry; otherwise just refresh cookie maxAge
    const remainingMs = decoded.exp * 1000 - Date.now();
    if (remainingMs <= REFRESH_THRESHOLD_MS) {
      const newToken = issueToken(String(user._id));
      setSessionCookies(res, newToken);
    } else {
      setSessionCookies(res, token);
    }

    return void res.status(200).json({ user });
  } catch (err) {
    console.error("Dashboard auth error:", err);
    return void res.status(500).json({ message: "Internal server error" });
  }
};

/* ───────── POST /api/dashboardAuth/logout ─────────
   Require explicit confirmation so accidental calls don’t log users out.
   Accepts JSON body {confirm:true} or query ?confirm=1
------------------------------------------------------------------ */
const logout: RequestHandler = (req, res) => {
  setNoStore(res);

  const v = (req.body && (req.body as any).confirm) ?? req.query.confirm;
  const confirm = v === true || v === "true" || v === "1" || v === 1;

  if (!confirm) {
    return void res.status(400).json({ message: "Missing confirm flag" });
  }

  clearSessionCookies(res);
  return void res.status(200).json({ message: "Logged out successfully" });
};

router.get("/me", getMe);
router.post("/logout", logout);

export default router;
