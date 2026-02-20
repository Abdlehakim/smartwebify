// routes/dashboardadmin/blog/postsubcategorie/getPostSubCategorieByParent.ts

import { Router, Request, Response } from "express";
import PostSubCategorie from "@/models/blog/PostSubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/blog/postsubcategorie/byParent/:parentId
 * Returns only the sub-categories belonging to the given parent category.
 */
router.get(
  "/byParent/:parentId",
  requirePermission("M_Blog"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId } = req.params;

      const PostSubCategories = await PostSubCategorie.find({
        postCategorie: parentId,
      })
        .select(
          "name postCategorie reference createdBy createdAt vadmin updatedBy updatedAt"
        )
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ PostSubCategories });
    } catch (err) {
      console.error("Get PostSubCategories by parent Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
