// src/app/manage-stock/productattribute/create/page.tsx
"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- allowed types ---------- */
type AttributeType = "dimension" | "color" | "other type";

interface NewAttributeBody {
  name: string;
  type: AttributeType | AttributeType[]; // allow single or array
}

export default function CreateProductAttributePage() {
  const router = useRouter();

  /* ---------- form state ---------- */
  const [name, setName] = useState("");
  const [type, setType] = useState<AttributeType | "">("");

  /* ---------- ui state ---------- */
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- submit ---------- */
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

    setSaving(true);
    try {
      const body: NewAttributeBody = { name: name.trim(), type };

      await fetchFromAPI("/dashboardadmin/stock/productattribute/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      router.push("/dashboard/manage-stock/product-attributes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">New Product Attribute</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block mb-1">Name*</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block mb-1">Type*</label>
          <select
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
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
