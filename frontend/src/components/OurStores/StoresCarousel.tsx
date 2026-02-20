/* ------------------------------------------------------------------ */
/*  app/components/StoresCarousel.tsx                                 */
/* ------------------------------------------------------------------ */
"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  FaRegClock,
  FaMapMarkerAlt,
  FaRegArrowAltCircleLeft,
  FaRegArrowAltCircleRight,
} from "react-icons/fa";
import { BsSunFill, BsMoonFill } from "react-icons/bs";

/* ---------- types ---------- */
interface OpeningHours {
  [day: string]: { open: string; close: string }[];
}

export interface StoreType {
  _id?: string;
  name: string;
  image: string;
  blurDataURL?: string;
  phoneNumber: string;
  address: string;
  city: string;
  localisation: string;
  openingHours: OpeningHours;
}

interface StoresProps {
  storesData: StoreType[];
}

interface StoresCardProps {
  store: StoreType;
  itemsPerSlide: number;
  isLCP?: boolean;
}

/* ---------- image size helper (keeps bytes tight) ---------- */
const cardSizes = (itemsPerSlide: number) => {
  switch (itemsPerSlide) {
    case 1:
      return "(max-width: 640px) 92vw, (max-width: 1024px) 720px, 720px";
    case 2:
      return "(max-width: 640px) 92vw, (max-width: 1024px) 480px, 480px";
    default:
      return "(max-width: 640px) 92vw, (max-width: 1024px) 300px, 300px";
  }
};

