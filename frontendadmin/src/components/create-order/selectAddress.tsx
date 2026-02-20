/* ------------------------------------------------------------------
   components/create-order/SelectAddress.tsx
   Sélection d’une adresse de livraison
------------------------------------------------------------------ */
"use client";

import React, {
  useRef,
  useState,
  useEffect,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  AiOutlineDown,
  AiOutlineUp,
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineSetting,
} from "react-icons/ai";
import AddAddress from "@/components/create-order/AddAddress";
import ManageAddresses from "@/components/create-order/ManageAddresses";
import type { Client } from "@/components/create-order/selectClient";

/* ---------- tiny skeleton helper (parité avec checkout) ---------- */
const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

/* ---------- types ---------- */
export interface Address {
  _id: string;
  Name: string;
  StreetAddress: string;
  Country: string;
  Province?: string;
  City: string;
  PostalCode: string;
  Phone: string;
}

interface SelectAddressProps {
  client: Client | null;
  addresses: Address[];
  value: string | null;
  onChange(id: string | null, label: string | null): void;
  loading?: boolean;
  refreshAddresses?: () => void | Promise<void>;
}

/* ---------- helpers ---------- */
/** Format complet (inclut le téléphone comme dans le checkout) */
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

/* ---------- component ---------- */
export default function SelectAddress({
  client,
  addresses,
  value,
  onChange,
  loading = false,
  refreshAddresses,
}: SelectAddressProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [showManage, setShowManage] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* close dropdown on outside click + ESC (aligné avec checkout) */
  useEffect(() => {
    const onDocClick = (e: MouseEvent | ReactMouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!client) return null;

  const selected = value ? addresses.find((a) => a._id === value) ?? null : null;

  const buttonText = selected
    ? formatAddress(selected)
    : loading
    ? "Chargement des adresses…"
    : addresses.length
    ? "-- Choisir une adresse --"
    : "Aucune adresse enregistrée pour ce client.";

  const openAddForm = () => {
    setAddressToEdit(null);
    setShowForm(true);
  };
  const openEditForm = () => {
    if (selected) {
      setAddressToEdit(selected);
      setShowForm(true);
    }
  };

  return (
    <>
      {/* Select dropdown (parité visuelle avec checkout) */}
      <div className="relative w-full py-4 bg-white space-y-4 mt-6">
        <h2 className="font-bold">Adresse de livraison</h2>

        {loading ? (
          <Skel className="h-12 w-full" />
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
              <span className={selected ? "block w-full truncate" : "text-gray-400 block w-full truncate"}>
                {buttonText}
              </span>
              {open ? (
                <AiOutlineUp className="h-4 w-4 text-gray-500 shrink-0" />
              ) : (
                <AiOutlineDown className="h-4 w-4 text-gray-500 shrink-0" />
              )}
            </button>

            {open && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md
                           bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
              >
                {addresses.map((a) => {
                  const isSelected = a._id === value;
                  return (
                    <li
                      key={a._id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(a._id, formatAddress(a));
                        setOpen(false);
                      }}
                      className={`cursor-pointer select-none px-4 py-2 transition-colors ${
                        isSelected
                          ? "bg-secondary text-white"
                          : "hover:bg-secondary hover:text-white"
                      }`}
                    >
                      <div className="truncate">{formatAddress(a)}</div>
                    </li>
                  );
                })}

                {!addresses.length && (
                  <li className="px-4 py-2 text-gray-500">
                    Aucune adresse enregistrée pour ce client.
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Actions alignées à droite (on garde Edit / Gérer spécifiques admin) */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={openAddForm}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm
                     flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          <AiOutlinePlus className="h-4 w-4" />
          Ajouter une nouvelle adresse
        </button>

        <button
          type="button"
          onClick={openEditForm}
          disabled={!selected}
          className={`w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm
                      flex items-center gap-4 ${
                        selected
                          ? "hover:bg-primary hover:text-white cursor-pointer"
                          : "opacity-50 cursor-not-allowed"
                      }`}
        >
          <AiOutlineEdit className="h-4 w-4" />
          Modifier l’adresse sélectionnée
        </button>

        <button
          type="button"
          onClick={() => setShowManage(true)}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm
                     flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          <AiOutlineSetting className="h-4 w-4" />
          Gérer / supprimer
        </button>
      </div>

      {/* Modal Add / Edit */}
      <AddAddress
        isFormVisible={showForm}
        toggleForminVisibility={() => setShowForm(false)}
        clientId={client._id}
        editAddress={addressToEdit || undefined}
        getAddress={async () => {
          await refreshAddresses?.();
        }}
      />

      {/* Modal Manage / Delete */}
      <ManageAddresses
        isVisible={showManage}
        addresses={addresses}
        fetched={true}
        onClose={() => setShowManage(false)}
        refresh={async () => {
          await refreshAddresses?.();
        }}
      />
    </>
  );
}
