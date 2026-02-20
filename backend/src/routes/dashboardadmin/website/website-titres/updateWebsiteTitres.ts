// routes/dashboardadmin/website/websiteTitres/UpdateWebsiteTitres.ts

import { Router, Request, Response } from "express";
import WebsiteTitres, { IwebsiteTitres } from "@/models/websitedata/websiteTitres";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * PUT /api/dashboardadmin/website/updateWebsiteTitres/:id
 * — updates the WebsiteTitres document
 */
router.put(
  "/updateWebsiteTitres/:id",
  requirePermission("M_WebsiteData"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const userId = req.dashboardUser?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      const existing = await WebsiteTitres.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: "WebsiteTitres not found." });
        return;
      }

      const {
        SimilarProductTitre,
        SimilarProductSubTitre,
      } = req.body as Partial<IwebsiteTitres>;

      const updateData: Partial<IwebsiteTitres> = {};
      if (typeof SimilarProductTitre === "string")
        updateData.SimilarProductTitre = SimilarProductTitre.trim();
      if (typeof SimilarProductSubTitre === "string")
        updateData.SimilarProductSubTitre = SimilarProductSubTitre.trim();

      const updated = await WebsiteTitres.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, message: "WebsiteTitres not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "WebsiteTitres updated successfully.",
        websiteTitres: updated,
      });
    } catch (err: unknown) {
      console.error("Update WebsiteTitres Error:", err);

      if ((err as any).code === 11000) {
        res.status(400).json({
          success: false,
          message: "Duplicate value for a unique field.",
        });
        return;
      }

      if (
        err instanceof Error &&
        (err as any).name === "ValidationError" &&
        (err as any).errors
      ) {
        const msgs = Object.values((err as any).errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
        return;
      }

      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
