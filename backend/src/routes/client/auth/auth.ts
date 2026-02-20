/* ------------------------------------------------------------------
   src/routes/client/auth/auth.ts
------------------------------------------------------------------ */
import { Router, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import Client from "@/models/Client";
import {
  issueClientToken,
  setClientSessionCookies,
  clearClientSessionCookies,
  REFRESH_THRESHOLD_MS,
} from "./sessionClient";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

const logoutHandler: RequestHandler = (_req, res) => {
  clearClientSessionCookies(res);
  res.json({ message: "Logged out successfully" });
};

function setNoStore(res: Response) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
  });
}

router.get("/me", (async (req: any, res: Response) => {
  try {
    setNoStore(res);
    const token = req.cookies?.token_FrontEnd;
    if (!token) return void res.json({ user: null });

    let decoded: { id: string; exp: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; exp: number };
    } catch {
      clearClientSessionCookies(res);
      return void res.json({ user: null });
    }

    const user = await Client.findById(decoded.id).select("-password").lean();
    if (!user) {
      clearClientSessionCookies(res);
      return void res.json({ user: null });
    }

    const remaining = decoded.exp * 1000 - Date.now();
    if (remaining <= REFRESH_THRESHOLD_MS) {
      const newToken = issueClientToken(String(user._id));
      setClientSessionCookies(res, newToken);
    } else {
      setClientSessionCookies(res, token);
    }

    return void res.json({ user });
  } catch (err) {
    console.error("Auth /me error:", err);
    return void res.status(500).json({ message: "Internal server error" });
  }
}) as RequestHandler);

router.post("/logout", logoutHandler);

export default router;
