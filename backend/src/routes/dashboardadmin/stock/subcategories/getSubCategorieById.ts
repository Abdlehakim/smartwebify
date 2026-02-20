// routes/dashboardadmin/stock/subcategories/getSubCategorieById.ts

import { Router, Request, Response } from "express";
import SubCategorie from "@/models/stock/SubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/subcategories/:subCatId
 */
router.get(
  "/:subCatId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subCatId } = req.params;
      const subCategorie = await SubCategorie
        .findById(subCatId)
        .populate("categorie", "name")            // populate parent category name
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!subCategorie) {
        res.status(404).json({ message: "Sub-categorie not found." });
        return;
      }

      res.json(subCategorie);
    } catch (err) {
      console.error("Fetch Sub-Categorie Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
