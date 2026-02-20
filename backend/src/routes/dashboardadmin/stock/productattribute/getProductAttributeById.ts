// routes/dashboardadmin/stock/productattribute/getProductAttributeById.ts
import { Router, Request, Response } from "express";
import ProductAttribute from "@/models/stock/ProductAttribute";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/productattribute/:attributeId
 * — fetches a single ProductAttribute by its ID
 */
router.get(
  "/:attributeId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { attributeId } = req.params;
      const attribute = await ProductAttribute.findById(attributeId)
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!attribute) {
        res.status(404).json({ success: false, message: "Product attribute not found." });
        return;
      }

      res.json({ success: true, attribute });
    } catch (err) {
      console.error("Fetch ProductAttribute Error:", err);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
