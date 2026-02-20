// src/components/menu/blog/PostCategories.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

export interface Categorie {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  subCategorieCount: number;
}

export default async function PostCategories() {
  let categories: Categorie[] = [];

  try {
    categories = await fetchData<Categorie[]>("/blog/postCategories");
  } catch (err) {
    console.error("Error fetching post categories:", err);
  }

  if (categories.length === 0) return null;

  return (
    <section className="desktop max-md:w-[95%] max-md:gap-[10px] flex flex-col gap-[40px] py-8">      
      <div className="grid grid-cols-6 gap-[16px] w-full max-xl:grid-cols-3 max-lg:grid-cols-3 max-md:grid-cols-3">
        {categories.map((categorie) => (
          <Link
            key={categorie._id}
            href={`/blog/${categorie.slug}`}
            className="rounded-full"
          >
            <div className="relative rounded-full group overflow-hidden justify-center items-center aspect-square">
              {/* dark overlay on hover */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 lg:group-hover:opacity-80 transition-opacity" />

              {/* category name */}
              <p className="absolute top-1/2 left-1/2 w-[85%] -translate-x-1/2 -translate-y-1/2 bg-white text-black text-lg rounded-3xl text-center py-1 max-xl:px-3 transition-all">
                {categorie.name}
              </p>

              {/* number of subcategories */}
              <p className="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg opacity-0 lg:group-hover:opacity-100 transition-opacity pt-2 max-xl:text-xs">
                {categorie.subCategorieCount}
                {categorie.subCategorieCount > 1 ? "s" : ""}
              </p>

              {/* category image */}
              <Image
                className="rounded-full w-[400px] h-[400px] object-cover"
                src={categorie.imageUrl || "/fallback-image.jpg"}
                alt={categorie.name}
                width={100}
                height={100}
                placeholder="blur"
                blurDataURL={categorie.imageUrl || "/fallback-image.jpg"}
                sizes="(max-width: 640px) 15vw, (max-width: 1200px) 15vw"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
