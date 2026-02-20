//dashboardadmin/stock/brands/delete.ts

import { Router, Request, Response } from "express";
import Brand from "@/models/stock/Brand";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * DELETE /api/dashboardadmin/stock/brands/delete/:brandId
 * — deletes the Brand document and any associated Cloudinary assets
 */
router.delete(
  "/delete/:brandId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { brandId } = req.params;

      // 1) remove the DB record (and grab its data)
      const deleted = await Brand.findByIdAndDelete(brandId);
      if (!deleted) {
        res.status(404).json({ message: "Brand not found." });
        return;
      }

      // 2) delete main image from Cloudinary
      if (deleted.imageId) {
        try {
          await cloudinary.uploader.destroy(deleted.imageId);
        } catch (cloudErr) {
          console.error("Cloudinary image deletion error:", cloudErr);
          // continue even on error
        }
      }

      // 3) delete logo from Cloudinary
      if (deleted.logoId) {
        try {
          await cloudinary.uploader.destroy(deleted.logoId);
        } catch (cloudErr) {
          console.error("Cloudinary logo deletion error:", cloudErr);
          // continue even on error
        }
      }

      // 4) respond success
      res.json({ message: "Brand and its images have been deleted." });
    } catch (err) {
      console.error("Delete Brand Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
