/* ------------------------------------------------------------------
   components/create-order/SelectMagasins.tsx
   (désormais purement “affichage” : ne fait plus de requête)
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";

/* ---------- types ---------- */
export interface Magasin {
  _id: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
}

interface SelectMagasinsProps {
  value: string | null;
  /** liste déjà chargée par le parent */
  magasins?: Magasin[];
  /** état de chargement depuis le parent */
  loading?: boolean;
  onChange(id: string | null, magasin: Magasin | null): void;
}

/* ---------- helpers ---------- */
const fmt = (b: Magasin) => `${b.name}${b.city ? " – " + b.city : ""}`;

/* ---------- component ---------- */
export default function SelectMagasins({
  value,
  magasins = [],
  loading = false,
  onChange,
}: SelectMagasinsProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* fermer dropdown sur clic extérieur */
  useEffect(() => {
    const handle = (e: MouseEvent | ReactMouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = value ? magasins.find((b) => b._id === value) ?? null : null;

  return (
    <div className="py-4 bg-white space-y-4 mt-6">
      <h2 className="font-bold">Magasin de retrait</h2>

      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex h-12 w-full items-center justify-between rounded-md border
                     border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none
                     focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50"
          disabled={loading}
        >
          <span
            className={
              selected
                ? "block w-full truncate"
                : "text-gray-400 block w-full truncate"
            }
          >
            {selected
              ? fmt(selected)
              : loading
              ? "Chargement des magasins…"
              : "-- Choisir un magasin --"}
          </span>
          {open ? (
            <AiOutlineUp className="h-4 w-4 shrink-0 text-gray-500" />
          ) : (
            <AiOutlineDown className="h-4 w-4 shrink-0 text-gray-500" />
          )}
        </button>

        {open && (
          <ul
            className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md
                       bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
          >
            {!loading &&
              magasins.map((b) => (
                <li
                  key={b._id}
                  onClick={() => {
                    onChange(b._id, b);
                    setOpen(false);
                  }}
                  className={`cursor-pointer select-none px-4 py-2 hover:bg-primary hover:text-white ${
                    b._id === value ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  {fmt(b)}
                  {(b.address || b.phoneNumber) && (
                    <p className="text-xs text-gray-500">
                      {b.address ?? ""}{" "}
                      {b.phoneNumber ? "• " + b.phoneNumber : ""}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
