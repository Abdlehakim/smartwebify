// ------------------------------------------------------------------
// src/app/dashboard/manage-client/clients-shop/update/[id]/page.tsx
// Page — Mise à jour d’un « ClientShop » via segment dynamique [id]
// ------------------------------------------------------------------
"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { MdArrowForwardIos } from "react-icons/md";
import LoadingDots from "@/components/LoadingDots";

/* ---------- types ---------- */
interface FormData {
  name: string;
  phone: string;
  email: string;
}
interface ClientDoc extends FormData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UpdateClientShopPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /* ---------- effects ---------- */
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { client }: { client: ClientDoc } = await fetchFromAPI(
          `/dashboardadmin/clientShop/${id}`,
          { method: "GET" }
        );
        setForm({
          name: client.name ?? "",
          phone: client.phone ?? "",
          email: client.email ?? "",
        });
      } catch (e) {
        console.error("Load ClientShop failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ---------- handlers ---------- */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await fetchFromAPI<{ message: string; client: ClientDoc }>(
        `/dashboardadmin/clientShop/update/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      router.push("/dashboard/manage-client/clients-shop");
    } catch (err) {
      console.error("Échec de la mise à jour :", err);
      alert("Échec de la mise à jour du client.");
      setSubmitting(false);
    }
  };

  /* ---------- loading & saving screens (no style changes) ---------- */
  if (loading) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Chargement des données du client…" />
      </div>
    );
  }

  if (submitting) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Mise à jour en cours…" />
      </div>
    );
  }

  /* ---------- UI ---------- */
  if (!id) {
    return (
      <div className="mx-auto py-4 w-[95%]">
        <p className="text-red-600">Identifiant du client manquant dans l’URL.</p>
        <Link href="/dashboard/manage-client/clients-shop" className="underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Modifier un client passage</h1>
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
          <span className="text-gray-700 font-medium">Modifier un client</span>
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
            className="btn-fit-white-outline"
          >
            Enregistrer
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
