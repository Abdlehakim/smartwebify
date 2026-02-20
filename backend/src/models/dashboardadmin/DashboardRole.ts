///models/dashboardadmin/DashboardRole
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDashboardRole extends Document {
  name: string;
  description?: string;
  permissions?: string[];
}

const DashboardRoleSchema: Schema<IDashboardRole> = new Schema<IDashboardRole>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

const DashboardRole: Model<IDashboardRole> = mongoose.model<IDashboardRole>(
  'DashboardRole',
  DashboardRoleSchema
);

export default DashboardRole;
