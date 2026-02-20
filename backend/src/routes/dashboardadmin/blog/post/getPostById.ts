// routes/dashboardadmin/blog/posts/getPostById.ts

import { Router, Request, Response } from 'express';
import Post from '@/models/blog/Post';
import { requirePermission } from '@/middleware/requireDashboardPermission';

const router = Router();

/**
 * GET /api/dashboardadmin/blog/posts/:postId
 * Returns a single Post with populated references.
 */
router.get(
  '/:postId',
  requirePermission('M_Blog'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId)
        .populate('postCategorie', 'name')
        .populate('postSubCategorie', 'name')
        .populate('author', 'username')
        .populate('createdBy updatedBy', 'username')
        .lean();

      if (!post) {
        res
          .status(404)
          .json({ success: false, message: 'Post not found.' });
        return;
      }

      res.json({ post });
    } catch (err: unknown) {
      console.error('Fetch Post Error:', err);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error.' });
    }
  },
);

export default router;
