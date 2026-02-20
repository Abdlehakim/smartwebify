"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Image from "next/image";
import { PiImage } from "react-icons/pi";

interface FormData {
  name: string;
  existingMainImageUrl?: string | null;
}

export default function CreateCategoryPage() {
  const router = useRouter();
  const iconInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormData>({ name: "" });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      if (!file && inputRef.current) {
        inputRef.current.value = "";
      }
    };

  const clearFile =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    () => {
      setter(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);

      await fetchFromAPI<{ message: string }>("/dashboardadmin/stock/categories/create", {
        method: "POST",
        body: fd,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/manage-stock/categories");
      }, 1500);
    } catch (err: unknown) {
      console.error("Échec de création :", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Échec de création de la catégorie.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Créer une catégorie</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/manage-stock/categories" className="text-gray-500 hover:underline">
            Toutes les catégories
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Créer une catégorie</span>
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

        <div className="flex max-lg:flex-col w-full gap-4">
          <div className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition">
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            {iconFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image src={URL.createObjectURL(iconFile)} alt="Icône principale" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile(setIconFile, iconInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-full text-gray-400"
                onClick={() => iconInput.current?.click()}
              >
                <input
                  ref={iconInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setIconFile, iconInput)}
                />
                Cliquez pour importer
                <br />
                Icône principale
              </div>
            )}
          </div>

          <div className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition">
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            {imageFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image src={URL.createObjectURL(imageFile)} alt="Image principale" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile(setImageFile, imageInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-full text-gray-400"
                onClick={() => imageInput.current?.click()}
              >
                <input
                  ref={imageInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setImageFile, imageInput)}
                />
                Cliquez pour importer
                <br />
                Image principale
              </div>
            )}
          </div>

          <div className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition">
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            {bannerFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image src={URL.createObjectURL(bannerFile)} alt="Bannière principale" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile(setBannerFile, bannerInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-full text-gray-400"
                onClick={() => bannerInput.current?.click()}
              >
                <input
                  ref={bannerInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setBannerFile, bannerInput)}
                />
                Cliquez pour importer
                <br />
                Bannière principale
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-stock/categories">
            <button type="button" disabled={submitting} className="px-6 py-2 bg-quaternary text-white rounded">
              Annuler
            </button>
          </Link>
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-tertiary text-white rounded">
            {submitting ? "Ajout en cours…" : "Ajouter la catégorie"}
          </button>
        </div>
      </form>

      <Overlay show={submitting || showSuccess} message={showSuccess ? "Catégorie créée avec succès" : undefined} />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
