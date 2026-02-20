/* ------------------------------------------------------------------
   components/create-order/AddAddress.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AiOutlinePlus } from "react-icons/ai";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import LoadingDots from "@/components/LoadingDots";

/* ---------- props ---------- */
interface AddAddressProps {
  isFormVisible: boolean;        // modal visible ?
  getAddress(): void;            // refetch liste dans le parent
  toggleForminVisibility(): void;
  clientId: string;              // id du client (obligatoire pour CREATE)
  editAddress?: {                // undefined = mode création
    _id: string;
    Name: string;
    StreetAddress: string;
    Country: string;
    Province?: string;
    City: string;
    PostalCode: string;
    Phone?: string;
  };
}

/* ---------- component ---------- */
export default function AddAddress({
  isFormVisible,
  getAddress,
  toggleForminVisibility,
  clientId,
  editAddress,
}: AddAddressProps) {
  /* ---------- state ---------- */
  const [addressData, setAddressData] = useState({
    Name: "",
    StreetAddress: "",
    Country: "",
    Province: "",
    City: "",
    PostalCode: "",
    Phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ---------- reset formulaire en mode création ---------- */
  useEffect(() => {
    if (isFormVisible && !editAddress) {
      setAddressData({
        Name: "",
        StreetAddress: "",
        Country: "",
        Province: "",
        City: "",
        PostalCode: "",
        Phone: "",
      });
    }
  }, [isFormVisible, editAddress]);

  /* ---------- lock/unlock scroll quand modal/overlay ---------- */
  useEffect(() => {
    const toggle = isFormVisible || showSuccess;
    document.body.classList.toggle("overflow-hidden", toggle);
    document.documentElement.classList.toggle("overflow-hidden", toggle);
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [isFormVisible, showSuccess]);

  /* ---------- pré-remplir en mode édition ---------- */
  useEffect(() => {
    if (editAddress) {
      setAddressData({
        Name: editAddress.Name,
        StreetAddress: editAddress.StreetAddress,
        Country: editAddress.Country,
        Province: editAddress.Province || "",
        City: editAddress.City,
        PostalCode: editAddress.PostalCode,
        Phone: editAddress.Phone || "",
      });
    }
  }, [editAddress]);

  /* ---------- handlers ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      /* ----- UPDATE (dashboard admin) ----- */
      if (editAddress) {
        await fetchFromAPI(`/dashboardadmin/clientAddress/update/${editAddress._id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressData),
        });
      }
      /* ----- CREATE (dashboard admin) ----- */
      else {
        await fetchFromAPI(`/dashboardadmin/clientAddress/${clientId}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressData),
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        toggleForminVisibility();
        getAddress();            // refetch
        setIsSubmitting(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Erreur inattendue",
      );
      setIsSubmitting(false);
    }
  };

  if (!isFormVisible && !showSuccess) return null;

  /* ---------- UI ---------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-filter backdrop-brightness-75">
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto my-auto max-md:w-[90%] rounded-xl bg-white p-5 shadow-lg"
      >
        {/* Overlay Loading / Success */}
        {(isSubmitting || showSuccess) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/75">
            <LoadingDots
              loadingMessage="Chargement en cours…"
              successMessage={
                editAddress
                  ? "Adresse mise à jour avec succès !"
                  : "Adresse ajoutée avec succès !"
              }
              isSuccess={showSuccess}
            />
          </div>
        )}

        <h2 className="text-xl max-md:text-lg text-center font-semibold text-gray-900">
          {editAddress ? "Modifier l’adresse" : "Nouvelle adresse"}
        </h2>

        {/* ---------- champs ---------- */}
        <div className="grid grid-cols-1 gap-4 max-md:gap-2 sm:grid-cols-2">
          {/* Nom */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Nom*
            </label>
            <input
              name="Name"
              value={addressData.Name}
              onChange={handleChange}
              type="text"
              placeholder="ex. Maison, Travail, Chez Jane"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Pays */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pays*
            </label>
            <input
              name="Country"
              value={addressData.Country}
              onChange={handleChange}
              type="text"
              placeholder="ex. Tunisie, France, Canada"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Gouvernorat / État*
            </label>
            <input
              name="Province"
              value={addressData.Province}
              onChange={handleChange}
              type="text"
              placeholder="ex. Tunis, Ontario, Bavière"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Ville*
            </label>
            <input
              name="City"
              value={addressData.City}
              onChange={handleChange}
              type="text"
              placeholder="ex. Tunis, Paris, Montréal"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Code postal */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Code postal*
            </label>
            <input
              name="PostalCode"
              value={addressData.PostalCode}
              onChange={handleChange}
              type="text"
              placeholder="ex. 1001, 75000, H2X 1Y4"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Téléphone*
            </label>
            <input
              name="Phone"
              value={addressData.Phone}
              onChange={handleChange}
              type="tel"
              placeholder="ex. +216 12 345 678"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Adresse complète */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Adresse*
            </label>
            <input
              name="StreetAddress"
              value={addressData.StreetAddress}
              onChange={handleChange}
              type="text"
              placeholder="ex. 123 rue Principale, Appt 4B"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* ---------- boutons ---------- */}
        <div className="mt-4 flex w-full justify-end gap-4">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-primary hover:text-white max-md:w-full"
            disabled={isSubmitting}
          >
            <AiOutlinePlus className="h-5 w-5" />
            {editAddress ? "Enregistrer" : "Ajouter l’adresse"}
          </button>

          <button
            type="button"
            onClick={toggleForminVisibility}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-primary hover:text-white max-md:w-full"
            disabled={isSubmitting}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
