/* ------------------------------------------------------------------
   src/routes/signin.ts
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { createHmac } from "node:crypto"; // ✅ for appsecret_proof
import Client from "@/models/Client";
import { issueClientToken, setClientSessionCookies } from "./sessionClient";

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ✅ Facebook env (ensure these are set in your server .env)
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";

// ✅ Use latest Graph API version
const FB_GRAPH = "https://graph.facebook.com/v20.0";

function setNoStore(res: Response) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
  });
}

/* ------------------------------- EMAIL/PASS ------------------------------- */
router.post("/", async (req: Request, res: Response) => {
  try {
    setNoStore(res);
    const { email, password } = req.body as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string") {
      return void res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await Client.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !user.password || !(await (user as any).comparePassword(password))) {
      return void res.status(401).json({ message: "Invalid credentials" });
    }

    const token = issueClientToken(String(user._id));
    setClientSessionCookies(res, token);
    return void res.json({ user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    console.error("Sign-in Error:", err);
    return void res.status(500).json({ message: "Internal server error" });
  }
});

/* --------------------------------- GOOGLE -------------------------------- */
router.post("/google", async (req: Request, res: Response) => {
  try {
    setNoStore(res);
    const { idToken } = req.body as { idToken?: unknown };
    if (typeof idToken !== "string") {
      return void res.status(400).json({ message: "idToken is required" });
    }

    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload() as TokenPayload | null;
    if (!payload?.email) {
      return void res.status(401).json({ message: "Google authentication failed" });
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || "";
    // @ts-expect-error phone may exist on some payloads
    const phone: string | undefined = payload.phone;

    let user = await Client.findOne({ email });
    if (user) {
      let updated = false;
      if (name && user.username !== name) { user.username = name; updated = true; }
      if (phone && user.phone !== phone) { user.phone = phone; updated = true; }
      if (updated) await user.save();
    } else {
      user = await Client.create({ email, username: name, phone, isGoogleAccount: true });
    }

    const token = issueClientToken(String(user._id));
    setClientSessionCookies(res, token);
    return void res.json({ user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    console.error("Google Sign-in Error:", err);
    return void res.status(500).json({ message: "Internal server error" });
  }
});

/* -------------------------------- FACEBOOK ------------------------------- */
// Types for FB responses
interface FBDebugTokenData {
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number;
  expires_at: number;
  is_valid: boolean;
  scopes?: string[];
  user_id: string;
}
interface FBDebugTokenResponse { data: FBDebugTokenData; }
interface FBProfile { id: string; name?: string; email?: string; }

// HMAC-SHA256(access_token, APP_SECRET)
function makeAppSecretProof(userAccessToken: string): string {
  return createHmac("sha256", FACEBOOK_APP_SECRET)
    .update(userAccessToken)
    .digest("hex");
}

async function fbDebugToken(userAccessToken: string): Promise<FBDebugTokenResponse> {
  const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
  const url = `${FB_GRAPH}/debug_token?input_token=${encodeURIComponent(userAccessToken)}&access_token=${encodeURIComponent(appToken)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`FB debug_token failed: ${r.status} ${txt}`);
  }
  return (await r.json()) as FBDebugTokenResponse;
}

async function fbFetchProfile(userAccessToken: string): Promise<FBProfile> {
  const appsecret_proof = makeAppSecretProof(userAccessToken);
  const url = `${FB_GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(userAccessToken)}&appsecret_proof=${appsecret_proof}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`FB /me failed: ${r.status} ${txt}`);
  }
  return (await r.json()) as FBProfile;
}

router.post("/facebook", async (req: Request, res: Response) => {
  try {
    setNoStore(res);
    const { accessToken } = req.body as { accessToken?: unknown };
    if (typeof accessToken !== "string" || !accessToken) {
      return void res.status(400).json({ message: "accessToken is required" });
    }
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return void res.status(500).json({ message: "Facebook app credentials not configured" });
    }

    // 1) Validate token
    const dbg = await fbDebugToken(accessToken);
    const d = dbg?.data;
    const now = Date.now();
    const isExpired = typeof d?.expires_at === "number" && d.expires_at * 1000 <= now;

    if (!d?.is_valid || d.app_id !== FACEBOOK_APP_ID || isExpired) {
      // Add hints for client logs
      return void res.status(401).json({
        message: "Invalid Facebook token",
        details: {
          app_id_matches: d?.app_id === FACEBOOK_APP_ID,
          is_valid: d?.is_valid ?? false,
          expires_at: d?.expires_at ?? null,
        },
      });
    }

    // Optional: require 'email' scope if your flow expects an email
    if (!d.scopes?.includes("email")) {
      return void res.status(400).json({
        message:
          "L’autorisation 'email' n’a pas été accordée à Facebook. Réessayez et autorisez l’accès à votre e-mail.",
      });
    }

    // 2) Fetch profile (with appsecret_proof)
    const profile = await fbFetchProfile(accessToken);
    const email = profile.email?.trim().toLowerCase();
    const name = profile.name || "";

    // Require email (keeps your DB consistent with Google flow)
    if (!email) {
      return void res.status(400).json({
        message:
          "Votre compte Facebook ne fournit pas d’e-mail. Autorisez l’accès à l’e-mail ou utilisez une autre méthode de connexion.",
      });
    }

    // 3) Upsert user
    let user = await Client.findOne({ email });
    if (user) {
      let updated = false;
      if (name && user.username !== name) { user.username = name; updated = true; }
      // (Optional) store facebookId if your schema supports it: user.facebookId = profile.id
      if (updated) await user.save();
    } else {
      user = await Client.create({
        email,
        username: name,
        isFacebookAccount: true, // add this field to your schema if you want to track source
      });
    }

    // 4) Issue session
    const token = issueClientToken(String(user._id));
    setClientSessionCookies(res, token);
    return void res.json({ user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    console.error("Facebook Sign-in Error:", err);
    return void res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
