/* ------------------------------------------------------------------ */
/*  src/routes/NavMenu/categorieSubCategoriePage.ts                   */
/*  (FULL FILE — now includes /allSlugs endpoint)                     */
/* ------------------------------------------------------------------ */
import { Router } from "express";
import { Types }  from "mongoose";

import Categorie    from "@/models/stock/Categorie";
import Subcategorie from "@/models/stock/SubCategorie";
import Product      from "@/models/stock/Product";
import Brand        from "@/models/stock/Brand";
import Magasin     from "@/models/stock/Magasin";

const router = Router();

/* ------------------------------------------------------------------ */
/*  helper — locate either a catégorie or a sub-cat by its slug       */
/* ------------------------------------------------------------------ */
async function findSectionBySlug(slug: string) {
  const doc = await Subcategorie.aggregate([
    { $match: { slug, vadmin: "approve" } },
    {
      $lookup: {
        from: "categories",
        localField: "categorie",
        foreignField: "_id",
        pipeline: [{ $project: { bannerUrl: 1 } }],
        as: "parent",
      },
    },
    { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        bannerUrl: "$parent.bannerUrl",
      },
    },
    { $limit: 1 },
  ]);

  if (doc.length) return doc[0];

  // fallback → catégorie
  return Categorie.findOne({ slug, vadmin: "approve" })
    .select("_id name slug bannerUrl")
    .lean();
}

/* ------------------------------------------------------------------ */
/*  NEW:  GET /api/NavMenu/categorieSubCategoriePage/allSlugs         */
/*  Returns a flat array of every approved catégorie & sub-cat slug   */
/* ------------------------------------------------------------------ */
router.get("/allSlugs", async (_req, res) => {
  try {
    const [cats, subs] = await Promise.all([
      Categorie.find({ vadmin: "approve" }).select("slug -_id").lean<{ slug: string }[]>(),
      Subcategorie.find({ vadmin: "approve" }).select("slug -_id").lean<{ slug: string }[]>(),
    ]);

    // dedupe in case a slug exists in both collections (unlikely but safe)
    const allSlugs = Array.from(
      new Set([...cats, ...subs].map((d) => d.slug))
    );

    res.json(allSlugs);
  } catch (err) {
    console.error("Error fetching slugs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/NavMenu/categorieSubCategoriePage/:slug                  */
/* ------------------------------------------------------------------ */
router.get("/:slug", async (req, res) => {
  try {
    const section = await findSectionBySlug(req.params.slug);
    if (!section) {
      res.status(404).json({ error: "Category or subcategory not found" });
      return;
    }
    res.json(section);
  } catch (err) {
    console.error("Error fetching section:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/NavMenu/categorieSubCategoriePage/categorie/:categorieId */
/* ------------------------------------------------------------------ */
router.get("/categorie/:categorieId", async (req, res) => {
  try {
    const subs = await Subcategorie.find({
      categorie: req.params.categorieId,
      vadmin: "approve",
    })
      .select("name slug")
      .lean<{ _id: Types.ObjectId; name: string; slug: string }[]>()
      .exec();

    res.json(subs);
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/NavMenu/categorieSubCategoriePage/products/:slug         */
/*  filters + pagination + effective price (price - %discount)        */
/* ------------------------------------------------------------------ */
router.get("/products/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 8);
    const skip  = Math.max(0, parseInt(req.query.skip  as string, 10) || 0);

    const {
      brand,
      magasin,
      subCat,
      priceMin,
      priceMax,
      sort = "asc",
    } = req.query as Record<string, string>;

    const section = await findSectionBySlug(slug);
    if (!section) {
      res.status(404).json({ error: "Category or subcategory not found" });
      return;
    }

    /* -------------------------------------------------------------- */
    /*  ➋ build $match with explicit ObjectId casting                  */
    /* -------------------------------------------------------------- */
    const match: any = {
      $or: [{ categorie: section._id }, { subcategorie: section._id }],
      vadmin: "approve",
    };

    if (brand)    match.brand        = new Types.ObjectId(brand);
    if (magasin) match.magasin     = new Types.ObjectId(magasin);
    if (subCat)   match.subcategorie = new Types.ObjectId(subCat);

    /* … rest of the aggregation pipeline stays identical … */
    const pipeline: any[] = [
      { $match: match },
      {
        $addFields: {
          effectivePrice: {
            $subtract: [
              "$price",
              { $multiply: ["$price", { $divide: ["$discount", 100] }] },
            ],
          },
        },
      },
    ];
    
    if (priceMin || priceMax) {
      const range: any = {};
      if (priceMin) range.$gte = Number(priceMin);
      if (priceMax) range.$lte = Number(priceMax);
      pipeline.push({ $match: { effectivePrice: range } });
    }

    pipeline.push(
      { $sort: { effectivePrice: sort === "desc" ? -1 : 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          tva: 1,
          slug: 1,
          price: 1,
          discount: 1,
          stockStatus: 1,
          mainImageUrl: 1,
          reference: 1,
          categorie: 1,
          subcategorie: 1,
          brand: 1,
          magasin: 1,
        },
      },
      { $lookup: { from: "categories",  localField: "categorie",   foreignField: "_id", as: "categorie" } },
      { $unwind: { path: "$categorie",  preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "subcategories", localField: "subcategorie", foreignField: "_id", as: "subcategorie" } },
      { $unwind: { path: "$subcategorie", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "brands",      localField: "brand",      foreignField: "_id", as: "brand" } },
      { $unwind: { path: "$brand",      preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "magasins",   localField: "magasin",   foreignField: "_id", as: "magasin" } },
      { $unwind: { path: "$magasin",   preserveNullAndEmptyArrays: true } }
    );
    const products = await Product.aggregate(pipeline).exec();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/NavMenu/categorieSubCategoriePage/products/:slug/options */
/* ------------------------------------------------------------------ */
router.get("/products/:slug/options", async (req, res) => {
  try {
    const { slug } = req.params;

    const section = await findSectionBySlug(slug);
    if (!section) {
      res.status(404).json({ error: "Category or subcategory not found" });
      return;
    }

    const match = {
      $or: [{ categorie: section._id }, { subcategorie: section._id }],
      vadmin: "approve",
    };

    const [brandIds, magasinIds, subCatIds] = await Promise.all([
      Product.distinct("brand",        match),
      Product.distinct("magasin",     match),
      Product.distinct("subcategorie", match),
    ]);

    const [brands, magasins, subcategories] = await Promise.all([
      Brand.find({ _id: { $in: brandIds } }).select("_id name").lean(),
      Magasin.find({ _id: { $in: magasinIds } }).select("_id name").lean(),
      Subcategorie.find({ _id: { $in: subCatIds } }).select("_id name").lean(),
    ]);

    res.json({ brands, magasins, subcategories });
  } catch (err) {
    console.error("Error fetching product options:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
