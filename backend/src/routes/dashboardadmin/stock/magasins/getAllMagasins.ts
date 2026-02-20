//dashboardadmin/stock/getAllMagasins.ts


import { Router, Request, Response } from "express";
import Magasin from "@/models/stock/Magasin";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/magasins
 * Returns: name, image, phoneNumber, localisation, createdBy, createdAt
 */
router.get(
  "/",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const magasins = await Magasin.find()
        .select("name reference createdBy createdAt vadmin updatedBy updatedAt")
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ magasins });
    } catch (err) {
      console.error("Get Magasins Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
