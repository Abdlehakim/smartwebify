// ------------------------------------------------------------------
// src/app/dashboard/manage-website/banners/update/[id]/page.tsx
// ------------------------------------------------------------------
"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MdArrowForwardIos } from "react-icons/md";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import LoadingDots from "@/components/LoadingDots";

/* ------------ banner document shape ------------ */
interface BannerDoc {
  _id: string;

  BCbannerImgUrl?: string;
  BCbannerTitle?: string;

  PromotionBannerImgUrl?: string;
  PromotionBannerTitle?: string;

  NPBannerImgUrl?: string;
  NPBannerTitle?: string;

  BlogBannerImgUrl?: string;
  BlogBannerTitle?: string;

  ContactBannerImgUrl?: string;
  ContactBannerTitle?: string;
}

/* ------------ editable form fields ------------- */
interface FormFields {
  BCbannerTitle: string;
  PromotionBannerTitle: string;
  NPBannerTitle: string;
  BlogBannerTitle: string;
  ContactBannerTitle: string;
}

export default function UpdateBannersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bannerId = params.id;

  /* ---------- state ---------- */
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

  const [loading, setLoading] = useState(true);   // initial fetch (bootstrapping)
  const [saving, setSaving] = useState(false);    // submit in progress
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const asStr = (v: unknown) =>
    typeof v === "string" ? v : v == null ? "" : String(v);

  /* ---------- fetch current doc ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { banners } = await fetchFromAPI<{ banners: BannerDoc }>(
          `/dashboardadmin/website/banners/getBanners`
        );

        if (!banners || banners._id !== bannerId) {
          router.replace("/dashboard/manage-website/banners");
          return;
        }

        // Keep inputs controlled: coerce to strings
        setForm({
          BCbannerTitle: asStr(banners.BCbannerTitle),
          PromotionBannerTitle: asStr(banners.PromotionBannerTitle),
          NPBannerTitle: asStr(banners.NPBannerTitle),
          BlogBannerTitle: asStr(banners.BlogBannerTitle),
          ContactBannerTitle: asStr(banners.ContactBannerTitle),
        });

        setBCpreview(banners.BCbannerImgUrl ?? null);
        setPromoPreview(banners.PromotionBannerImgUrl ?? null);
        setNPPreview(banners.NPBannerImgUrl ?? null);
        setBlogPreview(banners.BlogBannerImgUrl ?? null);
        setContactPreview(banners.ContactBannerImgUrl ?? null);
      } catch (err) {
        console.error("Load banner doc error:", err);
        setErrorMsg("Failed to load banner data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bannerId, router]);

  /* ------------ handlers ------------ */
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const fileChange =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      previewSetter: React.Dispatch<React.SetStateAction<string | null>>
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      previewSetter(file ? URL.createObjectURL(file) : null);
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));

      if (BCbannerFile) data.append("BCbanner", BCbannerFile);
      if (PromotionBannerFile) data.append("PromotionBanner", PromotionBannerFile);
      if (NPBannerFile) data.append("NPBanner", NPBannerFile);
      if (BlogBannerFile) data.append("BlogBanner", BlogBannerFile);
      if (ContactBannerFile) data.append("ContactBanner", ContactBannerFile);

      const res = await fetchFromAPI<{ success: boolean; message?: string }>(
        `/dashboardadmin/website/banners/updateBanners/${bannerId}`,
        { method: "PUT", body: data }
      );

      if (res.success) {
        router.push("/dashboard/manage-website/banners");
      } else {
        setErrorMsg(res.message || "Update failed.");
        setSaving(false);
      }
    } catch (err) {
      console.error("Update banners error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error.");
      setSaving(false);
    }
  };

  /* ------------ upload cell (matches list page styles) ------------ */
  const UploadCell = (
    fileSetter: React.Dispatch<React.SetStateAction<File | null>>,
    preview: string | null,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>,
    inputId: keyof FormFields,
    labelText: string
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
          onChange={fileChange(fileSetter, previewSetter)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm text-gray-600">
          Titre — {labelText}
        </label>
        <input
          id={inputId}
          type="text"
          value={form[inputId] ?? ""}  // keep controlled
          onChange={handleTitleChange}
          required
          className="FilterInput bg-white disabled:opacity-100"
        />
      </div>
    </div>
  );

  /* ------------ LoadingDots behavior similar to orders page ------------ */
  // Full-page loader BEFORE UI renders
  if (loading) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Chargement des bannières…" />
      </div>
    );
  }

  // Full-page loader WHILE SAVING (replaces UI)
  if (saving) {
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

  /* ------------ render (wrapper + body match list page) ------------ */
  return (
    <div className="mx-auto w-[95%] px-2 mb-6 py-4 h-fit min-h-screen flex flex-col gap-4 bg-green-50 rounded-xl">
      {/* Header + breadcrumb with top action buttons */}
      <div className="flex h-16 justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold uppercase">Bannières</h1>
          <nav className="text-sm underline flex items-center gap-2">
            <Link href="/dashboard/manage-website/banners" className="text-gray-500 hover:underline">
              Bannières
            </Link>
            <MdArrowForwardIos size={14} className="text-gray-400" />
            <span className="text-gray-700 font-medium">Modifier</span>
          </nav>
        </div>

        {/* Top action buttons (same button look as your DeletePopup) */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            form="updateForm"
            className="btn-fit-white-outline disabled:opacity-50"
          >
            Mettre à jour
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/manage-website/banners")}
            className="btn-fit-white-outline"
          >
            Annuler
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 rounded-lg h-full">
        <form id="updateForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
            {UploadCell(setBCbannerFile, BCpreview, setBCpreview, "BCbannerTitle", "Meilleure collection")}
            {UploadCell(setPromotionBannerFile, PromoPreview, setPromoPreview, "PromotionBannerTitle", "Promotions")}
            {UploadCell(setNPBannerFile, NPPreview, setNPPreview, "NPBannerTitle", "Nouveaux produits")}
            {UploadCell(setBlogBannerFile, BlogPreview, setBlogPreview, "BlogBannerTitle", "Blog")}
            {UploadCell(setContactBannerFile, ContactPreview, setContactPreview, "ContactBannerTitle", "Contact")}
          </div>
        </form>
      </div>

      {/* error popup */}
      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}
