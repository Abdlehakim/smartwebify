// routes/dashboardadmin/blog/postsubcategorie/deletePostSubCategorie.ts

import { Router, Request, Response } from "express";
import PostSubCategorie from "@/models/blog/PostSubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * DELETE /api/dashboardadmin/blog/postsubcategorie/delete/:postSubCategorieId
 * — deletes the PostSubCategorie document and any associated Cloudinary assets
 */
router.delete(
  "/delete/:postSubCategorieId",
  requirePermission("M_Blog"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postSubCategorieId } = req.params;

      // 1) remove the DB record (and grab its data)
      const deleted = await PostSubCategorie.findByIdAndDelete(postSubCategorieId);
      if (!deleted) {
        res.status(404).json({ message: "Post sub-categorie not found." });
        return;
      }

      // 2) delete banner from Cloudinary
      if (deleted.bannerId) {
        await cloudinary.uploader.destroy(deleted.bannerId).catch((e) => {
          console.error("Cloudinary banner deletion error:", e);
        });
      }

      // 3) delete main image
      if (deleted.imageId) {
        await cloudinary.uploader.destroy(deleted.imageId).catch((e) => {
          console.error("Cloudinary image deletion error:", e);
        });
      }

      // 4) delete icon
      if (deleted.iconId) {
        await cloudinary.uploader.destroy(deleted.iconId).catch((e) => {
          console.error("Cloudinary icon deletion error:", e);
        });
      }

      // 5) respond success
      res.json({ message: "Post sub-categorie and its images have been deleted." });
    } catch (err) {
      console.error("Delete post sub-categorie Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
