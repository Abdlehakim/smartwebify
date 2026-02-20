"use client";
import React, { useEffect, useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { cache } from "react";

interface Review {
  _id: string;
  user?: {
    _id: string;
    username: string;
    email: string;
  };
  name?: string;
  email?: string;
  text: string;
  reply?: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsProps {
  productId: string;
  summary?: boolean;
}

export const revalidate = 60;

// This fetch function returns T or null
const fetchData = cache(async function <T>(endpoint: string): Promise<T | null> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const res = await fetch(`${backendUrl}${endpoint}`, { cache: "no-store" });
  if (!res.ok) {
    // Return null if the request fails (e.g. 404/500)
    return null;
  }
  return res.json();
});

// Helper to fetch review array
const fetchReviews = (productId: string) =>
  fetchData<Review[]>(`/api/Products/ProductReviews/${productId}`);

const ReviewClient: React.FC<ReviewsProps> = ({ productId, summary = false }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await fetchReviews(productId);
        if (data === null) {
          setError("Failed to load reviews.");
        } else {
          setReviews(data);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadReviews();
    }
  }, [productId]);

  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  const averageRating = getAverageRating();

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      if (starValue <= rating) {
        return <FaStar key={index} />;
      } else if (starValue - 0.5 <= rating) {
        return <FaStarHalfAlt key={index} />;
      } else {
        return <FaRegStar key={index} />;
      }
    });

  if (loading) {
    return (
      <div className="reviews-summary flex items-center gap-[8px]">
        <div className="stars flex text-secondary text-xs">
          {Array.from({ length: 5 }, (_, index) => (
            <FaStar key={index} className="animate-pulse" />
          ))}
        </div>
        <p className="text-xs">0.0 / 5 (0)</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // If we only want the summary (average + count)
  if (summary) {
    return (
      <div className="reviews-summary flex items-center gap-[8px]">
        <div className="stars flex text-secondary text-xs">
          {renderStars(averageRating)}
        </div>
        <p className="text-xs">
          {averageRating.toFixed(1)} / 5 ({reviews.length})
        </p>
      </div>
    );
  }

  // Detailed view: listing each review
  return (
    <div className="reviews-component p-4 border-t mt-8">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      <div className="rating-summary flex items-center gap-[8px] mb-4">
        <div className="stars text-secondary text-xl">
          {renderStars(averageRating)}
        </div>
        <p>
          {averageRating.toFixed(1)} out of 5 ({reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"})
        </p>
      </div>
      <div className="reviews-list space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="review p-4 border rounded">
            <h3 className="font-semibold">
              {review.user ? review.user.username : review.name || "Anonymous"}
            </h3>
            <div className="stars text-secondary">{renderStars(review.rating)}</div>
            <p className="mt-2">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewClient;
