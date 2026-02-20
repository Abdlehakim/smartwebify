"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlBag } from "react-icons/sl";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Total from "@/components/menu/Total";
import CartModal from "@/components/menu/cart/CartModal";
import CartModalOnscroll from "@/components/menu/cart/CartModalOnscroll";
import { usePathname } from "next/navigation";

const CartLogic = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartModalOnscroll, setIsCartModalOnscrollOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [bump, setBump] = useState(false);

  const items = useSelector((state: RootState) => state.cart.items);
  const pathname = usePathname();

  const cartModalWrapperRef = useRef<HTMLDivElement>(null);
  const onscrollCartModalWrapperRef = useRef<HTMLDivElement>(null);

  /* ---------------- totals ---------------- */
  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + (item.quantity || 0), 0),
    [items]
  );

  useEffect(() => {
    if (totalQuantity === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [totalQuantity]);

  const totalPrice = useMemo(
    () =>
      items.reduce((total, item) => {
        const finalPrice =
          item.discount != null && item.discount > 0
            ? item.price - (item.price * item.discount) / 100
            : item.price;
        return total + finalPrice * item.quantity;
      }, 0),
    [items]
  );

  /* ---------------- handlers ---------------- */
  const toggleCartModal = () => setIsCartOpen((p) => !p);
  const toggleCartModalOnscroll = () =>
    setIsCartModalOnscrollOpen((p) => !p);
  const closeCartModal = () => setIsCartOpen(false);
  const closeCartModalOnscroll = () => setIsCartModalOnscrollOpen(false);

  /* 1️⃣ close on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isCartOpen &&
        cartModalWrapperRef.current &&
        !cartModalWrapperRef.current.contains(e.target as Node)
      ) {
        closeCartModal();
      }
      if (
        isCartModalOnscroll &&
        onscrollCartModalWrapperRef.current &&
        !onscrollCartModalWrapperRef.current.contains(e.target as Node)
      ) {
        closeCartModalOnscroll();
      }
    };

    if (isCartOpen || isCartModalOnscroll) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCartOpen, isCartModalOnscroll]);

  /* 2️⃣ detect threshold scroll for floating button */
  useEffect(() => {
    const container: HTMLElement | Window =
      document.querySelector("main") || window;

    const handleScroll = () => {
      const scrollPos =
        container instanceof Window ? window.pageYOffset : container.scrollTop;
      setIsScrolling(scrollPos > 80);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  /* 3️⃣ close both modals on ANY user scroll */
  useEffect(() => {
    const container: HTMLElement | Window =
      document.querySelector("main") || window;

    const onUserScroll = () => {
      if (isCartOpen) closeCartModal();
      if (isCartModalOnscroll) closeCartModalOnscroll();
    };

    container.addEventListener("scroll", onUserScroll, { passive: true });
    return () => container.removeEventListener("scroll", onUserScroll);
  }, [isCartOpen, isCartModalOnscroll]);

  /* 4️⃣ close on route change */
  useEffect(() => {
    closeCartModal();
    closeCartModalOnscroll();
  }, [pathname]);

  return (
    <>
      {/* mobile backdrop for header CartModal */}
      {isCartOpen && items.length > 0 && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeCartModal}
        />
      )}

      {/* Header cart */}
      <div className="flex items-center justify-center w-[200px] max-2xl:w-[150px] max-lg:w-fit text-white cursor-pointer select-none">
        <div
          className="flex items-center justify-center gap-[8px] w-fit max-lg:w-fit text-white cursor-pointer"
          onClick={toggleCartModal}
          ref={cartModalWrapperRef}
        >
          <div className="relative my-auto mx-2">
            <SlBag
              size={40}
              className={`${
                bump ? "scale-125 text-secondary" : "scale-100"
              }`}
            />
            <span
              className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs rounded-full bg-secondary text-white transition-transform duration-300 ${
                bump ? "scale-125" : "scale-100"
              }`}
            >
              {totalQuantity}
            </span>

            {/* ▼▼ DO NOT SCALE THIS DROPDOWN ▼▼ */}
            {isCartOpen && items.length > 0 && (
              <div
                className="absolute max-md:fixed shadow-xl z-30 flex gap-[8px] flex-col top-12 left-1/2 -translate-x-1/3 max-md:-translate-x-1/2 max-md:top-16 max-md:w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <CartModal items={items} onClose={closeCartModal} />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-text text-sm max-2xl:text-xs max-lg:hidden">
              Mon Panier
            </p>
            <Total totalPrice={totalPrice} />
          </div>
        </div>
      </div>

      {/* Floating cart on scroll */}
      {isScrolling && (
        <>
          {/* mobile backdrop for floating CartModalOnscroll */}
          {isCartModalOnscroll && items.length > 0 && (
            <div
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={closeCartModalOnscroll}
            />
          )}

          <div
            className={`fixed top-5 right-5 rounded-full z-50 bg-primary w-fit p-4 flex items-center gap-[16px] border-4 border-white shadow-lg cursor-pointer transition duration-300 ${
              bump ? " bg-secondary" : "bg-primary"
            }`}
            ref={onscrollCartModalWrapperRef}
            onClick={toggleCartModalOnscroll}
          >
            <div className="relative">
              <SlBag size={25} className="text-white" />
              <span
                className={`absolute -top-[8px] -right-[5px] w-5 h-5 flex items-center justify-center text-xs rounded-full text-white transition duration-300 ${
                  bump ? "scale-125 bg-green-200" : "scale-100 bg-secondary"
                }`}
              >
                {totalQuantity}
              </span>

              {/* ▼▼ DO NOT SCALE THIS ONE EITHER ▼▼ */}
              {isCartModalOnscroll && items.length > 0 && (
                <div
                  className="absolute max-md:fixed shadow-lg z-30 flex gap-[8px] top-12 right-0 flex-col max-md:top-[90px] max-md:right-[50%] max-md:transform max-md:translate-x-1/2 transition-all duration-900 ease-in-out rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CartModalOnscroll
                    items={items}
                    onClose={closeCartModalOnscroll}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CartLogic;
