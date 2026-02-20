// src/pages/api/dashboardadmin/stock/subcategories/delete.ts

import { Router, Request, Response } from "express";
import SubCategorie from "@/models/stock/SubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * DELETE /api/dashboardadmin/stock/subcategories/delete/:subCatId
 * — deletes the SubCategorie document and any associated Cloudinary assets
 */
router.delete(
  "/delete/:subCatId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subCatId } = req.params;

      // 1) remove the DB record (and grab its data)
      const deleted = await SubCategorie.findByIdAndDelete(subCatId);
      if (!deleted) {
        res.status(404).json({ message: "Sub-categorie not found." });
        return;
      }

      // 2) delete banner from Cloudinary
      if (deleted.bannerId) {
        try {
          await cloudinary.uploader.destroy(deleted.bannerId);
        } catch (cloudErr) {
          console.error("Cloudinary banner deletion error:", cloudErr);
          // continue even on error
        }
      }

      // 3) delete main image from Cloudinary
      if (deleted.imageId) {
        try {
          await cloudinary.uploader.destroy(deleted.imageId);
        } catch (cloudErr) {
          console.error("Cloudinary image deletion error:", cloudErr);
          // continue even on error
        }
      }

      // 4) delete icon from Cloudinary
      if (deleted.iconId) {
        try {
          await cloudinary.uploader.destroy(deleted.iconId);
        } catch (cloudErr) {
          console.error("Cloudinary icon deletion error:", cloudErr);
          // continue even on error
        }
      }

      // 5) respond success
      res.json({ message: "Sub-categorie and its images have been deleted." });
    } catch (err) {
      console.error("Delete Sub-Categorie Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
