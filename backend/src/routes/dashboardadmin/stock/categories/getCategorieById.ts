// routes/dashboardadmin/stock/categories/getCategorieById.ts

import { Router, Request, Response } from "express";
import Categorie from "@/models/stock/Categorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/categories/:categorieId
 */
router.get(
  "/:categorieId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { categorieId } = req.params;
      const categorie = await Categorie
        .findById(categorieId)
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!categorie) {
        res.status(404).json({ message: "Categorie not found." });
        return;
      }

      res.json(categorie);
    } catch (err) {
      console.error("Fetch Categorie Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
