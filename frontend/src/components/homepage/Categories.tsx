// src/app/(webpage)/page.tsx  (unchanged) – good

// src/components/homepage/Categories.tsx  (your page component below)
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchData } from "@/lib/fetchData";

interface CategorieTitles {
  HPcategorieTitle?: string | null;
  HPcategorieSubTitle?: string | null;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string | null;      // optimized from API
  blurDataURL?: string;          // NEW
  numberproduct: number;
}

export const revalidate = 60;

export default async function CategoriesPage() {
  const categorieTitles = await fetchData<CategorieTitles>("categories/title", {
    next: { revalidate: 300, tags: ["categories-title"] },
  }).catch(() => ({} as CategorieTitles));

  const categories = await fetchData<CategoryItem[]>("categories", {
    next: { revalidate: 300, tags: ["categories"] },
  }).catch(() => [] as CategoryItem[]);

  if (categories.length === 0) return null;

  /** Only the first row should be `priority` (to help LCP without overloading) */
  const firstRowCount = 6; // desktop first row (your grid shows 6/row at xl)
  const prioIds = new Set(categories.slice(0, firstRowCount).map((c) => c._id));

  return (
    <section className="desktop max-md:w-[95%] max-md:gap-[10px] flex flex-col gap-[40px] py-8">
      <div className="flex-col flex gap-[8px] items-center w-full max-lg:text-center">
        <h2 className="font-bold text-2xl text-HomePageTitles capitalize">
          {categorieTitles.HPcategorieTitle ?? ""}
        </h2>
        <p className="test-base max-md:text-sm text-[#525566] text-center">
          {categorieTitles.HPcategorieSubTitle ?? ""}
        </p>
      </div>

      <div className="grid grid-cols-6 gap-[16px] w-full max-xl:grid-cols-3 max-lg:grid-cols-3 max-md:grid-cols-3">
        {categories.map((categorie) => {
          const img = categorie.imageUrl ?? "/fallback.jpg";
          const prio = prioIds.has(categorie._id);

          return (
            <Link key={categorie._id} href={`/${categorie.slug}`} className="rounded-full">
              <div className="relative rounded-full group overflow-hidden justify-center items-center aspect-square">
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 lg:group-hover:opacity-80 transition-opacity" />
                <p className="absolute top-1/2 left-1/2 w-[85%] -translate-x-1/2 -translate-y-1/2 bg-white text-black text-lg max-lg:text-sm rounded-3xl text-center py-1 max-xl:px-3 transition-all">
                  {categorie.name.length > 8 ? `${categorie.name.slice(0, 6)}…` : categorie.name}
                </p>
                <p className="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg opacity-0 lg:group-hover:opacity-100 transition-opacity pt-2 max-xl:text-xs">
                  {categorie.numberproduct}
                </p>

                <div className="relative w-full aspect-[1/1] -z-[10]">
                  <Image
                    src={img}
                    alt={categorie.name}
                    fill
                    className="rounded-full object-cover"
                    // Use responsive fractions that match your grid
                    sizes="(max-width:640px) 33vw,
                           (max-width:1024px) 33vw,
                           (max-width:1280px) 33vw,
                           16vw"
                    // Blur placeholder from API (real LQIP)
                    placeholder={categorie.blurDataURL ? "blur" : "empty"}
                    blurDataURL={categorie.blurDataURL}
                    // Only first row as priority
                    priority={prio}
                    // Leave quality modest; Cloudinary already controls q via q_auto
                    quality={75}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
