// src/routes/website/blog/getAllPostCardBySubCategorie.ts

import { Router, Request, Response } from 'express'
import Post from '@/models/blog/Post'
import PostSubCategorie from '@/models/blog/PostSubCategorie'

const router = Router()

/**
 * GET /api/blog/getAllPostCardBySubCategorie/:slug
 *   e.g. /api/blog/getAllPostCardBySubCategorie/my-sub-slug
 */
router.get(
  '/getAllPostCardBySubCategorie/:slug',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params

      // 1️⃣ find the approved sub-category by slug
      const subCat = await PostSubCategorie.findOne({
        slug,
        vadmin: 'approve',
      }).lean()

      if (!subCat) {
        res.status(404).json({ message: 'Sub-category not found' })
        return
      }

      // 2️⃣ fetch all approved posts in that sub-category
      const posts = await Post.find({
        postSubCategorie: subCat._id,
        vadmin:           'approve',
      })
        .select('title description imageUrl slug createdAt postCategorie postSubCategorie')
        .populate([
          { path: 'postCategorie',    select: 'slug' },
          { path: 'postSubCategorie', select: 'slug' },
        ])
        .sort({ createdAt: -1 })
        .lean()

      // 3️⃣ map to the shape your frontend expects
      const payload = posts.map((p) => ({
        title:            p.title,
        description:      p.description,
        imageUrl:         p.imageUrl,
        slug:             p.slug,
        createdAt:        p.createdAt,
        postCategorie:    { slug: (p.postCategorie as any)?.slug || '' },
        postSubCategorie: { slug: (p.postSubCategorie as any)?.slug || '' },
      }))

      res.json(payload)
    } catch (err) {
      console.error('Get Post Cards by Sub-category Error:', err)
      res.status(500).json({ message: 'Internal server error.' })
    }
  }
)

export default router
