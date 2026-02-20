// src/routes/NavMenu/categoriesRoutes.ts
import { Router, Request, Response } from "express";
import Categorie from "@/models/stock/Categorie";
import SubCategorie from "@/models/stock/SubCategorie";
import HomePageData from "@/models/websitedata/homePageData";

const router = Router();

/** Turn a Cloudinary (or similar) URL into a small, square thumbnail */
function toGridThumb(url?: string | null) {
  if (!url) return null;
  // Cloudinary: square 256x256, crop fill, auto format/quality, device DPR
  return url.replace(
    "/upload/",
    "/upload/f_auto,q_auto,c_fill,g_auto,w_256,h_256,dpr_auto/"
  );
}

/** Tiny image for blur placeholder (very small), base64 data URL */
async function toBlurDataURL(imgUrl: string): Promise<string> {
  // 24x24 is enough for a good blur; keep it JPEG & low quality
  const tiny = imgUrl.replace(
    "/upload/",
    "/upload/w_24,h_24,c_fill,g_auto,q_30/"
  );
  const r = await fetch(tiny);
  const buf = Buffer.from(await r.arrayBuffer());
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/* ================================================================== */
/*  GET /api/categories  (home page – limited to 6)                   */
/* ================================================================== */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const cats = await Categorie.find({ vadmin: "approve" })
      .select("_id name slug imageUrl iconUrl")
      .limit(6)
      .populate("productCount")
      .lean();

    // Build optimized payload in parallel
    const data = await Promise.all(
      cats.map(async (cat: any) => {
        const imageOptimized = toGridThumb(cat.imageUrl) ?? "/fallback.jpg";
        const blurDataURL =
          imageOptimized.startsWith("http")
            ? await toBlurDataURL(imageOptimized)
            : undefined;

        return {
          _id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          iconUrl: cat.iconUrl ?? null,
          numberproduct: cat.productCount ?? 0,
          imageUrl: imageOptimized,
          blurDataURL, // NEW
        };
      })
    );

    // Strong caching for CDN & browser
    res.setHeader(
      "Cache-Control",
      "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(data);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Error fetching categories" });
  }
});

/* ================================================================== */
/*  GET /api/categories/getAll (same shape, no limit)                 */
/* ================================================================== */
router.get("/getAll", async (_req: Request, res: Response) => {
  try {
    const cats = await Categorie.find({ vadmin: "approve" })
      .select("_id name slug imageUrl iconUrl")
      .populate("productCount")
      .lean();

    const data = await Promise.all(
      cats.map(async (cat: any) => {
        const imageOptimized = toGridThumb(cat.imageUrl) ?? "/fallback.jpg";
        const blurDataURL =
          imageOptimized.startsWith("http")
            ? await toBlurDataURL(imageOptimized)
            : undefined;

        return {
          _id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          iconUrl: cat.iconUrl ?? null,
          numberproduct: cat.productCount ?? 0,
          imageUrl: imageOptimized,
          blurDataURL,
        };
      })
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(data);
  } catch (err) {
    console.error("Error fetching all categories:", err);
    res.status(500).json({ error: "Error fetching all categories" });
  }
});


/* ================================================================== */
/*  GET /api/categories/getAllName                                    */
/* ================================================================== */
router.get("/getAllName", async (req: Request, res: Response) => {
  try {
    const docs = await Categorie.aggregate([
      { $match: { vadmin: "approve" } },
      { $project: { name: 1, slug: 1 } },
      {
        $lookup: {
          from: SubCategorie.collection.name,
          let: { catId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$categorie", "$$catId"] },
                    { $eq: ["$vadmin", "approve"] },
                  ],
                },
              },
            },
            { $project: { name: 1, slug: 1 } },
          ],
          as: "subcategories",
        },
      },
    ]);

    const result = docs.map((cat: any) => ({
      name: cat.name,
      slug: cat.slug,
      subcategories: (cat.subcategories || []).map((s: any) => ({
        name: s.name,
        slug: s.slug,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching category names:", err);
    res.status(500).json({ error: "Error fetching category names" });
  }
});





/*
================================================================== */
/*  GET /api/categories/:id/subcategories                              */
/* ================================================================== */
router.get('/:id/subcategories', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subs = await SubCategorie.find({ categorie: id, vadmin: 'approve' })
      .select('_id name slug bannerUrl iconUrl imageUrl')
      .lean();

    const result = subs.map((sub: any) => ({
      _id:       sub._id.toString(),
      name:      sub.name,
      slug:      sub.slug,
      bannerUrl: sub.bannerUrl || null,
      iconUrl:   sub.iconUrl   || null,
      imageUrl:  sub.imageUrl  || null,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ error: 'Error fetching subcategories' });
  }
});


/* ================================================================== */
/*  GET /api/categories/title                                          */
/* ================================================================== */
router.get('/title', async (_req: Request, res: Response) => {
  try {
    const titleCategorie = await HomePageData
      .findOne()
      .select('HPcategorieTitle HPcategorieSubTitle')
      .lean();

    res.json(titleCategorie);
  } catch (err) {
    console.error('Error fetching title categorie:', err);
    res.status(500).json({ error: 'Error fetching title categorie' });
  }
});

export default router;
