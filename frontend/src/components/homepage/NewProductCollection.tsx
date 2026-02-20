import React from "react";
import Link from "next/link";
import ProductCard from "@/components/product/categorie/ProductCard";
import { fetchData } from "@/lib/fetchData";
import type { Product } from "@/types/Product";
import { FiArrowRight } from "react-icons/fi";

interface ProductDataType {
  HPNewProductTitle?: string;
  HPNewProductSubTitle?: string;
}

export const revalidate = 60;

export default async function NewProductCollection() {
  const productData = await fetchData<ProductDataType>(
    "products/ProductCollectionHomePageTitles"
  ).catch(() => ({ HPNewProductTitle: "", HPNewProductSubTitle: "" }));

  const products = await fetchData<Product[]>(
    "products/NewProductsCollectionHomePage"
  ).catch(() => []);

  if (products.length === 0) return null;

  return (
    <section className="desktop max-lg:w-[95%] flex flex-col items-center gap-8 py-8">
      <div className="flex w-full flex-col items-center gap-2 relative">
        <h2 className="font-bold text-2xl text-HomePageTitles capitalize text-center max-md:text-lg">
          {productData.HPNewProductTitle}
        </h2>
        <p className="test-base max-md:text-sm text-[#525566] text-center">
          {productData.HPNewProductSubTitle}
        </p>
        <div className="absolute max-lg:justify-center max-lg:static w-full flex justify-end mt-2">
          <Link
          prefetch={false}
            href="/new-products"
            className="group inline-flex items-center border-2 border-secondary text-secondary font-semibold uppercase tracking-wide px-6 py-2 rounded-full transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-white"
          >
            Voir plus ...
            <FiArrowRight
              className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      <ProductCard products={products} />
    </section>
  );
}
