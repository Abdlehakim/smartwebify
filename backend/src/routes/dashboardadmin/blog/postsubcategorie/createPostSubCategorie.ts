
// src/routes/dashboardadmin/blog/postsubcategorie/createPostSubCategorie.ts

import { Router, Request, Response } from 'express';
import { requirePermission } from '@/middleware/requireDashboardPermission';
import { memoryUpload } from '@/lib/multer';
import { uploadToCloudinary } from '@/lib/uploadToCloudinary';
import PostSubCategorie from '@/models/blog/PostSubCategorie';

const router = Router();

/**
 * POST /api/dashboardadmin/blog/postsubcategories/create
 * Create a new PostSubCategorie with required icon, image, and banner uploads
 */
router.post(
  '/create',
  requirePermission('M_Blog'),
  memoryUpload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const name = (req.body.name as string || '').trim();
      const postCategorie = req.body.postCategorie as string;
      if (!name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      if (!postCategorie) {
        res.status(400).json({ success: false, message: 'postCategorie ID is required' });
        return;
      }

      // Validate required files
      const files = req.files as Record<string, Express.Multer.File[]>;
      if (!files?.icon?.length) {
        res.status(400).json({ success: false, message: 'Icon file is required' });
        return;
      }
      if (!files?.image?.length) {
        res.status(400).json({ success: false, message: 'Image file is required' });
        return;
      }
      if (!files?.banner?.length) {
        
      }

      // Upload icon
      const iconUpload = await uploadToCloudinary(files.icon[0], 'subcategories');
      const iconUrl = iconUpload.secureUrl;
      const iconId = iconUpload.publicId;

      // Upload image
      const imageUpload = await uploadToCloudinary(files.image[0], 'subcategories');
      const imageUrl = imageUpload.secureUrl;
      const imageId = imageUpload.publicId;

      // Upload banner
      const bannerUpload = await uploadToCloudinary(files.banner[0], 'subcategories');
      const bannerUrl = bannerUpload.secureUrl;
      const bannerId = bannerUpload.publicId;

      // Create sub-category
      const subCategory = await PostSubCategorie.create({
        name,
        postCategorie,
        iconUrl,
        iconId,
        imageUrl,
        imageId,
        bannerUrl,
        bannerId,
        createdBy: userId,
      });

      res.status(201).json({ success: true, message: 'PostSubCategorie created.', subCategory });
    } catch (err: any) {
      console.error('Create PostSubCategorie Error:', err);
      if (err.code === 11000) {
        res.status(400).json({ success: false, message: 'Duplicate name or reference.' });
        return;
      }
      if (err.name === 'ValidationError' && err.errors) {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: messages.join(' ') });
        return;
      }
      res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
  }
);

export default router;
