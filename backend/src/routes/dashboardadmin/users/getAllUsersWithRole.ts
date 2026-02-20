// routes/dashboardadmin/users/getAllUsersWithRole.ts

import { Router, Request, Response } from "express";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";
import DashboardRole from "@/models/dashboardadmin/DashboardRole";
import { requirePermission } from "@/middleware/requireDashboardPermission";


const router = Router();

/**
 * GET /api/dashboardadmin/users-with-role
 * Returns all dashboard users (role populated) except those with SuperAdmin.
 */
router.get("/", 
  requirePermission('M_Access'),
  async (_req: Request, res: Response) => {
  try {
    /* 1. Find the SuperAdmin role _id (if it exists) */
    const superAdminRole = await DashboardRole.findOne({ name: "SuperAdmin" }, "_id");

    /* 2. Build a criteria object that excludes that role */
    const criteria =
      superAdminRole ? { role: { $ne: superAdminRole._id } } : {}; // if role missing, no exclusion

    /* 3. Query users, hide password, populate role */
    const users = await DashboardUser.find(criteria, { password: 0 }).populate("role");

    res.json({ users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
