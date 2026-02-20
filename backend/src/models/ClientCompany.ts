/* ------------------------------------------------------------------
   models/ClientCompany.ts
   Schéma Mongoose (TypeScript) pour les « clients entreprise ».
------------------------------------------------------------------ */
import mongoose, { Document, Model, Schema } from "mongoose";

/* ---------- interface ---------- */
export interface IClientCompany extends Document {
  _id: mongoose.Types.ObjectId;
  /** Raison sociale de l’entreprise (obligatoire) */
  companyName: string;
  /** Contact principal (optionnel) */
  contactName?: string;
  /** Téléphone (obligatoire) */
  phone: string;
  /** E‑mail (optionnel) */
  email?: string;
  /** Numéro TVA ou identifiant fiscal (optionnel) */
  vatNumber?: string;
}

/* ---------- schema ---------- */
const ClientCompanySchema: Schema<IClientCompany> =
  new Schema<IClientCompany>(
    {
      companyName: {
        type: String,
        required: true,
        trim: true,
      },
      contactName: {
        type: String,
        required: false,
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
      vatNumber: {
        type: String,
        required: false,
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* ---------- model ---------- */
const ClientCompany: Model<IClientCompany> = mongoose.model<IClientCompany>(
  "ClientCompany",
  ClientCompanySchema
);

export default ClientCompany;
