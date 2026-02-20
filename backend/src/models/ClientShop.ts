
/* ------------------------------------------------------------------
   models/ClientShop.ts
   Schéma Mongoose (TypeScript) pour les « clients magasin ».
------------------------------------------------------------------ */
import mongoose, { Document, Model, Schema } from "mongoose";

/* ---------- interface ---------- */
export interface IClientShop extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
}

/* ---------- schema ---------- */
const ClientShopSchema: Schema<IClientShop> = new Schema<IClientShop>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Adresse e‑mail invalide"],
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- model ---------- */
const ClientShop: Model<IClientShop> = mongoose.model<IClientShop>(
  "ClientShop",
  ClientShopSchema
);

export default ClientShop;
