"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Image from "next/image";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface CategoryData {
  name: string;
  iconUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
}

const blobLoader = ({ src }: { src: string }) => src;

export default function UpdateCategoryPage() {
  const router = useRouter();
  const { categorieId } = useParams() as { categorieId: string };

  const iconInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "" });

  const [initialIconUrl, setInitialIconUrl] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState("");
  const [initialBannerUrl, setInitialBannerUrl] = useState("");

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFromAPI<CategoryData>(`/dashboardadmin/stock/categories/${categorieId}`);
        setForm({ name: data.name });
        if (data.iconUrl) setInitialIconUrl(data.iconUrl);
        if (data.imageUrl) setInitialImageUrl(data.imageUrl);
        if (data.bannerUrl) setInitialBannerUrl(data.bannerUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec du chargement de la catégorie.");
      } finally {
        setLoading(false);
      }
    })();
  }, [categorieId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      clearInitial: React.Dispatch<React.SetStateAction<string>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      clearInitial("");
      if (!file && inputRef.current) inputRef.current.value = "";
    };

  const clearFile =
    (
      setterFile: React.Dispatch<React.SetStateAction<File | null>>,
      setterInitial: React.Dispatch<React.SetStateAction<string>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    () => {
      setterFile(null);
      setterInitial("");
      if (inputRef.current) inputRef.current.value = "";
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);
      await fetchFromAPI(`/dashboardadmin/stock/categories/update/${categorieId}`, { method: "PUT", body: fd });
      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/categories"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour de la catégorie.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto flex h-full w-[80%] flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Mettre à jour la catégorie</h1>
        <nav className="flex items-center gap-2 text-sm underline">
          <Link href="/dashboard/manage-stock/categories" className="text-gray-500 hover:underline">
            Toutes les catégories
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="font-medium text-gray-700">Mettre à jour la catégorie</span>
        </nav>
      </div>

      <div className="relative">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-8"
          style={{
            pointerEvents: loading || submitting || showSuccess ? "none" : "auto",
            opacity: loading || submitting || showSuccess ? 0.4 : 1,
          }}
        >
          <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
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
              disabled={submitting}
              className="rounded border-2 border-gray-300 px-3 py-2 disabled:opacity-50"
            />
          </div>

          <div className="flex w-full flex-col gap-4 lg:flex-row">
            {[
              { label: "Icône", file: iconFile, initialUrl: initialIconUrl, setFile: setIconFile, setInitial: setInitialIconUrl, ref: iconInput },
              { label: "Image", file: imageFile, initialUrl: initialImageUrl, setFile: setImageFile, setInitial: setInitialImageUrl, ref: imageInput },
              { label: "Bannière", file: bannerFile, initialUrl: initialBannerUrl, setFile: setBannerFile, setInitial: setInitialBannerUrl, ref: bannerInput },
            ].map(({ label, file, initialUrl, setFile, setInitial, ref }) => (
              <div
                key={label}
                className="relative h-72 flex-1 cursor-pointer rounded-lg border-2 border-gray-300 transition hover:border-gray-400"
                onClick={() => ref.current?.click()}
              >
                <input
                  ref={ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setFile, setInitial, ref)}
                  disabled={submitting}
                />
                <div className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
                  <PiImage size={24} />
                </div>
                {file || initialUrl ? (
                  <div className="relative h-full w-full overflow-hidden rounded">
                    <Image
                      src={file ? URL.createObjectURL(file) : initialUrl}
                      alt={label}
                      loader={file ? blobLoader : undefined}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearFile(setFile, setInitial, ref)}
                      disabled={submitting}
                      className="absolute right-1 top-1 rounded-full bg-white p-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <MdDelete size={16} className="text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div className="pointer-events-none flex h-full flex-col items-center justify-center text-gray-400">
                    Cliquez pour importer
                    <br />
                    {label}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-8">
            <Link href="/dashboard/manage-stock/categories">
              <button type="button" disabled={submitting} className="rounded bg-quaternary px-6 py-2 text-white disabled:opacity-50">
                Annuler
              </button>
            </Link>
            <button type="submit" disabled={submitting} className="rounded bg-tertiaire px-6 py-2 text-white disabled:opacity-50">
              {submitting ? "Mise à jour…" : "Mettre à jour la catégorie"}
            </button>
          </div>
        </form>

        <Overlay show={loading || submitting || showSuccess} message={showSuccess ? "Catégorie mise à jour avec succès" : undefined} />
      </div>

      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
