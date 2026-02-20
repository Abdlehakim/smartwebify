import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import Product from "@/models/stock/Product";
import Categorie from "@/models/stock/Categorie";
import SubCategorie from "@/models/stock/SubCategorie";
import Brand from "@/models/stock/Brand";
import Magasin from "@/models/stock/Magasin";

// If you don't use "@/..." path aliases, adjust the import paths above.

const router = Router();

const VALID_STATUS = new Set(["promotion", "new-products", "best-collection"]);

/** Helpers */
const toObjectId = (v?: string | null) =>
  v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

/* ------------------------------------------------------------------ */
/* GET /NavMenu/products/by-status                                    */
/* Query:
   - statuspage: "promotion" | "new-products" | "best-collection" (required)
   - limit (default 8, max 48)
   - skip (default 0)
   - categorie, subCat, brand, magasin (ObjectId strings)
   - priceMin, priceMax (numbers)
   - sort: "asc" | "desc" (price)
*/
/* ------------------------------------------------------------------ */
router.get("/by-status", async (req: Request, res: Response) => {
  try {
    const {
      statuspage,
      limit = "8",
      skip = "0",
      categorie,
      subCat,
      brand,
      magasin,
      priceMin,
      priceMax,
      sort = "asc",
    } = req.query as Record<string, string | undefined>;

    if (!statuspage || !VALID_STATUS.has(statuspage)) {
      return res.status(400).json({ error: "Invalid or missing statuspage." });
    }

    const _limit = clamp(parseInt(String(limit), 10) || 8, 1, 48);
    const _skip = Math.max(parseInt(String(skip), 10) || 0, 0);

    const filter: any = {
      statuspage,             // core filter
      vadmin: "approve",      // show approved products only
      // You can also gate stock here if desired:
      // stockStatus: "in stock",
    };

    const catId = toObjectId(categorie || undefined);
    const subId = toObjectId(subCat || undefined);
    const brandId = toObjectId(brand || undefined);
    const magasinId = toObjectId(magasin || undefined);

    if (catId) filter.categorie = catId;
    if (subId) filter.subcategorie = subId;
    if (brandId) filter.brand = brandId;
    if (magasinId) filter.magasin = magasinId;

    // Price range
    const min = priceMin ? Number(priceMin) : undefined;
    const max = priceMax ? Number(priceMax) : undefined;
    if (min !== undefined || max !== undefined) {
      filter.price = {};
      if (min !== undefined) filter.price.$gte = min;
      if (max !== undefined) filter.price.$lte = max;
    }

    // Sort by price asc/desc (fallback stable by _id)
    const sortSpec: any = { price: sort === "desc" ? -1 : 1, _id: 1 };

    const products = await Product.find(filter)
      .sort(sortSpec)
      .skip(_skip)
      .limit(_limit)
      .lean()
      .exec();

    res.json(products);
  } catch (err) {
    console.error("by-status error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

/* ------------------------------------------------------------------ */
/* GET /NavMenu/products/by-status/options
   Query:
   - statuspage: "promotion" | "new-products" | "best-collection" (required)
   Returns:
   - { categories: [{_id,name}], subcategories: [...], brands: [...], magasins: [...] }
*/
/* ------------------------------------------------------------------ */
router.get("/by-status/options", async (req: Request, res: Response) => {
  try {
    const { statuspage } = req.query as { statuspage?: string };
    if (!statuspage || !VALID_STATUS.has(statuspage)) {
      return res.status(400).json({ error: "Invalid or missing statuspage." });
    }

    const baseFilter = { statuspage, vadmin: "approve" };

    // distinct ids from products
    const [catIds, subIds, brandIds, magasinIds] = await Promise.all([
      Product.distinct("categorie", baseFilter),
      Product.distinct("subcategorie", { ...baseFilter, subcategorie: { $ne: null } }),
      Product.distinct("brand", { ...baseFilter, brand: { $ne: null } }),
      Product.distinct("magasin", { ...baseFilter, magasin: { $ne: null } }),
    ]);

    // load names from their collections
    const [categories, subcategories, brands, magasins] = await Promise.all([
      catIds.length ? Categorie.find({ _id: { $in: catIds } }, { name: 1 }).lean() : [],
      subIds.length ? SubCategorie.find({ _id: { $in: subIds } }, { name: 1 }).lean() : [],
      brandIds.length ? Brand.find({ _id: { $in: brandIds } }, { name: 1 }).lean() : [],
      magasinIds.length ? Magasin.find({ _id: { $in: magasinIds } }, { name: 1 }).lean() : [],
    ]);

    res.json({
      categories: categories.map((d: any) => ({ _id: d._id, name: d.name })),
      subcategories: subcategories.map((d: any) => ({ _id: d._id, name: d.name })),
      brands: brands.map((d: any) => ({ _id: d._id, name: d.name })),
      magasins: magasins.map((d: any) => ({ _id: d._id, name: d.name })),
    });
  } catch (err) {
    console.error("by-status/options error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
