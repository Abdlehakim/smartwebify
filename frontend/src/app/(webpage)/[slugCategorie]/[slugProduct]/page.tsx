/* ------------------------------------------------------------------ */
/*  src/app/(webpage)/[slugCategorie]/[slugProduct]/page.tsx          */
/* ------------------------------------------------------------------ */
import { notFound } from "next/navigation";
import ProductDetails from "@/components/product/ProductDetails";
import MainProductSection from "@/components/product/MainProductSection";
import SimilarProducts from "@/components/product/SimilarProducts";
import { fetchData } from "@/lib/fetchData";
import type { Product } from "@/types/Product";

export const revalidate = 60;

interface ProductTitleDataType {
  SimilarProductTitre?: string;
  SimilarProductSubTitre?: string;
}

/* ---------- dynamic params ---------------------------------------- */
type PageParams = {
  slugCategorie: string;
  slugProduct: string;
};

/* ---------- “light” Product type sent to MainProductSection ------- */
type ProductStub = Pick<
  Product,
  | "slug"
  | "name"
  | "reference"
  | "price"
  | "discount"
  | "stock"
  | "mainImageUrl"
  | "tva"
>;

interface ProductDetailsDataType {
  description?: string;
  productDetails?: { name: string; description?: string; image?: string }[];
}

/* ------------------------------------------------------------------ */
/*  1)  Pre-generate paths for ISR                                    */
/* ------------------------------------------------------------------ */
export async function generateStaticParams(): Promise<PageParams[]> {
  const slugs = await fetchData<string[]>(
    "products/MainProductSection/allProductSlugs"
  ).catch(() => []);

  const paths = await Promise.all(
    slugs.map(async (slugProduct) => {
      const prod = await fetchData<Product>(
        `products/MainProductSection/${slugProduct}`
      ).catch(() => null);

      if (!prod?.categorie?.slug) return null;

      return {
        slugCategorie: prod.categorie.slug,
        slugProduct,
      };
    })
  );

  return paths.filter((p): p is PageParams => p !== null);
}

/* ------------------------------------------------------------------ */
/*  2)  Product page (server component)                               */
/* ------------------------------------------------------------------ */
export default async function ProductPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slugProduct } = await params;

  /* ----- fetch the full product ---------------------------------- */
  const prod = await fetchData<Product>(
    `products/MainProductSection/${slugProduct}`
  ).catch(() => null);

  if (!prod || !prod.categorie) return notFound();

  /* ----- slim payload for the hero section ------------------------ */
  const initialProduct: ProductStub = {
    slug: prod.slug,
    name: prod.name,
    reference: prod.reference,
    price: prod.price,
    discount: prod.discount,
    stock: prod.stock,
    mainImageUrl: prod.mainImageUrl,
    tva: prod.tva,
  };

  const titleData = await fetchData<ProductTitleDataType>(
    "products/MainProductSection/SimilarProductTitles"
  ).catch(() => null);

  const { SimilarProductTitre = "", SimilarProductSubTitre = "" } = titleData ?? {};

  /* ---------- fetch lightweight description/details -------------- */
  const details = await fetchData<ProductDetailsDataType>(
    `products/MainProductSection/productDetails/${slugProduct}`
    // ^ typo "prodcut" corrigé ➜ "productDetails"
  ).catch(() => null);

  /* ----- render --------------------------------------------------- */
  return (
    <div className="flex flex-col w-[90%] gap-16 max-lg:gap-4 mx-auto">
      <MainProductSection initialProduct={initialProduct} />

      <ProductDetails
        description={details?.description}
        productDetails={details?.productDetails}
      />

      {/* -------- Similar products -------- */}
      <SimilarProducts
        categorieId={prod.categorie._id}
        subcategorieId={prod.subcategorie?._id}
        excludeSlug={prod.slug}
        SimilarProductTitre={SimilarProductTitre}
        SimilarProductSubTitre={SimilarProductSubTitre}
      />
    </div>
  );
}
