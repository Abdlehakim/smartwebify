// routes/dashboardadmin/website/websiteTitres/GetWebsiteTitres.ts

import { Router, Request, Response } from "express";
import WebsiteTitres from "@/models/websitedata/websiteTitres";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/website/getWebsiteTitres
 * — returns all WebsiteTitres docs (newest first)
 */
router.get(
  "/getWebsiteTitres",
  requirePermission("M_WebsiteData"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const docs = await WebsiteTitres.find().sort({ createdAt: -1 });
      res.json({ success: true, websiteTitres: docs });
    } catch (err) {
      console.error("Get WebsiteTitres Error:", err);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
