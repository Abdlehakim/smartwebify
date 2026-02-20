/* ------------------------------------------------------------------
   // src/app/(webpage)/new-products/page.tsx
------------------------------------------------------------------ */
import Banner from "@/components/Banner";
import ProductSectionByStatusPage from "@/components/product/collection/ProductSectionByStatusPage";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

/* DTO returned by /getNewProductsBannerData */
interface NewProductsBanner {
  NPBannerTitle?: string | null;
  NPBannerImgUrl?: string | null;
}

export default async function NewProductsPage() {
  /* -------- banner (server-side) -------- */
  const banner = await fetchData<NewProductsBanner>(
    "NavMenu/NewProducts/getNewProductsBannerData"
  ).catch(() => ({} as NewProductsBanner));

  return (
    <>
      {banner.NPBannerTitle && banner.NPBannerImgUrl && (
        <Banner title={banner.NPBannerTitle} imageBanner={banner.NPBannerImgUrl} />
      )}
      {/* Load products with statuspage=new-products */}
      <ProductSectionByStatusPage statusKey="new-products" />
    </>
  );
}
