// routes/dashboardadmin/blog/postcategorie/deletePostCategorie.ts

import { Router, Request, Response } from "express";
import PostCategorie from "@/models/blog/PostCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * DELETE /api/dashboardadmin/blog/postcategorie/delete/:postCategorieId
 * — deletes the PostCategorie document and any associated Cloudinary assets
 */

router.delete(
  "/delete/:postCategorieId",
  requirePermission("M_Blog"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postCategorieId } = req.params;

      // 1) remove the DB record (and grab its data)
      const deleted = await PostCategorie.findByIdAndDelete(postCategorieId);
      if (!deleted) {
        res.status(404).json({ message: "Post categorie not found." });
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
      res.json({ message: "Post categorie and its images have been deleted." });
    } catch (err) {
      console.error("Delete post categorie Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
