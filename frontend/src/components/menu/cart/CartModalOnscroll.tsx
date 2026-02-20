/* ------------------------------------------------------------------
   src/components/checkout/CartModalOnscroll.tsx
------------------------------------------------------------------ */
"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { FaRegTrashAlt } from "react-icons/fa";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { removeItem, updateItemQuantity, CartItem } from "@/store/cartSlice";
import Pagination from "@/components/PaginationClient";
import { useCurrency } from "@/contexts/CurrencyContext";           // ← NEW

/* ---------- props ---------- */
interface CartModalOnscrollProps {
  items: CartItem[];
  onClose: () => void;
}

/* ---------- helpers ---------- */
type CartItemWithNames = CartItem & {
  selectedNames?: Record<string, string>;
};

const looksLikeObjectId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

const selectionKey = (sel?: Record<string, string>) => {
  if (!sel) return "";
  const keys = Object.keys(sel).sort();
  return keys.map((k) => `${k}:${sel[k]}`).join("|");
};

/* Merge by (_id + selected) so different variants never collapse */
const useMergedItems = (items: CartItem[]) =>
  useMemo(() => {
    const map = new Map<string, CartItem>();
    for (const it of items) {
      const key = `${it._id}|${selectionKey(it.selected)}`;
      const found = map.get(key);
      if (found) {
        found.quantity += it.quantity;
      } else {
        map.set(key, { ...it });
      }
    }
    return Array.from(map.values());
  }, [items]);

const CartModalOnscroll: React.FC<CartModalOnscrollProps> = ({
  items,
  onClose,
}) => {
  const { fmt } = useCurrency();                                  // ← NEW
  const dispatch = useDispatch();

  /* merge duplicates by variant so UI shows one line per variant */
  const mergedItems = useMergedItems(items);

  const totalPrice = useMemo(() => {
    return mergedItems.reduce((total, item) => {
      const discount = item.discount ?? 0;
      const finalPrice =
        discount > 0 ? item.price - (item.price * discount) / 100 : item.price;
      return total + finalPrice * item.quantity;
    }, 0);
  }, [mergedItems]);

  /* ---------- handlers (variant-aware) ---------- */
  const incrementHandler = useCallback(
    (item: CartItem, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(
        updateItemQuantity({
          _id: item._id,
          quantity: item.quantity + 1,
          selected: item.selected, // keep variant identity
        })
      );
    },
    [dispatch]
  );

  const decrementHandler = useCallback(
    (item: CartItem, e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.quantity > 1) {
        dispatch(
          updateItemQuantity({
            _id: item._id,
            quantity: item.quantity - 1,
            selected: item.selected, // keep variant identity
          })
        );
      }
    },
    [dispatch]
  );

  const removeCartHandler = useCallback(
    (item: CartItem, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(removeItem({ _id: item._id, selected: item.selected })); // remove only this variant
    },
    [dispatch]
  );

  /* ---------- pagination ---------- */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = useMemo(
    () => Math.ceil(mergedItems.length / itemsPerPage),
    [mergedItems.length]
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return mergedItems.slice(start, start + itemsPerPage);
  }, [mergedItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (mergedItems.length === 0) return null;

  /* ---------- render ---------- */
  return (
    <div
      className="flex flex-col px-2 w-[420px] max-md:w-[350px] border-[#15335D] border-4 rounded-lg bg-white z-30"
      onClick={(e) => e.stopPropagation()}
    >
      <h1 className="text-lg font-bold text-black border-b-2 text-center py-2 max-md:text-sm">
        Your shopping cart ({mergedItems.length} items)
      </h1>

      <div className="text-gray-500 border-b-2">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="flex flex-col">
        {paginatedItems.map((raw) => {
          const item = raw as CartItemWithNames;
          const discount = item.discount ?? 0;
          const unitPrice =
            discount > 0 ? item.price - (item.price * discount) / 100 : item.price;

          // Build display attributes exactly "Label : Value"
          const displayAttrs: Array<[string | null, string]> = item.selectedNames
            ? Object.entries(item.selectedNames)
            : item.selected
            ? Object.entries(item.selected).map(([k, v]) =>
                looksLikeObjectId(k) ? [null, v] : [k, v]
              )
            : [];

          return (
            <div
              key={`${item._id}-${selectionKey(item.selected)}`}
              className="flex items-center gap-2 justify-start py-2 border-b-2 w-full"
            >
              {/* image */}
              <div className="relative h-16 aspect-square bg-gray-200">
                <Image
                  className="object-cover"
                  src={item.mainImageUrl ?? ""}
                  alt={item.name}
                  quality={75}
                  placeholder="empty"
                  priority
                  sizes="(max-width: 600px) 100vw, 600px"
                  fill
                />
              </div>

              {/* info */}
              <div className="text-black flex flex-col gap-[6px] min-w-0">
                <p className="text-sm font-bold truncate">{item.name}</p>            

                {/* Attributes like "Couleur : Blanc" */}
                {displayAttrs.length > 0 && (
                  <div className="text-xs text-gray-800">
                    {displayAttrs.map(([label, val], idx) =>
                      label ? (
                        <div key={`${label}-${val}-${idx}`}>
                          {label} : <span className="text-gray-700">{val}</span>
                        </div>
                      ) : (
                        <div key={`${val}-${idx}`}>
                          <span className="text-gray-700">{val}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                <p className="text-gray-800 text-xs max-md:hidden">
                  Price Unit: {fmt(unitPrice)}                 {/* ← NEW */}
                </p>
                <p className="text-gray-800 text-xs md:hidden">
                  Qty: {item.quantity}
                </p>
              </div>

              {/* controls */}
              <div className="ml-auto flex flex-col gap-2 items-end shrink-0">
                <div className="md:flex justify-between items-center gap-2 hidden w-full">
                  <button
                    className="text-black w-8 h-8 flex items-center justify-center bg-opacity-40 rounded-lg border-2 border-[#15335E] bg-white hover:bg-[#15335E] hover:text-white"
                    onClick={(e) => decrementHandler(item, e)}
                  >
                    –
                  </button>
                  <span className="text-black h-8 w-6 flex items-center justify-center bg-opacity-40 bg-white">
                    {item.quantity}
                  </span>
                  <button
                    className="text-black w-8 h-8 flex items-center justify-center bg-opacity-40 rounded-lg border-2 border-[#15335E] bg-white hover:bg-[#15335E] hover:text-white"
                    onClick={(e) => incrementHandler(item, e)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="flex items-center gap-2 justify-center border-2 border-[#15335E] rounded text-black hover:bg-[#15335E] hover:text-white px-2"
                  onClick={(e) => removeCartHandler(item, e)}
                >
                  <span className="max-md:hidden">Retirer</span>
                  <FaRegTrashAlt size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-black text-lg font-bold flex items-center justify-center flex-col gap-[16px] my-2 max-md:text-lg">
        Total: {fmt(totalPrice)}                              {/* ← NEW */}
      </p>

      <Link href="/checkout">
        <button
          aria-label="check"
          className="w-fit mx-auto px-6 h-10 rounded-full border-2 border-secondary hover:bg-secondary flex items-center justify-center my-2 hover:text-white text-secondary"
        >
          <span className="text-xl font-semibold tracking-wide max-md:text-base">
            Poursuivre au paiement
          </span>
        </button>
      </Link>

      <button
        className="w-full text-center text-black hover:underline cursor-pointer mb-2 hover:text-primary max-md:text-base"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        Continue shopping
      </button>
    </div>
  );
};

export default CartModalOnscroll;
