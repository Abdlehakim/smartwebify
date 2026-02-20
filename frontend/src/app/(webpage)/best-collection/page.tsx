/* ------------------------------------------------------------------
   src/app/best-collection/page.tsx
------------------------------------------------------------------ */
import Banner from "@/components/Banner";
import ProductSectionByStatusPage from "@/components/product/collection/ProductSectionByStatusPage";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

interface BestProductBanner {
  BCbannerTitle?: string | null;
  BCbannerImgUrl?: string | null;
}

export default async function BestCollectionPage() {
  const banner = await fetchData<BestProductBanner>(
    "NavMenu/BestProductCollection/getBestProductBannerData"
  ).catch(() => ({} as BestProductBanner));

  return (
    <>
      {banner.BCbannerTitle && banner.BCbannerImgUrl && (
        <Banner title={banner.BCbannerTitle} imageBanner={banner.BCbannerImgUrl} />
      )}
      <ProductSectionByStatusPage statusKey="best-collection" />
    </>
  );
}
