// src/app/manage-stock/sub-categories/voir/[subcategorieId]/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface SubCategory {
  _id: string;
  name: string;
  slug?: string;
  numberproduct?: number;
  categorie: { _id: string; name: string };
  iconUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: "approve" | "not-approve";
}

export default function SubCategoryViewPage() {
  const { subcategorieId } = useParams<{ subcategorieId: string }>();
  const router = useRouter();
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subcategorieId) return;
    setLoading(true);
    fetchFromAPI<SubCategory>(`/dashboardadmin/stock/subcategories/${subcategorieId}`)
      .then((data) => {
        setSubCategory(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load sub-category");
      })
      .finally(() => setLoading(false));
  }, [subcategorieId]);

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

  if (!subCategory) {
    return <p className="p-4">Sub-category not found.</p>;
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
        <h1 className="text-3xl font-bold">Sub-Category Details</h1>
      </div>

      <div className="bg-white shadow rounded p-6 flex gap-8">
        {subCategory.iconUrl && (
          <Image
            src={subCategory.iconUrl}
            alt={`${subCategory.name} icon`}
            width={120}
            height={120}
            className="object-cover rounded"
          />
        )}
        <div className="space-y-2">
          <div>
            <strong>Name:</strong> {subCategory.name}
          </div>
          <div>
            <strong>Slug:</strong> {subCategory.slug ?? "—"}
          </div>
          <div>
            <strong>Parent Category:</strong> {subCategory.categorie.name}
          </div>
          <div>
            <strong># Products:</strong> {subCategory.numberproduct ?? "—"}
          </div>
          <div>
            <strong>Admin Status:</strong>{" "}
            <span
              className={
                subCategory.vadmin === "approve"
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {subCategory.vadmin}
            </span>
          </div>
          <div>
            <strong>Created By:</strong> {subCategory.createdBy?.username ?? "—"}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(subCategory.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Updated By:</strong> {subCategory.updatedBy?.username ?? "—"}
          </div>
          <div>
            <strong>Updated At:</strong>{" "}
            {new Date(subCategory.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {subCategory.imageUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={subCategory.imageUrl}
            alt={`${subCategory.name} image`}
            width={150}
            height={150}
            className="object-cover rounded"
      
          />
          <div>
            <strong>Additional Image</strong>
          </div>
        </div>
      )}

      {subCategory.bannerUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={subCategory.bannerUrl}
            alt={`${subCategory.name} banner`}
            width={300}
            height={150}
            className="object-cover rounded"
          
          />
          <div>
            <strong>Banner</strong>
          </div>
        </div>
      )}
    </div>
  );
}
