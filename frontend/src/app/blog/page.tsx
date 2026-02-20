import Banner from "@/components/Banner";
import PostCard from "@/components/post/PostCard";
import PostCategories from "@/components/menu/blog/PostCategories";
import { fetchData } from "@/lib/fetchData";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface BlogBanner {
  BlogBannerTitle?: string | null;
  BlogBannerImgUrl?: string | null;
}

export type PostCardItem = {
  title: string;
  description: string;
  imageUrl: string;
  slug: string;
  createdAt: string;
  postCategorie: { slug: string };
  postSubCategorie: { slug: string };
};

export default async function BlogPage() {
  // 1) banner
  const banner: BlogBanner = await fetchData<BlogBanner>(
    "blog/getBlogBannerData"
  ).catch(() => ({} as BlogBanner));

  // 2) post cards
  const posts = await fetchData<PostCardItem[]>(
    "blog/getAllPostCardData"
  ).catch(() => []);
  if (posts.length === 0) {
    notFound();
  }

  return (
    <>
      {banner.BlogBannerTitle && banner.BlogBannerImgUrl && (
        <Banner
          title={banner.BlogBannerTitle}
          imageBanner={banner.BlogBannerImgUrl}
        />
      )}
      <PostCategories />
      <div className="max-md:p-4 p-16 w-full grid grid-cols-4 max-md:grid-cols-1  gap-4 relative">
        <PostCard posts={posts} />
      </div>
    </>
  );
}
