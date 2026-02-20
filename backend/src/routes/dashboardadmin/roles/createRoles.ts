import { Router, Request, Response } from 'express';
import cookieParser from 'cookie-parser';

// Models
import DashboardRole, { IDashboardRole } from '@/models/dashboardadmin/DashboardRole';
import { requirePermission } from "@/middleware/requireDashboardPermission";


const router = Router();
router.use(cookieParser());

/**
 * POST /dashboardRole/create
 * Creates a new DashboardRole. (No role verification anymore)
 */
router.post('/create',
  
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Role name is required.' });
      return;
    }

    // Create and save new role
    const newRole = new DashboardRole({
      name,
      description,
      permissions,
    } as IDashboardRole);

    await newRole.save();

    res.status(201).json({
      message: 'Role created successfully.',
      role: newRole,
    });
  } catch (error) {
    console.error('Create DashboardRole Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
