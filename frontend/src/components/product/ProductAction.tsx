/* ------------------------------------------------------------------
   src/components/product/ProductAction.tsx
   ProductAction — bouton loader + “Produit ajouté” on success
   Updated: remove auto-preview effect; clicks drive hero updates
------------------------------------------------------------------ */
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/Product";
import { FaSpinner } from "react-icons/fa6";
import { useCurrency } from "@/contexts/CurrencyContext";

const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export type AttrValueColour = { name: string; hex: string; image?: string };
export type AttrValueOther = { name: string; value: string; image?: string };
export type AttrValue = AttrValueColour | AttrValueOther | string;

interface RawAttribute {
  attributeSelected:
    | { _id: string; name: string; type: string | string[] }
    | string;
  value: AttrValue | AttrValue[];
}

interface AttrGroup {
  id: string;
  label: string;
  type: string;
  values: { label: string; hex?: string; image?: string }[];
}

const normaliseAttributes = (p: Product): AttrGroup[] =>
  (p.attributes ?? []).map((attr) => {
    const { attributeSelected, value } = attr as RawAttribute;
    const groupLabel =
      typeof attributeSelected === "object"
        ? attributeSelected.name
        : "Attribute";
    const groupType =
      typeof attributeSelected === "object"
        ? Array.isArray(attributeSelected.type)
          ? attributeSelected.type[0]
          : attributeSelected.type
        : "other";

    const rawRows: (AttrValue | string)[] = Array.isArray(value) ? value : [value];

    const mapped = rawRows.map((v) => {
      if (typeof v === "string") return { label: v };
      if ("hex" in v) return { label: v.name, hex: v.hex, image: v.image };
      const label = "value" in v && v.value.trim() ? `${v.name} ${v.value}` : v.name;
      return { label, image: v.image };
    });

    const values = Array.from(
      new Map(
        mapped.map((row) => [
          groupType === "color"
            ? `${row.label}-${row.image ?? row.hex ?? ""}`
            : row.label,
          row,
        ])
      ).values()
    );

    return {
      id:
        typeof attributeSelected === "object"
          ? attributeSelected._id
          : groupLabel,
      label: groupLabel,
      type: groupType,
      values,
    };
  });

interface ProductActionProps {
  product: Product;
  addToCartHandler: (
    product: Product,
    quantity: number,
    selected: Record<string, string>,
    selectedNames?: Record<string, string>
  ) => void;
  onImageSelect?: (img?: string) => void;
}

type BtnState = "loading" | "success";

