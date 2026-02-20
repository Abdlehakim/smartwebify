// src/app/manage-stock/brands/voir/[brandId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface Brand {
  _id: string;
  reference?: string;
  name: string;
  place?: string;
  logoUrl?: string;
  imageUrl?: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: "approve" | "not-approve";
}

export default function BrandViewPage() {
  const { brandId } = useParams();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    fetchFromAPI<Brand>(`/dashboardadmin/stock/brands/${brandId}`)
      .then(data => {
        setBrand(data);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load brand");
      })
      .finally(() => setLoading(false));
  }, [brandId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-quaternary text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!brand) {
    return <p className="p-4">Brand not found.</p>;
  }

  return (
    <div className="p-6 w-[80%] mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-quaternary text-white rounded"
        >
          Back to list
        </button>
        <h1 className="text-3xl font-bold">Brand Details</h1>
      </div>

      <div className="bg-white shadow rounded p-6 flex gap-8">
        {brand.logoUrl && (
          <Image
            src={brand.logoUrl}
            alt={`${brand.name} logo`}
            width={150}
            height={150}
            className="object-cover rounded"
          />
        )}
        <div className="space-y-2">
          <div>
            <strong>Reference:</strong> {brand.reference || "—"}
          </div>
          <div>
            <strong>Name:</strong> {brand.name}
          </div>
          <div>
            <strong>Place:</strong> {brand.place || "—"}
          </div>
          <div>
            <strong>Admin Status:</strong>{" "}
            <span
              className={
                brand.vadmin === "approve" ? "text-green-600" : "text-red-600"
              }
            >
              {brand.vadmin}
            </span>
          </div>
          <div>
            <strong>Created By:</strong> {brand.createdBy?.username || "—"}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(brand.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Updated By:</strong> {brand.updatedBy?.username || "—"}
          </div>
          <div>
            <strong>Updated At:</strong>{" "}
            {new Date(brand.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {brand.imageUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={brand.imageUrl}
            alt={`${brand.name} image`}
            width={150}
            height={150}
            className="object-cover rounded"
          />
          <div>
            <strong>Additional Image</strong>
          </div>
        </div>
      )}
    </div>
  );
}
