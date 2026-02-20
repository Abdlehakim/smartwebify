// src/models/blog/Post.ts

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import crypto from 'crypto';

/**
 * Recursive subsection interface allowing unlimited nesting
 */
export interface IPostSubsection {
  title: string;
  description: string;
  imageUrl?: string;
  imageId?: string;
  children: IPostSubsection[];
}

/**
 * Blog post interface with Cloudinary image IDs
 */
export interface IPost extends Document {
  title: string;
  description: string;
  imageUrl: string;
  imageId: string;
  reference: string;
  slug: string;
  vadmin: 'not-approve' | 'approve';
  postCategorie: Types.ObjectId;
  postSubCategorie?: Types.ObjectId | null;
  author: Types.ObjectId;
  subsections: IPostSubsection[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Extend Model to include commentCount static
export interface PostModel extends Model<IPost> {
  commentCount(postId: Types.ObjectId | string): Promise<number>;
}

/* helpers */
const generatePostReference = (): string =>
  'ps' + crypto.randomBytes(3).toString('hex').toLowerCase();

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

/* recursive subsection schema */
const SubsectionSchema = new Schema<IPostSubsection>(
  {
    title: { type: String, required: true },
    description: { type: String },
    // Images in subsections are optional
    imageUrl: { type: String,},
    imageId: { type: String,},
  },
  { _id: true }
);
SubsectionSchema.add({ children: { type: [SubsectionSchema], default: [] } });

/* main post schema */
const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    // Main section image is required
    imageUrl: { type: String, required: true },
    imageId: { type: String, required: true },
    reference: { type: String, required: true, unique: true, index: true },
    slug: { type: String, unique: true },
    vadmin: {
      type: String,
      enum: ['not-approve', 'approve'],
      default: 'not-approve',
    },
    postCategorie: {
      type: Schema.Types.ObjectId,
      ref: 'PostCategorie',
      required: true,
    },
    postSubCategorie: {
      type: Schema.Types.ObjectId,
      ref: 'PostSubCategorie',
      default: null,
    },
    author: { type: Schema.Types.ObjectId, ref: 'DashboardUser', required: true },
    subsections: { type: [SubsectionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'DashboardUser', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'DashboardUser', default: null },
  },
  { timestamps: true }
);

/* pre-validate hook: generate reference */
PostSchema.pre<IPost>('validate', async function (next) {
  if (this.isNew) {
    let ref: string;
    let exists: IPost | null;
    do {
      ref = generatePostReference();
      exists = await mongoose.models.Post.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

/* pre-save hook: slugify title */
PostSchema.pre<IPost>('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title);
  }
  next();
});

/* static method: count comments */
PostSchema.statics.commentCount = async function (
  postId: Types.ObjectId | string
): Promise<number> {
  return mongoose.model('PostComment').countDocuments({ post: postId });
};

// Include virtuals and statics in JSON output
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

// Export model with static
const Post = (mongoose.models.Post as PostModel) ||
  mongoose.model<IPost, PostModel>('Post', PostSchema);

export default Post;
