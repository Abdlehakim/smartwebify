// src/models/stock/Categorie.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";

export interface ICategorie extends Document {
  reference: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  iconId?: string | null;
  imageUrl?: string | null;
  imageId?: string | null;
  bannerUrl?: string | null;
  bannerId?: string | null;
  vadmin: "approve" | "not-approve";
  subCategorieCount?: number;
  productCount?: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const generateCategorieRef = (): string => {
  const prefix = "ca";
  const suffix = crypto
    .randomBytes(3)  // 3 bytes → 6 hex chars
    .toString("hex")
    .toUpperCase();
  return prefix + suffix;  // e.g. "caA1B2C3"
};

const slugifyCategorieName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const CategorieSchema = new Schema<ICategorie>(
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
    vadmin:      { type: String, enum: ["approve", "not-approve"], default: "not-approve" },
    createdBy:   { type: Schema.Types.ObjectId, ref: "DashboardUser", required: true },
    updatedBy:   { type: Schema.Types.ObjectId, ref: "DashboardUser", default: null },
  },
  { timestamps: true }
);

// Auto-generate a unique reference on new docs
CategorieSchema.pre<ICategorie>("validate", async function (next) {
  if (this.isNew) {
    let ref: string;
    let exists: ICategorie | null;
    do {
      ref = generateCategorieRef();
      exists = await mongoose.models.Categorie.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

// Slugify on name change when saving
CategorieSchema.pre<ICategorie>("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugifyCategorieName(this.name);
  }
  next();
});

// Recompute slug when using findOneAndUpdate / findByIdAndUpdate
CategorieSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update?.name) {
    update.slug = slugifyCategorieName(update.name);
    this.setUpdate(update);
  }
  next();
});

// Count related subcategories
CategorieSchema.virtual("subCategorieCount", {
  ref: "SubCategorie",
  localField: "_id",
  foreignField: "categorie",
  count: true,
});

// —— Count related products —— 
CategorieSchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "categorie",
  count: true,
});

// Include virtuals in JSON and object output
CategorieSchema.set("toJSON", { virtuals: true });
CategorieSchema.set("toObject", { virtuals: true });

const Categorie: Model<ICategorie> =
  mongoose.models.Categorie ||
  mongoose.model<ICategorie>("Categorie", CategorieSchema);

export default Categorie;
