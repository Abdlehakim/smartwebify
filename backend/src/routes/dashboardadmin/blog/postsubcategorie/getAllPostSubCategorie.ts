// routes/dashboardadmin/blog/postsubcategorie/getAllPostSubCategorie.ts

import { Router, Request, Response } from "express";
import PostSubCategorie from "@/models/blog/PostSubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/blog/postsubcategorie
 * Returns all PostSubCategories sorted by creation date (newest first).
 */
router.get(
  "/",
  requirePermission("M_Blog"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const PostSubCategories = await PostSubCategorie.find()
        .select(
          "name postCategorie  reference createdBy createdAt vadmin updatedBy updatedAt"
        )
        .populate("createdBy updatedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ PostSubCategories });
    } catch (err) {
      console.error("Get PostSubCategories Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
