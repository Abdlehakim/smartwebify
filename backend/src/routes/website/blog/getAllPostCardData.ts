// src/routes/website/blog/getAllPostCardData.ts
import { Router, Request, Response } from 'express';
import Post from '@/models/blog/Post';
import '@/models/blog/PostCategorie';   
import '@/models/blog/PostSubCategorie';   

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const posts = await Post.find({ vadmin: 'approve' })
      .select('title description imageUrl slug createdAt postCategorie postSubCategorie')
      .populate([
        { path: 'postCategorie', select: 'slug' },
        { path: 'postSubCategorie', select: 'slug' }
      ])
      .sort({ createdAt: -1 })
      .lean();

    const payload = posts.map((p: any) => ({
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      slug: p.slug,
      createdAt: p.createdAt,
      postCategorie: {
        slug: p.postCategorie?.slug || '',
      },
      postSubCategorie: {
        slug: p.postSubCategorie?.slug || '',
      },
    }));

    res.json(payload);
  } catch (err) {
    console.error('Get Post Card Data Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
