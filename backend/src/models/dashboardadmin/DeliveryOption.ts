// ───────────────────────────────────────────────────────────────
// src/models/checkout/DeliveryOption.ts
// ───────────────────────────────────────────────────────────────
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDeliveryOption extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  estimatedDays: number;
  isActive: boolean;

  /** ⇩ NOUVEAU : retrait en magasin ? */
  isPickup: boolean;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

const DeliveryOptionSchema = new Schema<IDeliveryOption>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDays: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    isPickup: {
      type: Boolean,
      default: false,
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

const DeliveryOption: Model<IDeliveryOption> =
  mongoose.models.DeliveryOption ||
  mongoose.model<IDeliveryOption>("DeliveryOption", DeliveryOptionSchema);

export default DeliveryOption;