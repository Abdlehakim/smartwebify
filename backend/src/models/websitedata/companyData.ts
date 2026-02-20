// models/websitedata/companyData.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyData extends Document {
  name: string;
  bannerImageUrl: string;
  bannerImageId: string;
  logoImageUrl: string;
  logoImageId: string;
  contactBannerUrl?: string;
  contactBannerId?: string;
  description: string;
  email: string;
  phone: string;
  vat: string;           
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
}

const companyDataSchema = new Schema<ICompanyData>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bannerImageUrl: {
      type: String,
      required: true,
    },
    bannerImageId: {
      type: String,
      required: true,
    },
    logoImageUrl: {
      type: String,
      required: true,
    },
    logoImageId: {
      type: String,
      required: true,
    },
    contactBannerUrl: {
      type: String,
      required: false,
    },
    contactBannerId: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    vat: {               
      type: String,
      required: true,
      trim: true,
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
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent creating more than one document
companyDataSchema.pre('save', async function (next) {
  const Model = this.constructor as Model<ICompanyData>;
  if (this.isNew) {
    const count = await Model.countDocuments();
    if (count > 0) {
      return next(new Error('CompanyData already exists. Use update instead.'));
    }
  }
  next();
});

const CompanyData: Model<ICompanyData> =
  mongoose.models.CompanyData ||
  mongoose.model<ICompanyData>('CompanyData', companyDataSchema);

export default CompanyData;
