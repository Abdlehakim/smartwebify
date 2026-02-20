// src/app/(webpage)/[slugCategorie]/page.tsx

import { notFound } from "next/navigation";
import Banner from "@/components/Banner";
import ProductSectionCategoriePage from "@/components/product/categorie/ProductSectionCategoriePage";
import { fetchData } from "@/lib/fetchData";
import type { Metadata } from "next";

export const revalidate = 60; // ISR

/* ---------- types ---------- */
interface SectionData {
  _id:       string;
  name:      string | null;
  slug:      string | null;
  bannerUrl: string | null;
}
interface OptionsData {
  brands:      { _id: string; name: string }[];
  magasins:   { _id: string; name: string }[];
  subcategories: { _id: string; name: string }[];
}

type PageParams = { slugCategorie: string };

/* ------------------------------------------------------------------ */
/*  1)  Pre-generate one static path per categorie or sub-categorie     */
/* ------------------------------------------------------------------ */
export async function generateStaticParams(): Promise<PageParams[]> {
  const slugs = await fetchData<string[]>(
    "NavMenu/categorieSubCategoriePage/allSlugs"
  ).catch(() => []);
  return slugs.map((slug) => ({ slugCategorie: slug }));
}

/* ------------------------------------------------------------------ */
/*  2)  Build-time SEO metadata                                       */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slugCategorie } = await params;
  const section = await fetchData<SectionData>(
    `NavMenu/categorieSubCategoriePage/${slugCategorie}`
  ).catch(() => null);

  const title = section?.name ?? "Catalogue";
  return {
    title,
    openGraph: {
      title,
      images: section?.bannerUrl ? [section.bannerUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: section?.bannerUrl ? [section.bannerUrl] : [],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  3)  Page component (Server)                                       */
/* ------------------------------------------------------------------ */
export default async function SectionPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slugCategorie } = await params;

  // fetch either categorie or sub-categorie meta
  const section = await fetchData<SectionData>(
    `NavMenu/categorieSubCategoriePage/${slugCategorie}`
  ).catch(() => null);

  if (!section || !section.name) {
    return notFound();
  }

  // fetch filter options to see if there are any sub-categories
  const opts = await fetchData<OptionsData>(
    `NavMenu/categorieSubCategoriePage/products/${slugCategorie}/options`
  ).catch(() => ({ brands: [], magasins: [], subcategories: [] }));

   const hideSubcategorie = opts.subcategories.length <= 1;

  return (
    <div className="flex flex-col gap-6">
      {section.bannerUrl && (
        <Banner title={section.name} imageBanner={section.bannerUrl} />
      )}

      <ProductSectionCategoriePage
        slugCategorie={slugCategorie}
        hideSubcategorie={hideSubcategorie}
      />
    </div>
  );
}
