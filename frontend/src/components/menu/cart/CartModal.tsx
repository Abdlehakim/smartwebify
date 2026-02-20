/* ------------------------------------------------------------------
   src/components/checkout/CartModal.tsx
------------------------------------------------------------------ */
"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { FaRegTrashAlt } from "react-icons/fa";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { removeItem, updateItemQuantity, CartItem } from "@/store/cartSlice";
import Pagination from "@/components/PaginationClient";
import { useCurrency } from "@/contexts/CurrencyContext";

/* ---------- props ---------- */
interface CartModalProps {
  items: CartItem[];
  onClose: () => void;
}

/* Optional: items may include human-readable attribute labels */
type CartItemWithNames = CartItem & {
  selectedNames?: Record<string, string>;
};

const looksLikeObjectId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

const CartModal: React.FC<CartModalProps> = ({ items, onClose }) => {
  const { fmt } = useCurrency();
  const dispatch = useDispatch();

  /* ---------- totals ---------- */
  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => {
      const discount = item.discount ?? 0;
      const finalPrice =
        discount > 0 ? item.price - (item.price * discount) / 100 : item.price;
      return total + finalPrice * item.quantity;
    }, 0);
  }, [items]);

  /* ---------- quantity handlers (variant-aware) ---------- */
  const incrementHandler = useCallback(
    (item: CartItem, event: React.MouseEvent) => {
      event.stopPropagation();
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
    (item: CartItem, event: React.MouseEvent) => {
      event.stopPropagation();
      if (item.quantity > 1) {
        dispatch(
          updateItemQuantity({
            _id: item._id,
            quantity: item.quantity - 1,
            selected: item.selected,
          })
        );
      }
    },
    [dispatch]
  );

  const removeCartHandler = useCallback(
    (item: CartItem, event: React.MouseEvent) => {
      event.stopPropagation();
      dispatch(removeItem({ _id: item._id, selected: item.selected }));
    },
    [dispatch]
  );

  /* ---------- pagination ---------- */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = useMemo(
    () => Math.ceil(items.length / itemsPerPage),
    [items.length]
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /* ---------- render ---------- */
  return (
    <div
      className="flex flex-col px-2 w-[420px] max-md:mx-auto max-md:w-[90%] border-[#15335D] border-4 rounded-lg bg-white z-30"
      onClick={(e) => e.stopPropagation()}
    >
      {/* header */}
      <h1 className="text-lg font-bold text-black border-b-2 text-center py-2 max-md:text-sm">
        Votre panier ({items.length} articles)
      </h1>

      {/* pagination controls */}
      <div className="text-gray-500 border-b-2">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* cart items */}
      <div className="flex flex-col">
        {items.length === 0 ? (
          <p className="text-center text-black">Your cart is empty.</p>
        ) : (
          paginatedItems.map((raw) => {
            const item = raw as CartItemWithNames;
            const discount = item.discount ?? 0;
            const unitPrice =
              discount > 0
                ? item.price - (item.price * discount) / 100
                : item.price;

            // Prefer display labels ("Couleur" -> "Blanc")
            // Fallback: if only selected with ObjectId keys, hide the key
            const displayAttrs: Array<[string | null, string]> = item.selectedNames
              ? Object.entries(item.selectedNames)
              : item.selected
              ? Object.entries(item.selected).map(([k, v]) =>
                  looksLikeObjectId(k) ? [null, v] : [k, v]
                )
              : [];

            return (
              <div
                key={`${item._id}-${JSON.stringify(item.selected ?? {})}`}
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
                <div className="text-black flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.name}</p>                
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

                  <div className="text-gray-800 text-xs mt-1">
                    <span className="max-md:hidden">Price Unit:</span> {fmt(unitPrice)}
                  </div>
                  <p className="text-gray-800 text-xs md:hidden">
                  Qty: {item.quantity}
                </p>
                </div>

                {/* actions */}
                <div className="ml-auto flex flex-col gap-2 items-end shrink-0">
                  {/* quantity buttons */}
                  <div className="md:flex justify-between items-center gap-2 hidden w-full">
                    <button
                      className="text-black w-8 h-8 flex items-center justify-center bg-white border-2 border-[#15335E] rounded-lg hover:bg-[#15335E] hover:text-white"
                      onClick={(e) => decrementHandler(item, e)}
                    >
                      –
                    </button>
                    <span className="text-black h-8 w-6 flex items-center justify-center bg-white">
                      {item.quantity}
                    </span>
                    <button
                      className="text-black w-8 h-8 flex items-center justify-center bg-white border-2 border-[#15335E] rounded-lg hover:bg-[#15335E] hover:text-white"
                      onClick={(e) => incrementHandler(item, e)}
                    >
                      +
                    </button>
                  </div>

                  {/* remove button */}
                  <button
                    className="flex items-center gap-2 justify-center border-2 border-[#15335E] rounded text-black hover:bg-[#15335E] hover:text-white px-2 max-md:py-2"
                    onClick={(e) => removeCartHandler(item, e)}
                  >
                    <FaRegTrashAlt size={15} /><span className='hidden md:flex'>Retirer</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* footer */}
      {items.length > 0 && (
        <>
          <p className="text-black text-lg font-bold text-center my-2">
            Total: {fmt(totalPrice)}
          </p>

          <Link href="/checkout">
            <button
              aria-label="checkout"
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
        </>
      )}
    </div>
  );
};

export default CartModal;
