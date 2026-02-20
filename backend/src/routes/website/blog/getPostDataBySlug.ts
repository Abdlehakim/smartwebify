// src/routes/website/blog/getPostDataBySlug.ts

import { Router, Request, Response } from 'express';
import Post, { IPost } from '@/models/blog/Post';
import '@/models/blog/PostCategorie';
import '@/models/blog/PostSubCategorie';

const router = Router();

/**
 * GET api/blog/getPostDataBySlug/:postSlug
 * Public endpoint to fetch one approved post by its slug
 */
router.get(
  '/getPostDataBySlug/:postSlug',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postSlug } = req.params;

      // find the approved post
      const post = await Post.findOne({ slug: postSlug, vadmin: 'approve' })
        .populate('postCategorie', 'slug name')
        .populate('postSubCategorie', 'slug name')
        .lean<IPost & {
          postCategorie: { slug: string; name?: string };
          postSubCategorie?: { slug: string; name?: string } | null;
        }>();

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      // return the post data
      res.json(post);
    } catch (err) {
      console.error('Error fetching post by slug:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
