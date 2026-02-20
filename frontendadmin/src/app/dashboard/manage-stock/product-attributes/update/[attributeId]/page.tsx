// src/app/manage-stock/product-attributes/update/[attributeId]/page.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type AttributeType = "dimension" | "color" | "other type";

interface ProductAttribute {
  _id: string;
  name: string;
  /** may be a single type or an array (old → new schema transition) */
  type: AttributeType | AttributeType[];
}

/* A helper that squashes “string | string[]” into a single string for
   the 1-choice <select>. If the back-end later supports multiple types
   in the UI, switch to a multi-select or check-boxes instead. */
const firstType = (t: AttributeType | AttributeType[]): AttributeType =>
  Array.isArray(t) ? t[0] : t;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function UpdateProductAttributePage() {
  const { attributeId } = useParams<{ attributeId: string }>();
  const router = useRouter();

  /* ---------- form state ---------- */
  const [name, setName] = useState("");
  const [type, setType] = useState<AttributeType | "">("");

  /* ---------- ui state ---------- */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- load existing attribute ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { attribute } = await fetchFromAPI<{ attribute: ProductAttribute }>(
          `/dashboardadmin/stock/productattribute/${attributeId}`
        );
        setName(attribute.name);
        setType(firstType(attribute.type));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load attribute."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [attributeId]);

  /* ---------- submit handler ---------- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!type) {
      setError("Please choose a type.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchFromAPI(
        `/dashboardadmin/stock/productattribute/update/${attributeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), type }),
        }
      );

      setShowSuccess(true);
      setTimeout(
        () => router.push("/dashboard/manage-stock/product-attributes"),
        1500
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  if (loading) return ;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Update Product Attribute</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block mb-1" htmlFor="attr-name">
            Name*
          </label>
          <input
            id="attr-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block mb-1" htmlFor="attr-type">
            Type*
          </label>
          <select
            id="attr-type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as AttributeType)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="" disabled>
              -- choose --
            </option>
            <option value="dimension">Dimension</option>
            <option value="color">Color</option>
            <option value="other type">Other type</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 rounded"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {submitting ? "Saving…" : "Update"}
          </button>
        </div>
      </form>

      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Attribute updated!" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
