// src/components/signin/SignUpForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { fetchData } from "@/lib/fetchData";
import LoadingDots from "@/components/LoadingDots";

interface SignUpFormProps {
  redirectTo: string;
}

export default function SignUpForm({ redirectTo }: SignUpFormProps) {

  const [username, setUsername]   = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError]               = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      await fetchData<{
        message: string;
        user: { id: string; email: string; username: string };
      }>("signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, phone, email, password }),
      });
      // Hard reload to ensure cookies/state are picked up in prod
      window.location.assign(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Échec de l’inscription");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingDots />
        </div>
      )}

      <div className="flex w-full h-screen items-center">
        <div className="w-[60%] max-lg:w-[100%] flex justify-center items-center h-full">
          <div className="px-8 flex flex-col w-[600px] h-full bg-white bg-opacity-80 rounded-xl max-md:rounded-none justify-center gap-4 z-10">
            <div className="flex flex-col gap-[8px] items-center">
              <h1 className="text-2xl uppercase font-bold">Créer un compte</h1>
            </div>

            {error && (
              <p className="text-red-500 text-center font-semibold">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-[8px]">
              <div>
                <label htmlFor="username" className="block mb-1 font-medium">
                  Nom d’utilisateur
                </label>
                <input
                  id="username"
                  placeholder="Votre nom"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block mb-1 font-medium">
                  Téléphone (facultatif)
                </label>
                <input
                  id="phone"
                  placeholder="Votre numéro de téléphone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md"
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-1 font-medium">
                  E‑mail
                </label>
                <input
                  id="email"
                  placeholder="vous@exemple.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md"
                />
              </div>

              <div className="flex flex-col gap-[4px] relative">
                <label htmlFor="password" className="block mb-1 font-medium">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    placeholder="*******"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
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
                className="h-[50px] w-full text-white text-lg font-semibold py-2 rounded-md bg-primary border-2 transition duration-200 mt-4 hover:bg-secondary"
              >
                {isSubmitting ? "Inscription en cours..." : "S’inscrire"}
              </button>
            </form>

            <div className="flex items-center mt-4 w-full gap-[8px]">
              <div className="flex-grow border-t border-gray-400" />
              <Link
                href="/signin"
                className="text-primary text-sm font-semibold hover:underline text-center"
              >
                Vous avez déjà un compte ? Connectez-vous
              </Link>
              <div className="flex-grow border-t border-gray-400" />
            </div>
          </div>
        </div>

        <div className="fixed inset-0 -z-10">
                <Image
                  src="/signin.jpg"
                  alt="Arrière-plan de connexion"
                  fill
                  className="object-cover"
                />
              </div>
      </div>
    </>
  );
}
