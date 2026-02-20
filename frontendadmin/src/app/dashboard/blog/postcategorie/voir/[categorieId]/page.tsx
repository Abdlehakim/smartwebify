// src/app/dashboard/blog/postcategorie/voir/[categorieId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface PostCategorie {
  _id: string;
  name: string;
  slug?: string;
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

export default function PostCategorieViewPage() {
  const { categorieId } = useParams();
  const router = useRouter();

  const [cat, setCat] = useState<PostCategorie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categorieId) return;

    setLoading(true);

    fetchFromAPI<{ postCategorie: PostCategorie }>(
      `/dashboardadmin/blog/postcategorie/${categorieId}`
    )
      .then(({ postCategorie }) => {
        setCat(postCategorie);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load category")
      )
      .finally(() => setLoading(false));
  }, [categorieId]);

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

  if (!cat) {
    return <p className="p-4">Post category not found.</p>;
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
        <h1 className="text-3xl font-bold">Post Category Details</h1>
      </div>

      <div className="bg-white shadow rounded p-6 flex gap-8">
        {cat.iconUrl && (
          <Image
            src={cat.iconUrl}
            alt={`${cat.name} icon`}
            width={120}
            height={120}
            className="object-cover rounded"
          />
        )}

        <div className="space-y-2">
          <div>
            <strong>Name:</strong> {cat.name}
          </div>
          <div>
            <strong>Slug:</strong> {cat.slug ?? "—"}
          </div>
          <div>
            <strong># Posts:</strong> {cat.numberPosts ?? "—"}
          </div>
          {cat.vadmin && (
            <div>
              <strong>Admin Status:</strong>{" "}
              <span
                className={
                  cat.vadmin === "approve" ? "text-green-600" : "text-red-600"
                }
              >
                {cat.vadmin}
              </span>
            </div>
          )}
          <div>
            <strong>Created By:</strong> {cat.createdBy?.username ?? "—"}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(cat.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Updated By:</strong> {cat.updatedBy?.username ?? "—"}
          </div>
          <div>
            <strong>Updated At:</strong>{" "}
            {new Date(cat.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {cat.imageUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={cat.imageUrl}
            alt={`${cat.name} image`}
            width={150}
            height={150}
            className="object-cover rounded"
          />
          <div>
            <strong>Additional Image</strong>
          </div>
        </div>
      )}

      {cat.bannerUrl && (
        <div className="bg-white shadow rounded p-6 flex gap-8 items-center">
          <Image
            src={cat.bannerUrl}
            alt={`${cat.name} banner`}
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
