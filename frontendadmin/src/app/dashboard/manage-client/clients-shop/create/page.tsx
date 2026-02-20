// ------------------------------------------------------------------
// src/app/dashboard/manage-client/clients-shop/create/page.tsx
// Page - Création d’un « ClientShop » (client passage)
// ------------------------------------------------------------------
"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { MdArrowForwardIos } from "react-icons/md";
import LoadingDots from "@/components/LoadingDots";

/* ---------- types ---------- */
interface FormData {
  name: string;
  phone: string;
  email: string;
}

export default function CreateClientShopPage() {
  const router = useRouter();

  /* ---------- state ---------- */
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);

  /* ---------- handlers ---------- */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchFromAPI<{ message: string }>("/dashboardadmin/clientShop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.push("/dashboard/manage-client/clients-shop");
    } catch (err) {
      console.error("Creation failed:", err);
      alert("La création du client a échoué.");
      setSubmitting(false);
    }
  };

  /* ---------- saving screen (align with client-company create) ---------- */
  if (submitting) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Création du client passage…" />
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Créer un client passage</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 justify-center items-center w-[80%] mx-auto h-[80%]"
      >
        <nav className="text-sm underline-offset-1 underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-client/clients-shop"
            className="text-gray-500 hover:underline"
          >
            Tous les clients passage
          </Link>
          <span className="text-gray-400">
            <MdArrowForwardIos />
          </span>
          <span className="text-gray-700 font-medium">Créer un client</span>
        </nav>

        <div className="flex flex-col justify-center gap-8 w-full">
          {/* Nom */}
          <div className="flex justify-center items-center gap-[16px]">
            <label htmlFor="name" className="w-1/8 text-sm font-medium">
              Nom*
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleInputChange}
              className="w-1/2 border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* E-mail (optionnel) */}
          <div className="flex justify-center items-center gap-[16px]">
            <label htmlFor="email" className="w-1/8 text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              className="w-1/2 border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* Téléphone */}
          <div className="flex justify-center items-center gap-[16px]">
            <label htmlFor="phone" className="w-1/8 text-sm font-medium">
              Téléphone*
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              required
              value={form.phone}
              onChange={handleInputChange}
              className="w-1/2 border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>
        </div>

        {/* actions */}
        <div className="flex  justify-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="btn-fit-white-outline"
          >
            Ajouter
          </button>

          <Link href="/dashboard/manage-client/clients-shop" className="w-1/6">
            <button
              type="button"
              className="btn-fit-white-outline"
            >
              Annuler
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