/* ---------- card ---------- */
const StoresCard: React.FC<StoresCardProps> = ({ store, itemsPerSlide, isLCP }) => {
  const [showHours, setShowHours] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  // scroll hint states
  const EPS = 10;
  const listRef = useRef<HTMLUListElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const check = () => {
      setAtTop(el.scrollTop === 0);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - EPS);
      setHasOverflow(el.scrollHeight > el.clientHeight);
    };
    check();
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, [store.openingHours, showHours]);

  return (
    <div
      className="relative group cursor-pointer w-[90%] aspect-[16/14] min-h-96"
      style={{
        flex: `0 0 ${90 / itemsPerSlide}%`,
        // Skip heavy offscreen work (layout/paint) until in view:
        contentVisibility: "auto",
        containIntrinsicSize: "400px 450px",
      }}
    >
      {store.image && (
        <Image
          src={store.image}
          alt={store.name}
          className="object-cover rounded-xl"
          fill
          sizes={cardSizes(itemsPerSlide)}
          // Preload only the first visible card; everything else lazy:
          priority={!!isLCP}
          fetchPriority={isLCP ? "high" : "auto"}
          loading={isLCP ? "eager" : "lazy"}
          // Keep bytes sensible; bump if you need more detail
          quality={70}
          // Only use blur when we actually have a tiny data URL
          placeholder={store.blurDataURL ? "blur" : "empty"}
          blurDataURL={store.blurDataURL}
          draggable={false}
        />
      )}

      <h2 className="bg-primary relative top-0 w-full rounded-t-xl h-16 max-lg:h-12 flex items-center justify-center text-2xl font-bold capitalize text-white tracking-wide border-b-8 border-secondary max-lg:text-sm z-30">
        {store.name}
      </h2>

      {/* ▼ toggle buttons (centered) */}
      <div
        className="absolute bottom-6 max-md:bottom-4 left-1/2 -translate-x-1/2 z-40 flex max-md:flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label={showHours ? "Hide horaire" : "Affiche horaire"}
          onClick={() => {
            setShowHours((s) => !s);
            if (!showHours) setShowAddress(false);
          }}
          className="pl-4 pr-3 py-2 bg-white rounded-full text-primary hover:bg-secondary hover:text-white transition flex items-center gap-2 justify-start min-w-[170px] whitespace-nowrap"
        >
          <FaRegClock size={20} />
          <span className="text-xs font-semibold uppercase">
            {showHours ? "Hide horaire" : hasOverflow ? "Affiche horaire (scroll)" : "Affiche horaire"}
          </span>
        </button>

        <button
          aria-label={showAddress ? "Hide adresse" : "Affiche adresse"}
          onClick={() => {
            setShowAddress((s) => !s);
            if (!showAddress) setShowHours(false);
          }}
          className="pl-4 pr-3 py-2 bg-white rounded-full text-primary hover:bg-secondary hover:text-white transition flex items-center gap-2 justify-start min-w-[170px] whitespace-nowrap"
        >
          <FaMapMarkerAlt size={20} />
          <span className="text-xs font-semibold uppercase">
            {showAddress ? "Hide adresse" : "Affiche adresse"}
          </span>
        </button>
      </div>

      {/* Horaire panel */}
      <div
        className={`absolute inset-x-0 top-16 max-lg:top-12 bottom-0 p-2 bg-black/80 flex flex-col transition-opacity duration-300 overflow-hidden z-20 rounded-b-xl ${
          showHours ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="my-2 mx-4 max-lg:mx-2 w-[90%] relative">
          <h3 className="font-semibold text-xl text-white max-lg:text-sm">TEMPS OUVERT :</h3>
          <div className="h-[2px] w-full bg-white/40 mt-1" />

          <div className="relative">
            <ul
              ref={listRef}
              className="text-sm max-lg:text-xs divide-y divide-white/20 max-h-56 max-lg:max-h-40 w-fit overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/40 [scrollbar-color:rgba(255,255,255,.4)_transparent] [scrollbar-width:thin]"
            >
              {Object.entries(store.openingHours).map(([day, hours]) => {
                const ranges =
                  Array.isArray(hours) && hours.length
                    ? hours
                        .map(({ open, close }) => (open || close ? `${open} – ${close}` : ""))
                        .filter(Boolean)
                    : [];

                return (
                  <li
                    key={day}
                    className="grid grid-cols-[auto_1fr] items-center gap-x-3 py-1 text-white tabular-nums"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <FaRegClock size={12} />
                      {day}
                    </span>

                    {ranges.length ? (
                      <div className="flex max-md:flex-col items-center max-md:items-end justify-end gap-x-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <BsSunFill size={12} />
                          {ranges[0]}
                        </span>
                        {ranges[1] && (
                          <span className="flex items-center gap-1.5">
                            <BsMoonFill size={12} />
                            {ranges[1]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="justify-self-end">Fermé</span>
                    )}
                  </li>
                );
              })}
            </ul>

            {!atTop && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/90 to-transparent" />
            )}
            {!atBottom && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/95 to-transparent flex items-end justify-center">
                <span className="text-[10px] uppercase tracking-wider text-white/70 animate-pulse flex items-center gap-1">
                  scroll
                  <svg width="10" height="10" viewBox="0 0 24 24" className="opacity-70">
                    <path fill="currentColor" d="M12 16l-6-6h12z" />
                  </svg>
                </span>
              </div>
            )}
          </div>

          <div className="h-[2px] w-full bg-white/40 my-1" />
        </div>
      </div>

      {/* Adresse panel */}
      <div
        className={`absolute inset-x-0 top-16 max-lg:top-12 bottom-0 p-2 bg-black/80 flex flex-col items-start transition-opacity duration-300 overflow-y-auto z-20 rounded-b-xl ${
          showAddress ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-white my-2 mx-4 max-lg:mx-2 w-[90%]">
          <h3 className="font-semibold text-xl max-lg:text-sm flex items-center gap-2">
            <FaMapMarkerAlt size={18} />
            ADRESSE
          </h3>
          <div className="h-[2px] w-full bg-white/40" />
          <p className="text-sm max-lg:text-xs leading-6">
            {store.address}, {store.city}
          </p>
          {store.localisation && (
            <a
              href={store.localisation}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-xs max-lg:text-[10px]"
            >
              Ouvrir dans Google Maps
            </a>
          )}
          <div className="h-[2px] w-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};

/* ---------- indicator with 48-px hit-box ---------- */
function Dot({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative flex items-center justify-center w-12 h-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className={`block w-3 h-3 rounded-full ${active ? "bg-primary" : "bg-gray-300"}`} />
    </button>
  );
}

/* ---------- carousel ---------- */
const StoresCarousel: React.FC<StoresProps> = ({ storesData }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 1210) setItemsPerSlide(1);
      else if (w < 1620) setItemsPerSlide(2);
      else setItemsPerSlide(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const slides = useMemo(() => {
    const out: StoreType[][] = [];
    for (let i = 0; i < storesData.length; i += itemsPerSlide) {
      out.push(storesData.slice(i, i + itemsPerSlide));
    }
    return out;
  }, [storesData, itemsPerSlide]);

  const total = slides.length;

  const next = useCallback(() => setCurrentSlide((n) => (n + 1) % total), [total]);
  const prev = useCallback(() => setCurrentSlide((n) => (n - 1 + total) % total), [total]);

  return (
    <div className="py-8 w-full">
      <div className="relative overflow-hidden">
        <div
          className="flex w-[90%] max-md:w-[80%] mx-auto transition-transform duration-300"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slideItems, i) => (
            <div key={i} className="flex-shrink-0 w-full flex gap-4 justify-center">
              {i === currentSlide &&
                slideItems.map((store, idx) => (
                  <StoresCard
                    key={store._id ?? store.name}
                    store={store}
                    itemsPerSlide={itemsPerSlide}
                    isLCP={currentSlide === 0 && idx === 0}
                  />
                ))}
            </div>
          ))}
        </div>

        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute top-1/2 left-4 max-md:left-0 -translate-y-1/2 z-10 p-1 text-primary hover:text-secondary hover:scale-110"
        >
          <FaRegArrowAltCircleLeft size={40} />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute top-1/2 right-4 max-md:right-0 -translate-y-1/2 z-10 p-1 text-primary hover:text-secondary hover:scale-110"
        >
          <FaRegArrowAltCircleRight size={40} />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, i) => (
          <Dot key={i} active={i === currentSlide} label={`Go to slide ${i + 1}`} onClick={() => setCurrentSlide(i)} />
        ))}
      </div>
    </div>
  );
};

export default StoresCarousel;
