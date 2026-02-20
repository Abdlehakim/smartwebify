// src/routes/dashboardadmin/blog/post/getAllPost.ts
import { Router, Request, Response } from 'express';
import Post, { PostModel } from '@/models/blog/Post';

/* ⭐  side-effect import registers the schema on mongoose */
import '@/models/blog/PostComment';   // <-- add this line

import { requirePermission } from '@/middleware/requireDashboardPermission';

const router = Router();

/**
 * GET /api/dashboardadmin/blog/post
 */
router.get(
  '/',
  requirePermission('M_Blog'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const posts = await Post.find()
        .select(
          'title reference slug vadmin createdAt updatedAt postCategorie postSubCategorie author createdBy updatedBy',
        )
        .populate('postCategorie', 'name')
        .populate('postSubCategorie', 'name')
        .populate('author', 'username')
        .populate('createdBy updatedBy', 'username')
        .sort({ createdAt: -1 })
        .lean();

      const postsWithCounts = await Promise.all(
        posts.map(async (p) => ({
          ...p,
          commentCount: await (Post as PostModel).commentCount(String(p._id)),
        })),
      );

      res.json({ posts: postsWithCounts });
    } catch (err) {
      console.error('Get Posts Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },
);

export default router;
