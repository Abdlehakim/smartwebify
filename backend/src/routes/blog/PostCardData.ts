import { Router, Request, Response } from 'express';
import PostCategorie from '@/models/blog/PostCategorie';
import PostMainSection from '@/models/blog/Post';
import specialPageBanner from "@/models/websitedata/specialPageBanner";

const router = Router();

// GET /api/blog/PostCardData
router.get('/PostCardData', async (req: Request, res: Response): Promise<void> => {
    try {
      await PostCategorie.find({});
      const Posts = await PostMainSection.find({ vadmin: 'approve' }).select("title description imageUrl slug createdAt")
        .populate('postCategorie','name vadmin slug ')
        .exec();
      res.status(200).json(Posts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching Posts" });
    }
  });


// GET /api/blog/getBlogBannerData

router.get("/getBlogBannerData", async (req: Request, res: Response) => {
  try {
    const getBlogBannerData = await specialPageBanner
      .findOne()
      .select("BlogBannerTitle BlogBannerImgUrl")
      .lean();
    res.json(getBlogBannerData);
  } catch (err) {
    console.error("Error fetching getBlogBannerData:", err);
    res.status(500).json({ error: "Error fetching getBlogBannerData" });
  }
});
  export default router