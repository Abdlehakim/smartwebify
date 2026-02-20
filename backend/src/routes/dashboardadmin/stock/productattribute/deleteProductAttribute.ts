// src/pages/api/dashboardadmin/stock/productattribute/deleteProductAttribute.ts
import { Router, Request, Response } from "express";
import ProductAttribute from "@/models/stock/ProductAttribute";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * DELETE /api/dashboardadmin/stock/productattribute/delete/:attributeId
 * — deletes the ProductAttribute document by ID
 */
router.delete(
  "/delete/:attributeId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { attributeId } = req.params;

      // remove the document
      const deleted = await ProductAttribute.findByIdAndDelete(attributeId);
      if (!deleted) {
        res.status(404).json({ message: "Product attribute not found." });
        return;
      }

      res.json({ message: "Product attribute deleted successfully." });
    } catch (err) {
      console.error("Delete ProductAttribute Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
