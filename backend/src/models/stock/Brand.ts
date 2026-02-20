// models/Brand.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";

export interface IBrand extends Document {
  reference: string;
  name: string;
  slug: string;
  place: string;
  description?: string | null;
  imageUrl?: string;
  imageId?: string;
  logoUrl?: string;
  logoId?: string;
  vadmin: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const generateBrandRef = (): string => {
  const prefix = "br";
  const suffix = crypto
    .randomBytes(3)           
    .toString("hex")
    .toLowerCase();
  return prefix + suffix;    
};

const slugifyBrandName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const BrandSchema = new Schema<IBrand>(
  {
    name:      { type: String, required: true, unique: true },
    reference: { type: String, required: true, unique: true },
    slug:      { type: String, unique: true },
    place:     { type: String },
    description: { type: String, default: null },
    imageUrl:  { type: String, default: null },
    imageId:   { type: String, default: null },
    logoUrl:   { type: String, default: null },
    logoId:    { type: String, default: null },
    vadmin:      { type: String, default: "not-approve" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "DashboardUser",
      required: true,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "DashboardUser" },
  },
  {
    timestamps: true,
  }
);

// Slugify whenever the name changes
BrandSchema.pre<IBrand>("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugifyBrandName(this.name);
  }
  next();
});

// Auto-generate a unique reference on creation
BrandSchema.pre<IBrand>("validate", async function (next) {
  if (this.isNew) {
    let ref: string;
    let exists: IBrand | null;
    do {
      ref = generateBrandRef();
      exists = await mongoose.models.Brand.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema);

export default Brand;
