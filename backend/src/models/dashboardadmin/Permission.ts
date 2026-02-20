// models/Permission.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermission extends Document {
  key: string;
}

const PermissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const PermissionModel: Model<IPermission> = mongoose.model<IPermission>(
  'Permission',
  PermissionSchema
);

export default PermissionModel;
