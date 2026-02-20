// src/app/blog/[categorieslug]/[subcategorieslug]/page.tsx

import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchData } from "@/lib/fetchData";
import PostCard, { PostCardItem } from "@/components/post/PostCard";
import Banner from "@/components/Banner";

export const revalidate = 60;

// raw API shape
interface APIResponse {
  title: string;
  description: string;
  imageUrl: string;
  slug: string;
  createdAt: string;
  postCategorie: { slug: string };
  postSubCategorie: { slug: string };
}

type PageParams = {
  categorieslug: string;
  subcategorieslug: string;
};

export default async function SubCategoryPage({
  params,
}: {
  // 🚨 Next injects params as a thenable
  params: Promise<PageParams>;
}) {
  // await before destructuring
  const { categorieslug, subcategorieslug } = await params;

  // 1) fetch posts for this sub-category
  const data = await fetchData<APIResponse[]>(
    `/blog/getAllPostCardBySubCategorie/${subcategorieslug}`
  ).catch(() => []);

  // 2) show 404 if none
  if (data.length === 0) {
    notFound();
  }

  // 3) map into PostCardItem[]
  const posts: PostCardItem[] = data.map((item) => ({
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    slug: item.slug,
    createdAt: item.createdAt,
    postCategorie: { slug: item.postCategorie.slug },
    postSubCategorie: { slug: item.postSubCategorie.slug },
  }));

  const [firstPost] = posts;

  return (
    <>
      {firstPost?.title && firstPost?.imageUrl && (
        <>
          <Banner title={firstPost.title} imageBanner={firstPost.imageUrl} />

          {/* Breadcrumb navigation */}
          <nav
            className="px-16 max-md:px-4 py-4 text-sm text-gray-600"
            aria-label="Breadcrumb"
          >
            <ol className="list-none p-0 inline-flex items-center space-x-2">
              <li>
                <Link href="/blog" className="hover:underline">
                  Blog
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href={`/blog/${categorieslug}`}
                  className="hover:underline"
                >
                  {categorieslug}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-500">{subcategorieslug}</li>
            </ol>
          </nav>
        </>
      )}

      {/* reuse PostCard */}
      <div className="max-md:p-4 p-16 w-full grid grid-cols-4 max-md:grid-cols-1 gap-4 relative">
        <PostCard posts={posts} />
      </div>
    </>
  );
}
