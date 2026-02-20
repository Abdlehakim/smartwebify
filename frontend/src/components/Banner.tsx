// src/components/Banner.tsx
"use client";

import React from "react";
import Image from "next/image";

interface BannerProps {
  title: string;
  imageBanner: string;
  blurDataURL?: string;
}

const Banner: React.FC<BannerProps> = ({ title, imageBanner, blurDataURL }) => {
  return (
    <div className="relative w-full aspect-[16/4] max-lg:hidden">
      <Image
        src={imageBanner}
        alt={title}
        fill
        className="object-cover"
        priority
        fetchPriority="high"
        loading="eager"
        sizes="100vw"
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
      />
      <div className="absolute bottom-0 w-full flex-col text-4xl text-white font-semibold tracking-wide drop-shadow-lg">
        <h1 className="h-16 flex items-center bg-primary pl-6 capitalize justify-center max-md:h-10 max-md:text-lg max-md:pl-0">
          {title}
        </h1>
        <div className="h-2 bg-secondary" />
      </div>
    </div>
  );
};

export default Banner;
