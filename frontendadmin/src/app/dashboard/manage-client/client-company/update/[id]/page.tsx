// ------------------------------------------------------------------
// src/app/dashboard/manage-client/client-company/update/[id]/page.tsx
// Page — Mise à jour d’un « ClientCompany » via segment dynamique [id]
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
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  vatNumber: string;
}
interface CompanyDoc extends FormData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UpdateClientCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [form, setForm] = useState<FormData>({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    vatNumber: "",
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
        const { company } = await fetchFromAPI<{ company: CompanyDoc }>(
          `/dashboardadmin/clientCompany/${id}`,
          { method: "GET" }
        );
        setForm({
          companyName: company.companyName ?? "",
          contactName: company.contactName ?? "",
          phone: company.phone ?? "",
          email: company.email ?? "",
          vatNumber: company.vatNumber ?? "",
        });
      } catch (e) {
        console.error("Load ClientCompany failed:", e);
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
      await fetchFromAPI<{ message: string; company: CompanyDoc }>(
        `/dashboardadmin/clientCompany/update/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      router.push("/dashboard/manage-client/client-company");
    } catch (err) {
      console.error("Échec de la mise à jour :", err);
      alert("Échec de la mise à jour de l’entreprise cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- loading & saving screens (no style changes to the page) ---------- */
  if (loading) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Chargement des données de l’entreprise…" />
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
        <p className="text-red-600">Identifiant d’entreprise manquant dans l’URL.</p>
        <Link href="/dashboard/manage-client/client-company" className="underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Modifier une entreprise cliente</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 justify-center items-center w-[80%] mx-auto h-[80%]"
      >
        <nav className="text-sm underline-offset-1 underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-client/client-company"
            className="text-gray-500 hover:underline"
          >
            Toutes les entreprises
          </Link>
          <span className="text-gray-400">
            <MdArrowForwardIos />
          </span>
          <span className="text-gray-700 font-medium">Modifier une entreprise</span>
        </nav>

        <div className="flex flex-col justify-center gap-8 w-full">
          {/* Nom de l’entreprise */}
          <div className="flex justify-center items-center gap-[16px]">
            <label htmlFor="companyName" className="w-1/8 text-sm font-medium">
              Nom de l’entreprise*
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={form.companyName}
              onChange={handleInputChange}
              className="w-1/2 border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* Nom du contact (optionnel) */}
          <div className="flex justify-center items-center gap-[16px]">
            <label htmlFor="contactName" className="w-1/8 text-sm font-medium">
              Nom du contact
            </label>
            <input
              id="contactName"
              name="contactName"
              type="text"
              value={form.contactName}
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

          {/* N° TVA (optionnel) */}
          <div className="flex justify-center items-center gap-[16px]">
            <label htmlFor="vatNumber" className="w-1/8 text-sm font-medium">
              N° TVA
            </label>
            <input
              id="vatNumber"
              name="vatNumber"
              type="text"
              value={form.vatNumber}
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
            Enregistrer
          </button>

          <Link
            href="/dashboard/manage-client/client-company"
            className="w-1/6"
          >
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
