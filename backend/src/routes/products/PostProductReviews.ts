import { Router, Request, Response } from 'express';
import Product from '@/models/stock/Product';  // Import the Product model
import Review from '@/models/Review';  // Import the Review model

const router = Router();

// POST: //post /api/reviews/PostProductReviews
router.post("/PostProductReviews", async (req: Request, res: Response): Promise<void> => {
  const { product, rating, text, email, name, user } = req.body;

  if (!product || !rating || !text || !email || !name || !user) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ message: "Rating must be between 1 and 5" });
    return;
  }

  try {
    const newReview = new Review({
      product,
      rating,
      text,
      email,
      name,
      user,
      likes: [],
      dislikes: [],
    });

    await newReview.save();

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    productDoc.nbreview += 1;
    const reviews = await Review.find({ product });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    productDoc.averageRating = averageRating;
    await productDoc.save();

    const populatedReview = await Review.findById(newReview._id)
      .populate('likes', '_id username email')
      .populate('dislikes', '_id username email');

    res.status(201).json({ review: populatedReview, product: productDoc });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
