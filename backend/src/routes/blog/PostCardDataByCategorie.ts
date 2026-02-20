import { Router, Request, Response } from 'express';
import PostCategorie from '@/models/blog/PostCategorie';
import PostMainSection from '@/models/blog/Post';

const router = Router();

// GET /api/Blog/PostCardDataByCategorie/:id
router.get('/PostCardDataByCategorie/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const postCategorieSlug = req.params.id;

    if (!postCategorieSlug || typeof postCategorieSlug !== 'string') {
      res.status(402).json("PostCategorie is required and should be a string");
      return; // Stop execution after sending response
    }

    // Look up approved PostCategorie by slug
    const foundCategorie = await PostCategorie.findOne({
      slug: postCategorieSlug,
      vadmin: "approve",
    });

    if (!foundCategorie) {
      res.status(403).json({ message: "PostCategorie not exist" });
      return; // Stop if not found
    }

    // Get all Posts matching the found categorie (approved only)
    const Posts = await PostMainSection.find({
      postcategorie: foundCategorie._id,
      vadmin: "approve",
    })
      .select("title description imageUrl slug createdAt")
      .populate("postCategorie", "slug")
      .exec();

    // Respond with the array of posts
    res.status(200).json(Posts);
    // No `return` needed here because there's no more code after

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching Posts by categorie" });
    // Execution ends here
  }
});

export default router;
