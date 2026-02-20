// models/SubCategorie.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import crypto from 'crypto';

export interface ISubCategorie extends Document {
  reference: string;
  name: string;
  slug: string;
  iconUrl: string;
  iconId?: string;
  imageUrl: string;
  imageId?: string;
  bannerUrl: string;
  bannerId?: string;
  vadmin: string;
  productCount?: number;

  categorie: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const generateSubCategorieRef = (): string => {
  const prefix = 'sc';
  const suffix = crypto
    .randomBytes(3)
    .toString('hex')
    .toLowerCase();
  return prefix + suffix;
};

const slugifySubCategorieName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

const SubCategorieSchema = new Schema<ISubCategorie>(
  {
    reference:   { type: String, required: true, unique: true },
    name:        { type: String, required: true, unique: true },
    slug:        { type: String, unique: true },
    iconUrl:     { type: String, default: null, required: true },
    iconId:      { type: String, default: null },
    imageUrl:    { type: String, default: null, required: true },
    imageId:     { type: String, default: null },
    bannerUrl:   { type: String, default: null, required: true },
    bannerId:    { type: String, default: null },
    vadmin:      { type: String, default: 'not-approve' },
    categorie:   { type: Schema.Types.ObjectId, ref: 'Categorie', required: true },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'DashboardUser', required: true },
    updatedBy:   { type: Schema.Types.ObjectId, ref: 'DashboardUser' },
  },
  { timestamps: true }
);

// Auto-generate a unique "scXXXXXX" reference before validation
SubCategorieSchema.pre<ISubCategorie>('validate', async function (next) {
  if (this.isNew) {
    let ref: string;
    let exists: ISubCategorie | null;
    do {
      ref = generateSubCategorieRef();
      exists = await mongoose.models.SubCategorie.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

// Slugify on name change
SubCategorieSchema.pre<ISubCategorie>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugifySubCategorieName(this.name);
  }
  next();
});

// Virtual to count products in this subcategory
SubCategorieSchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'subcategorie',
  count: true
});

// Include virtuals when converting to JSON or objects
SubCategorieSchema.set('toJSON', { virtuals: true });
SubCategorieSchema.set('toObject', { virtuals: true });

const SubCategorie: Model<ISubCategorie> =
  mongoose.models.SubCategorie ||
  mongoose.model<ISubCategorie>('SubCategorie', SubCategorieSchema);

export default SubCategorie;
