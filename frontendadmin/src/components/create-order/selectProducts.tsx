/* ------------------------------------------------------------------
   selectProducts.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaSearch, FaSpinner } from "react-icons/fa";
import type { Client } from "./selectClient";

/* ---------- constants ---------- */
const MIN_CHARS = 2;
const DEBOUNCE = 300;

/* ---------- types ---------- */
interface AttributeRow {
  attributeSelected: { _id: string; name: string };
  value?:
    | string
    | Array<{ name: string; value?: string; hex?: string; image?: string }>;
}

export interface ProductLite {
  _id: string;
  name: string;
  reference: string;
  price: number;
  tva: number;
  discount: number;
  stockStatus: "in stock" | "out of stock";
  attributes?: AttributeRow[];
}

export interface BasketItem extends ProductLite {
  quantity: number;
  chosen: Record<string, string>;
}

interface SelectProductsProps {
  client: Client | null;
  basket: BasketItem[];
  setBasket: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  searchProducts: (query: string) => Promise<ProductLite[]>;
}

/* ---------- helpers ---------- */
const unitPrice = (p: ProductLite) =>
  p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;

/** signature of chosen attributes (sorted) */
const chosenSig = (chosen: Record<string, string> | undefined) =>
  Object.entries(chosen ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");

/** stable unique key for a basket line (handles duplicate product ids) */
const basketKey = (it: BasketItem, idx: number) =>
  `${it._id}__${it.reference}__${chosenSig(it.chosen)}__${idx}`;

/** merge lines that have same product id/reference and identical chosen attrs */
function mergeDuplicates(list: BasketItem[]): BasketItem[] {
  const map = new Map<string, BasketItem>();
  for (const it of list) {
    const key = `${it._id}__${it.reference}__${chosenSig(it.chosen)}`;
    const prev = map.get(key);
    if (prev) map.set(key, { ...prev, quantity: prev.quantity + it.quantity });
    else map.set(key, { ...it });
  }
  return Array.from(map.values());
}

/** Build options per attribute id (only names), preserving attribute order */
function buildOptionsIndex(p: ProductLite): { order: string[]; options: Record<string, string[]> } {
  const order: string[] = [];
  const options: Record<string, string[]> = {};
  (p.attributes ?? []).forEach((row) => {
    const id = row.attributeSelected._id;
    if (!id) return;
    let opts: string[] = [];
    if (typeof row.value === "string") opts = [row.value];
    else if (Array.isArray(row.value)) opts = row.value.map((o) => o.name);
    // ignore attributes with no options (robustness)
    if (opts.length > 0) {
      order.push(id);
      options[id] = opts;
    }
  });
  return { order, options };
}

/** Create a normalized signature from a partial choice using the given order */
function sigFromChoice(order: string[], choice: Record<string, string>): string {
  return order.map((id) => `${id}:${choice[id] ?? ""}`).join("|");
}

/** Find the first attribute combination not used yet; null if none available */
function findUnusedChoice(
  order: string[],
  options: Record<string, string[]>,
  usedSignatures: Set<string>,
): Record<string, string> | null {
  if (order.length === 0) {
    // no attributes — only a single "combo"
    return usedSignatures.size === 0 ? {} : null;
  }

  // Iterate cartesian product but stop at first unseen combo
  const dfs = (idx: number, cur: Record<string, string>): Record<string, string> | null => {
    if (idx === order.length) {
      const sig = sigFromChoice(order, cur);
      return usedSignatures.has(sig) ? null : { ...cur };
    }
    const attrId = order[idx];
    for (const val of options[attrId]) {
      cur[attrId] = val;
      const hit = dfs(idx + 1, cur);
      if (hit) return hit;
    }
    return null;
  };

  return dfs(0, {});
}

export default function SelectProducts({
  client,
  basket,
  setBasket,
  searchProducts,
}: SelectProductsProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  /* ───────── product autocomplete effect ───────── */
  useEffect(() => {
    if (!client) return;
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setError("");
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const products = await searchProducts(query.trim());
        setResults(products);
        if (products.length === 0) setError("Aucun résultat.");
      } catch {
        setError("Erreur de recherche.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);
    return () => clearTimeout(id);
  }, [query, client, searchProducts]);

  /* ───────── close dropdown on outside click ───────── */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ───────── basket helpers ───────── */
  const decrement = (index: number) =>
    setBasket((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it)),
    );

  const increment = (index: number) =>
    setBasket((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: it.quantity + 1 } : it)));

  const addProduct = (p: ProductLite) => {
    const { order, options } = buildOptionsIndex(p);

    // signatures already present for this product
    const used = new Set(
      basket
        .filter((b) => b._id === p._id && b.reference === p.reference)
        .map((b) => sigFromChoice(order, b.chosen)),
    );

    // choose an unused combination (or {} if no attributes and no existing line)
    const choice = findUnusedChoice(order, options, used);

    if (!choice) {
      // nothing new to add (all combos already present)
      setError("Aucune autre variante disponible pour ce produit.");
      // auto-hide message after a moment
      setTimeout(() => setError(""), 1800);
      return;
    }

    setBasket((prev) => [...prev, { ...p, quantity: 1, chosen: choice }]);
    setQuery("");
    setResults([]);
  };

  const removeProduct = (index: number) => setBasket((b) => b.filter((_, i) => i !== index));

  /* ---------- attribute selector ---------- */
  const renderAttrSelector = (itemIdx: number, attrRow: NonNullable<ProductLite["attributes"]>[number]) => {
    const id = attrRow.attributeSelected._id;
    const attributeName = attrRow.attributeSelected.name;
    const value = attrRow.value;
    const opts: string[] = [];
    if (typeof value === "string") opts.push(value);
    else if (Array.isArray(value)) opts.push(...value.map((o) => o.name));
    if (opts.length === 0) return null;

    return (
      <div key={`${itemIdx}-${id}`} className="flex items-center gap-1">
        <span className="text-sm">{attributeName}:</span>
        <select
          className="border rounded px-1 text-sm"
          value={basket[itemIdx].chosen[id]}
          onChange={(e) => {
            const val = e.target.value;
            setBasket((prev) => {
              // apply the change, then merge if identical to another line
              const updated = prev.map((it, i) =>
                i === itemIdx ? { ...it, chosen: { ...it.chosen, [id]: val } } : it,
              );
              return mergeDuplicates(updated);
            });
          }}
        >
          {opts.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  };

  /* ───────── UI ───────── */
  return (
    <>
      {/* ---------- Product picker ---------- */}
      {client && (
        <div ref={boxRef} className="relative">
          <label className="font-semibold">Ajouter un produit : {error && !loading && <span className="text-red-600 mt-1 text-sm">{error}</span>} </label>
          <div className="flex gap-2 mt-1">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError("");
              }}
              placeholder="Nom ou référence…"
              className="flex-1 border border-gray-300 rounded px-4 py-2"
            />
            <div className="bg-primary text-white px-4 py-2 rounded flex items-center">
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
            </div>
          </div>
          {query && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
              {results.map((p) => (
                <li
                  key={p._id}
                  onClick={() => addProduct(p)}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-100 flex justify-between"
                >
                  <span>
                    {p.name} <span className="text-xs text-gray-500">({p.reference})</span>
                  </span>
                  <span className={`text-xs ${p.stockStatus === "in stock" ? "text-green-600" : "text-red-600"}`}>
                    {p.stockStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---------- Basket preview ---------- */}
      {basket.length > 0 && (
        <div className="border rounded-lg p-4 bg-white space-y-4">
          <h2 className="font-bold">Produits sélectionnés</h2>

          {basket.map((item, idx) => (
            <div key={basketKey(item, idx)} className="border rounded p-3 bg-gray-50 space-y-3">
              {/* header row */}
              <div className="flex justify-between items-center">
                <div className="font-medium">
                  {item.name} <span className="text-xs text-gray-500">({item.reference})</span>
                </div>
                <button onClick={() => removeProduct(idx)} className="text-red-600 text-sm hover:underline">
                  Retirer
                </button>
              </div>

              {/* quantity & pricing */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Qté :</span>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => decrement(idx)}
                      className="py-1 px-3 hover:bg-primary hover:text-white disabled:opacity-40"
                      disabled={item.quantity === 1}
                      aria-label="Diminuer la quantité"
                    >
                      –
                    </button>

                    <div className="w-12 border-l border-r border-gray-300 min-w-[40px] text-center">
                      {item.quantity}
                    </div>

                    <button
                      onClick={() => increment(idx)}
                      className="py-1 px-3 hover:bg-primary hover:text-white"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-sm">
                  Prix TTC : <strong>{unitPrice(item).toFixed(2)}</strong>
                  {item.discount > 0 && (
                    <span className="ml-2 line-through text-xs text-gray-500">{item.price.toFixed(2)}</span>
                  )}
                </div>

                <div className="text-sm">
                  TVA : <strong>{item.tva}%</strong>
                </div>
              </div>

              {/* attributes */}
              {item.attributes && item.attributes.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {item.attributes.map((row) => renderAttrSelector(idx, row))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
