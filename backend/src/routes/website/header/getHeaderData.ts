/// src/routes/website/header/getHeaderData.ts

import { Router, Request, Response } from 'express';

import CompanyData from "@/models/websitedata/companyData";

const router = Router();

// GET /routes/website/header/getHeaderData
router.get('/getHeaderData', async (req: Request, res: Response): Promise<void> => {
  try {
    const brandTitles = await CompanyData.findOne()
      .select("name logoImageUrl phone address city zipcode governorate")
      .exec();
    res.json(brandTitles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching data" });
  }
});

export default router;