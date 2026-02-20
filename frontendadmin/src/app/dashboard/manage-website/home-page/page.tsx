// src/app/dashboard/manage-website/home-page/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

interface HomePageData {
  _id: string;
  HPbannerImgUrl: string;
  HPbannerTitle: string;
  HPcategorieTitle: string;
  HPcategorieSubTitle: string;
  HPbrandTitle: string;
  HPbrandSubTitle: string;
  HPmagasinTitle: string;
  HPmagasinSubTitle: string;
  HPNewProductTitle: string;
  HPNewProductSubTitle: string;
  HPPromotionTitle: string;
  HPPromotionSubTitle: string;
  HPBestCollectionTitle: string;
  HPBestCollectionSubTitle: string;
}

export default function HomePageAdminPage() {
  const [item, setItem] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { homePageData } = await fetchFromAPI<{ homePageData: HomePageData[] }>(
          "/dashboardadmin/website/homepage/gethomePageData"
        );
        setItem(homePageData?.[0] ?? null);
      } catch (err) {
        console.error("Erreur de chargement de la page d’accueil :", err);
        setError("Échec du chargement des données de la page d’accueil.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const F = {
    text: (v?: string) => (v && v.trim().length > 0 ? v : "—"),
  };

  const containerMinH = loading ? "min-h-[100svh]" : "";

  return (
    <div
      className={`mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 bg-green-50 rounded-xl mb-6 ${containerMinH}`}
      aria-busy={loading}
    >
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Page d’accueil</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/home-page/update/${item._id}`}>
            <button className="btn-fit-white-outline">Modifier</button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/home-page/create">
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
                Aucune donnée de page d’accueil enregistrée.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-md border border-primary/20 p-4">
                  <h2 className="text-lg font-semibold mb-3">Bannière</h2>
                  <div className="relative h-64 rounded-md overflow-hidden border border-primary/20">
                    {item.HPbannerImgUrl ? (
                      <Image
                        src={item.HPbannerImgUrl}
                        alt="Bannière d’accueil"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Aucune bannière téléversée
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-sm text-gray-600">Titre de la bannière</label>
                      <input
                        value={F.text(item.HPbannerTitle)}
                        disabled
                        className="FilterInput bg-white disabled:opacity-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-primary/20 p-4 mb-6">
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Catégories</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Titre</label>
                        <input
                          value={F.text(item.HPcategorieTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Sous-titre</label>
                        <input
                          value={F.text(item.HPcategorieSubTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Marques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Titre</label>
                        <input
                          value={F.text(item.HPbrandTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Sous-titre</label>
                        <input
                          value={F.text(item.HPbrandSubTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Magasins</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Titre</label>
                        <input
                          value={F.text(item.HPmagasinTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Sous-titre</label>
                        <input
                          value={F.text(item.HPmagasinSubTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Nouveaux produits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Titre</label>
                        <input
                          value={F.text(item.HPNewProductTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Sous-titre</label>
                        <input
                          value={F.text(item.HPNewProductSubTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Promotions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Titre</label>
                        <input
                          value={F.text(item.HPPromotionTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Sous-titre</label>
                        <input
                          value={F.text(item.HPPromotionSubTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <h3 className="font-medium mb-2">Meilleure collection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Titre</label>
                        <input
                          value={F.text(item.HPBestCollectionTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Sous-titre</label>
                        <input
                          value={F.text(item.HPBestCollectionSubTitle)}
                          disabled
                          className="FilterInput bg-white disabled:opacity-100"
                        />
                      </div>
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
