"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import PaginationClient from "@/components/PaginationClient";
import { FaTrash, FaPenToSquare } from "react-icons/fa6";
import AddAddress from "@/components/checkout/AddAddress";
import DeletePopup from "@/components/Popup/DeletePopup";
import { fetchData } from "@/lib/fetchData";

const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

interface Address {
  _id: string;
  Name: string;
  StreetAddress: string;
  Country: string;
  Province?: string;
  City: string;
  PostalCode: string;
  Phone?: string;
}

const addressesPerPage = 2;

export default function AddressList() {
  const { isAuthenticated, loading } = useAuth();
  const [addrUpdateOk, setAddrUpdateOk] = useState("");
  const [addrUpdateErr, setAddrUpdateErr] = useState("");
  const [addrAddOk, setAddrAddOk] = useState("");
  const [addrAddErr, setAddrAddErr] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState("");
  const [addrToDelete, setAddrToDelete] = useState<Address | null>(null);
  const [addrEdit, setAddrEdit] = useState<Address | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      const data = await fetchData<Address[]>("/client/address/getAddress", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      setAddresses(data);
      setCurrentPage(1);
    } catch (err) {
      setAddressesError(
        err instanceof Error ? err.message : "Une erreur inattendue est survenue"
      );
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchAddresses().catch(() => {});
    }
  }, [loading, isAuthenticated, fetchAddresses]);

  const onAddrUpdated = useCallback(async () => {
    try {
      await fetchAddresses();
      setAddrUpdateOk("Adresse mise à jour avec succès !");
      setTimeout(() => setAddrUpdateOk(""), 3000);
    } catch (err) {
      setAddrUpdateErr(
        err instanceof Error ? err.message : "Une erreur inattendue est survenue"
      );
      setTimeout(() => setAddrUpdateErr(""), 3000);
    }
  }, [fetchAddresses]);

  const onAddrAdded = useCallback(async () => {
    try {
      await fetchAddresses();
      setAddrAddOk("Adresse ajoutée avec succès !");
      setTimeout(() => setAddrAddOk(""), 3000);
    } catch (err) {
      setAddrAddErr(
        err instanceof Error ? err.message : "Une erreur inattendue est survenue"
      );
      setTimeout(() => setAddrAddErr(""), 3000);
    }
  }, [fetchAddresses]);

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetchData(`/client/address/deleteAddress/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      setAddrUpdateOk("Adresse supprimée avec succès !");
      setTimeout(() => setAddrUpdateOk(""), 3000);
      await fetchAddresses();
    } catch (err) {
      setAddrUpdateErr(
        err instanceof Error ? err.message : "Une erreur inattendue est survenue"
      );
      setTimeout(() => setAddrUpdateErr(""), 3000);
    } finally {
      setAddrToDelete(null);
    }
  };

  const firstIndex = (currentPage - 1) * addressesPerPage;
  const shown = addresses.slice(firstIndex, firstIndex + addressesPerPage);
  const totalPages = Math.ceil(addresses.length / addressesPerPage);

  return (
    <section className="w-[90%] mx-auto flex flex-col lg:flex-row gap-10 py-6">
      <aside className="lg:w-1/5 space-y-2">
        <h2 className="text-lg font-semibold text-black">Carnet d’adresses</h2>
        <p className="text-sm text-gray-400">
          Gérez vos adresses de livraison et assurez‑vous qu’elles sont toujours à jour.
        </p>
      </aside>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setAddrEdit(null);
              setIsAddModalOpen(true);
            }}
            className="mt-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm text-black hover:text-white hover:bg-primary"
          >
            Ajouter
          </button>
        </div>

        <div className="h-6 flex justify-center">
          {addrAddOk && <p className="text-green-500">{addrAddOk}</p>}
          {addrAddErr && <p className="text-red-500">{addrAddErr}</p>}
          {addrUpdateOk && <p className="text-green-500">{addrUpdateOk}</p>}
          {addrUpdateErr && <p className="text-red-500">{addrUpdateErr}</p>}
        </div>

        <div className="flex-1 overflow-auto space-y-4">
          {addressesLoading ? (
            Array(addressesPerPage)
              .fill(null)
              .map((_, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex max-md:flex-col justify-between gap-2 h-66"
                >
                  <Skel className="h-full w-full" />
                </div>
              ))
          ) : addressesError ? (
            <div className="py-6 text-center text-red-500">{addressesError}</div>
          ) : shown.length === 0 ? (
            <div className="py-6 text-center text-gray-600">Aucune adresse trouvée.</div>
          ) : (
            shown.map((addr, i) => (
              <div
                key={addr._id}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex max-md:flex-col justify-between gap-2 h-66"
              >
                <div className="space-y-1 max-md:text-sm">
                  <p>
                    <span className="font-semibold">N° :</span> {firstIndex + i + 1}
                  </p>
                  <p>
                    <span className="font-semibold">Nom :</span> {addr.Name}
                  </p>
                  <p>
                    <span className="font-semibold">Adresse :</span> {addr.StreetAddress}
                  </p>
                  <p>
                    <span className="font-semibold">Ville :</span> {addr.City}
                  </p>
                  <p>
                    <span className="font-semibold">Gouvernorat :</span>{" "}
                    {addr.Province || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Code postal :</span> {addr.PostalCode}
                  </p>
                  <p>
                    <span className="font-semibold">Pays :</span> {addr.Country}
                  </p>
                  {addr.Phone && (
                    <p>
                      <span className="font-semibold">Téléphone :</span> {addr.Phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-col max-md:flex-row max-md:justify-end gap-2">
                  <button
                    onClick={() => {
                      setAddrEdit(addr);
                      setIsAddModalOpen(true);
                    }}
                    className="h-9 w-9 flex items-center justify-center border rounded text-secondary hover:bg-primary hover:text-white"
                    title="Modifier"
                  >
                    <FaPenToSquare size={16} />
                  </button>
                  <button
                    onClick={() => setAddrToDelete(addr)}
                    className="h-9 w-9 flex items-center justify-center border rounded text-secondary hover:bg-primary hover:text-white"
                    title="Supprimer"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <PaginationClient
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <AddAddress
        isFormVisible={isAddModalOpen}
        getAddress={addrEdit ? onAddrUpdated : onAddrAdded}
        toggleForminVisibility={() => {
          setIsAddModalOpen(false);
          setAddrEdit(null);
        }}
        editAddress={addrEdit ?? undefined}
      />

      {addrToDelete && (
        <DeletePopup
          handleClosePopup={() => setAddrToDelete(null)}
          Delete={handleDeleteAddress}
          id={addrToDelete._id}
          name={addrToDelete.Name}
        />
      )}
    </section>
  );
}
