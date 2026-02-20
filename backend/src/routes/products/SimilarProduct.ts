// src/routes/api/products/SimilarProduct.ts
import { Router, Request, Response, NextFunction } from "express";
import Product from "@/models/stock/Product";

const router = Router();

// GET /api/products/SimilarProduct/Similar?categoryId=<id>&limit=4
router.get(
  "/Similar",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // — validate categoryId
      const rawCategoryId = req.query.categoryId;
      if (typeof rawCategoryId !== "string" || !rawCategoryId.trim()) {
        res.status(400).json({ error: "Missing or invalid categoryId parameter" });
        return;
      }
      const categoryId = rawCategoryId;

      // — parse limit
      const lim =
        typeof req.query.limit === "string" && !isNaN(+req.query.limit)
          ? Math.max(1, +req.query.limit)
          : 4;

      // — fetch
      const docs = await Product.find({
        categorie: categoryId,
        vadmin: "approve",
      })
        .select(
          [
            "name",
            "reference",
            "price",
            "tva",
            "discount",
            "stock",
            "slug",
            "mainImageUrl",
            "nbreview",
            "averageRating",
            "categorie",
            "brand",
            "magasin",
          ].join(" ")
        )
        .populate("categorie", "name slug")
        .populate("brand", "name")
        .populate("magasin", "name")
        .limit(lim)
        .lean();

      res.status(200).json(docs);
    } catch (err) {
      console.error("Error fetching similar products:", err);
      next(err);
    }
  }
);

export default router;
