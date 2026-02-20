// src/components/product/categorie/ProductSectionSubCategoriePage.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/types/Product";
import ProductsFilter from "@/components/product/filter/FilterProducts";
import ProductCard     from "@/components/product/categorie/ProductCard";
import LoadingDots     from "@/components/LoadingDots";
import { fetchData }   from "@/lib/fetchData";

/* ---------- props ---------- */
interface Props {
  slugSubCategorie: string;
}
interface OptionItem { _id: string; name: string; }

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ProductSectionSubCategoriePage({ slugSubCategorie }: Props) {
  const itemsPerBatch = 8;

  /* ----- filter state ----- */
  const [selectedBrand,    setSelectedBrand]    = useState<string | null>(null);
  const [selectedMagasin, setSelectedMagasin] = useState<string | null>(null);
  const [minPrice, setMinPrice]   = useState<number | null>(null);
  const [maxPrice, setMaxPrice]   = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  /* ----- data state ----- */
  const [products,    setProducts]    = useState<Product[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(true);

  /* ----- option lists ----- */
  const [brands,    setBrands]    = useState<OptionItem[]>([]);
  const [magasins, setMagasins] = useState<OptionItem[]>([]);

  /* ----- sentinel ref ----- */
  const loaderRef = useRef<HTMLDivElement | null>(null);

  /* =================================================================
     BUILD QUERY STRING
  ================================================================== */
  const buildQuery = useCallback(
    (skip: number) => {
      const qs = new URLSearchParams();
      qs.set("limit", itemsPerBatch.toString());
      qs.set("skip",  skip.toString());

      if (selectedBrand)    qs.set("brand",    selectedBrand);
      if (selectedMagasin) qs.set("magasin", selectedMagasin);
      if (minPrice !== null) qs.set("priceMin", minPrice.toString());
      if (maxPrice !== null) qs.set("priceMax", maxPrice.toString());
      qs.set("sort", sortOrder);

      return qs.toString();
    },
    [itemsPerBatch, selectedBrand, selectedMagasin, minPrice, maxPrice, sortOrder]
  );

  /* =================================================================
     FETCH FIRST PAGE WHEN FILTERS CHANGE
  ================================================================== */
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingInit(true);
      try {
        const batch = await fetchData<Product[]>(
          `NavMenu/categorieSubCategoriePage/products/${slugSubCategorie}?${buildQuery(0)}`
        );
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
  }, [slugSubCategorie, buildQuery]);

  /* =================================================================
     INFINITE SCROLL
  ================================================================== */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchData<Product[]>(
        `NavMenu/categorieSubCategoriePage/products/${slugSubCategorie}?${buildQuery(products.length)}`
      );
      setProducts(prev => [...prev, ...next]);
      setHasMore(next.length === itemsPerBatch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, slugSubCategorie, buildQuery, products.length]);

  /* observe sentinel */
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      entries => entries[0].isIntersecting && loadMore(),
      { rootMargin: "200px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadMore, products.length]);

  /* =================================================================
     OPTION LISTS (once per slug)
  ================================================================== */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { brands, magasins } = await fetchData<{ brands: OptionItem[]; magasins: OptionItem[] }>(
          `NavMenu/categorieSubCategoriePage/products/${slugSubCategorie}/options`
        );
        if (!ignore) {
          setBrands(brands);
          setMagasins(magasins);
        }
      } catch (err) {
        if (!ignore) console.error(err);
      }
    })();
    return () => { ignore = true; };
  }, [slugSubCategorie]);

  /* =================================================================
     RENDER
  ================================================================== */
  return (
    <div className="flex flex-col gap-16 w-[90%] mx-auto">
      <div className="flex flex-col xl:flex-row gap-16 w-full">
        <ProductsFilter
          hideCategorie
          hideSubcategorie
          selectedSubCategorie={null}
          setSelectedSubCategorie={() => {}}
          subcategories={[]}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          selectedMagasin={selectedMagasin}
          setSelectedMagasin={setSelectedMagasin}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          categories={[]}
          brands={brands}
          magasins={magasins}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <div className="flex flex-col items-center w-full gap-16">
          {loadingInit ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-10">
              {Array.from({ length: itemsPerBatch }).map((_, i) => (
                <div key={i} className="h-[400px] w-[280px] bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : products.length ? (
            <>
              <div className="w-full">
                <ProductCard products={products} />
              </div>
              <div ref={loaderRef} key={products.length} />
              {loadingMore && <LoadingDots />}
            </>
          ) : (
            <p className="w-full text-center py-10">Aucun produit trouvé.</p>
          )}
        </div>
      </div>
    </div>
  );
}
