import React, { useEffect, useState } from "react";
import { FaStarHalfAlt } from "react-icons/fa";
import { FaRegStar, FaStar } from "react-icons/fa6";
interface Review {
  _id: string;
  name: string;
  email: string;
  text: string;
  reply: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}
interface CustomerReviewProps {
  productId: string;
  refresh?: boolean;
}
const fetchReviews = async (productId: string) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  const response = await fetch(
    `/api/review/getAllReviewByProduct?id=${productId}`
  );
  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data; // Ensure you return the fetched data
};

const CustomerReview: React.FC<CustomerReviewProps> = ({
  productId,
  refresh,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);


  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchReviews(productId);
        setReviews(data);
      } catch (error) {
        console.log ("error not defined", error)
      }
    };

    loadReviews();
  }, [productId, refresh]);

  const countRatings = (reviews: Review[]): Record<number, number> => {
    const counts: Record<number, number> = {};

    reviews.forEach((review) => {
      counts[review.rating] = (counts[review.rating] || 0) + 1;
    });

    return counts;
  };

  const ratingCounts = countRatings(reviews);
  const ratingCounts1 = ratingCounts[1] || 0;
const ratingCounts2 = ratingCounts[2] || 0;
const ratingCounts3 = ratingCounts[3] || 0;
const ratingCounts4 = ratingCounts[4] || 0;
const ratingCounts5 = ratingCounts[5] || 0;

  const numberOfReviews = reviews.length;
  const ratingstatic1=(ratingCounts1/numberOfReviews)*100;
  const ratingstatic2=(ratingCounts2/numberOfReviews)*100;
  const ratingstatic3=(ratingCounts3/numberOfReviews)*100;
  const ratingstatic4=(ratingCounts4/numberOfReviews)*100;
  const ratingstatic5=(ratingCounts5/numberOfReviews)*100;
  const reatingstatictotal=((ratingCounts1*1)+(ratingCounts2*2)+(ratingCounts3*3)+(ratingCounts4*4)+(ratingCounts5*5))/numberOfReviews;
  return (
    <div className="w-[50%] max-xl:w-full flex flex-col  gap-[32px] p-4">
      <div>
        <p className="text-xl ">Customer Review</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-[8px]">
        <p className="text-4xl font-bold">{reatingstatictotal||0}/5</p>
        <div className="text-primary flex items-center gap-[4px]">
        {Array.from({ length: 5 }, (_, index) => {
                    const starValue = index + 1;
                    if (starValue <= reatingstatictotal) {
                        return <FaStar key={index} />;  // Full star
                    } else if (starValue - 0.5 <= reatingstatictotal) {
                        return <FaStarHalfAlt key={index} />;  // Half star
                    } else {
                        return <FaRegStar key={index} />;  // Empty star
                    }
                })}
        </div>
        <p className="text-[#525566] text-sm">{numberOfReviews} reviews</p>
      </div>
      <div className="flex flex-col gap-[12px]">
        <div className=" flex items-center gap-[8px]">
          <div className="flex gap-[4px] items-center text-primary">
            <FaStar />
            <FaStar />
            <FaStar />
            <FaStar />
            <FaStar />
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-gray-200 ">
          <div
              className="absolute top-0 left-0 h-full bg-primary rounded"
              style={{ width: `${ratingstatic5}%` }}
              role="progressbar"
              aria-label="Rating progress" // Optionally describe what the progress represents
              
              
            ></div>
          </div>

          <p className="text-[#525566]">{ratingCounts5}</p>
        </div>

        <div className=" flex items-center gap-[8px]">
          <div className="flex gap-[4px] items-center text-primary">
            <FaStar />
            <FaStar />
            <FaStar />
            <FaStar />
            <FaRegStar />
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-gray-200 ">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded"
              style={{ width: `${ratingstatic4}%` }} 
              role="progressbar"
              aria-label="Rating progress"
            ></div>
          </div>
          <p className="text-[#525566]">{ratingCounts4}</p>
        </div>
        <div className=" flex items-center gap-[8px]">
          <div className="flex gap-[4px] items-center text-primary">
            <FaStar />
            <FaStar />
            <FaStar />
            <FaRegStar />
            <FaRegStar />
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-gray-200 ">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded"
              style={{ width: `${ratingstatic3}%` }} 
              role="progressbar"
              aria-label="Rating progress"
            ></div>
          </div>
          <p className="text-[#525566]">{ratingCounts3}</p>
        </div>
        <div className=" flex items-center gap-[8px]">
          <div className="flex gap-[4px] items-center text-primary">
            <FaStar />
            <FaStar />
            <FaRegStar />
            <FaRegStar />
            <FaRegStar />
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-gray-200 ">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded"
              style={{ width: `${ratingstatic2}%` }} 
              role="progressbar"
              aria-label="Rating progress"
            ></div>
          </div>
          <p className="text-[#525566]">{ratingCounts2}</p>
        </div>
        <div className=" flex items-center gap-[8px]">
          <div className="flex gap-[4px] items-center text-primary">
            <FaStar />
            <FaRegStar />
            <FaRegStar />
            <FaRegStar />
            <FaRegStar />
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-gray-200 ">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded"
              style={{ width: `${ratingstatic1}%` }} 
              role="progressbar"
              aria-label="Rating progress"
            ></div>
          </div>
          <p className="text-[#525566]">{ratingCounts1}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerReview;
