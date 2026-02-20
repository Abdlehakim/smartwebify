import { Router, Request, Response } from 'express';
import Review from '@/models/Review';
const router = Router();
// GET /api/Products/ProductReviews/:productId
router.get("/:productId", async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
    const review = await Review.find({ product: productId }) .populate('likes', '_id username email')
    .populate('dislikes', '_id username email');

      res.status(200).json(review);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching review" });
    }
  });
export default router