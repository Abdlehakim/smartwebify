// scripts/initRoles.ts

import DashboardRole from '@/models/dashboardadmin/DashboardRole';
import PermissionModel from '@/models/dashboardadmin/Permission';

/**
 * Creates or updates the "SuperAdmin" role with all permissions.
 * Clears permissions for all other roles unconditionally.
 */
export async function initializeDefaultRoles() {
  const allPermissionDocs = await PermissionModel.find({});
  const allPermissionKeys = allPermissionDocs.map((doc) => doc.key);

  const superAdminData = {
    name: 'SuperAdmin',
    description: 'The super admin role (only one allowed)',
    permissions: allPermissionKeys,
  };

  // Handle SuperAdmin role
  let superAdminRole = await DashboardRole.findOne({ name: superAdminData.name });

  if (!superAdminRole) {
    superAdminRole = new DashboardRole(superAdminData);
    await superAdminRole.save();
    console.log(`✅ Created default role: ${superAdminData.name}`);
  } else {
    superAdminRole.description = superAdminData.description;
    superAdminRole.permissions = superAdminData.permissions;
    await superAdminRole.save();
    console.log(`🔄 Updated existing role: ${superAdminData.name}`);
  }

  // Clear permissions for all other roles
  const otherRoles = await DashboardRole.find({ name: { $ne: 'SuperAdmin' } });
  for (const role of otherRoles) {
    role.permissions = [];
    await role.save();
    console.log(`🧹 Cleared permissions for role: ${role.name}`);
  }
}
