/* ------------------------------------------------------------------
   components/create-order/SelectDeliveryOption.tsx
------------------------------------------------------------------ */
"use client";

import React, {
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";

/* ---------- types ---------- */
export interface DeliveryOption {
  _id: string;
  name: string;
  description: string;
  price: number;
  isPickup: boolean;
}

interface SelectDeliveryOptionProps {
  value: string | null;
  onChange(id: string | null, option: DeliveryOption | null): void;
  /** options déjà chargées par le parent */
  options: DeliveryOption[];
  loading: boolean;
}

/* ---------- helpers ---------- */
const fmt = (o: DeliveryOption) =>
  `${o.name} – ${o.price.toFixed(2).replace(".", ",")} TND`;

/* ---------- component ---------- */
export default function SelectDeliveryOption({
  value,
  onChange,
  options,
  loading,
}: SelectDeliveryOptionProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef<HTMLDivElement>(null);

  /* fermer dropdown sur clic extérieur */
  React.useEffect(() => {
    const handle = (e: MouseEvent | ReactMouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected =
    value ? options.find((o) => o._id === value) ?? null : null;

  /* ---------- UI ---------- */
  return (
    <div className="py-4 bg-white space-y-4 mt-6">
      <h2 className="font-bold">Mode de livraison</h2>

      {/* select */}
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
              ? "Chargement des modes de livraison…"
              : "-- Choisir un mode de livraison --"}
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
              options.map((opt) => (
                <li
                  key={opt._id}
                  onClick={() => {
                    onChange(opt._id, opt);
                    setOpen(false);
                  }}
                  className={`cursor-pointer select-none px-4 py-2 hover:bg-primary hover:text-white ${
                    opt._id === value ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  {fmt(opt)}
                  {opt.description && (
                    <p className="text-xs text-gray-500">{opt.description}</p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
