/* ------------------------------------------------------------------
   src/components/product/categorie/ProductSectionCategoriePage.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/types/Product";
import ProductCard from "@/components/product/categorie/ProductCard";
import FilterProducts from "@/components/product/filter/FilterProducts";
import LoadingDots from "@/components/LoadingDots";
import { fetchData } from "@/lib/fetchData";
import { useFooterLock } from "@/contexts/FooterLockContext";

/* ---------- types ---------- */
interface Props {
  slugCategorie: string;
  /** when true we’re on a sub-categorie page, so hide the subcategorie filter */
  hideSubcategorie?: boolean;
}
interface OptionItem {
  _id: string;
  name: string;
}

/* ---------- component ---------- */
export default function ProductSectionCategoriePage({
  slugCategorie,
  hideSubcategorie = false,
}: Props) {
  const itemsPerBatch = 8;

  /* ---------- filter state ---------- */
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedMagasin, setSelectedMagasin] = useState<string | null>(null);
  const [selectedSubCategorie, setSelectedSubCategorie] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  /* ---------- product data ---------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  /* ---------- option lists ---------- */
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [magasins, setMagasins] = useState<OptionItem[]>([]);
  const [subcategories, setSubcategories] = useState<OptionItem[]>([]);

  /* ---------- refs ---------- */
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const prefillRunning = useRef(false);

  /* ---------- footer lock ---------- */
  const { setLocked } = useFooterLock();

  /* Keep the footer hidden while there are more products to load or while fetching */
  useEffect(() => {
    setLocked(loadingInitial || loadingMore || hasMore);
    return () => setLocked(false);
  }, [loadingInitial, loadingMore, hasMore, setLocked]);

  /* =================================================================
     BUILD QUERY STRING
  ================================================================== */
  const buildQuery = useCallback(
    (skip: number) => {
      const qs = new URLSearchParams();
      qs.set("limit", itemsPerBatch.toString());
      qs.set("skip", skip.toString());

      if (selectedBrand) qs.set("brand", selectedBrand);
      if (selectedMagasin) qs.set("magasin", selectedMagasin);
      if (selectedSubCategorie) qs.set("subCat", selectedSubCategorie);
      if (minPrice !== null) qs.set("priceMin", minPrice.toString());
      if (maxPrice !== null) qs.set("priceMax", maxPrice.toString());
      qs.set("sort", sortOrder);

      return qs.toString();
    },
    [
      itemsPerBatch,
      selectedBrand,
      selectedMagasin,
      selectedSubCategorie,
      minPrice,
      maxPrice,
      sortOrder,
    ]
  );

  /* =================================================================
     FETCH FIRST PRODUCT PAGE WHENEVER FILTERS CHANGE
  ================================================================== */
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingInitial(true);
      try {
        const firstBatch = await fetchData<Product[]>(
          `NavMenu/categorieSubCategoriePage/products/${slugCategorie}?${buildQuery(0)}`
        );
        if (!ignore) {
          setProducts(firstBatch);
          setHasMore(firstBatch.length === itemsPerBatch);
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoadingInitial(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [slugCategorie, buildQuery]);

  /* =================================================================
     INFINITE SCROLL – LOAD MORE
  ================================================================== */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextBatch = await fetchData<Product[]>(
        `NavMenu/categorieSubCategoriePage/products/${slugCategorie}?${buildQuery(products.length)}`
      );
      setProducts((prev) => [...prev, ...nextBatch]);
      setHasMore(nextBatch.length === itemsPerBatch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, slugCategorie, buildQuery, products.length]);

  /* Trigger loading when the sentinel nears the viewport */
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "800px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadMore, products.length]);

  /* =================================================================
     AUTO-PREFILL UNTIL PAGE IS TALL ENOUGH (no white-space scrolling)
  ================================================================== */
  useEffect(() => {
    if (loadingInitial || !hasMore) return;
    let canceled = false;

    const bufferPx = 200;
    const prefill = async () => {
      if (prefillRunning.current) return;
      prefillRunning.current = true;
      try {
        while (!canceled && hasMore) {
          const doc = document.documentElement;
          const pageTooShort = doc.scrollHeight <= window.innerHeight + bufferPx;
          if (!pageTooShort) break;
          await loadMore();
          // No artificial delay; rely on subsequent renders to update height.
        }
      } finally {
        prefillRunning.current = false;
      }
    };

    prefill();
    return () => {
      canceled = true;
    };
  }, [products.length, hasMore, loadingInitial, loadMore]);

  /* =================================================================
     FETCH OPTION LISTS (once per slugCategorie)
  ================================================================== */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { brands, magasins, subcategories } = await fetchData<{
          brands: OptionItem[];
          magasins: OptionItem[];
          subcategories: OptionItem[];
        }>(
          `NavMenu/categorieSubCategoriePage/products/${slugCategorie}/options`
        );

        if (!ignore) {
          setBrands(brands);
          setMagasins(magasins);
          setSubcategories(subcategories);
        }
      } catch (err) {
        if (!ignore) console.error(err);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [slugCategorie]);

  /* =================================================================
     RENDER
  ================================================================== */
  return (
    <div className="flex flex-row justify-around max-xl:flex-col gap-6 w-[95%] min-h-screen mx-auto my-4 select-none">
      <FilterProducts
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        selectedMagasin={selectedMagasin}
        setSelectedMagasin={setSelectedMagasin}
        selectedSubCategorie={selectedSubCategorie}
        setSelectedSubCategorie={setSelectedSubCategorie}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        brands={brands}
        magasins={magasins}
        subcategories={subcategories}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        hideSubcategorie={hideSubcategorie}
        hideCategorie={true}
      />

      <div className="flex flex-col items-center gap-6 w-full">
        {loadingInitial ? (
          <div className="grid grid-cols-4 gap-10 max-md:grid-cols-1">
            {Array.from({ length: itemsPerBatch }).map((_, i) => (
              <div
                key={i}
                className="h-[400px] w-[280px] bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        ) : products.length ? (
          <>
            <ProductCard products={products} />
            {/* IntersectionObserver sentinel (no spacer below) */}
            <div ref={loaderRef} key={products.length} className="h-1 w-full" />
            {loadingMore && <LoadingDots />}
          </>
        ) : (
          <p className="w-full text-center min-h-screen py-10">
            Aucun produit trouvé.
          </p>
        )}
      </div>
    </div>
  );
}
