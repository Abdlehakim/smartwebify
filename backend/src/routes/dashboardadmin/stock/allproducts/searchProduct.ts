// src/routes/dashboardadmin/stock/allproducts/searchProduct.ts
import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* GET /api/dashboardadmin/stock/products/find?q=something */

router.get(
  "/find",
  requirePermission("M_Stock"),
  async (req: Request, res: Response) => {
    try {
      const q  = String(req.query.q || "").trim();
      const rx = q.length >= 2 ? new RegExp(q, "i") : /.^/;

      const products = await Product.find({
        $or: [{ name: rx }, { reference: rx }],
      })
        .select(
          "name reference price tva discount stockStatus attributes"
        )
        /* 🌟  AJOUT : on peuple le nom de l’attribut  */
        .populate({
          path: "attributes.attributeSelected",
          select: "name",          // on n’a besoin que du nom
          model: "ProductAttribute",
        })
        .limit(20)
        .sort({ createdAt: -1 })
        .lean();

      res.json({ products });
    } catch (err) {
      console.error("Product‑find error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


export default router;
