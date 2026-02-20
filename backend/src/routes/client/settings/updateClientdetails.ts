// src/routes/client/settings/updateClientdetails.ts
import { Router, Request, Response } from 'express';
import Client from '@/models/Client';
import { authenticateToken } from '@/middleware/authenticateToken';

interface AuthRequest extends Request {
  user: { id: string };
}

const router = Router();

// Assurez‑vous d’avoir monté express.json() avant ce router
//    app.use(express.json());
//    app.use('/api/clientSetting', router);

router.put(
  '/update',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // on cast ici pour récupérer user.id
      const authReq = req as AuthRequest;
      const userId = authReq.user.id;

      const { username, email, phone } = req.body;

      // récupérer l’existant pour lire isGoogleAccount
      const existing = await Client.findById(userId);
      if (!existing) {
        res.status(404).json({ error: 'Utilisateur introuvable.' });
        return;
      }

      // construire l’objet d’updates
      const updates: Partial<{
        username: string;
        email: string;
        phone: string;
      }> = {};

      if (existing.isGoogleAccount) {
        // compte Google → on ne met à jour que phone
        if (typeof phone === 'string') {
          updates.phone = phone;
        }
      } else {
        // compte classique → username+email sont requis
        if (!username || !email) {
          res.status(400).json({ error: 'Username et email sont requis.' });
          return;
        }
        updates.username = username;
        updates.email    = email;
        if (typeof phone === 'string') {
          updates.phone = phone;
        }
      }

      const updatedUser = await Client.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      res.json(updatedUser!);
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const message = err instanceof Error ? err.message : 'Internal server error.';
      res.status(500).json({ error: message });
    }
  }
);

export default router;
