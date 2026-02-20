/* ------------------------------------------------------------------
   src/components/checkout/RecapProduct.tsx
------------------------------------------------------------------ */
"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { useDispatch } from "react-redux";
import { CartItem, addItem, removeItem } from "@/store/cartSlice";
import { useCurrency } from "@/contexts/CurrencyContext";
import { fetchData } from "@/lib/fetchData";

interface AttributeRow {
  attributeSelected: { _id: string; name: string; type?: string };
  value?: string | Array<{ name: string; value?: string; hex?: string; image?: string }>;
}

type CartItemWithAttrs = CartItem & { attributes?: AttributeRow[] };

interface RecapProductProps {
  items: CartItem[];
  incrementHandler(item: CartItem): void;
  decrementHandler(item: CartItem): void;
  removeCartHandler(id: string): void;
}

const looksLikeObjectId = (s: string) => /^[a-f0-9]{24}$/i.test(s);
const selectionKey = (sel?: Record<string, string>) => {
  if (!sel) return "";
  const keys = Object.keys(sel).sort();
  return keys.map((k) => `${k}:${sel[k]}`).join("|");
};

type Option = { value: string; label: string };

const optionsFromRow = (row: AttributeRow): Option[] => {
  const v = row.value;
  if (!v) return [];
  if (typeof v === "string") return [{ value: v, label: v }];
  return v.map((o) => {
    const name = (o.name ?? "").trim();
    return { value: name, label: name };
  });
};

