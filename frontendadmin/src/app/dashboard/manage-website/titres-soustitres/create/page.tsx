"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormFields {
  SimilarProductTitre: string;
  SimilarProductSubTitre: string;
}

export default function CreateWebsiteTitres() {
  const router = useRouter();

  const [form, setForm] = useState<FormFields>({
    SimilarProductTitre: "",
    SimilarProductSubTitre: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if data already exists
  useEffect(() => {
    (async () => {
      try {
        const { websiteTitres } =
          await fetchFromAPI<{ websiteTitres: { _id: string }[] }>(
            "/api/dashboardadmin/website/getWebsiteTitres"
          );
        if (websiteTitres.length > 0) {
          router.replace(
            `/dashboard/manage-website/titres-soustitres/update/${websiteTitres[0]._id}`
          );
          return;
        }
      } catch (e) {
        console.error("Error checking existing WebsiteTitres:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <div className="py-6 text-center">Checking existing data…</div>;
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
      await fetchFromAPI<{ message: string }>(
        "/dashboardadmin/website/createWebsiteTitres",
        {
          method: "POST",
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
      console.error("Creation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create entry.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Create Titres &amp; Sous-titres</h1>
        <Link href="/dashboard/manage-website/titres-soustitres">
          <button className="px-4 py-2 bg-quaternary text-white rounded hover:opacity-90">
            All Entries
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
              className="px-6 py-2 bg-quaternary text-white rounded"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded"
          >
            {submitting ? "Creating..." : "Create Entry"}
          </button>
        </div>
      </form>

      {/* Overlay & Error */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Created successfully!" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
