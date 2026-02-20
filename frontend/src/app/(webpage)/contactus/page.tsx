/* ------------------------------------------------------------------ 
   // src/app/(webpage)/contactus/page.tsx
/* ------------------------------------------------------------------ */
import Banner from "@/components/Banner";
import ContactUsForm from "@/components/ContactUsForm";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

/* DTO returned by /NavMenu/contactus/ContactBanner */
interface ContactBanner {
  ContactBannerTitle?: string | null;
  ContactBannerImgUrl?: string | null;
}

export default async function ContactPage() {
  const banner = await fetchData<ContactBanner>(
    "NavMenu/contactus/ContactBanner"
  ).catch(() => ({} as ContactBanner));

  return (
    <>
      {banner.ContactBannerTitle && banner.ContactBannerImgUrl && (
        <Banner
          title={banner.ContactBannerTitle}
          imageBanner={banner.ContactBannerImgUrl}
        />
      )}
      <ContactUsForm />
    </>
  );
}
