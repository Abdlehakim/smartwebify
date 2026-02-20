/* ------------------------------------------------------------------
   src/routes/auth/signup.ts
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import Client, { IClient } from "@/models/Client";
import { issueClientToken, setClientSessionCookies } from "./sessionClient";

const router = Router();

function setNoStore(res: Response) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
  });
}

router.post("/", async (req: Request, res: Response) => {
  try {
    setNoStore(res);
    const { username, phone, email, password } = req.body as {
      username?: unknown; phone?: unknown; email?: unknown; password?: unknown;
    };

    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
      return void res.status(400).json({ message: "Username, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await Client.findOne({ email: normalizedEmail })) {
      return void res.status(409).json({ message: "Email is already in use." });
    }

    const newUser = await Client.create({
      username: username.trim(),
      phone: typeof phone === "string" ? phone.trim() : "",
      email: normalizedEmail,
      password,
    });

    const token = issueClientToken(String(newUser._id));
    setClientSessionCookies(res, token);

    return void res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id.toString(), email: newUser.email, username: newUser.username },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return void res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
