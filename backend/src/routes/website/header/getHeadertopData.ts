/// src/routes/website/header/getHeadertopData.ts

import { Router, Request, Response } from 'express';

import CompanyData from "@/models/websitedata/companyData";

const router = Router();

// GET /routes/website/header/getHeadertopData.ts
router.get('/getHeadertopData', async (req: Request, res: Response): Promise<void> => {
  try {
    const brandTitles = await CompanyData.findOne()
      .select("address city governorate zipcode phone email facebook linkedin instagram")
      .exec();
    res.json(brandTitles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching data" });
  }
});

export default router;