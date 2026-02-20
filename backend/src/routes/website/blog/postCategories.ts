// src/routes/website/blog/postCategories.ts

import { Router, Request, Response } from 'express';
import PostCategorie from '@/models/blog/PostCategorie';
import PostSubCategorie from '@/models/blog/PostSubCategorie';
import specialPageBanner from "@/models/websitedata/specialPageBanner";

const router = Router();

// GET /api/postCategories
// Returns only approved post categories that have at least one approved sub‐category,
// including an explicit subCategorieCount and imageUrl for each.
router.get('/postCategories', async (_req: Request, res: Response) => {
  try {
    const cats = await PostCategorie
      .find({ vadmin: 'approve' })
      .select('_id name slug imageUrl')
      .lean();

    const withSubs = await Promise.all(
      cats.map(async cat => {
        const subs = await PostSubCategorie
          .find({ postCategorie: cat._id, vadmin: 'approve' })
          .select('_id name slug')
          .lean();

        return {
          _id:               cat._id.toString(),
          name:              cat.name,
          slug:              cat.slug,
          imageUrl:          cat.imageUrl || null,
          subCategorieCount: subs.length,
          subcategories:     subs.map(sub => ({
            _id:  sub._id.toString(),
            name: sub.name,
            slug: sub.slug,
          })),
        };
      })
    );
    const result = withSubs.filter(cat => cat.subCategorieCount > 0);

    res.json(result);
  } catch (err) {
    console.error('Error fetching post categories:', err);
    res.status(500).json({ error: 'Error fetching post categories' });
  }
});

export default router;
