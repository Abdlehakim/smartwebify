// ------------------------------------------------------------------
// src/app/dashboard/manage-website/titres-soustitres/page.tsx
// ------------------------------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

interface WebsiteTitres {
  _id: string;
  SimilarProductTitre: string;
  SimilarProductSubTitre: string;
}

export default function WebsiteTitresAdminPage() {
  const [item, setItem] = useState<WebsiteTitres | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { websiteTitres } =
          await fetchFromAPI<{ websiteTitres: WebsiteTitres[] }>(
            "/dashboardadmin/website/getWebsiteTitres"
          );
        setItem(websiteTitres?.[0] ?? null);
      } catch (err) {
        console.error("Erreur de chargement des titres :", err);
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const T = {
    text: (v?: string) => (v && v.trim().length > 0 ? v : "—"),
  };

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* En-tête (style unifié) */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Titres &amp; Sous-titres</h1>

        {item ? (
          <Link href={`/dashboard/manage-website/titres-soustitres/update/${item._id}`}>
            <button className="btn-fit-white-outline">Modifier</button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/titres-soustitres/create">
            <button className="btn-fit-white-outline">Créer</button>
          </Link>
        )}
      </div>

      {/* Corps avec overlay de chargement cohérent */}
      <div className="relative flex-1 overflow-auto rounded-lg">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
            <FaSpinner className="animate-spin text-3xl" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Carte : Produits similaires */}
            <div className="bg-white rounded-md border border-primary/20 p-4">
              <h2 className="text-lg font-semibold mb-3">Produits similaires</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Titre</label>
                  <input
                    value={T.text(item?.SimilarProductTitre)}
                    disabled
                    className="FilterInput bg-white disabled:opacity-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Sous-titre</label>
                  <input
                    value={T.text(item?.SimilarProductSubTitre)}
                    disabled
                    className="FilterInput bg-white disabled:opacity-100"
                  />
                </div>
              </div>
            </div>

            {/* Aucune donnée */}
            {!item && (
              <div className="p-4 text-center bg-white rounded-md border border-primary/20">
                Aucune donnée enregistrée.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
