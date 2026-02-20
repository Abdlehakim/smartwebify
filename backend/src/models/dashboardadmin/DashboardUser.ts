import mongoose, { Document, Model, Schema } from 'mongoose';
 import bcrypt from "bcryptjs";

export interface IDashboardUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  phone: string;
  email: string;
  password: string;
  role: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt?: Date;   // ← added for timestamps typings
  updatedAt?: Date;   // ← added for timestamps typings
}

const DashboardUserSchema: Schema<IDashboardUser> = new Schema<IDashboardUser>(
  {
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: { type: String, required: true },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DashboardRole',
      required: true,
    },
  },
  { timestamps: true }
);

// Hash password when modified
DashboardUserSchema.pre<IDashboardUser>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Ensure only one SuperAdmin
DashboardUserSchema.pre<IDashboardUser>('validate', async function (next) {
  try {
    const roleDoc: any = await mongoose.model('DashboardRole').findById(this.role);
    if (roleDoc && roleDoc.name === 'SuperAdmin') {
      const count = await mongoose
        .model('DashboardUser')
        .countDocuments({ role: this.role, _id: { $ne: this._id } });
      if (count > 0) return next(new Error('Only one SuperAdmin user is allowed.'));
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

DashboardUserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

const DashboardUser: Model<IDashboardUser> =
  mongoose.models.DashboardUser || mongoose.model<IDashboardUser>('DashboardUser', DashboardUserSchema);

export default DashboardUser;