const ProductAction: React.FC<ProductActionProps> = ({
  product,
  addToCartHandler,
  onImageSelect,
}) => {
  const { fmt } = useCurrency();

  const loading = !product.attributes;

  const [quantity, setQuantity] = useState(1);
  const dec = () => quantity > 1 && setQuantity(quantity - 1);
  const inc = () =>
    quantity < (product.stock || 0) && setQuantity(quantity + 1);
  const manual = (e: React.ChangeEvent<HTMLInputElement>) =>
    setQuantity(
      Math.max(
        1,
        Math.min(product.stock || 1, parseInt(e.target.value, 10) || 1)
      )
    );

  const groups = useMemo(() => normaliseAttributes(product), [product]);

  const [selected, setSelected] = useState<Record<string, string>>({});

  // Ensure defaults: pick the FIRST option for each attribute, and
  // keep existing choices if they’re still valid.
  useEffect(() => {
    if (groups.length === 0) return;
    setSelected((prev) => {
      const next: Record<string, string> = {};
      let changed = false;

      for (const g of groups) {
        const allowed = new Set(g.values.map((v) => v.label));
        const keep = prev[g.id] && allowed.has(prev[g.id]);
        next[g.id] = keep ? (prev[g.id] as string) : (g.values[0]?.label ?? "");
        if (!keep) changed = true;
      }

      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [groups]);

  // NOTE: Removed the auto-preview effect. Now only user clicks update hero.

  const choose = (id: string, val: string, image?: string) => {
    setSelected((prev) => ({ ...prev, [id]: val }));
    if (image && onImageSelect) onImageSelect(image); // last click wins
  };

  const selectedNames = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach((g) => {
      const v = selected[g.id] ?? g.values[0]?.label;
      if (v) map[g.label] = v;
    });
    return map;
  }, [groups, selected]);

  const discountPct = product.discount ?? 0;
  const hasDiscount = discountPct > 0;
  const finalPrice = hasDiscount
    ? product.price * (1 - discountPct / 100)
    : product.price;

  const inStock =
    product.stockStatus === "in stock" && (product.stock || 0) > 0;

  const [btnState, setBtnState] = useState<BtnState | undefined>(undefined);

  const onAddToCart = () => {
    if (btnState === "loading") return;
    setBtnState("loading");
    addToCartHandler(product, quantity, selected, selectedNames);
    setTimeout(() => {
      setBtnState("success");
      setTimeout(() => setBtnState(undefined), 500);
    }, 1000);
  };

  return (
    <>
      {loading ? (
        <Skel className="h-28 w-full" />
      ) : (
        groups.map((g) => {
          const isColor = g.type === "color";
          return (
            <div key={g.id} className="flex flex-col gap-4 h-28">
              <p className="flex gap-4 max-lg:text-sm">
                <span className="font-bold">{g.label} :</span>
                {isColor && (
                  <span className="text-gray-700">
                    {selected[g.id] ?? g.values[0]?.label}
                  </span>
                )}
              </p>
              <div className="flex gap-3 h-20 items-center">
                {g.values.map((v, idx) => {
                  if (isColor) {
                    const active = (selected[g.id] ?? g.values[0]?.label) === v.label;
                    return (
                      <button
                        key={`${g.id}-${idx}`}
                        onClick={() => choose(g.id, v.label, v.image)}
                        className={`w-14 h-14 rounded-md border-2 overflow-hidden transition focus:outline-none ${
                          active ? "border-primary scale-105" : "border-gray-300"
                        }`}
                        aria-label={v.label}
                        title={v.label}
                        type="button"
                      >
                        {v.image ? (
                          <div className="relative aspect-[16/16] bg-gray-200">
                            <Image
                              src={v.image}
                              alt={v.label}
                              quality={75}
                              placeholder="empty"
                              priority
                              sizes="(max-width: 600px) 100vw, 600px"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full" style={{ backgroundColor: v.hex }} />
                        )}
                      </button>
                    );
                  }
                  const active = (selected[g.id] ?? g.values[0]?.label) === v.label;
                  return (
                    <button
                      key={`${g.id}-${idx}`}
                      onClick={() => choose(g.id, v.label, v.image)}
                      className={`px-3 border rounded-md transition text-sm flex items-center gap-1 ${
                        active ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                      }`}
                      type="button"
                    >
                      {v.image && (
                        <Image
                          src={v.image}
                          alt={v.label}
                          width={20}
                          height={20}
                          className="object-cover rounded-sm"
                        />
                      )}
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <hr className="my-4" />
      {loading ? (
        <Skel className="h-8 w-32 mx-auto" />
      ) : (
        <div className="flex items-center justify-center gap-4 max-lg:flex-col max-lg:gap-2">
          <p className="text-primary text-2xl font-bold">{fmt(finalPrice)}</p>
          {hasDiscount && <p className="text-gray-500 line-through">{fmt(product.price)}</p>}
        </div>
      )}

      <hr className="my-4" />

      {loading ? (
        <Skel className="h-12 w-full" />
      ) : (
        <div className="flex flex-col justify-center items-center gap-4">
          {inStock ? (
            <>
              <div className="flex justify-between items-center w-full gap-4 max-md:flex-col">
                <div className="flex items-center max-lg:justify-center gap-2">
                  <button
                    onClick={dec}
                    disabled={quantity === 1}
                    className="p-2 border hover:bg-primary hover:text-white"
                    type="button"
                    aria-label="Diminuer la quantité"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={manual}
                    min={1}
                    max={product.stock}
                    className="w-16 text-center border p-2"
                  />
                  <button
                    onClick={inc}
                    disabled={quantity >= (product.stock || 0)}
                    className="p-2 border hover:bg-primary hover:text-white"
                    type="button"
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={onAddToCart}
                    disabled={btnState === "loading"}
                    className={`flex-1 h-10 font-semibold rounded-md max-lg:text-sm relative ${
                      btnState === "loading"
                        ? "bg-gray-400 cursor-not-allowed text-white border-2"
                        : btnState === "success"
                        ? "bg-gray-400 cursor-default text-white border-2"
                        : "bg-white border-primary border-2 text-black hover:bg-primary hover:text-white"
                    }`}
                    type="button"
                  >
                    {btnState === "loading" ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaSpinner className="w-5 h-5 animate-spin" />
                      </div>
                    ) : btnState === "success" ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        Produit ajouté
                      </span>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        Ajouter au panier
                      </span>
                    )}
                  </button>

                  <Link href="/checkout" className="flex-1">
                    <button
                      onClick={() =>
                        addToCartHandler(product, quantity, selected, selectedNames)
                      }
                      className="w-full bg-primary text-white h-10 font-semibold rounded-md max-lg:text-sm hover:bg-secondary"
                      type="button"
                    >
                      Acheter
                    </button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <button
              disabled
              className="bg-gray-500 text-white h-10 w-full font-bold rounded-md"
              type="button"
            >
              Rupture de stock
            </button>
          )}
        </div>
      )}
      <hr className="my-4" />
    </>
  );
};

export default ProductAction;
