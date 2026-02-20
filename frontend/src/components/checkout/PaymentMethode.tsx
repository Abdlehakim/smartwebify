/* ------------------------------------------------------------------
   src/app/components/checkout/PaymentMethode.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { fetchData } from "@/lib/fetchData";

/* ---------- tiny skeleton helper ---------- */
const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

interface PaymentMethod {
  _id?: string;      // backend id
  name?: string;     // stable key if provided
  label: string;     // display label
  help?: string;     // optional hint text
}

interface PaymentMethodeProps {
  selectedPaymentMethod: string;                 // store the label (or switch to id if you prefer)
  handlePaymentMethodChange: (id: string, label: string) => void; // UPDATED signature
}

const PaymentMethode: React.FC<PaymentMethodeProps> = ({
  selectedPaymentMethod,
  handlePaymentMethodChange,
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // dropdown state
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /* fetch enabled methods once */
  useEffect(() => {
    (async () => {
      try {
        const active = await fetchData<PaymentMethod[]>("/checkout/payment-methods");
        setMethods(active || []);
      } catch (err) {
        console.error("Fetch payment methods failed:", err);
        setMethods([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // close on outside click / escape
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

  const selected = methods.find((m) => m.label === selectedPaymentMethod) || null;

  const buttonText = selected
    ? selected.label
    : loading
    ? "Chargement des moyens de paiement…"
    : methods.length
    ? "-- Choisir un moyen de paiement --"
    : "Aucun moyen de paiement disponible";

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">
        Choisissez le moyen de paiement qui vous convient :
      </h3>

      {/* Select-like dropdown */}
      <div className="flex flex-col">
        <div className="relative w-full" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !loading && methods.length && setOpen((p) => !p)}
            className="flex h-12 w-full items-center justify-between rounded-md border
                       border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none
                       focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50"
            disabled={loading || !methods.length}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className={selected ? "block w-full truncate" : "text-gray-400 block w-full truncate"}>
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
              {loading ? (
                <>
                  <li className="px-4 py-2">
                    <Skel className="h-4 w-2/3" />
                    <Skel className="mt-1 h-3 w-1/2" />
                  </li>
                  <li className="px-4 py-2">
                    <Skel className="h-4 w-1/2" />
                    <Skel className="mt-1 h-3 w-1/3" />
                  </li>
                </>
              ) : (
                methods.map((m) => {
                  const isSelected = m.label === selectedPaymentMethod;
                  const key = m.name ?? m._id ?? m.label; // stable unique key
                  return (
                    <li
                      key={key}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        handlePaymentMethodChange(m._id ?? "", m.label);
                        setOpen(false);
                      }}
                      className={`cursor-pointer select-none px-4 py-2 transition-colors ${
                        isSelected
                          ? "bg-secondary text-white"
                          : "hover:bg-secondary hover:text-white"
                      }`}
                    >
                      <div className="truncate font-medium">{m.label}</div>
                      {m.help && <p className="text-xs text-gray-500">{m.help}</p>}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethode;
