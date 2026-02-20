// src/components/SignInClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import LoadingDots from "@/components/LoadingDots";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface Props {
  redirectTo: string;
}

export default function SignInClient({ redirectTo }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated (cookie present), bounce away from /signin immediately

  useEffect(() => {
    const saved = localStorage.getItem("rememberedAdminEmail");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      await fetchFromAPI("/signindashboardadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include" is set inside fetchFromAPI
        body: JSON.stringify({ email, password }),
      });

      if (rememberMe) {
        localStorage.setItem("rememberedAdminEmail", email);
      } else {
        localStorage.removeItem("rememberedAdminEmail");
      }

      // Hard reload so middleware sees the HttpOnly cookie
      window.location.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <LoadingDots />
        </div>
      )}

      <div className="w-full h-screen flex items-center">
        <div className="w-[60%] max-lg:w-full flex justify-center items-center h-screen">
          <div className="px-8 flex flex-col w-[600px] h-screen max-md:h-full bg-white/80 rounded-xl max-md:rounded-none justify-center gap-4 z-10">
            <div className="flex flex-col gap-2 items-center">
              <h1 className="text-2xl uppercase font-bold">Connectez-vous (Admin)</h1>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* E-mail */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="block mb-1 font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md"
                />
              </div>

              {/* Mot de passe */}
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="block mb-1 font-medium">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
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
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                  </button>
                </div>
              </div>

              {/* Se souvenir / Mot de passe oublié */}
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
                <Link href="/forgot-password" className="text-primary hover:underline max-md:text-xs">
                  Mot de passe oublié&nbsp;?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full text-white text-lg font-semibold rounded-md bg-primary transition hover:bg-secondary disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <Image src="/signin.jpg" alt="Arrière-plan de connexion" fill priority className="object-cover" />
      </div>
    </>
  );
}
