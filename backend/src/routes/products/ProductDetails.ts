// src/routes/api/Products/ProductDetails.ts
import { Router, Request, Response, NextFunction } from "express";
import Product from "@/models/stock/Product";
import Brand from "@/models/stock/Brand";

const router = Router();

// GET /api/Products/ProductDetails/:id
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // optional cache-warm
      await Brand.find();

      // fetch only the fields your client needs
      const product = await Product.findOne({ slug: id, vadmin: "approve" })
        .select(
          [
            "description",
            "material",
            "dimensions",
            "color",
            "warranty",
            "weight",
            "brand",
          ].join(" ")
        )
        .populate("brand", "name")
        .lean();

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.status(200).json(product);
    } catch (err) {
      console.error("Error fetching Product:", err);
      next(err);
    }
  }
);

export default router;
