"use client";
import React, { FormEvent, useState } from "react";
import ReviewBlock from "./ReviewBlock";
import { FaStar } from "react-icons/fa";
import { useSession } from "next-auth/react";
import CustomerReview from "./CustomerReview";


interface Product {
  _id: string;
  name: string;
  description: string;
  info:string;
  ref: string;
  price: number;
  imageUrl?: string;
  images?: string [];
  brand?: Brand; // Make brand optional
  stock: number;
  dimensions?:string;
  discount?: number;
  warranty?:number;
  weight?:number;
  color?: string;
  material?: string;
  status?: string;
}

interface Brand {
  _id: string;
  place: string;
  name: string;
  imageUrl: string;
}



const SubmitReview: React.FC<{ product: Product | null }> = ({ product }) => {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [ratingError, setRatingError] = useState("");
  const [reviewError, setReviewError] = useState("");
  
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const productId = product?._id|| '';
  const { data: session } = useSession();
  const [key, setKey] = useState(0);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalName = name || session?.user?.name || '';
    const finalEmail = email || session?.user?.email || '';
    if (rating < 1) {
      setRatingError("Please provide a rating of at least 1.");
      return;
  } else {
      setRatingError(""); // Clear the error if rating is valid
  }
  if (!review){
    setReviewError("Please writing review.");
    return;
  }else {
    setReviewError(""); // Clear the error if rating is valid
}
    const reviewData = new FormData();
    reviewData.append("rating", rating.toString());
    reviewData.append("text", review);
    reviewData.append("email", finalEmail);
    reviewData.append("name", finalName);
    reviewData.append("product", productId);
    try {
      const response = await fetch("/api/review/postReviewByProduct", {
          method: "POST",
          body: reviewData,
      });

      if (!response.ok) {
          throw new Error("Network response was not ok");
      }
      setName('');
    setEmail('');
    setReview('');
    setRating(0);


      // Force re-render by changing key
      setKey(prevKey => prevKey + 1);
  } catch (error) {
      console.error("Error submitting review:", error);
     
  }
};

  return (
    <div className="bg-blue-50 desktop max-lg:w-[95%] my-10  rounded-lg flex flex-col gap-20  ">
      {/* top */}
      <div className="flex max-xl:flex-col justify-between">
        <CustomerReview  productId={productId} key={key} />
        <div className="w-[50%] max-xl:w-full p-4 ">
          <ReviewBlock product={product} productId={productId} key={key} />
          <div className="flex flex-col w-[95%] mx-auto gap-[20px]">
            <p className="text-xl">ADD A REVIEW</p>
            <p className="text-[#525566]">
              Your email adress will not be published. Required fields are
              marked *
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 h-[516px]">
              <div className="flex items-center gap-[12px]">
                <p>Your rating:</p>
                <div className="text-primary flex items-center gap-[4px]">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      onClick={() => setRating(index + 1)}
                      className={`cursor-pointer ${
                        index < rating ? "text-primary" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                 {/* Display rating error */}
            {ratingError && (
                <p className="text-red-500 text-sm">{ratingError}</p>
            )}
              </div>

              <label className="flex flex-col gap-[16px]">
                <label>Your review:</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-40 px-2.5 py-3"
                  placeholder=""
                  required
                />
                 {reviewError && (
                <p className="text-red-500 text-sm">{reviewError}</p>
            )}
              </label>

           {!session &&   (
            <div>
              <label className="flex flex-col gap-[8px]">
                <label>Name:</label>
                <input
                
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder=""
                  required
                />
              </label>

              <label className="flex flex-col gap-[8px]">
                <label>Email:</label>
                <input
                
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder=""
                  required
                />
              </label>
              </div>
            )}

             
              <button
                type="submit"
                className="text-white bg-primary hover:bg-[#15335D] h-10 w-[20%] font-bold rounded-md"
              >
                Submit
              </button>
             
            </form>
          </div>
        </div>
      </div>
      {/* mid */}
      
    </div>
  );
};

export default SubmitReview;
