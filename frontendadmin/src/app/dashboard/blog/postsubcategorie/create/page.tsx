"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Image from "next/image";
import { PiImage } from "react-icons/pi";

interface PostCategorie {
  _id: string;
  name: string;
}

interface FormFields {
  name: string;
  postCategorie: string;
}

export default function CreatePostSubCategoriePage() {
  const router = useRouter();
  const iconInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<PostCategorie[]>([]);
  const [form, setForm] = useState<FormFields>({ name: "", postCategorie: "" });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchFromAPI<{ PostCategories: PostCategorie[] }>("/api/dashboardadmin/blog/postcategorie");
        setCategories(res.PostCategories);
      } catch (err) {
        console.error("Échec du chargement des catégories :", err);
      }
    })();
  }, []);

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
    (setter: React.Dispatch<React.SetStateAction<File | null>>, inputRef: React.RefObject<HTMLInputElement | null>) =>
    () => {
      setter(null);
      if (inputRef.current) inputRef.current.value = "";
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("postCategorie", form.postCategorie);
      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);

      await fetchFromAPI("/api/dashboardadmin/blog/postsubcategorie/create", {
        method: "POST",
        body: fd,
      });

      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/blog/postsubcategorie"), 1500);
    } catch (err: unknown) {
      console.error("Échec de création :", err);
      setError(err instanceof Error ? err.message : "Échec de création de la sous-catégorie.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Créer une sous-catégorie d’articles</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/blog/postsubcategorie" className="text-gray-500 hover:underline">
            Toutes les sous-catégories
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Créer une sous-catégorie</span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col md:w-1/2 lg:w-2/5 gap-2">
          <label htmlFor="name" className="text-sm font-medium">Nom*</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleInputChange}
            required
            disabled={submitting}
            className="border-2 border-gray-300 rounded px-3 py-2 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col md:w-1/2 lg:w-2/5 gap-2">
          <label htmlFor="postCategorie" className="text-sm font-medium">Catégorie parente*</label>
          <select
            id="postCategorie"
            name="postCategorie"
            value={form.postCategorie}
            onChange={handleInputChange}
            required
            disabled={submitting}
            className="border-2 border-gray-300 rounded px-3 py-2 disabled:opacity-50"
          >
            <option value="">Sélectionner une catégorie…</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4">
          {[
            { file: iconFile, ref: iconInput, label: "Icône" },
            { file: imageFile, ref: imageInput, label: "Image" },
            { file: bannerFile, ref: bannerInput, label: "Bannière" },
          ].map(({ file, ref, label }) => (
            <div
              key={label}
              className="relative flex-1 border-2 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
              onClick={() => ref.current?.click()}
            >
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange(
                  label === "Icône" ? setIconFile : label === "Image" ? setImageFile : setBannerFile,
                  ref
                )}
                disabled={submitting}
              />
              <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                <PiImage size={24} />
              </div>
              {file ? (
                <div className="relative w-full h-full rounded overflow-hidden">
                  <Image src={URL.createObjectURL(file)} alt={label} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={clearFile(
                      label === "Icône" ? setIconFile : label === "Image" ? setImageFile : setBannerFile,
                      ref
                    )}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition disabled:opacity-50"
                    disabled={submitting}
                  >
                    <MdDelete size={16} className="text-red-600" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 pointer-events-none">
                  Cliquez pour importer
                  <br />
                  {label}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-8">
          <Link href="/dashboard/blog/postsubcategorie">
            <button
              type="button"
              disabled={submitting}
              className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
            >
              Annuler
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50"
          >
            {submitting ? "Création…" : "Créer la sous-catégorie"}
          </button>
        </div>
      </form>

      <Overlay show={submitting || showSuccess} message={showSuccess ? "Sous-catégorie créée avec succès" : undefined} />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
