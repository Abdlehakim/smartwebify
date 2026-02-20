// models/websitedata/specialPageBanner.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISpecialPageBanner extends Document {
  // Best-Collection
  BCbannerImgUrl: string;
  BCbannerImgId: string;
  BCbannerTitle: string;

  // Promotion
  PromotionBannerImgUrl: string;
  PromotionBannerImgId: string;
  PromotionBannerTitle: string;

  // new-products
  NPBannerImgUrl: string;
  NPBannerImgId: string;
  NPBannerTitle: string;

  // Blog
  BlogBannerImgUrl: string;
  BlogBannerImgId: string;
  BlogBannerTitle: string;

  // Contact
  ContactBannerImgUrl: string;
  ContactBannerImgId: string;
  ContactBannerTitle: string;
}

const SpecialPageBannerSchema = new Schema<ISpecialPageBanner>(
  {
    /* ------------------------ Best-Collection ------------------------- */
    BCbannerImgUrl: {
      type: String,
      required: true,
      unique: true,
    },
    BCbannerImgId: {
      type: String,
      required: true,
      unique: true,
    },
    BCbannerTitle: {
      type: String,
      required: true,
      unique: true,
    },

    /* --------------------------- Promotion ---------------------------- */
    PromotionBannerImgUrl: {
      type: String,
      required: true,
      unique: true,
    },
    PromotionBannerImgId: {
      type: String,
      required: true,
      unique: true,
    },
    PromotionBannerTitle: {
      type: String,
      required: true,
      unique: true,
    },

    /* ------------------------ new-products ---------------------------- */
    NPBannerImgUrl: {
      type: String,
      required: true,
      unique: true,
    },
    NPBannerImgId: {
      type: String,
      required: true,
      unique: true,
    },
    NPBannerTitle: {
      type: String,
      required: true,
      unique: true,
    },

    /* ----------------------------- Blog ------------------------------ */
    BlogBannerImgUrl: {
      type: String,
      required: true,
      unique: true,
    },
    BlogBannerImgId: {
      type: String,
      required: true,
      unique: true,
    },
    BlogBannerTitle: {
      type: String,
      required: true,
      unique: true,
    },

    /* ---------------------------- Contact ---------------------------- */
    ContactBannerImgUrl: {
      type: String,
      required: true,
      unique: true,
    },
    ContactBannerImgId: {
      type: String,
      required: true,
      unique: true,
    },
    ContactBannerTitle: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const SpecialPageBanner: Model<ISpecialPageBanner> =
  mongoose.models.SpecialPageBanner ||
  mongoose.model<ISpecialPageBanner>('SpecialPageBanner', SpecialPageBannerSchema);

export default SpecialPageBanner;
