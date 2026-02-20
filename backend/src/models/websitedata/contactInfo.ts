// models/websitedata/contactInfo.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContactInfo extends Document {
  name: string;
  email: string;
  phone: number;
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

const contactInfoSchema = new Schema<IContactInfo>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    zipcode: {
      type: String,
      required: true,
      trim: true,
    },
    governorate: {
      type: String,
      required: true,
      trim: true,
    },
    facebook: {
      type: String,
      required: true,
      trim: true,
    },
    linkedin: {
      type: String,
      required: true,
      trim: true,
    },
    instagram: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const ContactInfo: Model<IContactInfo> =
  mongoose.models.ContactInfo ||
  mongoose.model<IContactInfo>("ContactInfo", contactInfoSchema);

export default ContactInfo;
