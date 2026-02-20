// src/components/addproductsteps/ProductBreadcrumb.tsx
"use client";

import React from "react";
import Link from "next/link";
import { MdArrowForwardIos } from "react-icons/md";

interface Props {
  baseHref: string;
  baseLabel: string;
  currentLabel: string;
}

export default function ProductBreadcrumb({
  baseHref,
  baseLabel,
  currentLabel,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold uppercase">{currentLabel}</h1>
      <nav className="text-sm underline flex items-center gap-2">
        <Link
          href={baseHref}
          className="text-gray-500 hover:underline"
        >
          {baseLabel}
        </Link>
        <MdArrowForwardIos className="text-gray-400" />
        <span>{currentLabel}</span>
      </nav>
    </div>
  );
}
