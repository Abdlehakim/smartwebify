// models/blog/PostComment.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface IPostComment extends Document {
  post: Types.ObjectId;
  /** ID of the author (Client or DashboardUser)                        */
  author: Types.ObjectId;
  /** Tells Mongoose which collection to populate (`Client` or `DashboardUser`) */
  authorModel: 'Client' | 'DashboardUser';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/* Schema                                                             */
/* ------------------------------------------------------------------ */
const PostCommentSchema = new Schema<IPostComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },

    /** -----------------------------------------------
     *  Flexible author — can be a Client *or* DashboardUser
     *  --------------------------------------------- */
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'authorModel', // <─ dynamic ref
    },
    authorModel: {
      type: String,
      required: true,
      enum: ['Client', 'DashboardUser'],
    },

    /** Comment content */
    content: { type: String, required: true },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Model                                                              */
/* ------------------------------------------------------------------ */
const PostComment: Model<IPostComment> =
  mongoose.models.PostComment ||
  mongoose.model<IPostComment>('PostComment', PostCommentSchema);

export default PostComment;
