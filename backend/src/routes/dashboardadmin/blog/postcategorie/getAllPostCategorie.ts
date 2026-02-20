//dashboardadmin/blog/postCategorie/getAllPostCategorie.ts

import { Router, Request, Response } from "express";
import PostCategorie from "@/models/blog/PostCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/blog/postCategorie/getAlLPostCategorie.ts
 * Returns all PostCategories sorted by name.
 */
router.get(
  "/",
  requirePermission("M_Blog"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const PostCategories = await PostCategorie.find()
        .select(
          "name reference createdBy createdAt vadmin updatedBy updatedAt"
        )
        .populate("createdBy updatedBy", "username")
        .sort({createdAt: -1})
        .lean();

      res.json({ PostCategories });
    } catch (err) {
      console.error("Get PostCategories Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
