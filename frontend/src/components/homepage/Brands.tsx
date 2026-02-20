// src/components/homepage/Brands.tsx  (your BrandsPage)
import React from "react";
import Image from "next/image";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

interface BrandTitles {
  HPbrandTitle?: string | null;
  HPbrandSubTitle?: string | null;
}

interface Brand {
  _id: string;
  name: string;
  place?: string | null;
  description?: string | null;
  imageUrl: string;      // optimized (800x400)
  imageBlur?: string;    // NEW
  logoUrl: string;       // optimized (400x400)
  logoBlur?: string;     // NEW
}

export default async function BrandsPage() {
  const titles = (await fetchData<BrandTitles>("brands/titles", {
    next: { revalidate: 300, tags: ["brands-titles"] },
  })) ?? {};

  const brands = (await fetchData<Brand[]>("brands", {
    next: { revalidate: 300, tags: ["brands"] },
  })) ?? [];

  if (brands.length === 0) return null;

  return (
    <section className="w-[95%] flex flex-col gap-[40px] max-md:gap-[16px] py-8 max-md:py-2">
      <div className="flex w-full flex-col items-center gap-2 justify-center">
        <h3 className="font-bold text-2xl text-HomePageTitles capitalize text-center max-md:text-lg">
          {titles.HPbrandTitle}
        </h3>
        <p className="test-base max-md:text-sm text-[#525566] text-center">
          {titles.HPbrandSubTitle}
        </p>
      </div>

      <div className="group w-[80%] flex max-md:flex-col justify-center gap-[8px] mx-auto">
        {brands.map((brand) => (
          <div
            key={brand._id}
            className="group/article relative w-full rounded-xl overflow-hidden
                       md:group-hover:[&:not(:hover)]:w-[20%]
                       md:group-focus-within:[&:not(:focus-within):not(:hover)]:w-[20%]
                       transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.15)]
                       focus-within:ring focus-within:ring-indigo-300 cursor-pointer"
          >
            {/* Banner image: 800x400 optimized, use px-based sizes so Next doesn’t jump to 640 */}
            <div className="relative w-full h-[400px] max-md:h-[300px]">
              <Image
                src={brand.imageUrl}
                alt={brand.name}
                fill
                className="object-cover"
                // Each card typically ~16–20% of 80vw group → about 250–360px wide
                sizes="(max-width: 640px) 95vw, (max-width: 1024px) 360px, 320px"
                quality={75}
                placeholder={brand.imageBlur ? "blur" : "empty"}
                blurDataURL={brand.imageBlur}
                loading="lazy"
              />
            </div>

            <div className="absolute max-md:h-[10%] top-0 left-0 w-full h-[15%] bg-primary" />

            {/* Bottom overlay with logo */}
            <div
              className="absolute bottom-0 left-0 w-full h-[25%] bg-primary
                         opacity-0 max-md:opacity-100 group-hover/article:opacity-100 transition-opacity duration-200
                         flex justify-center items-center gap-4"
            >
              <div className="rounded-full w-40 h-40 max-md:w-20 max-md:h-20 border-primary border-4 bg-white flex items-center justify-center z-40">
                <div className="relative w-24 h-24 max-md:w-14 max-md:h-14">
                  <Image
                    src={brand.logoUrl}
                    alt={`${brand.name} logo`}
                    fill
                    className="object-cover rounded-full"
                    // The displayed logo box is ~96px (24) to 160px (40) → request small rungs
                    sizes="(max-width: 640px) 96px, 160px"
                    placeholder={brand.logoBlur ? "blur" : "empty"}
                    blurDataURL={brand.logoBlur}
                    loading="lazy"
                    quality={70}
                  />
                </div>
              </div>
              <div className="flex flex-col w-[60%]">
                <p className="text-white font-bold max-md:text-xs">{brand.place}</p>
                <p className="text-white max-md:text-xs truncate">
                  {brand.description}
                </p>
              </div>
            </div>

            <span className="absolute inset-x-0 top-0 text-2xl max-lg:text-xs max-xl:text-sm uppercase tracking-widest font-bold p-4 max-md:p-2 text-white z-20">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
