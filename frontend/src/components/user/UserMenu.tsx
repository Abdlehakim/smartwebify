"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AiOutlineUser } from "react-icons/ai";
import Dropdown from "@/components/user/Dropdown";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const UserMenu = () => {
  const { user, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);
  const closeDropdown = () => setIsDropdownOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    const handleScroll = () => {
      if (isDropdownOpen) closeDropdown();
    };

    const container: HTMLElement | Window =
      document.querySelector("main") || window;

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isDropdownOpen]);

  // Close dropdown when route changes
  useEffect(() => {
    closeDropdown();
  }, [pathname]);

  return (
    <div className="flex items-center justify-center w-[200px] max-2xl:w-[150px] max-lg:w-fit text-white cursor-pointer select-none">
      <div
        className="flex items-center justify-center gap-[8px] w-fit max-lg:w-fit text-white"
        ref={dropdownRef}
        onClick={toggleDropdown}
      >
        <div className="relative my-auto mx-2">
          <AiOutlineUser size={40} />
          {isDropdownOpen &&
            (isAuthenticated ? (
              <div
                className="absolute shadow-xl z-30 flex gap-[8px] flex-col top-12 -translate-x-1/5 max-md:-translate-x-28"
                onClick={(e) => e.stopPropagation()}
              >
                <Dropdown userName={user?.username ?? "User"} />
              </div>
            ) : (
              <div className="absolute shadow-xl z-30 flex gap-[8px] flex-col top-12 -translate-x-1/5 max-md:-translate-x-[130px] bg-white p-4 border-[#15335D] border-4 rounded-lg">
                <Link
                  href="/signin"
                  className="bg-primary px-8 py-2 rounded border-2 border-primary text-center hover:bg-white hover:text-black"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="bg-secondary px-8 py-2 border-2 border-secondary rounded text-center hover:bg-white hover:text-black"
                >
                  Inscription
                </Link>
              </div>
            ))}
        </div>
        <div className="flex flex-col">
          <p className="text-[#C1C4D6] text-sm max-2xl:text-xs max-md:hidden">
            Mon Compte
          </p>
          <p className="text-white font-bold max-md:hidden max-2xl:text-sm">
            détails
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserMenu;
