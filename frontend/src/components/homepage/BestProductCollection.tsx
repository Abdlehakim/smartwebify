import React from "react";
import ProductCard from "@/components/product/categorie/ProductCard";
import { fetchData } from "@/lib/fetchData";
import { Product } from "@/types/Product";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

interface ProductsBestCollectionDataType {
  HPBestCollectionTitle?: string;
  HPBestCollectionSubTitle?: string;
}

export const revalidate = 60;

export default async function ProductsBestCollection() {
  const [header, products] = await Promise.all([
    fetchData<ProductsBestCollectionDataType>("products/BestProductHomePageTitles").catch(
      () => ({ HPBestCollectionTitle: "", HPBestCollectionSubTitle: "" })
    ),
    fetchData<Product[]>("products/productsBestCollection").catch(() => []),
  ]);

  if (products.length === 0) return null;

  return (
    <section className="desktop max-lg:w-[95%] flex flex-col items-center gap-8 py-8">
      <div className="flex w-full flex-col items-center gap-2 relative">
        <h2 className="font-bold text-2xl text-HomePageTitles capitalize text-center max-md:text-lg">
          {header.HPBestCollectionTitle}
        </h2>
        <p className="test-base max-md:text-sm text-[#525566] text-center">
          {header.HPBestCollectionSubTitle}
        </p>

        <div className="absolute w-full flex justify-end mt-2 max-lg:justify-center max-lg:static">
          {/* Choose A or B (below). This shows Option A: solid accessible button */}
          <Link
            href="/best-collection"
            prefetch={false}
            aria-label="Voir plus — Best Collection"
            className="group inline-flex items-center border-2 border-secondary text-secondary font-semibold uppercase tracking-wide px-6 py-2 rounded-full transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-white"
          >
            Voir plus ...
            <FiArrowRight className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>

      <ProductCard products={products} />
    </section>
  );
}
