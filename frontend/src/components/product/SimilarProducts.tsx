"use client";

import React, { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { fetchData } from "@/lib/fetchData";
import ProductCard from "@/components/product/categorie/ProductCard";
import type { Product } from "@/types/Product";

interface SimilarProductsProps {
  categorieId: string;
  subcategorieId?: string | null;
  excludeSlug: string;
  SimilarProductTitre: string;
  SimilarProductSubTitre: string;
}

function computeLimit(w: number) {
  // Keep your exact thresholds:
  // 1 ≤ 767, 2 < 1024, 3 < 1536, 4 ≥ 1536
  return w <= 767 ? 1 : w < 1024 ? 2 : w < 1536 ? 3 : 4;
}

export default function SimilarProducts({
  categorieId,
  subcategorieId,
  excludeSlug,
  SimilarProductTitre,
  SimilarProductSubTitre,
}: SimilarProductsProps) {
  const key = subcategorieId ?? categorieId;

  // Keep initial 4 to match your original default
  const [limit, setLimit] = useState(4);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Recompute limit on mount + resize (no style changes)
  useEffect(() => {
    const apply = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1024;
      const next = computeLimit(w);
      setLimit((prev) => (prev !== next ? next : prev));
    };

    // initial sync
    apply();

    // debounce resize updates
    let tid: number | undefined;
    const onResize = () => {
      if (tid) window.clearTimeout(tid);
      tid = window.setTimeout(apply, 150);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (tid) window.clearTimeout(tid);
    };
  }, []);

  // Fetch whenever key / slug / limit / refresh change
  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();

    const url =
      `products/MainProductSection/similarById/${key}` +
      `?limit=${limit}&exclude=${encodeURIComponent(excludeSlug)}&t=${Date.now()}`;

    fetchData<Product[]>(url, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error("SimilarProducts fetch error:", err);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [key, excludeSlug, limit, refresh]);

  if (!loading && products.length === 0) {
    return <p className="w-full text-center py-10">No similar product.</p>;
  }

  return (
    <section className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-[8px] items-center w-full max-lg:text-center">
        <h2 className="font-bold text-2xl text-HomePageTitles capitalize">
          {SimilarProductTitre}
        </h2>
        <p className="test-base max-md:text-sm text-[#525566] text-center">
          {SimilarProductSubTitre}
        </p>
      </div>

      <div className="flex w-full max-lg:flex-col max-lg:h-fit h-[450px] justify-center items-center gap-4">
        {/* prev buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setRefresh(Date.now())}
            className="max-lg:hidden p-4 bg-white border border-gray-300 rounded-full shadow-md hover:bg-secondary hover:text-white transition duration-200"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setRefresh(Date.now())}
            className="hidden p-4 bg-white border border-gray-300 rounded-full shadow-md hover:bg-secondary hover:text-white transition duration-200"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* grid skeleton + cards */}
        {loading ? (
          <div className="grid grid-cols-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-[40px]">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="h-[390px] w-[280px] bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ProductCard products={products} />
        )}

        {/* next buttons */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setRefresh(Date.now())}
            className="lg:hidden p-4 bg-white border border-gray-300 rounded-full shadow-md hover:bg-secondary hover:text-white transition duration-200"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setRefresh(Date.now())}
            className="p-4 bg-white border border-gray-300 rounded-full shadow-md hover:bg-secondary hover:text-white transition duration-200"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
