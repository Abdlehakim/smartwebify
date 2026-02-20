// src/routes/dashboardadmin/client

import express, { Request, Response } from 'express';
import Client from '@/models/Client';
import { requirePermission } from '@/middleware/requireDashboardPermission';

const router = express.Router();

/**
 * DELETE /api/dashboardadmin/client/delete/:id
 * Delete a client by ID.
 */
router.delete(
  '/delete/:id',
  requirePermission('M_Access'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const client = await Client.findByIdAndDelete(id);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Delete Client Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
