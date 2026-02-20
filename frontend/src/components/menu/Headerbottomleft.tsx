/*  src/components/menu/Headerbottomleft.tsx                          */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa6";
import { FaLongArrowAltLeft, FaPlus, FaMinus } from "react-icons/fa";

/* getAllName response shapes */
export interface SubCategorie {
  name: string;
  slug: string;
}
export interface Categorie {
  name: string;
  slug: string;
  subcategories: SubCategorie[];
}

interface HeaderbottomleftProps {
  categories: Categorie[];
}

const Headerbottomleft: React.FC<HeaderbottomleftProps> = ({ categories }) => {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<string | null>(null); // slug
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLDivElement>(null);

  const hasSubs = (cat: Categorie) => (cat.subcategories?.length || 0) > 0;

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((p) => !p);
  };
  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveCategory(null);
  };

  // Desktop: close on click outside / scroll
  useEffect(() => {
    const isDesktop = () =>
      typeof window !== "undefined" && window.innerWidth >= 1024;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMenuOpen &&
        isDesktop() &&
        !menuWrapperRef.current?.contains(e.target as Node) &&
        !toggleButtonRef.current?.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    const handleScroll = () =>
      isMenuOpen && isDesktop() && closeMenu();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  // Mobile: lock body scroll while drawer is open
  useEffect(() => {
    const isDesktop = () =>
      typeof window !== "undefined" && window.innerWidth >= 1024;

    if (isMenuOpen && !isDesktop()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMenuOpen]);

  return (
    <div
      className="relative w-[300px] h-[70%] bg-white text-primary font-bold flex justify-center items-center cursor-pointer"
      onClick={toggleMenu}
      ref={toggleButtonRef}
    >
      <div className="flex gap-6 items-center select-none">
        <FaBars />
        <p>TOUTES NOS CATEGORIES</p>
      </div>

      {/* ====================== Desktop dropdown (hover) ====================== */}
      {isMenuOpen && (
        <div
          ref={menuWrapperRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-30 top-12 left-1/2 -translate-x-1/2 bg-white shadow-lg mt-4 border-2 border-white select-none hidden lg:block"
        >
          <div className="flex flex-col w-[300px] bg-white">
            {categories.map((cat) => {
              const open = activeCategory === cat.slug && hasSubs(cat);
              return (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => setActiveCategory(cat.slug)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={`/${cat.slug}`}
                    onClick={closeMenu}
                    className="group flex items-center gap-3 px-4 py-2 duration-300 hover:bg-primary hover:text-white"
                  >
                    <span className="font-bold text-base">{cat.name}</span>
                  </Link>

                  {open && (
                    <div className="absolute top-0 left-full pl-4 w-[300px]">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/${sub.slug}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 bg-white px-4 py-2 border-2 border-white duration-300 hover:bg-primary hover:text-white"
                        >
                          <span className="font-bold text-base">
                            {sub.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================== Mobile drawer (slides from left) ====================== */}
      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={(e) => {
            e.stopPropagation(); // prevent bubbling to the trigger
            closeMenu();
          }}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 h-full w-[80%] max-w-[80%] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation catégories"
      >
        <div className="h-14 px-4 flex items-center gap-3 border-b-2 border-primary">
          <span className="font-bold text-sm">TOUTES NOS CATEGORIES</span>
          <button
            onClick={closeMenu}
            className="ml-auto p-2 rounded hover:bg-gray-100"
            aria-label="Fermer"
          >
            <FaLongArrowAltLeft className="text-xl" />
          </button>
        </div>

        <nav className="py-2">
          {categories.map((cat) => {
            const open = activeCategory === cat.slug && hasSubs(cat);
            return (
              <div key={cat.slug} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    if (hasSubs(cat)) {
                      setActiveCategory((prev) =>
                        prev === cat.slug ? null : cat.slug
                      );
                    } else {
                      closeMenu();
                      router.push(`/${cat.slug}`);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left hover:bg-gray-50"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-base">{cat.name}</span>
                  {hasSubs(cat) && (
                    <span aria-hidden="true">
                      {open ? (
                        <FaMinus className="text-base" />
                      ) : (
                        <FaPlus className="text-base" />
                      )}
                    </span>
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-[max-height,padding] duration-300 ease-in-out ${
                    open ? "max-h-96 py-2" : "max-h-0 py-0"
                  }`}
                >
                  {cat.subcategories?.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/${sub.slug}`}
                      onClick={closeMenu}
                      className="block px-8 py-2 hover:bg-primary/10"
                    >
                      <span className="font-medium text-sm">{sub.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Headerbottomleft;
