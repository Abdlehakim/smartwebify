// initSuperAdmin.ts
import DashboardUser from '@/models/dashboardadmin/DashboardUser';
import DashboardRole from '@/models/dashboardadmin/DashboardRole';

async function createSuperAdminAccount(): Promise<void> {
  try {
    // Retrieve the SuperAdmin role document
    const superAdminRole = await DashboardRole.findOne({ name: 'SuperAdmin' });
    if (!superAdminRole) {
      console.error("SuperAdmin role not found. Please ensure you have initialized default roles.");
      return;
    }

    // Check if a user with the SuperAdmin role already exists
    const existingSuperAdmin = await DashboardUser.findOne({ role: superAdminRole._id });
    if (existingSuperAdmin) {
      console.log("SuperAdmin account already exists. Skipping creation.");
      return;
    }

    // Define credentials for the SuperAdmin account (use env variables or defaults)
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD ;
    const username = process.env.SUPER_ADMIN_USERNAME;
    const phone = process.env.SUPER_ADMIN_PHONE;


    const newSuperAdmin = new DashboardUser({
      email,
      password, 
      username,
      phone,
      role: superAdminRole._id,
    });

    await newSuperAdmin.save();
    console.log("SuperAdmin account created successfully.");
  } catch (error) {
    console.error("Error creating SuperAdmin account:", error);
  }
}

export default createSuperAdminAccount;
