// updateAddressById.ts

import { Router, Request, Response, NextFunction } from 'express';
import Address from '@/models/Address';
import { authenticateToken } from '@/middleware/authenticateToken';

const router = Router();

// PUT /api/client/address/updateAddress/:id
router.put(
  '/updateAddress/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const address = await Address.findOne({ _id: id, client: userId });
      if (!address) {
        res.status(404).json({ error: 'Address not found' });
        return;
      }

      address.Name = req.body.Name ?? address.Name;
      address.StreetAddress = req.body.StreetAddress ?? address.StreetAddress;
      address.Country = req.body.Country ?? address.Country;
      address.Province = req.body.Province ?? address.Province;
      address.City = req.body.City ?? address.City;
      address.PostalCode = req.body.PostalCode ?? address.PostalCode;
      address.Phone = req.body.Phone ?? address.Phone;  // ← added phone update

      await address.save();
      res.status(200).json({ message: 'Address updated successfully', address });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
