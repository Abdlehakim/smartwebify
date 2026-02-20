/* ------------------------------------------------------------------
   src/routes/dashboardadmin/users/dashboardSignin.ts
------------------------------------------------------------------ */

import { Router, Request, Response } from "express";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";
import { issueToken, setSessionCookies } from "./session";

const router = Router();

/** Avoid any intermediary/proxy/browser caching of the auth response */
function setNoStore(res: Response) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
  });
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    setNoStore(res);

    const { email, password } = req.body as {
      email?: unknown;
      password?: unknown;
    };

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await DashboardUser.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !user.password || !(await (user as any).comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Minimal JWT (id only) using the shared session policy (SESSION_TTL_* from src/auth/session.ts)
    const token = issueToken(String(user._id));

    // Set aligned cookies using the shared helper
    setSessionCookies(res, token);

    res.status(200).json({
      user: { id: String(user._id), email: user.email },
    });
  } catch (err) {
    console.error("Dashboard Sign-in Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
