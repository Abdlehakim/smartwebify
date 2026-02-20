// src/models/payment/PaymentMethods.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  PAYMENT_METHOD_KEYS,
  PaymentMethodKey,
} from "@/constants/paymentMethodsData";

/* ---------- interface ---------- */
export interface IPaymentMethod extends Document {
  name: PaymentMethodKey;
  enabled: boolean;
  label?: string;
  help?: string;
  payOnline: boolean;
  requireAddress: boolean;
}

const paymentSettingschema = new Schema<IPaymentMethod>(
  {
    name: {
      type: String,
      enum: PAYMENT_METHOD_KEYS,
      required: true,
      unique: true,
    },
    enabled: { type: Boolean, required: true, default: false },
    label: { type: String, trim: true, default: "" },
    help: { type: String, trim: true, default: "" },

    payOnline: { type: Boolean, required: true, default: false, index: true },

    requireAddress: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", paymentSettingschema);

export default PaymentMethod;
