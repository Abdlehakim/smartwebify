// src/models/blog/PostSubCategorie.ts

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import crypto from 'crypto';

export interface IPostSubCategorie extends Document {
  reference: string;
  name: string;
  slug: string;
  iconUrl: string;
  iconId: string;
  imageUrl: string;
  imageId: string;
  bannerUrl: string;
  bannerId: string;
  vadmin: 'not-approve' | 'approve';
  postCategorie: Types.ObjectId;
  postCount?: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const generateSubCategorieRef = (): string => {
  const prefix = 'psc';
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return prefix + suffix;
};

const slugifyName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

const PostSubCategorieSchema = new Schema<IPostSubCategorie>(
  {
    reference: { type: String, required: true, unique: true },
    name:      { type: String, required: true, unique: true },
    slug:      { type: String, unique: true },
    iconUrl:   { type: String, required: true },
    iconId:    { type: String, required: true },
    imageUrl:  { type: String, required: true },
    imageId:   { type: String, required: true },
    bannerUrl: { type: String, required: true },
    bannerId:  { type: String, required: true },
    vadmin:    { type: String, enum: ['not-approve','approve'], default: 'not-approve' },
    postCategorie: { type: Schema.Types.ObjectId, ref: 'PostCategorie', required: true },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'DashboardUser', required: true },
    updatedBy:  { type: Schema.Types.ObjectId, ref: 'DashboardUser', default: null }
  },
  { timestamps: true }
);

PostSubCategorieSchema.pre<IPostSubCategorie>('validate', async function(next) {
  if (this.isNew) {
    let ref: string;
    let exists: IPostSubCategorie | null;
    do {
      ref = generateSubCategorieRef();
      exists = await mongoose.models.PostSubCategorie.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

PostSubCategorieSchema.pre<IPostSubCategorie>('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugifyName(this.name);
  }
  next();
});

PostSubCategorieSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'postSubCategorie',
  count: true
});

PostSubCategorieSchema.set('toJSON', { virtuals: true });
PostSubCategorieSchema.set('toObject', { virtuals: true });

const PostSubCategorie: Model<IPostSubCategorie> =
  mongoose.models.PostSubCategorie ||
  mongoose.model<IPostSubCategorie>('PostSubCategorie', PostSubCategorieSchema);

export default PostSubCategorie;
