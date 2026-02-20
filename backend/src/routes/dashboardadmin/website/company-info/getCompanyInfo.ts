// routes/dashboardadmin/website/company-info/getCompanyInfo.ts

import { Router, Request, Response } from "express";
import CompanyData, { ICompanyData } from "@/models/websitedata/companyData";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/website/company-info/getCompanyInfo
 * — returns the single CompanyData document
 */
router.get(
  "/getCompanyInfo",
  requirePermission("M_WebsiteData"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // grab the single entry
      const info = await CompanyData.findOne().lean<ICompanyData>();

      if (!info) {
        res.status(404).json({
          success: false,
          message: "Company info not found. Please create it first.",
        });
        return;
      }

      res.json({
        success: true,
        companyInfo: info,
      });
    } catch (err: unknown) {
      console.error("Get CompanyInfo Error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

export default router;
