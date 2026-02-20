/* ------------------------------------------------------------------
   Sélection d’un client : Account (“account”), ClientShop (“shop”)
   ou ClientCompany (“company”)
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaSearch, FaSpinner } from "react-icons/fa";

/* ---------- constants ---------- */
const MIN_CHARS = 2;
const DEBOUNCE  = 300;

/* ---------- types ---------- */
export interface Client {
  _id: string;
  username?: string;
  name?: string;
  phone?: string;
  email?: string;
  origin: "account" | "shop" | "company";
}

interface SelectClientProps {
  client: Client | null;
  searchClients(query: string): Promise<Client[]>;
  onSelect(client: Client): void;
  onClear(): void;
}

/* ---------- helpers ---------- */
const displayName = (c: Client) => c.username || c.name || "—";
const badgeColor = (o: Client["origin"]) => {
  switch (o) {
    case "shop":
      return "bg-purple-200 text-purple-800";
    case "company":
      return "bg-green-200 text-green-800";
    default:
      return "bg-blue-200 text-blue-800";
  }
};

/* ---------- component ---------- */
export default function SelectClient({
  client,
  searchClients,
  onSelect,
  onClear,
}: SelectClientProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  /* ───────── fetch suggestions (delegated) ───────── */
  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setError("");
      return;
    }

    const id = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const clients = await searchClients(query.trim());
        setResults(clients);
        if (clients.length === 0) setError("Aucun résultat.");
      } catch {
        setError("Erreur de recherche.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);

    return () => clearTimeout(id);
  }, [query, searchClients]);

  /* ───────── close dropdown on outside click ───────── */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setResults([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ───────── UI ───────── */
  if (client) {
    return (
      <div className="border rounded-lg p-4 bg-white space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="font-bold">Client sélectionné</h2>
          <button
  type="button"           
  onClick={onClear}
  className="text-red-600 text-sm hover:underline"
>
  Retirer
</button>
        </div>

        <p>
          <strong>Nom :</strong> {displayName(client)}
        </p>
        <p>
          <strong>Email :</strong> {client.email || "—"}
        </p>
        <p>
          <strong>Téléphone :</strong> {client.phone || "—"}
        </p>
        <span
          className={`${badgeColor(
            client.origin,
          )} text-[10px] uppercase px-2 py-[2px] rounded`}
        >
          {client.origin}
        </span>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="font-semibold">Client :</label>
      <div className="flex gap-2 mt-1">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          placeholder="Nom, email ou téléphone…"
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <div className="bg-primary text-white px-4 py-2 rounded flex items-center">
          {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
        </div>
      </div>

      {/* suggestions */}
      {query && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
          {results.map((c) => (
            <li
              key={`${c.origin}-${c._id}`}
              onClick={() => {
                onSelect(c);
                setQuery("");
                setResults([]);
              }}
              className="cursor-pointer px-3 py-2 hover:bg-gray-100 flex justify-between items-start"
            >
              <div className="flex flex-col">
                <span className="font-medium">{displayName(c)}</span>
                {c.email && (
                  <span className="text-sm text-gray-600">{c.email}</span>
                )}
                {c.phone && (
                  <span className="text-xs text-gray-500">{c.phone}</span>
                )}
              </div>
              <span
                className={`${badgeColor(
                  c.origin,
                )} text-[10px] uppercase px-2 py-[2px] rounded self-start`}
              >
                {c.origin}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && !loading && (
        <p className="text-red-600 mt-1 text-sm">{error}</p>
      )}
    </div>
  );
}
