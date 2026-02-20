// src/app/blog/[categorieslug]/[subcategorieslug]/[postslug]/page.tsx

import React from "react";
import { notFound } from "next/navigation";
import { fetchData } from "@/lib/fetchData";
import PostMainSection, {
  PostData,
  Subsection,
} from "@/components/post/PostMainSection";
import PostCard, { PostCardItem } from "@/components/post/PostCard";

export const revalidate = 60;

interface SimilarAPIResponse {
  title: string;
  description: string;
  imageUrl: string;
  slug: string;
  createdAt: string;
  postCategorie: { slug: string };
  postSubCategorie: { slug: string };
}

type PostPageProps = { postslug: string };

export default async function PostPage({
  params,
}: {
  params: Promise<PostPageProps>;
}) {
  // await the lazy params first
  const { postslug } = await params;

  // 1️⃣ fetch the main post
  const post = await fetchData<PostData>(
    `/blog/getPostDataBySlug/${postslug}`
  ).catch(() => null);

  if (!post) {
    notFound();
  }

  // 2️⃣ fetch similar posts
  const similarData = await fetchData<SimilarAPIResponse[]>(
    `/blog/getSimilarPostBySlug/${postslug}`
  ).catch(() => []);

  // 3️⃣ map into PostCardItem[]
  const similarPosts: PostCardItem[] = similarData.map((item) => ({
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    slug: item.slug,
    createdAt: item.createdAt,
    postCategorie: { slug: item.postCategorie.slug },
    postSubCategorie: { slug: item.postSubCategorie.slug },
  }));

  // 4️⃣ build TOC items
  const tocItems = post.subsections?.length
    ? generateToc(post.subsections)
    : [];

  return (
    <div className="desktop flex py-4 max-lg:py-20 gap-[40px]">
      {/* Main section */}
      <div className="w-[70%] max-lg:w-full flex flex-col gap-[32px]">
        <PostMainSection post={post} />
      </div>

      {/* Sidebar: similar posts */}
      {similarPosts.length > 0 && (
        <aside className="flex flex-col w-fit gap-[16px] max-xl:hidden">
          {/* Summary Section */}
          {tocItems.length > 0 && (
            <section className="flex flex-col w-full gap-[16px]">
              <h2 className="text-2xl font-semibold">Summary</h2>
              <ul className="list-disc list-inside">{tocItems}</ul>
            </section>
          )}
          <h2 className="text-xl font-semibold">Similar Posts</h2>
          <div className="w-[350px] flex flex-col gap-4">
            <PostCard posts={similarPosts} />
          </div>
        </aside>
      )}
    </div>
  );
}

/**
 * Flattens subsections to generate a Table of Contents list.
 */
function generateToc(sections: Subsection[], level = 0): React.ReactNode[] {
  return sections.flatMap((sec, idx) => {
    const id = `${sec.title.toLowerCase().replace(/\s+/g, "-")}-${idx}`;
    const indent = level * 4;
    const item = (
      <li key={id}>
        <a
          href={`#${id}`}
          className="block hover:underline"
          style={{ marginLeft: `${indent}px` }}
        >
          {sec.title}
        </a>
      </li>
    );
    const children = sec.children?.length
      ? generateToc(sec.children, level + 1)
      : [];
    return [item, ...children];
  });
}
