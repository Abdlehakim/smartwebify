/* ------------------------------------------------------------------
   components/create-order/ManageAddresses.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiTrash } from "react-icons/fi";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import type { Address } from "./selectAddress";
import LoadingDots from "@/components/LoadingDots";

/* ---------- props ---------- */
interface ManageAddressesProps {
  isVisible: boolean;
  addresses: Address[];
  fetched: boolean;
  onClose(): void;
  refresh(): void;
}

/* ---------- component ---------- */
export default function ManageAddresses({
  isVisible,
  addresses,
  fetched,
  onClose,
  refresh,
}: ManageAddressesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /* lock scroll when modal open / success overlay */
  useEffect(() => {
    const toggle = isVisible || showSuccess;
    document.body.classList.toggle("overflow-hidden", toggle);
    document.documentElement.classList.toggle("overflow-hidden", toggle);
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [isVisible, showSuccess]);

  /* handlers */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetchFromAPI(`/dashboardadmin/clientAddress/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setDeletingId(null);
        refresh(); // recharge la liste dans SelectAddress
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
      setDeletingId(null);
    }
  };

  if (!isVisible && !showSuccess) return null;

  /* ---------- UI ---------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-filter backdrop-brightness-75">
      <div className="relative mx-auto my-auto w-[60%] max-md:w-[90%] rounded-xl bg-white p-5 shadow-lg flex flex-col gap-4">
        {/* Loading + Success Overlay */}
        {(deletingId || showSuccess) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white bg-opacity-75">
            <LoadingDots
              loadingMessage="Suppression en cours…"
              successMessage="Adresse supprimée avec succès !"
              isSuccess={showSuccess}
            />
          </div>
        )}

        <h2 className="text-center text-xl font-semibold">All Adresses</h2>

        {/* -------- contenu principal -------- */}
        {!fetched ? (
          <div className="space-y-2 h-64 max-h-64 overflow-y-auto">
            <LoadingDots />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-center text-gray-500">
            Aucune adresse enregistrée.
          </p>
        ) : (
          /* max-h-64 ≈ 4 lignes puis scroll */
          <ul className="space-y-2 h-64 max-h-64 overflow-y-auto py-6">
            {addresses.map((a) => (
              <li
                key={a._id}
                className="flex justify-between items-center rounded border border-gray-200 p-3"
              >
                <span className="text-sm leading-5 w-full">
                  {`${a.StreetAddress}, ${a.City} ${a.PostalCode}, ${a.Country}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(a._id)}
                  disabled={Boolean(deletingId)}
                  className="ml-4 rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="Supprimer"
                >
                  {deletingId === a._id ? (
                    <LoadingDots />
                  ) : (
                    <FiTrash className="h-5 w-5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-primary hover:text-white max-md:w-full"
          disabled={Boolean(deletingId)}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
