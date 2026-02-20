// src/components/post/PostMainSection.tsx

import React from "react";
import Image from "next/image";

// Define subsection type
export interface Subsection {
  title: string;
  description: string;
  imageUrl?: string;
  children: Subsection[];
}

// Define post data type
export interface PostData {
  title: string;
  description: string;
  imageUrl: string;
  slug: string;
  createdAt: string;
  postCategorie?: { name: string };
  postSubCategorie?: { name: string };
  user?: { username: string };
  subsections: Subsection[];
}

interface PostMainSectionProps {
  post: PostData;
}

export default function PostMainSection({ post }: PostMainSectionProps) {
  return (
    <div className="flex flex-col w-full gap-[16px]">
      {/* Title + Meta */}
      <div className="flex flex-col gap-[24px]">
        <div className="w-full h-fit flex items-center justify-center">
          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              width={1000}
              height={600}
              alt="Post image"
              className="object-cover w-full h-[300px]"
            />
          )}
        </div>
        <div className="flex flex-col gap-[8px]">
          <p className="text-gray-400 text-sm">
            Posted on{' '}
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            {post.user?.username && <>by {post.user.username}</>}
          </p>
          {/* Category */}
          {post.postCategorie?.name && (
            <div className="flex items-center gap-[8px]">
              <p className="text-xs px-4 py-2 rounded-md bg-gray-600 text-white">
                {post.postCategorie.name}
              </p>
            </div>
          )}
        </div>
        <p className="text-4xl font-bold">{post.title}</p>
      </div>

      {/* Main Description */}
      {post.description && (
        <div className="flex flex-col gap-[24px]">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.description }} />
        </div>
      )}

      {/* Subsections */}
      {post.subsections.map((section, index) => (
        <div key={index} id={`section-${index}`} className="flex flex-col gap-[24px]">
          {/* Section Title */}
          <p className="text-2xl font-bold">{section.title}</p>

          {/* Section Description */}
          {section.description && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: section.description }} />
          )}

          {/* Section Image */}
          {section.imageUrl && (
            <div className="w-full h-fit flex items-center justify-center">
              <Image
                src={section.imageUrl}
                width={1000}
                height={600}
                alt={`${section.title} image`}
                className="object-cover w-full h-[300px]"
              />
            </div>
          )}

          {/* Nested Subsections */}
          {section.children.map((sub, subIndex) => (
            <div key={subIndex} className="flex flex-col gap-[24px]">
              <p className="text-xl font-bold">{sub.title}</p>

              {sub.description && (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sub.description }} />
              )}

              {sub.imageUrl && (
                <div className="w-full h-fit flex items-center justify-center">
                  <Image
                    src={sub.imageUrl}
                    width={1000}
                    height={600}
                    alt={`${sub.title} image`}
                    className="object-cover w-full h-[300px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
