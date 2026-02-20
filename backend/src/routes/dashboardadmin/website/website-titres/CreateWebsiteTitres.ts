// routes/dashboardadmin/website/websiteTitres/CreateWebsiteTitres.ts

import { Router, Request, Response } from "express";
import WebsiteTitres, { IwebsiteTitres } from "@/models/websitedata/websiteTitres";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * POST /api/dashboardadmin/website/createWebsiteTitres
 * — creates the single WebsiteTitres document
 */
router.post(
  "/createWebsiteTitres",
  requirePermission("M_WebsiteData"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Prevent more than one document
      const count = await WebsiteTitres.estimatedDocumentCount();
      if (count > 0) {
        res.status(400).json({
          success: false,
          message: "WebsiteTitres already exists. Please update the existing entry.",
        });
        return;
      }

      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const {
        SimilarProductTitre = "",
        SimilarProductSubTitre = "",
      } = req.body as Partial<IwebsiteTitres>;

      if (!SimilarProductTitre?.trim() || !SimilarProductSubTitre?.trim()) {
        res.status(400).json({
          success: false,
          message: "Both SimilarProductTitre and SimilarProductSubTitre are required.",
        });
        return;
      }

      const created = await WebsiteTitres.create({
        SimilarProductTitre: SimilarProductTitre.trim(),
        SimilarProductSubTitre: SimilarProductSubTitre.trim(),
      });

      res.status(201).json({
        success: true,
        message: "WebsiteTitres created successfully.",
        websiteTitres: created,
      });
    } catch (err: unknown) {
      console.error("Create WebsiteTitres Error:", err);

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

      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Internal server error.",
      });
    }
  }
);

export default router;
