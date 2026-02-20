/* ------------------------------------------------------------------
   src/components/checkout/DeliveryAddress.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AiOutlinePlus, AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { useAuth } from "@/hooks/useAuth";
import { fetchData } from "@/lib/fetchData";
import AddAddress from "./AddAddress";

/* ---------- tiny skeleton helper ---------- */
const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

/* ---------- model ---------- */
export interface Address {
  _id: string;
  Name: string;
  StreetAddress: string;
  Country: string;
  Province?: string;
  City: string;
  PostalCode: string;
  Phone?: string;
}

/* ---------- props ---------- */
interface Props {
  selectedAddressId: string;
  onAddressChange(id: string, DeliverToAddress: string): void;
}

/** Build a clean, comma-separated address string (includes phone) */
const formatAddress = (a: Address) =>
  [
    a.Name,
    a.StreetAddress,
    a.City,
    a.Province,
    a.PostalCode,
    a.Country,
    a.Phone && `Tel: ${a.Phone}`,
  ]
    .filter(Boolean)
    .join(", ");

export default function DeliveryAddress({
  selectedAddressId,
  onAddressChange,
}: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  // dropdown state (aligned with other components)
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { isAuthenticated, loading: authLoading } = useAuth();

  /* ---------- fetch addresses ---------- */
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchData<Address[]>("/client/address/getAddress", {
        credentials: "include",
      });
      setAddresses(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des adresses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchAddresses();
  }, [authLoading, isAuthenticated, fetchAddresses]);

  /* ---------- close on outside click / escape (like others) ---------- */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* ---------- selected ---------- */
  const selected =
    addresses.find((a) => a._id === selectedAddressId) ?? null;

  const buttonText = selected
    ? formatAddress(selected)
    : authLoading || loading
    ? "Chargement des adresses…"
    : addresses.length
    ? "-- Choisir une adresse --"
    : "Aucune adresse enregistrée";

  return (
    <>
      {error && <p className="text-red-500 py-2">{error}</p>}

      <div className="flex flex-col items-end gap-4">
        <h3 className="font-semibold w-full">
          Sélectionnez votre adresse ou ajoutez-en une nouvelle&nbsp;:
        </h3>

        {authLoading || loading ? (
          <Skel className="h-12 w-full min-w-0" />
        ) : (
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => !loading && addresses.length && setOpen((p) => !p)}
              className="flex h-12 w-full items-center justify-between rounded-md border
                         border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none
                         focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50"
              disabled={loading || !addresses.length}
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <span
                className={
                  selected ? "block w-full truncate" : "text-gray-400 block w-full truncate"
                }
              >
                {buttonText}
              </span>
              {open ? (
                <AiOutlineUp className="h-4 w-4 shrink-0 text-gray-500" />
              ) : (
                <AiOutlineDown className="h-4 w-4 shrink-0 text-gray-500" />
              )}
            </button>

            {open && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md
                           bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
              >
                {addresses.map((addr) => {
                  const isSelected = addr._id === selectedAddressId;
                  return (
                    <li
                      key={addr._id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onAddressChange(addr._id, formatAddress(addr));
                        setOpen(false);
                      }}
                      className={`cursor-pointer select-none px-4 py-2 transition-colors ${
                        isSelected
                          ? "bg-secondary text-white"
                          : "hover:bg-secondary hover:text-white"
                      }`}
                    >
                      <div className="truncate">{formatAddress(addr)}</div>
                    </li>
                  );
                })}

                {addresses.length === 0 && (
                  <li className="px-4 py-2 text-gray-500">
                    Aucune adresse enregistrée.
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!isAuthenticated}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white flex items-center gap-4"
        >
          <AiOutlinePlus className="h-5 w-5" />
          Ajouter une nouvelle adresse
        </button>
      </div>

      <AddAddress
        isFormVisible={showForm}
        toggleForminVisibility={() => {
          setShowForm(false);
          fetchAddresses();
        }}
        getAddress={fetchAddresses}
      />
    </>
  );
}
