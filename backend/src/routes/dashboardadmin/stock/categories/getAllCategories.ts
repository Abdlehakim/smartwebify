//dashboardadmin/stock/getAllCategories.ts

import { Router, Request, Response } from "express";
import Categorie from "@/models/stock/Categorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/stock/categories
 * Returns all categories (current behavior preserved).
 */
router.get(
  "/",
  requirePermission("M_Stock"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const categories = await Categorie.find()
        .select(
          "name reference createdBy createdAt vadmin updatedBy updatedAt"
        )
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ categories });
    } catch (err) {
      console.error("Get Categories Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

/**
 * GET /api/dashboardadmin/stock/categories/cateSubcate
 * Returns categories (basic fields) + their related subcategories.
 */
router.get(
  "/cateSubcate",
  requirePermission("M_Stock"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const categories = await Categorie.aggregate([
        // keep category _id and name
        { $project: { _id: 1, name: 1 } },

        // join with subcategories and keep their _id and name
        {
          $lookup: {
            from: "subcategories",
            localField: "_id",
            foreignField: "categorie",
            as: "subcategories",
            pipeline: [
              { $project: { _id: 1, name: 1 } },
              { $sort: { name: 1 } },
            ],
          },
        },

        // sort categories by name and project final shape
        { $sort: { name: 1 } },
        { $project: { _id: 1, name: 1, subcategories: 1 } },
      ]);

      res.json({ categories });
    } catch (err) {
      console.error("Get Categories + Subcategories (id & name) Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);


export default router;
