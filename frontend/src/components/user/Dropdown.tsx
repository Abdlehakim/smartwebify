// src/components/Dropdown.tsx
"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchData } from "@/lib/fetchData";
import { useAuth } from "@/hooks/useAuth"; // ← added

interface DropdownProps {
  userName: string;
}

const Dropdown: React.FC<DropdownProps> = ({ userName }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(true);
  const router = useRouter();
  const { refresh, logout } = useAuth(); // if your hook exposes these

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    },
    [closeDropdown]
  );

  const handleScroll = useCallback(() => closeDropdown(), [closeDropdown]);

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [dropdownOpen, handleClickOutside, handleScroll]);

  const handleSignOut = async () => {
    try {
      await fetchData<void>("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // optional: clear local stuff
      localStorage.removeItem("rememberedEmail");
      // if you still store anything custom:
      localStorage.removeItem("token_FrontEnd");
      localStorage.removeItem("userName");

      // if your auth hook has a logout/refresh:
      logout?.();
      await refresh?.();
      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!dropdownOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="flex flex-col w-[220px] max-md:w-[180px] border-[#15335D] border-4 rounded-lg bg-white z-30"
    >
      <div className="px-4 py-2 text-sm text-gray-900">
        <div className="font-bold">{userName}</div>
      </div>
      <div className="border-t border-gray-100" />
      <Link
        href="/settings"
        className="block px-4 py-2 text-sm text-primary hover:bg-primary hover:text-white max-lg:text-xs"
      >
        Paramètres
      </Link>
      <Link
        href="/orderhistory"
        className="block px-4 py-2 text-sm max-lg:text-xs text-primary hover:bg-primary hover:text-white"
      >
        Historique des achats
      </Link>
      <a
        href="#"
        className="block px-4 py-2 text-sm text-primary hover:bg-primary hover:text-white max-lg:text-xs"
        onClick={(e) => {
          e.preventDefault();
          handleSignOut();
        }}
      >
        se déconnecter
      </a>
    </div>
  );
};

export default Dropdown;
