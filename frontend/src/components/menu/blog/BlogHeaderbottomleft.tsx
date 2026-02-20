// src/app/components/HeaderBottomBlog/BlogHeaderbottomleft.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBars } from "react-icons/fa6";

export interface SubCategoryDTO {
  _id: string;
  name: string;
  slug: string;
}

export interface CategoryDTO {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubCategoryDTO[];
}

interface BlogHeaderbottomleftProps {
  categories: CategoryDTO[];
}

const BlogHeaderbottomleft: React.FC<BlogHeaderbottomleftProps> = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(open => !open);
  };
  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveCategory(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMenuOpen &&
        !menuWrapperRef.current?.contains(e.target as Node) &&
        !toggleButtonRef.current?.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    const handleScroll = () => {
      if (isMenuOpen) closeMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  return (
    <div
      className="relative w-[300px] h-[70%] bg-white text-primary font-bold flex justify-center items-center cursor-pointer"
      onClick={toggleMenu}
      ref={toggleButtonRef}
    >
      <div className="flex gap-[24px] items-center select-none">
        <FaBars />
        <p>TOUTES NOS CATÉGORIES</p>
      </div>

      {isMenuOpen && (
        <div
          className="absolute z-30 top-12 left-1/2 -translate-x-1/2 bg-white shadow-lg mt-4 select-none"
          ref={menuWrapperRef}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-col w-[300px] bg-white z-30">
            {categories.map(cat => (
              <div
                key={cat._id}
                className="relative"
                onMouseEnter={() => setActiveCategory(cat._id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={`/blog/${cat.slug}`}
                  onClick={closeMenu}
                  className="flex items-center gap-[12px] duration-300 hover:bg-primary hover:text-white p-4"
                >
                  <span className="font-bold text-base">{cat.name}</span>
                </Link>

                {activeCategory === cat._id && cat.subcategories.length > 0 && (
                  <div className="absolute top-0 left-full pl-4 w-[300px]">
                    {cat.subcategories.map(sub => (
                      <Link
                        key={sub._id}
                        href={`/blog/${cat.slug}/${sub.slug}`}
                        onClick={closeMenu}
                        className="flex bg-white items-center gap-[12px] duration-300 hover:bg-primary hover:text-white p-4"
                      >
                        <span className="font-bold text-base">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogHeaderbottomleft;
