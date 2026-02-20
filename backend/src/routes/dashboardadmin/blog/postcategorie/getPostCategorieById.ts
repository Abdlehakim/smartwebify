// routes/dashboardadmin/blog/postcategorie/getPostCategorieById.ts

import { Router, Request, Response } from "express";
import PostCategorie from "@/models/blog/PostCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/blog/postcategorie/:postCategorieId
 */
router.get(
  "/:postCategorieId",
  requirePermission("M_Blog"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postCategorieId } = req.params;
      const postCategorie = await PostCategorie
        .findById(postCategorieId)
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!postCategorie) {
        res.status(404).json({ success: false, message: "Post categorie not found." });
        return;
      }

      res.json({ postCategorie });
    } catch (err: unknown) {
      console.error("Fetch PostCategorie Error:", err);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
