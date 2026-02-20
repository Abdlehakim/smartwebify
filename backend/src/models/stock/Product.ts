// src/models/stock/Product.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";

/* ------------------------------------------------------------------ */
/* Interfaces                                                         */
/* ------------------------------------------------------------------ */
export interface IProduct extends Document {
  name: string;
  info: string;
  description?: string;

  reference: string;
  slug: string;

  categorie: Types.ObjectId;
  subcategorie?: Types.ObjectId | null;
  magasin?: Types.ObjectId | null;
  brand?: Types.ObjectId | null;

  stock: number;
  price: number;
  tva: number;
  discount: number;

  stockStatus: "in stock" | "out of stock";
  statuspage: "none" | "new-products" | "promotion" | "best-collection";
  vadmin: "not-approve" | "approve";

  mainImageUrl: string;
  mainImageId?: string;
  extraImagesUrl: string[];
  extraImagesId: string[];

  nbreview: number;
  averageRating: number;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  attributes: {
    attributeSelected: Types.ObjectId;
    value?:
      | string
      | Array<{
          name: string;
          value?: string;
          hex?: string;
          image?: string;
          imageId?: string;
        }>;
  }[];

  productDetails: {
    name: string;
    description?: string;
    image?: string;
    imageId?: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const generateProductReference = () =>
  "pr" + crypto.randomBytes(3).toString("hex").toLowerCase();

const slugify = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

/* ------------------------------------------------------------------ */
/* Schema                                                             */
/* ------------------------------------------------------------------ */
const ProductSchema = new Schema<IProduct>(
  {
    /* ------------ basics ------------ */
    name: { type: String, unique: true, required: true },
    info: { type: String },
    description: { type: String },

    reference: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },

    categorie: { type: Schema.Types.ObjectId, ref: "Categorie", required: true },
    subcategorie: { type: Schema.Types.ObjectId, ref: "SubCategorie", default: null },
    magasin: { type: Schema.Types.ObjectId, ref: "Magasin", default: null },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", default: null },

    stock: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    tva: { type: Number, default: 0, min: 0, max: 100 },
    discount: { type: Number, default: 0, min: 0, max: 100 },

    stockStatus: { type: String, enum: ["in stock", "out of stock"], default: "in stock" },
    statuspage: { type: String, enum: ["none", "new-products", "promotion", "best-collection"], default: "none" },
    vadmin: { type: String, enum: ["not-approve", "approve"], default: "not-approve" },

    /* ------------ images ------------ */
    mainImageUrl: { type: String, required: true },
    mainImageId: { type: String, default: null },
    extraImagesUrl: { type: [String], default: [] },
    extraImagesId: { type: [String], default: [] },

    /* ------------ ratings ----------- */
    nbreview: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },

    /* ------------ users ------------- */
    createdBy: { type: Schema.Types.ObjectId, ref: "DashboardUser", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "DashboardUser", default: null },

    /* ------------ dynamic attributes ------------ */
    attributes: [
      {
        attributeSelected: {
          type: Schema.Types.ObjectId,
          ref: "ProductAttribute",
          required: true,
        },
        
        value: {
          type: [
            {
              name: { type: String, required: true },
              value: { type: String },
              hex: { type: String },
              image: { type: String },
              imageId: { type: String },
            },
          ],
          required: false,
          validate: {
            validator(v: any) {
              /* absent or null is now allowed */
              if (v === undefined || v === null) return true;

              /* plain string */
              if (typeof v === "string") return v.trim().length > 0;

              /* array of objects */
              if (Array.isArray(v)) {
                if (v.length === 0) return false;

                return v.every((p) => {
                  if (!p || typeof p.name !== "string" || p.name.trim().length === 0) {
                    return false;
                  }

                  const hasPayload =
                    (typeof p.value === "string" && p.value.trim().length > 0) ||
                    (typeof p.hex === "string" && p.hex.trim().length > 0) ||
                    (typeof p.image === "string" && p.image.trim().length > 0) ||
                    (typeof p.imageId === "string" && p.imageId.trim().length > 0);

                  return true || hasPayload;
                });
              }

              return false; // any other datatype rejected
            },
            message:
              "When provided, each attribute row needs a name plus at least one of value, hex, image, or imageId.",
          },
        },
      },
    ],

    /* ------------ product details ------------ */
    productDetails: [
      {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: null, trim: true },
        image: { type: String, default: null },
        imageId: { type: String, default: null }, // ← NEW FIELD
      },
    ],
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Hooks                                                              */
/* ------------------------------------------------------------------ */
ProductSchema.pre<IProduct>("validate", async function (next) {
  if (this.isNew) {
    let ref: string;
    let exists: IProduct | null;
    do {
      ref = generateProductReference();
      exists = await mongoose.models.Product.findOne({ reference: ref });
    } while (exists);
    this.reference = ref;
  }
  next();
});

ProductSchema.pre<IProduct>("save", function (next) {
  if (this.isModified("name")) this.slug = slugify(this.name);
  next();
});

/* virtual: review count */
ProductSchema.virtual("reviewCount", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
  count: true,
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

/* ------------------------------------------------------------------ */
/* Model                                                              */
/* ------------------------------------------------------------------ */
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
