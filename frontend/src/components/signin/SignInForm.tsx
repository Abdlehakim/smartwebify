/* ------------------------------------------------------------------
   src/components/signin/SignInForm.tsx
------------------------------------------------------------------ */
"use client";

import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  GoogleLogin,
  type CredentialResponse,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import { fetchData } from "@/lib/fetchData";
import LoadingDots from "@/components/LoadingDots";

/* ----------------------------- Facebook SDK types ----------------------------- */
interface FBAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
}
interface FBLoginStatus {
  status: "connected" | "not_authorized" | "unknown" | "authorization_expired";
  authResponse?: FBAuthResponse;
}
interface FBApi {
  init: (opts: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }) => void;
  login: (
    cb: (resp: FBLoginStatus) => void,
    opts?: { scope?: string; return_scopes?: boolean }
  ) => void;
  getLoginStatus?: (cb: (resp: FBLoginStatus) => void) => void;
}

declare global {
  interface Window {
    google?: { accounts?: Record<string, unknown> };
    FB?: FBApi;
    fbAsyncInit?: () => void;
  }
}

/* ---------------------------------- Props ---------------------------------- */
interface SignInFormProps {
  redirectTo: string;
}

/* ------------------------------ Helpers ------------------------------ */
function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function buildFacebookOAuthUrl(fbAppId: string, redirectTo: string) {
  // NOTE: page lives under (auth)/facebook/redirect → public path is /facebook/redirect
  const redirectUri = `${window.location.origin}/facebook/redirect`;
  const state = encodeURIComponent(JSON.stringify({ redirectTo }));
  return (
    `https://www.facebook.com/v20.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(fbAppId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent("public_profile,email")}` +
    `&state=${state}` +
    `&display=touch`
  );
}
function openByAnchor(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* -------------------------------- Component -------------------------------- */
export default function SignInForm({ redirectTo }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasGoogleLoaded, setHasGoogleLoaded] = useState(false);

  // Facebook
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [hasFacebookLoaded, setHasFacebookLoaded] = useState(false);

  // HTTPS check for FB.login — set after mount to avoid hydration mismatch
  const [isSecureForFB, setIsSecureForFB] = useState<boolean | null>(null);

  const fbBtnHostRef = useRef<HTMLDivElement>(null);

  /* ------------------------------ Effects ---------------------------------- */
  // Detect Google one-tap presence (for skeleton swap)
  useEffect(() => {
    const t = setTimeout(
      () =>
        setHasGoogleLoaded(
          typeof window !== "undefined" && !!window.google?.accounts
        ),
      3000
    );
    return () => clearTimeout(t);
  }, []);

  // Secure origin check (HTTPS or https://localhost)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecureForFB(
        window.location.protocol === "https:" ||
          window.location.hostname === "localhost"
      );
    }
  }, []);

  // Load Facebook SDK once (no XFBML needed) — for DESKTOP flow only
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";
  useEffect(() => {
    if (typeof window === "undefined" || !fbAppId) return;

    // If we're on mobile, we don't need the SDK (we use full-page redirect/deep-link)
    if (isMobileUA()) {
      setHasFacebookLoaded(true);
      return;
    }

    // Already present
    if (window.FB) {
      setHasFacebookLoaded(true);
      return;
    }

    window.fbAsyncInit = () => {
      try {
        window.FB!.init({
          appId: fbAppId,
          cookie: true,
          xfbml: false, // using JS SDK directly, not XFBML
          version: "v20.0",
        });
        setHasFacebookLoaded(true);
      } catch {
        setHasFacebookLoaded(false);
      }
    };

    // Inject SDK
    const id = "facebook-jssdk";
    if (!document.getElementById(id)) {
      const js = document.createElement("script");
      js.id = id;
      js.async = true;
      js.defer = true;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, [fbAppId]);

  // Remember me (email)
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  /* ------------------------------ Handlers --------------------------------- */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    void (async () => {
      try {
        document.cookie = "token_FrontEnd_exp=; Max-Age=0; path=/";
        await fetchData("/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (rememberMe) localStorage.setItem("rememberedEmail", email);
        else localStorage.removeItem("rememberedEmail");
        window.location.replace(redirectTo);
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        setError("E-mail ou mot de passe incorrect.");
      }
    })();
  }

  function handleGoogleSignIn(resp: CredentialResponse) {
    if (!resp.credential || isGoogleLoading) return;
    setError("");
    setIsGoogleLoading(true);

    void (async () => {
      try {
        document.cookie = "token_FrontEnd_exp=; Max-Age=0; path=/";
        await fetchData("/signin/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken: resp.credential }),
        });
        window.location.replace(redirectTo);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Échec de la connexion Google"
        );
        setIsGoogleLoading(false);
        setIsSubmitting(false);
      }
    })();
  }

  // Facebook login: Mobile => deep-link to app (fb:// → intent:// → web)
  // Desktop => JS SDK popup (unchanged)
  function loginWithFacebook() {
    if (!fbAppId) return;

    // ✅ Mobile branch
    if (isMobileUA()) {
      const oauthUrl = buildFacebookOAuthUrl(fbAppId, redirectTo);

      try {
        if (isIOS()) {
          const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(
            oauthUrl
          )}`;
          const started = Date.now();
          openByAnchor(appUrl);
          // If app didn't intercept, fall back to web quickly
          setTimeout(() => {
            if (Date.now() - started < 1500) window.location.href = oauthUrl;
          }, 800);
          return;
        }

        if (isAndroid()) {
          // Try fb:// first
          const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(
            oauthUrl
          )}`;
          let fellBack = false;

          const fallbackTimer = setTimeout(() => {
            if (fellBack) return;
            // Then try intent:// with package + browser fallback
            const intentUrl =
              `intent://${oauthUrl.replace(/^https?:\/\//, "")}` +
              `#Intent;scheme=https;package=com.facebook.katana;` +
              `S.browser_fallback_url=${encodeURIComponent(oauthUrl)};end`;
            openByAnchor(intentUrl);
            // Final safety fallback to web
            setTimeout(() => {
              if (!fellBack) window.location.href = oauthUrl;
            }, 800);
          }, 600);

          openByAnchor(appUrl);
          // If the app grabbed focus, timers won't run
          setTimeout(() => {
            fellBack = true;
            clearTimeout(fallbackTimer);
          }, 1800);
          return;
        }
      } catch {
        // ignore and fall through
      }

      // Default mobile fallback: normal OAuth in browser
      window.location.href = oauthUrl;
      return;
    }

    // ✅ Desktop: keep JS SDK popup
    if (!window.FB || isFacebookLoading) return;
    setError("");
    setIsFacebookLoading(true);

    window.FB.login(
      (resp) => {
        void (async () => {
          try {
            if (resp?.status === "connected" && resp.authResponse?.accessToken) {
              document.cookie = "token_FrontEnd_exp=; Max-Age=0; path=/";
              await fetchData("/signin/facebook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  accessToken: resp.authResponse.accessToken,
                }),
              });
              window.location.replace(redirectTo);
            } else {
              setError("Connexion Facebook annulée.");
              setIsFacebookLoading(false);
            }
          } catch {
            setError("Échec de la connexion Facebook");
            setIsFacebookLoading(false);
          }
        })();
      },
      { scope: "public_profile,email", return_scopes: true }
    );
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  /* ---------------------- Unified skeleton flags (same UX) ---------------------- */
  const needFbSdk = !isMobileUA(); // only desktop needs SDK
  const showGoogleSkeleton = isGoogleLoading || !hasGoogleLoaded;
  const showFacebookSkeleton =
    isFacebookLoading ||
    (needFbSdk && (!hasFacebookLoaded || !fbAppId || isSecureForFB !== true));

  /* --------------------------------- Render --------------------------------- */
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {(isSubmitting || isGoogleLoading || isFacebookLoading) && (
        <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingDots />
        </div>
      )}

      <div className="w-flex w-full h-screen items-center">
        <div className="w-[60%] max-lg:w-[100%] flex justify-center items-center h-full">
          <div className="px-8 flex flex-col w-[600px] h-full bg-white/80 rounded-xl max-md:rounded-none justify-center gap-4 z-10">
            <div className="flex flex-col gap-2 items-center">
              <h1 className="text-2xl uppercase font-bold">Connectez-vous</h1>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="block mb-1 font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md"
                />
              </div>

              <div className="flex flex-col gap-1 relative">
                <label htmlFor="password" className="block mb-1 font-medium">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="•••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 border border-gray-300 px-4 pr-10 rounded-md focus:outline-none text-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible size={22} />
                    ) : (
                      <AiOutlineEye size={22} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full text-white text-lg font-semibold rounded-md bg-primary transition hover:bg-secondary disabled:opacity-60"
              >
                {isSubmitting ? "Connexion…" : "Se connecter"}
              </button>

              <div className="flex items-center justify-between mt-2 text-sm font-semibold">
                <label className="inline-flex items-center text-gray-500 max-md:text-xs">
                  <input
                    type="checkbox"
                    className="mr-2 w-4 h-4"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Se souvenir de moi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline max-md:text-xs"
                >
                  Mot de passe oublié&nbsp;?
                </Link>
              </div>

              <div className="flex items-center">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="mx-2 text-gray-500">ou</span>
                <hr className="flex-grow border-t border-gray-300" />
              </div>

              {/* Social auth (Google + Facebook), same LoadingDots & width */}
              <div className="flex flex-col items-center w-full">
                <div className="w-full flex justify-center">
                  <div className="w-full space-y-2">
                    {/* Google */}
                    <div className="w-full flex justify-center">
                      {showGoogleSkeleton ? (
                        <div className="h-[40px] w-[300px] flex items-center justify-center rounded-md border border-gray-200">
                          <LoadingDots />
                        </div>
                      ) : (
                        <div className="w-full flex justify-center">
                          <GoogleLogin
                            onSuccess={handleGoogleSignIn}
                            onError={() =>
                              setError("Échec de la connexion Google")
                            }
                            size="large"
                            text="continue_with"
                            shape="rectangular"
                            logo_alignment="left"
                            width="300"
                          />
                        </div>
                      )}
                    </div>

                    {/* Facebook — button with left icon */}
                    <div className="w-full flex justify-center" ref={fbBtnHostRef}>
                      {showFacebookSkeleton ? (
                        <div className="h-[40px] w-[300px] flex items-center justify-center rounded-md border border-gray-200">
                          <LoadingDots />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={loginWithFacebook}
                          aria-label="Continuer avec Facebook"
                          className="relative h-[40px] w-full max-w-[300px] rounded-md border border-gray-200 flex items-center justify-center text-sm font-normal hover:bg-gray-50"
                        >
                          <FaFacebookF
                            className="absolute left-3 text-[#1877F2]"
                            size={18}
                            aria-hidden
                          />
                          <span>Continuer avec Facebook</span>
                        </button>
                      )}
                      {!isMobileUA() && isSecureForFB === false && (
                        <p className="text-xs text-red-500 mt-2">
                          Facebook Login nécessite HTTPS (ou https://localhost).
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-t border-gray-300" />
            </form>

            <div className="flex items-center w-full gap-2 justify-center">
              <div className="flex-grow border-t border-gray-400" />
              <Link
                href="/signup"
                className="text-primary text-center text-sm font-semibold hover:underline"
              >
                Vous n’avez pas de compte ? Cliquez ici pour en créer un.
              </Link>
              <div className="flex-grow border-t border-gray-400" />
            </div>

            <hr className="border-t border-gray-300" />

            <div className="flex gap-4 justify-center">
              {[FaFacebookF, FaInstagram, FaTwitter, FaYoutube].map(
                (Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-12 h-12 border-4 border-gray-500 rounded-full flex items-center justify-center text-gray-500"
                  >
                    <Icon className="text-2xl" />
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 -z-10">
        <Image
          src="/signin.jpg"
          alt="Arrière-plan de connexion"
          fill
          priority
          className="object-cover"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
