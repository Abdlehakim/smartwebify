/* ------------------------------------------------------------------
   src/components/checkout/DeliveryMethod.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { fetchData } from "@/lib/fetchData";
import { useCurrency } from "@/contexts/CurrencyContext";

const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

interface DeliveryMethodProps {
  selectedMethodId: string;
  onMethodChange: (
    id: string,
    name: string,
    price: number,
    expectedDeliveryDate?: string
  ) => void;
  filter?: "all" | "pickupOnly" | "deliveryOnly";
}

interface DeliveryOption {
  id: string;
  name: string;
  description?: string;
  cost?: number;
  price?: number;
  estimatedDays?: number;
  isPickup?: boolean;
}

const DeliveryMethod: React.FC<DeliveryMethodProps> = ({
  selectedMethodId,
  onMethodChange,
  filter = "all",
}) => {
  const { fmt } = useCurrency();
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const opts = await fetchData<DeliveryOption[]>("/checkout/delivery-options?limit=100");
        setOptions([...(opts || [])].sort((a, b) => (a.cost ?? a.price ?? 0) - (b.cost ?? b.price ?? 0)));
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const filteredOptions = useMemo(() => {
    if (filter === "all") return options;
    if (filter === "pickupOnly") return options.filter((o) => !!o.isPickup);
    return options.filter((o) => !o.isPickup);
  }, [options, filter]);

  const selectedOpt = filteredOptions.find((o) => o.id === selectedMethodId) || null;

  const normalizePrice = (opt: DeliveryOption) => opt.cost ?? opt.price ?? 0;
  const labelFor = (opt: DeliveryOption) => {
    const value = normalizePrice(opt);
    return value === 0 ? `Gratuit – ${opt.name}` : `${fmt(value)} – ${opt.name}`;
  };

  const buttonText = selectedOpt
    ? labelFor(selectedOpt)
    : loading
    ? "Chargement des modes de livraison…"
    : filteredOptions.length
    ? "-- Choisir un mode de livraison --"
    : "Aucune méthode de livraison disponible";

  const computeExpectedISO = (opt: DeliveryOption) => {
    if (opt.isPickup) return undefined; // ← do not compute for pickup
    if (typeof opt.estimatedDays !== "number") return undefined;
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + opt.estimatedDays);
    return base.toISOString();
  };

  const handlePick = (opt: DeliveryOption) => {
    const expected = computeExpectedISO(opt);
    onMethodChange(opt.id, opt.name, normalizePrice(opt), expected);
    setOpen(false);
  };

  useEffect(() => {
    if (!selectedMethodId || !filteredOptions.length) return;
    const opt = filteredOptions.find((o) => o.id === selectedMethodId);
    if (!opt) return;
    const expected = computeExpectedISO(opt);
    onMethodChange(opt.id, opt.name, normalizePrice(opt), expected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethodId, filteredOptions.length]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold">Choisissez la méthode de livraison qui vous convient :</h2>
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !loading && filteredOptions.length && setOpen((p) => !p)}
          className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50"
          disabled={loading || !filteredOptions.length}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selectedOpt ? "block w-full truncate" : "text-gray-400 block w-full truncate"}>
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
            className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
          >
            {loading ? (
              <>
                <li className="px-4 py-2">
                  <Skel className="h-4 w-2/3" />
                  <Skel className="mt-1 h-3 w-1/3" />
                </li>
                <li className="px-4 py-2">
                  <Skel className="h-4 w-1/2" />
                  <Skel className="mt-1 h-3 w-1/4" />
                </li>
                <li className="px-4 py-2">
                  <Skel className="h-4 w-3/4" />
                  <Skel className="mt-1 h-3 w-1/2" />
                </li>
              </>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === selectedMethodId;
                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handlePick(opt)}
                    className={`cursor-pointer select-none px-4 py-2 transition-colors ${
                      isSelected ? "bg-secondary text-white" : "hover:bg-secondary hover:text-white"
                    }`}
                  >
                    <div className="truncate">{labelFor(opt)}</div>
                    {!!opt.description && (
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DeliveryMethod;
