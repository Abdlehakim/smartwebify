// src/routes/website/blog/getAllPostCardByCategorie.ts

import { Router, Request, Response } from 'express'
import Post from '@/models/blog/Post'
import PostCategorie from '@/models/blog/PostCategorie'

const router = Router()

/**
 * GET /api/blog/getAllPostCardByCategorie/:slug
 *   e.g. /api/blog/getAllPostCardByCategorie/test3
 */
router.get(
  '/getAllPostCardByCategorie/:slug',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params

      // 1️⃣ find the approved category by slug
      const category = await PostCategorie.findOne({
        slug,
        vadmin: 'approve',
      }).lean()

      if (!category) {
        res.status(404).json({ message: 'Category not found' })
        return
      }

      // 2️⃣ fetch all approved posts in that category
      const posts = await Post.find({
        postCategorie: category._id,
        vadmin:        'approve',
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
      console.error('Get Post Cards by Category Error:', err)
      res.status(500).json({ message: 'Internal server error.' })
    }
  }
)

export default router
