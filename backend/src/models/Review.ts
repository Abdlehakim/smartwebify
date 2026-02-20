import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { IClient } from "./Client";
export interface IReview extends Document {
  product: string;
  rating: number;
  text?: string;
  email: string;
  name: string;
  reply: string;
  createdAt?: Date;
  updatedAt?: Date;
  likes: Array<IClient | string>; // Array of user IDs
  dislikes: Array<IClient | string>; // Array of user IDs
}

const ReviewSchema: Schema = new Schema(
  {
    product: { type: String, require: true },
    rating: { type: Number, required: true },
    text: { type: String, required: true },
    email: { type: String, require: true },
    name: { type: String, require: true },
    reply: { type: String },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "Client" }],
      default: [],
    }, // Array of ObjectIds referencing User model
    dislikes: {
      type: [{ type: Schema.Types.ObjectId, ref: "Client" }],
      default: [],
    }, // Array of ObjectIds referencing User model
  },
  { timestamps: true }
);

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
