// src/app/dashboard/blog/postsubcategorie/voir/[subcategorieId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface PostSubCategorie {
  _id: string;
  name: string;
  slug?: string;
  parentCategorie?: { _id: string; name: string };
  numberPosts?: number;
  iconUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin?: "approve" | "not-approve";
}

export default function PostSubCategorieViewPage() {
  const { subcategorieId } = useParams();
  const router = useRouter();

  const [subcat, setSubcat] = useState<PostSubCategorie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subcategorieId) return;

    setLoading(true);

    fetchFromAPI<{ postSubCategorie: PostSubCategorie }>(
      `/dashboardadmin/blog/postsubcategorie/${subcategorieId}`
    )
      .then(({ postSubCategorie }) => {
        setSubcat(postSubCategorie);
        setError(null);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load sub-category"
        )
      )
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

  if (!subcat) {
    return <p className="p-4">Post sub-category not found.</p>;
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
        <h1 className="text-3xl font-bold">Post Sub-Category Details</h1>
      </div>

      <div className="bg-white shadow rounded p-6 flex gap-8">
        {subcat.iconUrl && (
          <Image
            src={subcat.iconUrl}
            alt={`${subcat.name} icon`}
            width={120}
            height={120}
            className="object-cover rounded"
          />
        )}

        <div className="space-y-2">
          <div>
            <strong>Name:</strong> {subcat.name}
          </div>
          <div>
            <strong>Slug:</strong> {subcat.slug ?? "—"}
          </div>
          <div>
            <strong># Posts:</strong> {subcat.numberPosts ?? "—"}
          </div>
          <div>
            <strong>Parent Category:</strong>{" "}
            {subcat.parentCategorie?.name ?? "—"}
          </div>
          {subcat.vadmin && (
            <div>
              <strong>Admin Status:</strong>{" "}
              <span
                className={
                  subcat.vadmin === "approve" ? "text-green-600" : "text-red-600"
                }
              >
                {subcat.vadmin}
              </span>
            </div>
          )}
          <div>
            <strong>Created By:</strong> {subcat.createdBy?.username ?? "—"}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(subcat.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Updated By:</strong> {subcat.updatedBy?.username ?? "—"}
          </div>
          <div>
            <strong>Updated At:</strong>{" "}
            {new Date(subcat.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {subcat.imageUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={subcat.imageUrl}
            alt={`${subcat.name} image`}
            width={150}
            height={150}
            className="object-cover rounded"
          />
          <div>
            <strong>Additional Image</strong>
          </div>
        </div>
      )}

      {subcat.bannerUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={subcat.bannerUrl}
            alt={`${subcat.name} banner`}
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
