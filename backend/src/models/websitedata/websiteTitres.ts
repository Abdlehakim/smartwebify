// models/websitedata/websiteTitres.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IwebsiteTitres extends Document {
  SimilarProductTitre: string;
  SimilarProductSubTitre: string;
}

const websiteTitresSchema = new Schema<IwebsiteTitres>(
  {
    SimilarProductTitre:    { type: String, required: true, unique: true },
    SimilarProductSubTitre: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const WebsiteTitres: Model<IwebsiteTitres> =
  mongoose.models.WebsiteTitres ||
  mongoose.model<IwebsiteTitres>('WebsiteTitres', websiteTitresSchema);

export default WebsiteTitres;
