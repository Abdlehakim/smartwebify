// src/components/sidebar/IconButton.tsx
"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Accessible label (and tooltip). */
  ariaLabel?: string;
  /** Extra Tailwind classes to merge. */
  className?: string;
  /** Keep absolute floating position by default (backward compatible). */
  floating?: boolean;
  /** Consider a link active when pathname starts with href (default: true). */
  activeWhenStartsWith?: boolean;
}

/** tiny join helper to avoid double spaces */
const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

const normalizePath = (s?: string) => {
  if (!s) return "";
  const noTrail = s.replace(/\/+$/, "");
  return noTrail.length ? noTrail : "/";
};

export default function IconButton({
  icon,
  href,
  onClick,
  ariaLabel,
  className,
  floating = true,
  activeWhenStartsWith = true,
}: Props) {
  const pathname = normalizePath(usePathname());
  const normHref = normalizePath(href);

  const active = href
    ? activeWhenStartsWith
      ? pathname === normHref || pathname.startsWith(normHref + "/")
      : pathname === normHref
    : false;

  // Hidden on mobile by default; visible on md+
  const base =
    "hidden md:inline-flex items-center justify-center h-12 w-12 rounded-md border-2 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 cursor-pointer z-50";
  const float = floating
    ? "absolute bottom-[10%] -right-8 md:top-auto md:-right-8 md:bottom-6"
    : "";
  const colors = active
    ? "bg-secondary text-primary"
    : "bg-primary text-white hover:bg-secondary hover:scale-105";
  const classes = cx(base, float, colors, className);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {icon}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} title={ariaLabel}>
        {icon}
      </Link>
    );
  }

  // Fallback (no href, no onClick)
  return (
    <div className={classes} aria-label={ariaLabel} title={ariaLabel} role="img">
      {icon}
    </div>
  );
}
