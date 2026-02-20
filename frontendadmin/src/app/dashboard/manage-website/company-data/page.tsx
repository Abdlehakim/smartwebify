// src/app/dashboard/manage-website/company-data/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface CompanyData {
  _id: string;
  name: string;
  description: string;
  bannerImageUrl?: string;
  logoImageUrl?: string;
  contactBannerUrl?: string;
  email: string;
  phone?: string;
  vat?: string;
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
}

export default function CompanyDataAdminPage() {
  const [item, setItem] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { companyInfo } = await fetchFromAPI<{ companyInfo: CompanyData }>(
          "/dashboardadmin/website/company-info/getCompanyInfo"
        );
        setItem(companyInfo ?? null);
      } catch (err: unknown) {
        console.error("Erreur de chargement des données société :", err);
        setError("Échec du chargement des données de l’entreprise.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const F = {
    text: (v?: string) => (v && v.trim().length > 0 ? v : "—"),
  };

  // Only enforce viewport-height while loading; afterwards, let content define height.
  const containerMinH = loading ? "min-h-[100svh]" : ""; // use svh to handle mobile URL bar

  return (
    <div
      className={`mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 bg-green-50 rounded-xl mb-6 ${containerMinH}`}
      aria-busy={loading}
    >
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Données de l’entreprise</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/company-data/update/${item._id}`}>
            <button className="btn-fit-white-outline">Modifier</button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/company-data/create">
            <button className="btn-fit-white-outline">Créer</button>
          </Link>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-green-50">
          <FaSpinner className="animate-spin text-3xl" />
        </div>
      )}

      <div className="relative rounded-lg">
        {!loading && error && (
          <div className="p-4 text-center text-red-600 bg-white rounded-md border border-primary/20">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {!item ? (
              <div className="p-6 text-center bg-white rounded-md border border-primary/20">
                Aucune donnée d’entreprise enregistrée.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative h-64 rounded-md border border-primary/20 bg-white overflow-hidden">
                    {item.logoImageUrl ? (
                      <Image
                        src={item.logoImageUrl}
                        alt="Logo de l’entreprise"
                        fill
                        className="object-contain p-4"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Aucun logo
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-md border border-primary/20 p-4">
                  <h2 className="text-lg font-semibold mb-3">Informations générales</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Nom</label>
                      <input value={F.text(item.name)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">E-mail</label>
                      <input value={F.text(item.email)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Téléphone</label>
                      <input value={F.text(item.phone)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Matricule fiscale</label>
                      <input value={F.text(item.vat)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Description</label>
                    <textarea
                      rows={4}
                      value={F.text(item.description)}
                      disabled
                      className="w-full border rounded px-3 py-2 bg-white disabled:opacity-100 border-primary/20"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-md border border-primary/20 p-4">
                  <h2 className="text-lg font-semibold mb-3">Adresse</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Adresse</label>
                      <input value={F.text(item.address)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Ville</label>
                      <input value={F.text(item.city)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Code postal</label>
                      <input value={F.text(item.zipcode)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Gouvernorat</label>
                      <input value={F.text(item.governorate)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-primary/20 p-4 mb-6">
                  <h2 className="text-lg font-semibold mb-3">Réseaux sociaux</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Facebook</label>
                      <input value={F.text(item.facebook)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">LinkedIn</label>
                      <input value={F.text(item.linkedin)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Instagram</label>
                      <input value={F.text(item.instagram)} disabled className="FilterInput bg-white disabled:opacity-100" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
