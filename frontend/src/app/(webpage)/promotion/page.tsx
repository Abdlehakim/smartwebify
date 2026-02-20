/* ------------------------------------------------------------------ */
/*  productpromotion page                                             */
/* ------------------------------------------------------------------ */
import Banner from "@/components/Banner";
import ProductSectionByStatusPage
  from "@/components/product/collection/ProductSectionByStatusPage";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

interface PromotionBanner {
  PromotionBannerTitle?: string | null;
  PromotionBannerImgUrl?: string | null;
}

export default async function ProductPromotionPage() {
  const banner = await fetchData<PromotionBanner>(
    "NavMenu/ProductPromotion/getProductPromotionBannerData"
  ).catch(() => ({} as PromotionBanner));

  return (
    <>
      {banner.PromotionBannerTitle && banner.PromotionBannerImgUrl && (
        <Banner
          title={banner.PromotionBannerTitle}
          imageBanner={banner.PromotionBannerImgUrl}
        />
      )}
      <ProductSectionByStatusPage statusKey="promotion" />
    </>
  );
}