const RecapProduct: React.FC<RecapProductProps> = ({
  items,
  incrementHandler,
  decrementHandler,
  removeCartHandler,
}) => {
  const { fmt } = useCurrency();
  const dispatch = useDispatch();

  const [attrsById, setAttrsById] = useState<Record<string, AttributeRow[]>>({});

  useEffect(() => {
    const ids = Array.from(new Set(items.map((it) => it._id)));
    const missing = ids.filter((id) => !attrsById[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const id of missing) {
        try {
          const rows = await fetchData<AttributeRow[]>(`products/MainProductSection/attributes/${id}`);
          if (!cancelled) setAttrsById((prev) => ({ ...prev, [id]: rows ?? [] }));
        } catch {
          if (!cancelled) setAttrsById((prev) => ({ ...prev, [id]: [] }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items, attrsById]);

  const onChangeAttribute = useCallback(
    (
      itemRaw: CartItemWithAttrs,
      attrId: string,
      attrLabel: string,
      newVal: string,
      newLabel: string
    ) => {
      const item = itemRaw as CartItemWithAttrs;
      const currentSelected = item.selected ?? {};
      if (currentSelected[attrId] === newVal) return;

      const newSelected: Record<string, string> = { ...currentSelected, [attrId]: newVal };
      const currentSelectedNames = item.selectedNames ?? {};
      const newSelectedNames: Record<string, string> = {
        ...currentSelectedNames,
        [attrLabel]: newLabel || newVal,
      };

      dispatch(removeItem({ _id: item._id, selected: item.selected }));
      const { quantity, ...base } = item;
      dispatch(
        addItem({
          item: { ...base, selected: newSelected, selectedNames: newSelectedNames },
          quantity,
        })
      );
    },
    [dispatch]
  );

  return (
    <div className="w-[70%] max-lg:w-full">
      {items.length > 0 ? (
        <div className="flex justify-between flex-col gap-2 h-full">
          {items.map((raw) => {
            const item = raw as CartItemWithAttrs;
            const attributeRows = item.attributes ?? attrsById[item._id] ?? [];

            const price = Number(item.price ?? 0);
            const discountPct = Number(item.discount ?? 0);
            const tvaPct = Number(item.tva ?? 0);
            const qty = Number(item.quantity ?? 1);

            const priceTtc = discountPct > 0 ? (price * (100 - discountPct)) / 100 : price;
            const factor = 1 + tvaPct / 100;
            const unitHt = factor > 0 ? priceTtc / factor : priceTtc;
            const unitTva = priceTtc - unitHt;
            const lineHt = unitHt * qty;
            const lineTva = unitTva * qty;
            const lineTtc = lineHt + lineTva;

            const renderAttrSelector = (row: AttributeRow) => {
              const id = row.attributeSelected._id;
              const label = row.attributeSelected.name;
              let opts = optionsFromRow(row);
              if (opts.length === 0) return null;

              const currentFromSlice = item.selected?.[id];
              const current = currentFromSlice ?? opts[0].value;

              if (!opts.some((o) => o.value === current)) {
                const injectedLabel = item.selectedNames?.[label] ?? String(current);
                opts = [{ value: current, label: injectedLabel }, ...opts];
              }

              const currentLabel =
                opts.find((o) => o.value === current)?.label ?? String(current);
              const visibleOpts = opts.filter((o) => o.value !== current);

              return (
                <label key={id} className="flex items-center gap-2 text-xs max-md:flex-col">
                  <span className="font-semibold">{label} :</span>
                  <select
                    className="w-[60%] max-md:w-full border rounded px-2 py-1 text-xs bg-white truncate "
                    value={current}
                    onChange={(e) => {
                      const v = e.target.value;
                      const lbl = opts.find((o) => o.value === v)?.label ?? v;
                      onChangeAttribute(item, id, label, v, lbl);
                    }}
                  >
                    <option key={`__current-${id}`} value={current} hidden>
                      {currentLabel}
                    </option>
                    {visibleOpts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            };

            return (
              <div
                key={`${item._id}-${selectionKey(item.selected)}`}
                className="relative flex justify-around gap-4 bg-gray-100 p-4 rounded-md max-lg:flex-col"
              >
                <div className="relative aspect-[16/14] h-40 bg-gray-200">
                  <Image
                    src={item.mainImageUrl ?? ""}
                    alt={item.name}
                    fill
                    sizes="(max-width: 600px) 100vw, 600px"
                    className="object-cover"
                    placeholder="empty"
                    priority
                    quality={75}
                  />
                </div>

                <div className="flex flex-col justify-center max-lg:items-center w-2/5 max-lg:w-full gap-2">
                  <p className="text-gray-600 uppercase text-xs">REF&nbsp;: {item.reference}</p>

                  <div className="flex max-md:flex-col gap-2 items-center">
                    {item.categorie && (
                      <p className="text-gray-500 uppercase text-xs">
                        {item.categorie.name}
                        {item.subcategorie && ` ▸ ${item.subcategorie.name}`} :
                      </p>
                    )}
                    <p className="text-xs font-bold break-words">{item.name}</p>
                  </div>

                  <p className="font-semibold flex gap-2 max-md:flex-col items-center">
                    {discountPct > 0 && (
                      <span className="line-through text-gray-500 ml-2 text-xs">
                        {fmt(price)}
                      </span>
                    )}
                    {fmt(priceTtc)} TTC
                  </p>
                  {attributeRows.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {attributeRows.map((row) => renderAttrSelector(row))}
                    </div>
                  ) : (
                    (item.selectedNames &&
                      Object.keys(item.selectedNames).length > 0 && (
                        <div className="text-xs text-gray-800 space-y-0.5">
                          {Object.entries(item.selectedNames).map(([k, v], idx) => (
                            <div key={`${k}-${v}-${idx}`}>
                              <span className="font-semibold">{k} :</span>{" "}
                              <span className="text-gray-700">{v}</span>
                            </div>
                          ))}
                        </div>
                      )) ||
                    (item.selected &&
                      Object.keys(item.selected).length > 0 && (
                        <div className="text-xs text-gray-800 space-y-0.5">
                          {Object.entries(item.selected).map(([k, v], idx) => (
                            <div key={`${k}-${v}-${idx}`}>
                              {looksLikeObjectId(k) ? (
                                <span className="text-gray-700">{String(v)}</span>
                              ) : (
                                <>
                                  <span className="font-semibold">{k} :</span>{" "}
                                  <span className="text-gray-700">{String(v)}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                  )}
                </div>

                <div className="flex items-center justify-center w-1/5 max-lg:w-full">
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => decrementHandler(item)}
                      className="py-1 px-3 hover:bg-primary hover:text-white"
                    >
                      –
                    </button>
                    <div className="py-2 px-4 border-l border-r border-gray-300 min-w-[40px] text-center">
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => incrementHandler(item)}
                      className="py-1 px-3 hover:bg-primary hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center w-1/5 max-lg:w-full max-lg:items-center">
                  <p className="font-semibold">TTC&nbsp;{fmt(lineTtc)}</p>
                  <p className="text-xs text-gray-500">TVA&nbsp;{fmt(lineTva)}</p>
                  <p className="text-xs text-gray-500">HT&nbsp;{fmt(lineHt)}</p>
                </div>

                <div className="flex justify-end w-1/12 max-lg:w-full max-lg:order-first max-lg:mb-2 max-lg:items-end">
                  <button
                    onClick={() => removeCartHandler(item._id)}
                    aria-label="remove"
                    className="p-1"
                  >
                    <RxCross1 className="cursor-pointer" size={24} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-10 text-gray-500">
          Your cart is empty.
        </div>
      )}
    </div>
  );
};

export default RecapProduct;
