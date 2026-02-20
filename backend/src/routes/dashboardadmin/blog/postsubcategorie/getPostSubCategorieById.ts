// routes/dashboardadmin/blog/postsubcategorie/getPostSubcategorieById.ts

import { Router, Request, Response } from "express";
import PostSubCategorie from "@/models/blog/PostSubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/blog/postsubcategorie/:postSubcategorieId
 */
router.get(
  "/:postSubcategorieId",
  requirePermission("M_Blog"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postSubcategorieId } = req.params;
      const postSubCategorie = await PostSubCategorie
        .findById(postSubcategorieId)
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!postSubCategorie) {
        res.status(404).json({ success: false, message: "Post sub-category not found." });
        return;
      }

      res.json({ postSubCategorie });
    } catch (err) {
      console.error("Fetch PostSubCategory Error:", err);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
