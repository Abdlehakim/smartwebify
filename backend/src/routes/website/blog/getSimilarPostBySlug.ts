// src/routes/website/blog/getSimilarPostBySlug.ts

import { Router, Request, Response } from 'express';
import Post, { IPost } from '@/models/blog/Post';
import '@/models/blog/PostCategorie';
import '@/models/blog/PostSubCategorie';

const router = Router();

/**
 * GET /api/blog/getSimilarPostBySlug/:postSlug
 * Fetch posts in the same category or subcategory as the given slug,
 * excluding the post itself.
 */
router.get(
  
  '/getSimilarPostBySlug/:postSlug',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postSlug } = req.params;

      // 1️⃣ Find the original approved post
      const originPost = await Post.findOne({ slug: postSlug, vadmin: 'approve' })
        .lean<IPost & {
          postCategorie: { _id: any };
          postSubCategorie?: { _id: any } | null;
        }>();

      if (!originPost) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      // 2️⃣ Build filter: exclude itself, only approved
      const filter: any = {
        vadmin: 'approve',
        slug: { $ne: postSlug },
      };

      // If a subcategory exists, match either category or subcategory
      if (originPost.postSubCategorie?._id) {
        filter.$or = [
          { postCategorie: originPost.postCategorie._id },
          { postSubCategorie: originPost.postSubCategorie._id },
        ];
      } else {
        // Otherwise, match by category only
        filter.postCategorie = originPost.postCategorie._id;
      }

      // 3️⃣ Query similar posts
      const similarPosts = await Post.find(filter)
        .select(
          'title description imageUrl slug createdAt postCategorie postSubCategorie'
        )
        .populate([
          { path: 'postCategorie', select: 'slug' },
          { path: 'postSubCategorie', select: 'slug' },
        ])
        .sort({ createdAt: -1 })
        .lean();

      // 4️⃣ Map to frontend shape
      const payload = similarPosts.map((p: any) => ({
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        slug: p.slug,
        createdAt: p.createdAt,
        postCategorie: { slug: p.postCategorie?.slug || '' },
        postSubCategorie: { slug: p.postSubCategorie?.slug || '' },
      }));

      res.json(payload);
    } catch (err) {
      console.error('Get similar posts error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
