// ------------------------------------------------------------------
// src/app/dashboard/manage-website/banners/page.tsx
// ------------------------------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface BannersData {
  _id: string;
  /* Meilleure collection */
  BCbannerImgUrl?: string;
  BCbannerTitle: string;
  /* Promotions */
  PromotionBannerImgUrl?: string;
  PromotionBannerTitle: string;
  /* Nouveaux produits */
  NPBannerImgUrl?: string;
  NPBannerTitle: string;
  /* Blog */
  BlogBannerImgUrl?: string;
  BlogBannerTitle: string;
  /* Contact */
  ContactBannerImgUrl?: string;
  ContactBannerTitle: string;
}

export default function BannersAdminPage() {
  const [item, setItem] = useState<BannersData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { banners } = await fetchFromAPI<{ banners: BannersData }>(
          "/dashboardadmin/website/banners/getBanners"
        );
        setItem(banners ?? null);
      } catch (err: unknown) {
        console.error("Erreur de chargement des bannières :", err);
        setError("Échec du chargement des bannières.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const T = {
    text: (v?: string) => (v && v.trim().length > 0 ? v : "—"),
  };

  return (
  <div className="mx-auto w-[95%] px-2 mb-6 py-4 h-fit flex flex-col gap-4 bg-green-50 rounded-xl">
      {/* En-tête */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Bannières</h1>

        {item ? (
          <Link href={`/dashboard/manage-website/banners/update/${item._id}`}>
            <button className="btn-fit-white-outline">Modifier</button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/banners/create">
            <button className="btn-fit-white-outline">Créer</button>
          </Link>
        )}
      </div>

      {/* Corps avec overlay de chargement */}
      <div className="relative flex-1 rounded-lg">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50 h-screen">
            <FaSpinner className="animate-spin text-3xl" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 text-center text-red-600 bg-white rounded-md border border-primary/20">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {/* Meilleure collection */}
              <BannerBlock
                label="Meilleure collection"
                imgUrl={item?.BCbannerImgUrl}
                imgAlt="Bannière Meilleure collection"
                title={T.text(item?.BCbannerTitle)}
                inputId="bcTitle"
                emptyText='Aucune bannière “Meilleure collection”'
              />

              {/* Promotions */}
              <BannerBlock
                label="Promotions"
                imgUrl={item?.PromotionBannerImgUrl}
                imgAlt="Bannière Promotions"
                title={T.text(item?.PromotionBannerTitle)}
                inputId="promoTitle"
                emptyText='Aucune bannière “Promotions”'
              />

              {/* Nouveaux produits */}
              <BannerBlock
                label="Nouveaux produits"
                imgUrl={item?.NPBannerImgUrl}
                imgAlt="Bannière Nouveaux produits"
                title={T.text(item?.NPBannerTitle)}
                inputId="npTitle"
                emptyText='Aucune bannière “Nouveaux produits”'
              />

              {/* Blog */}
              <BannerBlock
                label="Blog"
                imgUrl={item?.BlogBannerImgUrl}
                imgAlt="Bannière Blog"
                title={T.text(item?.BlogBannerTitle)}
                inputId="blogTitle"
                emptyText='Aucune bannière “Blog”'
              />

              {/* Contact */}
              <BannerBlock
                label="Contact"
                imgUrl={item?.ContactBannerImgUrl}
                imgAlt="Bannière Contact"
                title={T.text(item?.ContactBannerTitle)}
                inputId="contactTitle"
                emptyText='Aucune bannière “Contact”'
              />
            </div>

            {!item && (
              <div className="mt-4 p-4 text-center bg-white rounded-md border border-primary/20">
                Aucune donnée de bannières enregistrée.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------- UI helpers --------------------------- */
function BannerBlock(props: {
  label: string;
  imgUrl?: string;
  imgAlt: string;
  title: string;
  inputId: string;
  emptyText: string;
}) {
  const { label, imgUrl, imgAlt, title, inputId, emptyText } = props;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-primary/20 p-3">
      <div className="text-sm font-medium">Image Bannier — {label}</div>
      <div className="relative h-44 rounded-md overflow-hidden border border-primary/20">
        {imgUrl ? (
          <Image src={imgUrl} alt={imgAlt} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
            {emptyText}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm text-gray-600">
          Titre — {label}
        </label>
        <input
          id={inputId}
          value={title}
          disabled
          className="FilterInput bg-white disabled:opacity-100"
        />
      </div>
    </div>
  );
}
