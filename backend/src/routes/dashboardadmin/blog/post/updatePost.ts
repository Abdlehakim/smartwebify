// routes/dashboardadmin/blog/posts/updatePost.ts
import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Post, { IPost } from '@/models/blog/Post';
import { requirePermission } from '@/middleware/requireDashboardPermission';
import { memoryUpload } from '@/lib/multer';
import { uploadToCloudinary } from '@/lib/uploadToCloudinary';
import cloudinary from '@/lib/cloudinary';

const router = Router();

/**
 * PUT /api/dashboardadmin/blog/posts/update/:postId
 * — updates text / status / taxonomy,
 *   optionally replaces the main image,
 *   fully replaces subsections (deleting removed images),
 *   and stamps updatedBy.
 */
router.put(
  '/update/:postId',
  requirePermission('M_Blog'),
  // accept main + subImg-<idx> uploads
  memoryUpload.any(),
  async (req: Request, res: Response): Promise<void> => {
    const { postId } = req.params;
    const userId = req.dashboardUser?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    try {
      // 1) Load existing post
      const existing = await Post.findById(postId).lean();
      if (!existing) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }

      // 2) Build update payload
      const update: Partial<IPost> = { updatedBy: userId };
      const {
        title,
        description,
        vadmin,
        postCategorie,
        postSubCategorie,
      } = req.body as {
        title?: string;
        description?: string;
        vadmin?: 'approve' | 'not-approve';
        postCategorie?: string;
        postSubCategorie?: string | null;
        subsections?: string;
      };

      if (title?.trim()) update.title = title.trim();
      if (description !== undefined) update.description = description.trim();
      if (vadmin) update.vadmin = vadmin;
      if (postCategorie) update.postCategorie = new Types.ObjectId(postCategorie);
      if (postSubCategorie !== undefined)
        update.postSubCategorie = postSubCategorie
          ? new Types.ObjectId(postSubCategorie)
          : null;

      // 3) Parse incoming subsections JSON
      let incoming: any[] = [];
      if (req.body.subsections) {
        try {
          incoming = JSON.parse(req.body.subsections as string);
        } catch {
          res.status(400).json({ success: false, message: 'Invalid JSON for subsections.' });
          return;
        }
      }

      // 4) Collect old subsection imageIds (any depth)
      const collectIds = (secs: any[]): string[] => {
        let ids: string[] = [];
        secs.forEach(s => {
          if (s.imageId) ids.push(s.imageId);
          if (Array.isArray(s.children)) {
            ids = ids.concat(collectIds(s.children));
          }
        });
        return ids;
      };
      const oldSubIds = collectIds(existing.subsections);

      // 5) Merge in any newly-uploaded subImg-<idx>, re-collect new imageIds
      const files = req.files as Express.Multer.File[];
      const newSubsections = await Promise.all(
        incoming.map(async (sub, idx) => {
          const fileField = `subImg-${idx}`;
          const uploaded = files.find(f => f.fieldname === fileField);
          if (uploaded) {
            const { secureUrl, publicId } = await uploadToCloudinary(uploaded, 'posts/subsections');
            sub.imageUrl = secureUrl;
            sub.imageId = publicId;
          }
          // propagate into children as well if nested uploads (optional)
          if (Array.isArray(sub.children)) {
            sub.children = await Promise.all(
              sub.children.map(async (child: any, cidx: number) => {
                const childField = `subImg-${idx}-${cidx}`;
                const cf = files.find(f => f.fieldname === childField);
                if (cf) {
                  const { secureUrl, publicId } = await uploadToCloudinary(cf, 'posts/subsections');
                  child.imageUrl = secureUrl;
                  child.imageId = publicId;
                }
                return child;
              })
            );
          }
          return sub;
        })
      );

      // 6) Determine which old IDs are no longer present → destroy them
      const newSubIds = collectIds(newSubsections);
      const removedIds = oldSubIds.filter(id => !newSubIds.includes(id));
      await Promise.all(
        removedIds.map(id =>
          cloudinary.uploader.destroy(id).catch(console.error)
        )
      );

      update.subsections = newSubsections;

      // 7) Replace main image if provided
      const mainFile = files.find(f => f.fieldname === 'image');
      if (mainFile) {
        if (existing.imageId) {
          await cloudinary.uploader.destroy(existing.imageId).catch(console.error);
        }
        const { secureUrl, publicId } = await uploadToCloudinary(mainFile, 'posts');
        update.imageUrl = secureUrl;
        update.imageId  = publicId;
      }

      // 8) Apply update
      const updated = await Post.findByIdAndUpdate(
        postId,
        update,
        { new: true, runValidators: true }
      );
      if (!updated) {
        res.status(404).json({ success: false, message: 'Post not found after update.' });
        return;
      }

      // 9) Respond
      res.json({ success: true, message: 'Post updated.', post: updated });
    } catch (err: any) {
      console.error('Update Post Error:', err);
      if (err.code === 11000) {
        res.status(400).json({ success: false, message: 'Duplicate title or reference.' });
      } else if (err.name === 'ValidationError' && err.errors) {
        const msgs = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(' ') });
      } else {
        res.status(500).json({ success: false, message: err.message || 'Server error.' });
      }
    }
  }
);

export default router;
