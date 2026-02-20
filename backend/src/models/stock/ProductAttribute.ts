// src/models/stock/ProductAttribute.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ---------- types ---------- */
export type AttributeType = "dimension" | "color" | "other type";

export interface IProductAttribute extends Document {
  name: string;
  type: AttributeType | AttributeType[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ---------- schema ---------- */
const ALLOWED: AttributeType[] = ["dimension", "color", "other type"];

const ProductAttributeSchema = new Schema<IProductAttribute>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // accept a single string or an array of strings
    type: {
      type: [String],
      required: true,
      enum: ALLOWED,
      validate: {
        validator: (v: string | string[]) =>
          Array.isArray(v) ? v.length > 0 : ALLOWED.includes(v as AttributeType),
        message:
          "Type must include at least one of 'dimension', 'color', or 'other type'.",
      },
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "DashboardUser",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "DashboardUser",
    },
  },
  { timestamps: true }
);

/* ---------- model ---------- */
const ProductAttribute: Model<IProductAttribute> =
  mongoose.models.ProductAttribute ||
  mongoose.model<IProductAttribute>("ProductAttribute", ProductAttributeSchema);

export default ProductAttribute;
