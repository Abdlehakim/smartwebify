//dashboardadmin/stock/brands/getAllBrands
import { Router, Request, Response } from "express";
import Brand from "@/models/stock/Brand";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/brands
 * Returns all brands sorted by name.
 */
router.get(
  "/",
  requirePermission("M_Stock"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const brands = await Brand.find()
        .select("name reference createdBy createdAt vadmin updatedBy updatedAt")
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ brands });
    } catch (err) {
      console.error("Get Brands Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
