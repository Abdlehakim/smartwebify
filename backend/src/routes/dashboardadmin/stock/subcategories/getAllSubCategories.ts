// src/pages/api/dashboardadmin/stock/subcategories/getAllSubCategories.ts

import { Router, Request, Response } from "express";
import SubCategorie from "@/models/stock/SubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/subcategories
 * Optional query: ?categorie=<parentCategorieId> to filter by parent.
 * Returns all subcategories (or those belonging to a specific category), sorted by creation date.
 */
router.get(
  "/",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { categorie } = req.query as { categorie?: string };
      const filter = categorie ? { categorie } : {};

      const subCategories = await SubCategorie.find(filter)
        .select(
          "name reference createdBy createdAt vadmin updatedBy updatedAt"
        )
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ subCategories });
    } catch (err) {
      console.error("Get Sub-Categories Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
