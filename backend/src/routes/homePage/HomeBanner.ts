// src/routes/homePage/HomeBanner.ts
import { Router, Request, Response } from 'express';
import HomePageData from "@/models/websitedata/homePageData";

const router = Router();

async function getBlurDataURL(imgUrl: string) {
  // tiny transformed image (e.g., Cloudinary)
  const tinyUrl = imgUrl.replace('/upload/', '/upload/w_24,h_6,c_fill,q_30/');
  const r = await fetch(tinyUrl); // ← native fetch from Node 22
  const buf = Buffer.from(await r.arrayBuffer());
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const websiteInfo = await HomePageData.findOne()
      .select("HPbannerTitle HPbannerImgUrl")
      .lean()
      .exec();

    if (!websiteInfo) {
      res.status(404).json({ error: 'No website info found' });
      return;
    }

    const optimizedUrl = websiteInfo.HPbannerImgUrl
      .replace('/upload/', '/upload/f_auto,q_auto,c_fill,w_1536,h_384,dpr_auto/');

    const blur = await getBlurDataURL(optimizedUrl);

    res.setHeader('Cache-Control',
      'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');

    res.json({
      HPbannerTitle: websiteInfo.HPbannerTitle,
      HPbannerImgUrl: optimizedUrl,
      HPbannerBlur: blur,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching website info' });
  }
});

export default router;
