
/*  src/routes/NavMenu/ProductPromotion.ts                                                                    
/* ------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import SpecialPageBanner from "@/models/websitedata/specialPageBanner";

const router = Router();


router.get(
  "/getProductPromotionBannerData",
  async (_req: Request, res: Response) => {
    try {
      const doc = await SpecialPageBanner.findOne()
        .select("PromotionBannerImgUrl PromotionBannerTitle")
        .lean();
      res.json(doc);
    } catch (err) {
      console.error("Error fetching banner:", err);
      res.status(500).json({ error: "Error fetching banner" });
    }
  }
);

export default router;
