import { Router, Request, Response } from 'express';
import PostCategorie from '@/models/blog/PostCategorie';
import PostMainSection from '@/models/blog/Post';

const router = Router();

// GET /api/Blog/getPostbyslug/:id
router.get('/getPostbyslug/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const Postbyslug = req.params.id;

    // Validate the slug parameter
    if (!Postbyslug || typeof Postbyslug !== 'string') {
      res.status(404).json("Post name is required and should exist");
      return;
    }

    await PostCategorie.find();

    // Find the post with the given slug
    const Posts = await PostMainSection.findOne({ slug: Postbyslug, vadmin: "approve" })
      .populate('postCategorie', 'name vadmin slug createdAt')
      .exec();

    if (!Posts) {
      res.status(403).json('Post not found');
      return; // Stop here
    }

    // If we get here, posts exist
    res.status(200).json(Posts);
    // No need to `return` since there's no more code below

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching Post" });
    // After this, no more code runs
  }
});

export default router;
