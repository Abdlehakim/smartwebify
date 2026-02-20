// routes/dashboardadmin/blog/posts/deletePost.ts

import { Router, Request, Response } from 'express';
import Post from '@/models/blog/Post';
import { requirePermission } from '@/middleware/requireDashboardPermission';
import cloudinary from '@/lib/cloudinary';

const router = Router();

/**
 * DELETE /api/dashboardadmin/blog/posts/delete/:postId
 * — removes the Post document and ALL related Cloudinary images
 *   (main image + any subsection images, at any depth)
 */
router.delete(
  '/delete/:postId',
  requirePermission('M_Blog'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { postId } = req.params;

      /* ------------------------------------------------------------------ */
      /* 1. Remove the DB record (return the doc so we can inspect it)       */
      /* ------------------------------------------------------------------ */
      const deleted = await Post.findByIdAndDelete(postId).lean();
      if (!deleted) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      /* ------------------------------------------------------------------ */
      /* 2. Gather EVERY Cloudinary publicId                                */
      /* ------------------------------------------------------------------ */
      const ids: string[] = [];

      // main section image
      if (deleted.imageId) ids.push(deleted.imageId);

      // recurse through nested subsections
      const walk = (sections: any[] = []) => {
        sections.forEach((s) => {
          if (s.imageId) ids.push(s.imageId);
          if (Array.isArray(s.children) && s.children.length) {
            walk(s.children);
          }
        });
      };
      walk(deleted.subsections);

      /* ------------------------------------------------------------------ */
      /* 3. Delete each asset on Cloudinary (fire-and-forget)               */
      /* ------------------------------------------------------------------ */
      await Promise.all(
        ids.map((publicId) =>
          cloudinary.uploader
            .destroy(publicId)
            .catch((e) => console.error('Cloudinary deletion error:', e)),
        ),
      );

      /* ------------------------------------------------------------------ */
      /* 4. Respond                                                          */
      /* ------------------------------------------------------------------ */
      res.json({
        message: 'Post and all associated images have been deleted.',
        deletedId: deleted._id,
      });
    } catch (err) {
      console.error('Delete Post Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },
);

export default router;
