/* ------------------------------------------------------------------
   src/components/product/collection/ProductSectionByStatusPage.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/product/categorie/ProductCard";
import FilterProducts from "@/components/product/filter/FilterProducts";
import LoadingDots from "@/components/LoadingDots";
import { fetchData } from "@/lib/fetchData";
import type { Product } from "@/types/Product";
import { useFooterLock } from "@/contexts/FooterLockContext";

type StatusKey = "promotion" | "new-products" | "best-collection";

interface Props {
  statusKey: StatusKey;
}

interface OptionItem { _id: string; name: string; }

export default function ProductSectionByStatusPage({ statusKey }: Props) {
  const itemsPerBatch = 8;

  /* -------- live filter state -------- */
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [selectedSubCategorie, setSelectedSubCategorie] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedMagasin, setSelectedMagasin] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  /* -------- data -------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  /* -------- option lists -------- */
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [subcategories, setSubcategories] = useState<OptionItem[]>([]);
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [magasins, setMagasins] = useState<OptionItem[]>([]);

  /* -------- sentinel / guards -------- */
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const prefillRunning = useRef(false);

  /* -------- footer lock (hide footer while more can load) -------- */
  const { setLocked } = useFooterLock();
  useEffect(() => {
    setLocked(loadingInit || loadingMore || hasMore);
    return () => setLocked(false);
  }, [loadingInit, loadingMore, hasMore, setLocked]);

  /* -------- query builder -------- */
  const buildQuery = useCallback(
    (skip: number) => {
      const qs = new URLSearchParams();
      qs.set("limit", itemsPerBatch.toString());
      qs.set("skip", skip.toString());

      // core: filter by statuspage
      qs.set("statuspage", statusKey);

      if (selectedCategorie) qs.set("categorie", selectedCategorie);
      if (selectedSubCategorie) qs.set("subCat", selectedSubCategorie);
      if (selectedBrand) qs.set("brand", selectedBrand);
      if (selectedMagasin) qs.set("magasin", selectedMagasin);
      if (minPrice !== null) qs.set("priceMin", String(minPrice));
      if (maxPrice !== null) qs.set("priceMax", String(maxPrice));
      qs.set("sort", sortOrder);

      return qs.toString();
    },
    [
      itemsPerBatch,
      statusKey,
      selectedCategorie,
      selectedSubCategorie,
      selectedBrand,
      selectedMagasin,
      minPrice,
      maxPrice,
      sortOrder,
    ]
  );

  /* -------- endpoints (adjust if your backend path differs) -------- */
  const productsEndpoint = useCallback(
    (skip: number) => `NavMenu/products/by-status?${buildQuery(skip)}`,
    [buildQuery]
  );
  const optionsEndpoint = useCallback(
    () => `NavMenu/products/by-status/options?statuspage=${encodeURIComponent(statusKey)}`,
    [statusKey]
  );

  /* -------- fetch first batch & on filter change -------- */
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingInit(true);
      try {
        const batch = await fetchData<Product[]>(productsEndpoint(0));
        if (!ignore) {
          setProducts(batch);
          setHasMore(batch.length === itemsPerBatch);
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoadingInit(false);
      }
    })();
    return () => { ignore = true; };
  }, [productsEndpoint]);

  /* -------- infinite scroll -------- */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchData<Product[]>(productsEndpoint(products.length));
      setProducts((prev) => [...prev, ...next]);
      setHasMore(next.length === itemsPerBatch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, productsEndpoint, products.length]);

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

  /* -------- prefill until tall enough (avoid blank space) -------- */
  useEffect(() => {
    if (loadingInit || !hasMore) return;
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
        }
      } finally {
        prefillRunning.current = false;
      }
    };

    prefill();
    return () => { canceled = true; };
  }, [products.length, hasMore, loadingInit, loadMore]);

  /* -------- option lists -------- */
  useEffect(() => {
    (async () => {
      try {
        const { categories, subcategories, brands, magasins } =
          await fetchData<{
            categories: OptionItem[];
            subcategories: OptionItem[];
            brands: OptionItem[];
            magasins: OptionItem[];
          }>(optionsEndpoint());

        setCategories(categories);
        setSubcategories(subcategories);
        setBrands(brands);
        setMagasins(magasins);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [optionsEndpoint]);

  /* -------- render -------- */
  return (
    <div className="flex flex-col xl:flex-row gap-16 w-[90%] mx-auto pt-8 select-none">
      <FilterProducts
        selectedCategorie={selectedCategorie}
        setSelectedCategorie={setSelectedCategorie}
        selectedSubCategorie={selectedSubCategorie}
        setSelectedSubCategorie={setSelectedSubCategorie}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        selectedMagasin={selectedMagasin}
        setSelectedMagasin={setSelectedMagasin}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        categories={categories}
        subcategories={subcategories}
        brands={brands}
        magasins={magasins}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <div className="flex flex-col flex-1 items-center gap-16">
        {loadingInit ? (
          <div className="grid grid-cols-4 gap-10 max-md:grid-cols-1">
            {Array.from({ length: itemsPerBatch }).map((_, i) => (
              <div key={i} className="h-[400px] w-[280px] bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : products.length ? (
          <>
            <ProductCard products={products} />
            <div ref={loaderRef} key={products.length} className="h-1 w-full" />
            {loadingMore && <LoadingDots />}
          </>
        ) : (
          <p className="w-full text-center py-10">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  );
}
