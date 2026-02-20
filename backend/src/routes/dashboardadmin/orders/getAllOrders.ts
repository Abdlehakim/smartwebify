///src/routes/dashboardadmin/orders/getAllOrders.ts



import express, { Request, Response } from 'express';
import Order from '@/models/Order';
import { requirePermission } from '@/middleware/requireDashboardPermission';

const router = express.Router();

/**
 * GET /api/dashboardadmin/orders
 */

router.get(
  '/',
  requirePermission('M_Access'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await Order.find()
      .sort({ createdAt: -1 })
        .populate('client')
      res.status(200).json({ orders });
    } catch (error) {
      console.error('Get Orders Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
