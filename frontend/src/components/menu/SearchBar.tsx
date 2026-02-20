// src/components/SearchBar.tsx
"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { BiChevronRight } from "react-icons/bi"; // ← arrow icon
import { useCurrency } from "@/contexts/CurrencyContext";
import { fetchData } from "@/lib/fetchData";

/* ---------- backend DTOs ---------- */
type SuggestProduct = {
  slug: string;
  name: string;
  mainImageUrl: string;
  price: number;
  discount?: number;
};

type HeavyProductForNav = {
  slug: string;
  categorie?: { slug?: string };
};

/* ---------- component ---------- */
const SearchBar: React.FC = () => {
  const { fmt } = useCurrency();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* debounce */
  useEffect(() => {
    const id = setTimeout(() => setDebounced(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  /* click outside */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* suggestions */
  useEffect(() => {
    if (!debounced) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchData<SuggestProduct[]>(
          `/products/search/suggest?q=${encodeURIComponent(debounced)}&limit=8`
        );
        if (!cancelled) {
          setSuggestions(data);
          setOpen(true);
          setActiveIndex(data.length ? 0 : -1);
        }
      } catch (err) {
        console.error("Suggest fetch error:", err);
        if (!cancelled) {
          setSuggestions([]);
          setOpen(true);
          setActiveIndex(-1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const goToProduct = async (slug: string) => {
    try {
      const prod = await fetchData<HeavyProductForNav>(
        `/products/MainProductSection/${encodeURIComponent(slug)}`
      );
      const catSlug = prod?.categorie?.slug || "produit";
      router.push(`/${catSlug}/${slug}`);
      setSearchTerm("");
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
    } catch (err) {
      console.error("Failed to open product:", err);
    }
  };

  const handleSearchClick = () => {
    if (searchTerm.trim()) setOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && e.key !== "Enter") return;

    const max = suggestions.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < max ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : max));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex <= max) {
        e.preventDefault();
        goToProduct(suggestions[activeIndex].slug);
      } else if (suggestions[0]) {
        e.preventDefault();
        goToProduct(suggestions[0].slug);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const hasResults = suggestions.length > 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-[450px] max-2xl:w-[300px] max-xl:w-[250px] max-xl:hidden"
    >
      <div className="relative">
        <input
          className="w-full h-12 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim() && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un produit…"
          aria-label="Search for products"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggest-listbox"
          aria-autocomplete="list"
        />
        <button
          className="absolute h-full px-4 group right-0 top-1/2 -translate-y-1/2 rounded-r-full text-[#15335D]"
          aria-label="Search"
          onClick={handleSearchClick}
        >
          <CiSearch className="w-8 h-8 transition-transform duration-500 group-hover:w-10 group-hover:h-10" />
        </button>
      </div>

      {open && (
        <div
          id="search-suggest-listbox"
          role="listbox"
          className="absolute top-14 left-0 w-full bg-white shadow-lg max-h-72 overflow-y-auto z-50 rounded border border-gray-200"
        >
          {loading && (
            <div className="p-4 text-sm text-gray-500">Recherche…</div>
          )}

          {!loading && !hasResults && (
            <div className="p-4 text-sm text-gray-500">Aucun résultat</div>
          )}

          {!loading &&
            hasResults &&
            suggestions.map((p, idx) => {
              const hasDiscount =
                typeof p.discount === "number" && p.discount > 0;
              const discountedPrice = hasDiscount
                ? (p.price * (100 - (p.discount as number))) / 100
                : p.price;

              const isActive = idx === activeIndex;

              return (
                <button
                  key={`${p.slug}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()} // keep focus
                  onClick={() => goToProduct(p.slug)}
                  className={[
                    "group relative w-full text-left p-3 border-b last:border-b-0",
                    "flex items-center gap-3 pl-8", // ← space for left arrow
                    isActive ? "bg-gray-50" : "bg-white",
                    "hover:bg-gray-50 transition-colors",
                  ].join(" ")}
                >
                  {/* Left hover/active arrow */}
                  <BiChevronRight
                    aria-hidden
                    size={18}
                    className={[
                      "absolute left-2 top-1/2 -translate-y-1/2",
                      "transition-all duration-150",
                      // hidden by default; show on hover or when active (keyboard)
                      isActive
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-1",
                      "group-hover:opacity-100 group-hover:translate-x-0",
                    ].join(" ")}
                  />

                  <Image
                    width={50}
                    height={50}
                    src={p.mainImageUrl}
                    alt={p.name}
                    className="rounded-md flex-shrink-0"
                  />

                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-[15px] font-semibold tracking-wide">
                      {p.name.toUpperCase()}
                    </span>
                    <div className="text-[13px] text-gray-600">
                      {hasDiscount ? (
                        <>
                          <span className="line-through mr-2 text-red-500">
                            {fmt(p.price)}
                          </span>
                          <span className="text-green-600">
                            {fmt(discountedPrice)}
                          </span>
                        </>
                      ) : (
                        <span>{fmt(p.price)}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
