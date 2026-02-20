// src/routes/brands.ts
import { Router, Request, Response } from "express";
import Brand from "@/models/stock/Brand";
import HomePageData from "@/models/websitedata/homePageData";

const router = Router();

/* ---------- helpers (Cloudinary-style) ---------- */
// Card banner area is ~wide and ~400px tall → crop to ~800×400 (retina via dpr_auto)
const toBrandBanner = (url?: string | null) =>
  url
    ? url.replace(
        "/upload/",
        "/upload/f_auto,q_auto,c_fill,g_auto,w_800,h_400,dpr_auto/"
      )
    : null;

// Logo shows inside a circle (~160–200px) → square 400×400 covers retina nicely
const toBrandLogo = (url?: string | null) =>
  url
    ? url.replace(
        "/upload/",
        "/upload/f_auto,q_auto,c_fill,g_auto,w_400,h_400,dpr_auto/"
      )
    : null;

// small LQIPs matching aspect
async function lqip(url: string, w: number, h: number) {
  const tiny = url.replace(
    "/upload/",
    `/upload/w_${w},h_${h},c_fill,g_auto,q_30/`
  );
  const r = await fetch(tiny);
  const b = Buffer.from(await r.arrayBuffer());
  return `data:image/jpeg;base64,${b.toString("base64")}`;
}

/* ------------------------------------------------------------------
 * GET /api/brands  — 5 randomized brands, optimized + LQIPs
 * ------------------------------------------------------------------ */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const sampleSize = 5;

    const sampledIds = await Brand.aggregate([
      { $match: { vadmin: "approve" } },
      { $sample: { size: sampleSize } },
    ]).then((docs) => docs.map((d) => d._id));

    const brands = await Brand.find({ _id: { $in: sampledIds } })
      .select("name place description imageUrl logoUrl")
      .lean();

    const result = await Promise.all(
      brands.map(async (b: any) => {
        const image = toBrandBanner(b.imageUrl) ?? "/fallback.jpg";
        const logo = toBrandLogo(b.logoUrl) ?? "/brand-logo-fallback.png";

        const imageBlur = image.startsWith("http")
          ? await lqip(image, 24, 12) // 800x400 aspect → 24x12
          : undefined;

        const logoBlur = logo.startsWith("http")
          ? await lqip(logo, 16, 16) // 400x400 aspect → 16x16
          : undefined;

        return {
          _id: b._id.toString(),
          name: b.name,
          place: b.place ?? null,
          description: b.description ?? null,
          imageUrl: image,
          imageBlur,
          logoUrl: logo,
          logoBlur,
        };
      })
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching random brands" });
  }
});

/* ------------------------------------------------------------------ */
router.get("/titles", async (_req: Request, res: Response): Promise<void> => {
  try {
    const brandTitles = await HomePageData.findOne()
      .select("HPbrandTitle HPbrandSubTitle -_id")
      .lean();
    res.json(brandTitles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching brand title data" });
  }
});

export default router;
