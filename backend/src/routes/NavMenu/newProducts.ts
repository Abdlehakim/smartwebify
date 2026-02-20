import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";

import specialPageBanner from "@/models/websitedata/specialPageBanner";

const router = Router();


// GET /api/NavMenu/NewProducts/getNewProductsBannerData
router.get("/getNewProductsBannerData", async (req: Request, res: Response) => {
  try {
    const getNewProductsBannerData = await specialPageBanner
      .findOne()
      .select("NPBannerImgUrl NPBannerTitle")
      .lean();
    res.json(getNewProductsBannerData);
  } catch (err) {
    console.error("Error fetching getNewProductsBannerData:", err);
    res.status(500).json({ error: "Error fetching getNewProductsBannerData" });
  }
});

export default router;
