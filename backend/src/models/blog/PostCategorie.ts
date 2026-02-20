import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import crypto from 'crypto';

export interface IPostCategorie extends Document {
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
  subCategorieCount?: number;
  postCount?: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const generateCategorieRef = (): string => {
  const prefix = 'pc';
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return prefix + suffix;
};

const slugifyCategorieName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

const PostCategorieSchema = new Schema<IPostCategorie>(
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'DashboardUser', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'DashboardUser', default: null }
  },
  { timestamps: true }
);

PostCategorieSchema.pre<IPostCategorie>('validate', async function(next) {
  if (this.isNew) {
    let ref: string;
    let exists: IPostCategorie | null;
    do {
      ref = generateCategorieRef();
      exists = await mongoose.models.PostCategorie.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

PostCategorieSchema.pre<IPostCategorie>('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugifyCategorieName(this.name);
  }
  next();
});

PostCategorieSchema.virtual('subCategorieCount', {
  ref: 'PostSubCategorie',
  localField: '_id',
  foreignField: 'postCategorie',
  count: true
});

PostCategorieSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'postCategorie',
  count: true
});

PostCategorieSchema.set('toJSON', { virtuals: true });
PostCategorieSchema.set('toObject', { virtuals: true });

const PostCategorie: Model<IPostCategorie> =
  mongoose.models.PostCategorie ||
  mongoose.model<IPostCategorie>('PostCategorie', PostCategorieSchema);

export default PostCategorie;