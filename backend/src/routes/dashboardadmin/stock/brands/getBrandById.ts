// routes/dashboardadmin/stock/brands/getBrandById.ts

import { Router, Request, Response } from "express";
import Brand from "@/models/stock/Brand";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/brands/:brandId
 */
router.get(
  "/:brandId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { brandId } = req.params;
      const brand = await Brand.findById(brandId).populate("createdBy updatedBy", "username").lean();
      if (!brand) {
        res.status(404).json({ message: "Brand not found." });
        return;
      }
      res.json(brand);
    } catch (err) {
      console.error("Fetch Brand Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
