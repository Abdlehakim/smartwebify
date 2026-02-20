// src/app/dashboard/manage-website/home-page/update/[id]/page.tsx
"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

interface FormFields {
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

export default function UpdateHomePageData() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormFields>({
    HPbannerTitle: "",
    HPcategorieTitle: "",
    HPcategorieSubTitle: "",
    HPbrandTitle: "",
    HPbrandSubTitle: "",
    HPmagasinTitle: "",
    HPmagasinSubTitle: "",
    HPNewProductTitle: "",
    HPNewProductSubTitle: "",
    HPPromotionTitle: "",
    HPPromotionSubTitle: "",
    HPBestCollectionTitle: "",
    HPBestCollectionSubTitle: "",
  });

  const [existingBannerUrl, setExistingBannerUrl] = useState<string | undefined>();
  const [bannerPreview, setBannerPreview] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { homePageData } = await fetchFromAPI<{
          homePageData: (FormFields & { _id: string; HPbannerImgUrl?: string })[];
        }>("/dashboardadmin/website/homepage/gethomePageData");

        if (!homePageData?.length) {
          router.replace("/dashboard/manage-website/home-page/create");
          return;
        }

        const entry = homePageData.find((e) => e._id === id);
        if (!entry) {
          router.replace("/dashboard/manage-website/home-page");
          return;
        }

        setForm({
          HPbannerTitle: entry.HPbannerTitle ?? "",
          HPcategorieTitle: entry.HPcategorieTitle ?? "",
          HPcategorieSubTitle: entry.HPcategorieSubTitle ?? "",
          HPbrandTitle: entry.HPbrandTitle ?? "",
          HPbrandSubTitle: entry.HPbrandSubTitle ?? "",
          HPmagasinTitle: entry.HPmagasinTitle ?? "",
          HPmagasinSubTitle: entry.HPmagasinSubTitle ?? "",
          HPNewProductTitle: entry.HPNewProductTitle ?? "",
          HPNewProductSubTitle: entry.HPNewProductSubTitle ?? "",
          HPPromotionTitle: entry.HPPromotionTitle ?? "",
          HPPromotionSubTitle: entry.HPPromotionSubTitle ?? "",
          HPBestCollectionTitle: entry.HPBestCollectionTitle ?? "",
          HPBestCollectionSubTitle: entry.HPBestCollectionSubTitle ?? "",
        });
        setExistingBannerUrl(entry.HPbannerImgUrl);
        setBannerPreview(entry.HPbannerImgUrl);
      } catch {
        setError("Échec du chargement des données de la page d’accueil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBannerPreview(URL.createObjectURL(file));
    else setBannerPreview(existingBannerUrl);
    if (!file && bannerInput.current) bannerInput.current.value = "";
  };

  const clearBanner = () => {
    setBannerPreview(undefined);
    if (bannerInput.current) bannerInput.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    for (const [k, v] of Object.entries(form)) {
      if (!v.trim()) {
        setError(`Le champ « ${k} » est requis.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      const file = bannerInput.current?.files?.[0];
      if (file) fd.append("banner", file);

      await fetchFromAPI<{ success: boolean }>(
        `/dashboardadmin/website/homepage/updatehomePageData/${id}`,
        { method: "PUT", body: fd }
      );

      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-website/home-page"), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
      setSubmitting(false);
    }
  };

  const containerMinH = loading ? "min-h-[100svh]" : "";

  return (
    <div
      className={`mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 bg-green-50 rounded-xl mb-6 ${containerMinH}`} aria-busy={loading}
    >
      <div className="flex h-16 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase">Mettre à jour la page d’accueil</h1>
          <nav className="text-sm underline flex items-center gap-2">
            <Link href="/dashboard/manage-website/home-page" className="text-gray-500 hover:underline">
              Page d’accueil
            </Link>
            <MdArrowForwardIos className="text-gray-400" size={14} />
            <span className="text-gray-700 font-medium">Mise à jour</span>
          </nav>
        </div>
        <div className="flex items-start gap-2">
          <Link href="/dashboard/manage-website/home-page">
            <button type="button" className="btn-fit-white-outline disabled:opacity-50" disabled={submitting}>
              Annuler
            </button>
          </Link>
          <button
            type="submit"
            form="home-update-form"
            className="btn-fit-white-outline disabled:opacity-50 flex items-center gap-2"
            disabled={submitting}
          >
            {submitting && <FaSpinner className="animate-spin" />}
            Mettre à jour
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-green-50">
          <FaSpinner className="animate-spin text-3xl" />
        </div>
      )}

      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

      <form id="home-update-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-white rounded-md border border-primary/20 p-4">
          <h2 className="text-lg font-semibold mb-3">Bannière</h2>
          <div className="relative h-64 rounded-md overflow-hidden border border-primary/20">
            {bannerPreview ? (
              <>
                <Image src={bannerPreview} alt="Bannière d’accueil" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearBanner}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Cliquez pour importer la bannière
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={bannerInput}
              onChange={handleBannerChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-gray-600" htmlFor="HPbannerTitle">Titre de la bannière</label>
              <input
                id="HPbannerTitle"
                name="HPbannerTitle"
                value={form.HPbannerTitle}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 bg-white border-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md border border-primary/20 p-4 mb-6">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Catégories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPcategorieTitle">Titre</label>
                <input
                  id="HPcategorieTitle"
                  name="HPcategorieTitle"
                  value={form.HPcategorieTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPcategorieSubTitle">Sous-titre</label>
                <input
                  id="HPcategorieSubTitle"
                  name="HPcategorieSubTitle"
                  value={form.HPcategorieSubTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Marques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPbrandTitle">Titre</label>
                <input
                  id="HPbrandTitle"
                  name="HPbrandTitle"
                  value={form.HPbrandTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPbrandSubTitle">Sous-titre</label>
                <input
                  id="HPbrandSubTitle"
                  name="HPbrandSubTitle"
                  value={form.HPbrandSubTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Magasins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPmagasinTitle">Titre</label>
                <input
                  id="HPmagasinTitle"
                  name="HPmagasinTitle"
                  value={form.HPmagasinTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPmagasinSubTitle">Sous-titre</label>
                <input
                  id="HPmagasinSubTitle"
                  name="HPmagasinSubTitle"
                  value={form.HPmagasinSubTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Nouveaux produits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPNewProductTitle">Titre</label>
                <input
                  id="HPNewProductTitle"
                  name="HPNewProductTitle"
                  value={form.HPNewProductTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPNewProductSubTitle">Sous-titre</label>
                <input
                  id="HPNewProductSubTitle"
                  name="HPNewProductSubTitle"
                  value={form.HPNewProductSubTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Promotions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPPromotionTitle">Titre</label>
                <input
                  id="HPPromotionTitle"
                  name="HPPromotionTitle"
                  value={form.HPPromotionTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPPromotionSubTitle">Sous-titre</label>
                <input
                  id="HPPromotionSubTitle"
                  name="HPPromotionSubTitle"
                  value={form.HPPromotionSubTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="mb-2">
            <h3 className="font-medium mb-2">Meilleure collection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPBestCollectionTitle">Titre</label>
                <input
                  id="HPBestCollectionTitle"
                  name="HPBestCollectionTitle"
                  value={form.HPBestCollectionTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600" htmlFor="HPBestCollectionSubTitle">Sous-titre</label>
                <input
                  id="HPBestCollectionSubTitle"
                  name="HPBestCollectionSubTitle"
                  value={form.HPBestCollectionSubTitle}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Mise à jour réussie !" : "Mise à jour de la page d’accueil en cours…"}
      />
    </div>
  );
}
