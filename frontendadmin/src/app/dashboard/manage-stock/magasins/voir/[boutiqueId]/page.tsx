// src/app/manage-stock/magasins/voir/[magasinId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface TimeRange {
  open: string;
  close: string;
}

interface Magasin {
  _id: string;
  reference?: string;
  name: string;
  image?: string;
  phoneNumber?: string;
  localisation?: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: "approve" | "not-approve";
  openingHours?: Record<string, TimeRange[]>;
}

export default function MagasinViewPage() {
  const { magasinId } = useParams();
  const router = useRouter();
  const [magasin, setMagasin] = useState<Magasin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!magasinId) return;
    setLoading(true);
    fetchFromAPI<Magasin>(`/dashboardadmin/stock/magasins/${magasinId}`)
      .then(data => {
        setMagasin(data);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load magasin");
      })
      .finally(() => setLoading(false));
  }, [magasinId]);

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
  if (!magasin) {
    return <p className="p-4">Magasin not found.</p>;
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
        <h1 className="text-3xl font-bold">Magasin Details</h1>
      </div>

      <div className="bg-white shadow rounded p-6 flex gap-8">
        {magasin.image && (
          <Image
            src={magasin.image}
            alt={magasin.name}
            width={150}
            height={150}
            className="object-cover rounded"
          />
        )}
        <div className="space-y-2">
          <div><strong>Reference:</strong> {magasin.reference || "—"}</div>
          <div><strong>Name:</strong> {magasin.name}</div>
          <div><strong>Phone:</strong> {magasin.phoneNumber || "—"}</div>
          <div><strong>Localisation:</strong> {magasin.localisation || "—"}</div>
          <div>
            <strong>Admin Status:</strong>{" "}
            <span className={magasin.vadmin === "approve" ? "text-green-600" : "text-red-600"}>
              {magasin.vadmin}
            </span>
          </div>
          <div><strong>Created By:</strong> {magasin.createdBy?.username || "—"}</div>
          <div><strong>Created At:</strong> {new Date(magasin.createdAt).toLocaleString()}</div>
          <div><strong>Updated By:</strong> {magasin.updatedBy?.username || "—"}</div>
          <div><strong>Updated At:</strong> {new Date(magasin.updatedAt).toLocaleString()}</div>
        </div>
      </div>

      {magasin.openingHours && (
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Opening Hours</h2>
          <ul className="list-disc ml-6 space-y-1">
            {Object.entries(magasin.openingHours).map(([day, ranges]) => (
              <li key={day}>
                <strong>{day}:</strong> {ranges.map(r => `${r.open}-${r.close}`).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
