/* ------------------------------------------------------------------
   models/Address.ts
   Adresses pouvant pointer vers Client, ClientShop ou ClientCompany
   (sans champ `clientModel`)
------------------------------------------------------------------ */
import mongoose, { Schema, Document, Model } from "mongoose";
import { IClient } from "./Client";
import { IClientShop } from "./ClientShop";
import { IClientCompany } from "./ClientCompany";

/* ---------- interface ---------- */
export interface IAddress extends Document {
  Name: string;
  StreetAddress: string;
  Country: string;
  Province?: string;
  City: string;
  PostalCode: string;
  Phone: string;

  /** ID brut ou document peuplé issu de l’un des trois modèles */
  client: mongoose.Types.ObjectId | IClient | IClientShop | IClientCompany;

  createdAt?: Date;
  updatedAt?: Date;
}

/* ---------- schema ---------- */
const AddressSchema: Schema<IAddress> = new Schema<IAddress>(
  {
    Name: { type: String, required: true },
    StreetAddress: { type: String, required: true },
    Country: { type: String, required: true },
    Province: { type: String },
    City: { type: String, required: true },
    PostalCode: { type: String, required: true },
    Phone: { type: String, required: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

/* ---------- model ---------- */
const Address: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>("Address", AddressSchema);

export default Address;
