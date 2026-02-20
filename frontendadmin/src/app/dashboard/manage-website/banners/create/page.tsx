// ------------------------------------------------------------------
// src/app/dashboard/manage-website/banners/create/page.tsx
// ------------------------------------------------------------------

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdArrowForwardIos } from "react-icons/md";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import LoadingDots from "@/components/LoadingDots";

/* ----------------------------- types ----------------------------- */
interface FormFields {
  BCbannerTitle: string;
  PromotionBannerTitle: string;
  NPBannerTitle: string;
  BlogBannerTitle: string;
  ContactBannerTitle: string;
}

/* --------------------------- component --------------------------- */
export default function CreateBannersPage() {
  const [form, setForm] = useState<FormFields>({
    BCbannerTitle: "",
    PromotionBannerTitle: "",
    NPBannerTitle: "",
    BlogBannerTitle: "",
    ContactBannerTitle: "",
  });

  const [BCbannerFile, setBCbannerFile] = useState<File | null>(null);
  const [PromotionBannerFile, setPromotionBannerFile] = useState<File | null>(null);
  const [NPBannerFile, setNPBannerFile] = useState<File | null>(null);
  const [BlogBannerFile, setBlogBannerFile] = useState<File | null>(null);
  const [ContactBannerFile, setContactBannerFile] = useState<File | null>(null);

  const [BCpreview, setBCpreview] = useState<string | null>(null);
  const [PromoPreview, setPromoPreview] = useState<string | null>(null);
  const [NPPreview, setNPPreview] = useState<string | null>(null);
  const [BlogPreview, setBlogPreview] = useState<string | null>(null);
  const [ContactPreview, setContactPreview] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ------------------------ handlers ------------------------ */
  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCreating(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));

      if (BCbannerFile) data.append("BCbanner", BCbannerFile);
      if (PromotionBannerFile) data.append("PromotionBanner", PromotionBannerFile);
      if (NPBannerFile) data.append("NPBanner", NPBannerFile);
      if (BlogBannerFile) data.append("BlogBanner", BlogBannerFile);
      if (ContactBannerFile) data.append("ContactBanner", ContactBannerFile);

      const res = await fetchFromAPI<{ success: boolean; message?: string }>(
        "/dashboardadmin/website/banners/createBanners",
        { method: "POST", body: data }
      );

      if (res.success) {
        window.location.href = "/dashboard/manage-website/banners";
      } else {
        setErrorMsg(res.message || "Échec de la création des bannières.");
        setCreating(false);
      }
    } catch (err) {
      console.error("Create Banners Error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
      setCreating(false);
    }
  };

  /* --------------------- upload cell helper --------------------- */
  const UploadCell = (
    fileSetter: React.Dispatch<React.SetStateAction<File | null>>,
    preview: string | null,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>,
    inputId: keyof FormFields,
    labelText: string,
    required = true
  ) => (
    <div className="flex flex-col gap-2 rounded-md border border-primary/20 p-3">
      <div className="text-sm font-medium">Image Bannier — {labelText}</div>
      <div className="relative h-44 rounded-md overflow-hidden border border-primary/20">
        {preview ? (
          <Image src={preview} alt={`${labelText} Preview`} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
            Aucune image sélectionnée
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, fileSetter, previewSetter)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          required={required}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm text-gray-600">
          Titre — {labelText}
        </label>
        <input
          id={inputId}
          type="text"
          value={form[inputId]}
          onChange={handleTextChange}
          required={required}
          className="FilterInput bg-white disabled:opacity-100"
        />
      </div>
    </div>
  );

  /* ----------------------------- UI ----------------------------- */
  // Full-page loader during creation (mirrors orders/update behavior)
  if (creating) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Création des bannières…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-[95%] px-2 mb-6 py-4 h-fit min-h-screen flex flex-col gap-4 bg-green-50 rounded-xl">
      {/* header + breadcrumb + top actions (same style as update page) */}
      <div className="flex h-16 justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold uppercase">Bannières</h1>
          <nav className="text-sm underline flex items-center gap-2">
            <Link href="/dashboard/manage-website/banners" className="text-gray-500 hover:underline">
              Bannières
            </Link>
            <MdArrowForwardIos size={14} className="text-gray-400" />
            <span className="text-gray-700 font-medium">Créer</span>
          </nav>
        </div>

        {/* Top action buttons — same look as DeletePopup */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            form="createForm"
            className="btn-fit-white-outline disabled:opacity-50"
          >
            Créer
          </button>
          <Link href="/dashboard/manage-website/banners">
            <button type="button" className="btn-fit-white-outline">
              Annuler
            </button>
          </Link>
        </div>
      </div>

      {/* form body */}
      <div className="relative flex-1 rounded-lg h-full">
        <form id="createForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
            {UploadCell(setBCbannerFile, BCpreview, setBCpreview, "BCbannerTitle", "Meilleure collection")}
            {UploadCell(
              setPromotionBannerFile,
              PromoPreview,
              setPromoPreview,
              "PromotionBannerTitle",
              "Promotions"
            )}
            {UploadCell(setNPBannerFile, NPPreview, setNPPreview, "NPBannerTitle", "Nouveaux produits")}
            {UploadCell(setBlogBannerFile, BlogPreview, setBlogPreview, "BlogBannerTitle", "Blog")}
            {UploadCell(
              setContactBannerFile,
              ContactPreview,
              setContactPreview,
              "ContactBannerTitle",
              "Contact"
            )}
          </div>
        </form>
      </div>

      {/* error popup */}
      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}
