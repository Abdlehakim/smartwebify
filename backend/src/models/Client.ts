// models/Client.ts
import mongoose, { Document, Model, Schema } from 'mongoose';
 import bcrypt from "bcryptjs";

// Interface for the Client document
export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  username?: string;
  phone?: string;
  email: string;
  password?: string;
  isGoogleAccount?: boolean;  // Flag to differentiate OAuth accounts
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ClientSchema: Schema<IClient> = new Schema<IClient>(
  {
    username: { type: String, required: false },
    phone: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      // Only required for non-OAuth users
      required: function (this: IClient) { return !this.isGoogleAccount; },
    },
    isGoogleAccount: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash the password if it is modified or if it exists
ClientSchema.pre<IClient>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords for non-OAuth accounts
ClientSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const Client: Model<IClient> = mongoose.model<IClient>('Client', ClientSchema);

export default Client;
