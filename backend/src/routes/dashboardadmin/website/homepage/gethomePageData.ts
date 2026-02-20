// routes/dashboardadmin/website/homepage/gethomePageData.ts

import { Router, Request, Response } from "express";
import homePageData from "@/models/websitedata/homePageData";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/homepage/gethomePageData
 * — returns all homePageData documents
 */
router.get(
  "/gethomePageData",
  requirePermission("M_WebsiteData"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const allData = await homePageData.find().sort({ createdAt: -1 });
      res.json({
        success: true,
        homePageData: allData,
      });
    } catch (err: unknown) {
      console.error("Get HomePageData Error:", err);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
