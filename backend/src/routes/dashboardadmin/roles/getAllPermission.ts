import { Router, Request, Response } from 'express';
import PermissionModel from '@/models/dashboardadmin/Permission';
import { requirePermission } from "@/middleware/requireDashboardPermission";


const router = Router();

/**
 * GET /api/dashboardadmin/getAllPermission
 * Returns a list of all permission keys in the database
 */

router.get('/',
  requirePermission("M_Access"),
   async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Fetch all permission documents
    const permissionsDocs = await PermissionModel.find({});
    // 2) Extract just the "key" from each document
    const permissions = permissionsDocs.map((doc) => doc.key);

    // 3) Respond with the permission keys
    res.json({ permissions });
  } catch (error) {
    console.error('Get All Permissions Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
