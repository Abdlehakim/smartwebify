// models/websitedata/homePageData.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IhomePageData extends Document {
  HPbannerImgUrl: string;
  HPbannerImgId: string;
  HPbannerTitle: string;
  HPcategorieTitle: string;
  HPcategorieSubTitle: string;
  HPbrandTitle: string;
  HPbrandSubTitle: string;
  HPmagasinTitle: string;
  HPmagasinSubTitle: string;
  HPNewProductTitle: string;
  HPNewProductSubTitle: string;
  HPPromotionTitle: string;
  HPPromotionSubTitle: string;
  HPBestCollectionTitle: string;
  HPBestCollectionSubTitle: string;
}

const homePageDataSchema = new Schema<IhomePageData>(
  {
    HPbannerImgUrl:        { type: String, required: true, unique: true },
    HPbannerImgId:         { type: String, required: true, unique: true },
    HPbannerTitle:         { type: String, required: true, unique: true },
    HPcategorieTitle:      { type: String, required: true, unique: true },
    HPcategorieSubTitle:   { type: String, required: true, unique: true },
    HPbrandTitle:          { type: String, required: true, unique: true },
    HPbrandSubTitle:       { type: String, required: true, unique: true },
    HPmagasinTitle:       { type: String, required: true, unique: true },
    HPmagasinSubTitle:    { type: String, required: true, unique: true },
    HPNewProductTitle:     { type: String, required: true, unique: true },
    HPNewProductSubTitle:  { type: String, required: true, unique: true },
    HPPromotionTitle:      { type: String, required: true, unique: true },
    HPPromotionSubTitle:   { type: String, required: true, unique: true },
    HPBestCollectionTitle: { type: String, required: true, unique: true },
    HPBestCollectionSubTitle: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);


const HomePageData: Model<IhomePageData> =
  mongoose.models.HomePageData ||
  mongoose.model<IhomePageData>('HomePageData', homePageDataSchema);

export default HomePageData;
