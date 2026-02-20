// src/routes/dashboardadmin/blog/post/create.ts
import { Router, Request, Response } from 'express'
import { requirePermission } from '@/middleware/requireDashboardPermission'
import { memoryUpload } from '@/lib/multer'
import { uploadToCloudinary } from '@/lib/uploadToCloudinary'
import Post from '@/models/blog/Post'

const router = Router()

/**
 * POST /api/dashboardadmin/blog/post/create
 * Create a new Post with main image + optional subsection images
 */
router.post(
  '/create',
  requirePermission('M_Blog'),
  // catch main image + any subImg-<index> files
  memoryUpload.any(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // --- 1) Authorization ---
      const userId = req.dashboardUser?._id
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }

      // --- 2) Text fields ---
      const title            = (req.body.title as string || '').trim()
      const description      = (req.body.description as string || '').trim()
      const postCategorie    = req.body.postCategorie as string
      const postSubCategorie = (req.body.postSubCategorie as string) || null

      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' })
        return
      }
      if (!description) {
        res.status(400).json({ success: false, message: 'Description is required' })
        return
      }
      if (!postCategorie) {
        res.status(400).json({ success: false, message: 'Category ID is required' })
        return
      }

      // --- 3) File array ---
      const files = req.files as Express.Multer.File[]
      const mainFile = files.find(f => f.fieldname === 'image')
      if (!mainFile) {
        res.status(400).json({ success: false, message: 'Main image is required' })
        return
      }

      // --- 4) Upload main image ---
      const mainUp = await uploadToCloudinary(mainFile, 'posts')
      const imageUrl = mainUp.secureUrl
      const imageId  = mainUp.publicId

      // --- 5) Parse subsections JSON ---
      let rawSubs: any[] = []
      if (req.body.subsections) {
        try {
          rawSubs = JSON.parse(req.body.subsections as string)
        } catch {
          res.status(400).json({ success: false, message: 'Invalid subsections JSON' })
          return
        }
      }

      // --- 6) Process each subsection image ---
      const subsections = await Promise.all(
        rawSubs.map(async (sub, idx) => {
          const fileField = `subImg-${idx}`
          const subFile   = files.find(f => f.fieldname === fileField)

          let subUrl: string | undefined
          let subId:  string | undefined
          if (subFile) {
            const upl = await uploadToCloudinary(subFile, 'posts/subsections')
            subUrl = upl.secureUrl
            subId  = upl.publicId
          }

          return {
            title:       sub.title,
            description: sub.description,
            imageUrl:    subUrl,
            imageId:     subId,
            children:    sub.children || []
          }
        })
      )

      // --- 7) Create the Post document ---
      const post = await Post.create({
        title,
        description,
        imageUrl,
        imageId,
        postCategorie,
        postSubCategorie,
        author:     userId,
        subsections,
        createdBy:  userId
      })

      // --- 8) Response ---
      res.status(201).json({ success: true, message: 'Post created.', post })
    } catch (err: any) {
      console.error('Create Post Error:', err)
      if (err.code === 11000) {
        res.status(400).json({ success: false, message: 'Duplicate title or reference.' })
        return
      }
      if (err.name === 'ValidationError' && err.errors) {
        const msgs = Object.values(err.errors).map((e: any) => e.message)
        res.status(400).json({ success: false, message: msgs.join(' ') })
        return
      }
      res.status(500).json({ success: false, message: err.message || 'Server error.' })
    }
  }
)

export default router
