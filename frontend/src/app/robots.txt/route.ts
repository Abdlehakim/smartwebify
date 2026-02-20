// src/app/robots.txt/route.ts
import { NextResponse } from "next/server";

// optional: run on the Edge runtime
export const runtime = "edge";

export function GET() {
  return new NextResponse(
    `
User-agent: *
Allow: /

Sitemap: https://soukelmeuble.tn/sitemap.xml
Host: https://soukelmeuble.tn
`.trim(),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
