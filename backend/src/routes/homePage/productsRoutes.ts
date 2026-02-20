// src/routes/homePage/products.ts
import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import HomePageData from "@/models/websitedata/homePageData";

const router = Router();

/* ───────────────────────── helpers (Cloudinary-style) ───────────────────────── */

/** Return a square, CDN-resized thumbnail suited for product cards (default 320x320). */
const toGridThumb = (url?: string | null, size = 320) =>
  url
    ? url.replace(
        "/upload/",
        `/upload/f_auto,q_auto,c_fill,g_auto,w_${size},h_${size},dpr_auto/`
      )
    : null;

/** Tiny 1:1 LQIP (blur) so images paint instantly. */
async function toBlur1x1(url: string) {
  const tiny = url.replace("/upload/", "/upload/w_16,h_16,c_fill,g_auto,q_30/");
  const r = await fetch(tiny);
  const b = Buffer.from(await r.arrayBuffer());
  return `data:image/jpeg;base64,${b.toString("base64")}`;
}

/** Shape a DB product into the API payload (image optimized; blur filled later). */
function shapeProduct(item: any) {
  const imageUrl = toGridThumb(item.mainImageUrl, 320) ?? "/fallback.jpg";
  return {
    _id: item._id.toString(),
    name: item.name,
    price: item.price,
    slug: item.slug,
    mainImageUrl: imageUrl,      // optimized 320×320 (retina via dpr_auto)
    mainImageBlur: undefined as string | undefined,
    status: item.stockStatus,
    discount: item.discount,
    tva: item.tva,
    reference: item.reference,
    categorie: item.categorie
      ? {
          _id: item.categorie._id.toString(),
          name: item.categorie.name,
          slug: item.categorie.slug,
        }
      : null,
    subcategorie: item.subcategorie
      ? {
          _id: item.subcategorie._id.toString(),
          name: item.subcategorie.name,
          slug: item.subcategorie.slug,
        }
      : null,
  };
}

/** Add blur placeholders in parallel. */
async function withBlur(products: ReturnType<typeof shapeProduct>[]) {
  return Promise.all(
    products.map(async (p) => ({
      ...p,
      mainImageBlur: p.mainImageUrl.startsWith("http")
        ? await toBlur1x1(p.mainImageUrl)
        : undefined,
    }))
  );
}

/** Consistent strong caching for lists on homepage. */
function cacheHeaders(res: Response) {
  res.setHeader(
    "Cache-Control",
    "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400"
  );
}

/* ───────────────────────────── Endpoints ───────────────────────────── */

/**
 * GET /api/products/NewProductsCollectionHomePage
 * Latest products flagged as "new-products" (max 8), with optimized images + LQIP.
 */
router.get(
  "/NewProductsCollectionHomePage",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const docs = await Product.find({
        vadmin: "approve",
        statuspage: "new-products",
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "_id name price mainImageUrl slug stockStatus discount reference tva"
        )
        .populate("categorie", "name slug")
        .populate("subcategorie", "name slug")
        .lean();

      const shaped = docs.map(shapeProduct);
      const result = await withBlur(shaped);
      cacheHeaders(res);
      res.json(result);
    } catch (err) {
      console.error("NewProductsCollectionHomePage Error:", err);
      res
        .status(500)
        .json({ error: "Error fetching latest new-products collection" });
    }
  }
);

/**
 * GET /api/products/productsCollectionPromotion
 * Latest products flagged as "promotion" (max 8), with optimized images + LQIP.
 */
router.get(
  "/productsCollectionPromotion",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const docs = await Product.find({
        vadmin: "approve",
        statuspage: "promotion",
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "_id name price mainImageUrl slug stockStatus discount reference tva"
        )
        .populate("categorie", "name slug")
        .populate("subcategorie", "name slug")
        .lean();

    const shaped = docs.map(shapeProduct);
    const result = await withBlur(shaped);
    cacheHeaders(res);
    res.json(result);
    } catch (err) {
      console.error("productsCollectionPromotion Error:", err);
      res
        .status(500)
        .json({ error: "Error fetching productsCollectionPromotion" });
    }
  }
);

/**
 * GET /api/products/productsBestCollection
 * Latest products flagged as "best-collection" (max 8), with optimized images + LQIP.
 */
router.get(
  "/productsBestCollection",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const docs = await Product.find({
        vadmin: "approve",
        statuspage: "best-collection",
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "_id name price mainImageUrl slug stockStatus discount reference tva"
        )
        .populate("categorie", "name slug")
        .populate("subcategorie", "name slug")
        .lean();

      const shaped = docs.map(shapeProduct);
      const result = await withBlur(shaped);
      cacheHeaders(res);
      res.json(result);
    } catch (err) {
      console.error("productsBestCollection Error:", err);
      res.status(500).json({ error: "Error fetching productsBestCollection" });
    }
  }
);

/* ───────────────────────────── Titles (unchanged) ───────────────────────────── */

router.get(
  "/ProductCollectionHomePageTitles",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const titles = await HomePageData.findOne()
        .select("HPNewProductTitle HPNewProductSubTitle")
        .lean();
      res.json(titles);
    } catch (err) {
      console.error("ProductCollectionHomePageTitles Error:", err);
      res
        .status(500)
        .json({ error: "Error fetching ProductCollectionHomePageTitles" });
    }
  }
);

router.get(
  "/BestProductHomePageTitles",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const titles = await HomePageData.findOne()
        .select("HPBestCollectionTitle HPBestCollectionSubTitle")
        .lean();
      res.json(titles);
    } catch (err) {
      console.error("BestProductHomePageTitles Error:", err);
      res
        .status(500)
        .json({ error: "Error fetching BestProductHomePageTitles" });
    }
  }
);

router.get(
  "/ProductPromotionHomePageTitles",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const titles = await HomePageData.findOne()
        .select("HPPromotionTitle HPPromotionSubTitle")
        .lean();
      res.json(titles);
    } catch (err) {
      console.error("ProductPromotionHomePageTitles Error:", err);
      res
        .status(500)
        .json({ error: "Error fetching ProductPromotionHomePageTitles" });
    }
  }
);

export default router;
