"use client";

import React, { useEffect, useRef, useState } from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { fetchData } from "@/lib/fetchData";

/* ---------- tiny skeleton helper ---------- */
const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export interface Magasin {
  _id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  city?: string;

  /** set on the SELECTED magasin and mirrors `name` for BE payloads */
  MagasinName?: string;
}

interface Props {
  value: string | null;
  onChange: (id: string | null, magasin: Magasin | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function MagasinSelected({
  value,
  onChange,
  placeholder = "-- Choisir un magasin --",
  label = "Magasin de retrait",
  disabled = false,
}: Props) {
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchData<Magasin[]>("/checkout/Magasin-options");
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
        setMagasins(list);
      } catch {
        setMagasins([]);
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

  const selected = magasins.find((m) => m._id === value) || null;
  const fmtOption = (m: Magasin) => (m.city ? `${m.name} — ${m.city}` : m.name);

  const buttonText =
    selected?.name ??
    (loading
      ? "Chargement des magasins…"
      : magasins.length
      ? placeholder
      : "Aucun magasin disponible");

  const canInteract = !disabled && !loading && magasins.length > 0;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">{label}</h2>

      {/* Select-like dropdown */}
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => canInteract && setOpen((p) => !p)}
          className={`flex h-12 w-full items-center justify-between rounded-md border
                      border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none
                      focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50
                      ${!selected ? "text-gray-400" : ""}`}
          disabled={!canInteract}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="block w-full truncate">{buttonText}</span>
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
            ) : magasins.length ? (
              <>
                {/* Clear selection option */}
                {selected && (
                  <li
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      onChange(null, null);
                      setOpen(false);
                    }}
                    className="cursor-pointer select-none px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Effacer la sélection
                  </li>
                )}
                {magasins.map((m) => {
                  const isSelected = m._id === value;
                  return (
                    <li
                      key={m._id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        // Ensure the selected magasin object carries MagasinName = name
                        onChange(m._id, { ...m, MagasinName: m.name });
                        setOpen(false);
                      }}
                      className={`cursor-pointer select-none px-4 py-2 transition-colors ${
                        isSelected
                          ? "bg-secondary text-white"
                          : "hover:bg-secondary hover:text-white"
                      }`}
                    >
                      <div className="truncate font-medium">{fmtOption(m)}</div>
                      {(m.address || m.phoneNumber) && (
                        <p className="text-xs text-gray-500">
                          {m.address ?? ""}
                          {m.address && m.phoneNumber ? " • " : ""}
                          {m.phoneNumber ?? ""}
                        </p>
                      )}
                    </li>
                  );
                })}
              </>
            ) : (
              <li className="px-4 py-2 text-gray-500">Aucun magasin disponible</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
