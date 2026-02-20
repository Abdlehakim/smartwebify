// src/middleware/requireDashboardPermission.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import DashboardUser from '@/models/dashboardadmin/DashboardUser';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    dashboardUser?: typeof DashboardUser.prototype;
  }
}

/**
 * Guard middleware: only lets through if the authenticated dashboard user’s
 * role includes the given permission string.
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1️⃣ Verify there’s a token cookie
      const token = req.cookies?.token_FrontEndAdmin;
      if (!token) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      // 2️⃣ Decode & verify signature/expiry, casting via `unknown`
      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
      } catch {
        res.status(401).json({ message: 'Invalid or expired token.' });
        return;
      }

      // 3️⃣ Load the user and its permissions
      const user = await DashboardUser.findById(decoded.id)
        .populate('role', 'name permissions')
        .select('-password');
      if (!user || !user.role) {
        res.status(401).json({ message: 'User not found.' });
        return;
      }

      const rolePermissions: string[] = (user.role as any).permissions ?? [];
      if (!rolePermissions.includes(permission)) {
        res.status(403).json({ message: 'Forbidden.' });
        return;
      }

      // 4️⃣ Attach the full user document for downstream handlers
      req.dashboardUser = user;
      next();
    } catch (err) {
      console.error('requirePermission error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
}
