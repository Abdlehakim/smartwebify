import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import specialPageBanner from "@/models/websitedata/specialPageBanner";

const router = Router();

// GET /api/NavMenu/BestProductCollection/getBestProductBannerData
router.get("/getBestProductBannerData", async (req: Request, res: Response) => {
  try {
    const getBestProductBannerData = await specialPageBanner
      .findOne()
      .select("BCbannerTitle BCbannerImgUrl")
      .lean();
    res.json(getBestProductBannerData);
  } catch (err) {
    console.error("Error fetching getBestProductBannerData:", err);
    res.status(500).json({ error: "Error fetching getBestProductBannerData" });
  }
});

export default router;
