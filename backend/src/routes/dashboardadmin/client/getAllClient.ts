// src/routes/dashboardadmin/client/getAllClient.ts

import express, { Request, Response } from 'express';
import Client from '@/models/Client';
import { requirePermission } from '@/middleware/requireDashboardPermission';

const router = express.Router();

/**
 * GET /api/dashboardadmin/client/getAllClient
 * Returns all client accounts (excluding passwords).
 */
router.get(
  '/',
  requirePermission('M_Access'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const clients = await Client.find().select('-password');
      res.status(200).json({ clients });
    } catch (error) {
      console.error('Get Clients Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;