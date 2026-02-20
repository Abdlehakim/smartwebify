// src/components/GoogleIdentityLoader.tsx
"use client";

import Script from "next/script";

export default function GoogleIdentityLoader() {
  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="lazyOnload"
      onLoad={() => {}}
    />
  );
}
