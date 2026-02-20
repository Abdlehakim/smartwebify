// routes/dashboardadmin/stock/allproducts/getProductById.ts

import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/products/:productId
 */
router.get(
  "/:productId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      const product = await Product.findById(productId)
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!product) {
        res.status(404).json({ message: "Product not found." });
        return;
      }

      res.json(product);
    } catch (err) {
      console.error("Fetch Product Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
