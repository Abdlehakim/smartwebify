import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import DashboardUser from '@/models/dashboardadmin/DashboardUser';
import DashboardRole from '@/models/dashboardadmin/DashboardRole';
import { requirePermission } from '@/middleware/requireDashboardPermission';

const router = Router();

/**
 * PUT /api/dashboardadmin/roles/:userId
 */
router.put(
  '/:userId',
  requirePermission('M_Access'),
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(roleId)) {
      res.status(400).json({ message: 'Invalid userId or roleId.' });
      return;
    }

    try {
      const role = await DashboardRole.findById(roleId);
      if (!role) {
        res.status(404).json({ message: 'Role not found.' });
        return;
      }

      /* Block SuperAdmin assignment */
      if (role.name === 'SuperAdmin') {
        const user = await DashboardUser.findById(userId).populate('role');
        res.json({
          message: 'No change: SuperAdmin role is reserved and was not assigned.',
          user,
        });
        return;
      }

      /* Update user’s role */
      const updatedUser = await DashboardUser.findByIdAndUpdate(
        userId,
        { role: roleId },
        { new: true }
      ).populate('role');

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      res.json({ message: 'User role updated.', user: updatedUser });
      return;
    } catch (err) {
      console.error('updateUserRole error:', err);
      res.status(500).json({ message: 'Internal server error.' });
      return;
    }
  }
);

export default router;
