// src/app/manage-stock/voir/sub-categories/update/[subcategorieId]/page.tsx
"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import { PiImage } from "react-icons/pi";
import Image from "next/image";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

interface CategoryOption {
  _id: string;
  name: string;
}

interface SubCategoryData {
  name: string;
  categorie: { _id: string; name: string };
  iconUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
}

export default function UpdateSubCategoryPage() {
  const router = useRouter();
  const params = useParams<{ subcategorieId: string }>();
  const subCatId = params.subcategorieId;

  const iconInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [initialIconUrl, setInitialIconUrl] = useState<string>("");
  const [initialImageUrl, setInitialImageUrl] = useState<string>("");
  const [initialBannerUrl, setInitialBannerUrl] = useState<string>("");

  const [form, setForm] = useState<{ name: string; categorie: string }>({
    name: "",
    categorie: "",
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFromAPI<SubCategoryData>(`/dashboardadmin/stock/subcategories/${subCatId}`);
        setForm({ name: data.name, categorie: data.categorie._id });
        if (data.iconUrl) setInitialIconUrl(data.iconUrl);
        if (data.imageUrl) setInitialImageUrl(data.imageUrl);
        if (data.bannerUrl) setInitialBannerUrl(data.bannerUrl);

        const resp = await fetchFromAPI<{ categories: CategoryOption[] }>(`/dashboardadmin/stock/categories`);
        setCategories(resp.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec du chargement des données.");
      } finally {
        setLoading(false);
      }
    })();
  }, [subCatId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange =
    (setter: React.Dispatch<React.SetStateAction<File | null>>, inputRef: React.RefObject<HTMLInputElement | null>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      if (!file && inputRef.current) inputRef.current.value = "";
    };

  const clearFile =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      clearUrl: React.Dispatch<React.SetStateAction<string>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    () => {
      setter(null);
      clearUrl("");
      if (inputRef.current) inputRef.current.value = "";
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("categorie", form.categorie);
      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);

      await fetchFromAPI<{ message: string }>(`/dashboardadmin/stock/subcategories/update/${subCatId}`, {
        method: "PUT",
        body: fd,
      });

      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/sub-categories"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour de la sous-catégorie.");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Chargement…</div>;

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Mettre à jour la sous-catégorie</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/manage-stock/sub-categories" className="text-gray-500 hover:underline">
            Toutes les sous-catégories
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Mettre à jour la sous-catégorie</span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col md:w-1/2 lg:w-2/5 gap-4">
          <label htmlFor="name" className="text-sm font-medium">
            Nom*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col md:w-1/2 lg:w-2/5 gap-4">
          <label htmlFor="categorie" className="text-sm font-medium">
            Catégorie parente*
          </label>
          <select
            id="categorie"
            name="categorie"
            value={form.categorie}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex max-lg:flex-col w-full gap-4">
          <div
            className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => iconInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            <input ref={iconInput} type="file" accept="image/*" className="hidden" onChange={handleFileChange(setIconFile, iconInput)} />
            {iconFile || initialIconUrl ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image src={iconFile ? URL.createObjectURL(iconFile) : initialIconUrl} alt="Aperçu icône" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile(setIconFile, setInitialIconUrl, iconInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                Cliquez pour importer
                <br />
                Icône
              </div>
            )}
          </div>

          <div
            className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => imageInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            <input ref={imageInput} type="file" accept="image/*" className="hidden" onChange={handleFileChange(setImageFile, imageInput)} />
            {imageFile || initialImageUrl ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image src={imageFile ? URL.createObjectURL(imageFile) : initialImageUrl} alt="Aperçu image" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile(setImageFile, setInitialImageUrl, imageInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                Cliquez pour importer
                <br />
                Image
              </div>
            )}
          </div>

          <div
            className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => bannerInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={handleFileChange(setBannerFile, bannerInput)} />
            {bannerFile || initialBannerUrl ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image src={bannerFile ? URL.createObjectURL(bannerFile) : initialBannerUrl} alt="Aperçu bannière" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile(setBannerFile, setInitialBannerUrl, bannerInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                Cliquez pour importer
                <br />
                Bannière
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-stock/sub-categories">
            <button type="button" disabled={submitting} className="px-6 py-2 bg-quaternary text-white rounded">
              Annuler
            </button>
          </Link>
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-tertiary text-white rounded">
            {submitting ? (
              <>
                <FaSpinner className="inline mr-2 animate-spin" /> Mise à jour…
              </>
            ) : (
              "Mettre à jour la sous-catégorie"
            )}
          </button>
        </div>
      </form>

      <Overlay show={submitting || showSuccess} message={showSuccess ? "Sous-catégorie mise à jour avec succès" : undefined} />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
