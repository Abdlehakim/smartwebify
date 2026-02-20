"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { MdArrowForwardIos } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormFields {
  SimilarProductTitre: string;
  SimilarProductSubTitre: string;
}

export default function UpdateWebsiteTitres() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState<FormFields>({
    SimilarProductTitre: "",
    SimilarProductSubTitre: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { websiteTitres } = await fetchFromAPI<{
          websiteTitres: (FormFields & { _id: string })[];
        }>("/dashboardadmin/website/getWebsiteTitres");

        if (websiteTitres.length === 0) {
          router.replace("/dashboard/manage-website/titres-soustitres/create");
          return;
        }

        const entry = websiteTitres.find((e) => e._id === id);
        if (!entry) {
          router.replace("/dashboard/manage-website/titres-soustitres");
          return;
        }

        setForm({
          SimilarProductTitre: entry.SimilarProductTitre,
          SimilarProductSubTitre: entry.SimilarProductSubTitre,
        });
      } catch (e) {
        console.error("Failed to load WebsiteTitres:", e);
        setError("Failed to load current titles.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    for (const [key, val] of Object.entries(form)) {
      if (!val.trim()) {
        setError(`Field "${key}" is required.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      await fetchFromAPI<{ success: boolean; message: string }>(
        `/dashboardadmin/website/updateWebsiteTitres/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SimilarProductTitre: form.SimilarProductTitre.trim(),
            SimilarProductSubTitre: form.SimilarProductSubTitre.trim(),
          }),
        }
      );

      setShowSuccess(true);
      setTimeout(
        () => router.push("/dashboard/manage-website/titres-soustitres"),
        1200
      );
    } catch (err: unknown) {
      console.error("Update failed:", err);
      setError(err instanceof Error ? err.message : "Failed to update entry.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <FaSpinner className="animate-spin text-3xl text-gray-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header & breadcrumb */}
      <div className="flex justify-start gap-2 flex-col h-16">
        <h1 className="text-3xl font-bold">Update Titres &amp; Sous-titres</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-website/titres-soustitres"
            className="text-gray-500 hover:underline"
          >
            Titres &amp; Sous-titres
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Update Entry</span>
        </nav>
      </div>

      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Similar Product Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="SimilarProductTitre" className="text-sm font-medium">
            Similar Product Title*
          </label>
          <input
            id="SimilarProductTitre"
            name="SimilarProductTitre"
            type="text"
            value={form.SimilarProductTitre}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Similar Product Sub Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="SimilarProductSubTitre" className="text-sm font-medium">
            Similar Product Sub Title*
          </label>
          <input
            id="SimilarProductSubTitre"
            name="SimilarProductSubTitre"
            type="text"
            value={form.SimilarProductSubTitre}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-website/titres-soustitres">
            <button
              type="button"
              disabled={submitting}
              className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <FaSpinner className="animate-spin" />}
            {submitting ? "Updating..." : "Update Entry"}
          </button>
        </div>
      </form>

      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Updated successfully!" : undefined}
      />
    </div>
  );
}
