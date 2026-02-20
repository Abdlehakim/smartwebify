// scripts/createOrUpdatePermissions.ts

import PermissionModel from '@/models/dashboardadmin/Permission';
import { PERMISSIONS, isValidPermission } from '@/constants/permissions';

/**
 * Synchronize permission constants with the database.
 * Returns true if any change was made.
 */
export async function createOrUpdatePermissions(): Promise<boolean> {
  const permissionKeys = Object.values(PERMISSIONS);
  let changesMade = false;

  for (const key of permissionKeys) {
    const exists = await PermissionModel.exists({ key });
    if (!exists) {
      await PermissionModel.create({ key });
      console.log(`Inserted new permission: ${key}`);
      changesMade = true;
    }
  }

  const dbPermissions = await PermissionModel.find({});
  for (const dbPermission of dbPermissions) {
    if (!isValidPermission(dbPermission.key)) {
      await PermissionModel.deleteOne({ _id: dbPermission._id });
      console.log(`Removed stale permission: ${dbPermission.key}`);
      changesMade = true;
    }
  }

  if (changesMade) {
    console.log('✅ Permissions synced with database.');
  } else {
    console.log('✅ No permission changes needed. Skipped update.');
  }

  return changesMade;
}
