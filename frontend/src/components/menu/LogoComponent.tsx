// src/components/menu/LogoComponent

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchData } from "@/lib/fetchData";

export interface LogoData {
  name: string;
  logoImageUrl: string;
}

export const revalidate = 60;

type Props = {
  /** Override container sizing/positioning (must include `relative` + explicit size) */
  className?: string;
};

export default async function LogoComponent({ className }: Props) {
  const { name, logoImageUrl }: LogoData = await fetchData<LogoData>(
    "/website/header/getHeaderData"
  ).catch(() => ({ name: "", logoImageUrl: "" } as LogoData));

  const isSvg = Boolean(logoImageUrl && logoImageUrl.toLowerCase().endsWith(".svg"));

  const defaultClasses =
    "relative w-full aspect-[16/15] max-h-[64px] max-2xl:max-h-[64px] " +
    "max-2xl:max-w-[298px] max-w-[298px]";

  return (
    <Link
      href="/"
      aria-label="Home page"
      className={className || defaultClasses}
      title={name || "Home"}
    >
      {/* If SVG: use mask to color it white (change bg to control color) */}
      {isSvg && logoImageUrl ? (
        <span
          aria-hidden
          className="absolute inset-0 block bg-white"
          style={{
            WebkitMaskImage: `url(${logoImageUrl})`,
            maskImage: `url(${logoImageUrl})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          } as React.CSSProperties}
        />
      ) : logoImageUrl ? (
        <Image
          src={logoImageUrl}
          alt={`${name || "Brand"} logo`}
          fill
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
          sizes="(max-width: 1920px) 100vw, (max-width: 1200px) 100vw"
          className="object-contain"
          priority
        />
      ) : null}
    </Link>
  );
}
