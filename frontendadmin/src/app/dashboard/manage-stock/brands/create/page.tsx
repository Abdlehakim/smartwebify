// src/app/manage-stock/brands/create/page.tsx

"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Image from "next/image";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormData {
  name: string;
  place: string;
  description?: string;
  existingLogoUrl?: string | null;
  existingImageUrl?: string | null;
}

export default function CreateBrandPage() {
  const router = useRouter();
  const logoInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormData>({
    name: "",
    place: "",
    description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      fd.append("place", form.place.trim());
      if (form.description) fd.append("description", form.description.trim());
      if (logoFile) fd.append("logo", logoFile);
      if (imageFile) fd.append("image", imageFile);

      await fetchFromAPI<{ message: string }>("/dashboardadmin/stock/brands/create", {
        method: "POST",
        body: fd,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/manage-stock/brands");
      }, 1500);
    } catch (err: unknown) {
      console.error("Creation failed:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Échec de la création de la marque.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Créer une marque</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/manage-stock/brands" className="text-gray-500 hover:underline">
            Toutes les marques
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Créer une marque</span>
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
          <label htmlFor="place" className="text-sm font-medium">
            Lieu*
          </label>
          <input
            id="place"
            name="place"
            type="text"
            value={form.place}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col md:w-1/2 lg:w-2/5 gap-4">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={4}
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="flex max-lg:flex-col w-160 gap-4 ">
          <div
            className="relative border-2 lg:w-1/2 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => logoInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange(setLogoFile, logoInput)}
            />
            {logoFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={URL.createObjectURL(logoFile)}
                  alt="Aperçu du logo"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile(setLogoFile, logoInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                Cliquez pour importer
                <br />
                Logo
              </div>
            )}
          </div>

          <div
            className="relative border-2 lg:w-1/2 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => imageInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange(setImageFile, imageInput)}
            />
            {imageFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={URL.createObjectURL(imageFile)}
                  alt="Aperçu de l’image"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile(setImageFile, imageInput)}
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
        </div>

        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-stock/brands">
            <button
              type="button"
              disabled={submitting}
              className="px-6 py-2 bg-quaternary text-white rounded"
            >
              Annuler
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiaire text-white rounded"
          >
            {submitting ? "Ajout en cours..." : "Ajouter la marque"}
          </button>
        </div>
      </form>

      <Overlay show={submitting || showSuccess} message={showSuccess ? "Marque créée avec succès" : undefined} />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
