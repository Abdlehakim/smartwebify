// src/pages/api/dashboardadmin/stock/productattribute/getAllProductAttribute.ts
import { Router, Request, Response } from "express";
import ProductAttribute from "@/models/stock/ProductAttribute";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/productattribute/getAllProductAttribute
 * Returns all product attributes, sorted by creation date (newest first).
 */
router.get(
  "/",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const productAttributes = await ProductAttribute.find()
        .select("name type createdBy updatedBy createdAt updatedAt")
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, productAttributes });
    } catch (err) {
      console.error("Get ProductAttributes Error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
