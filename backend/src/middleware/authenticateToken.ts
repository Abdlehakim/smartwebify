import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// non‑null assertion: now JWT_SECRET is typed as string
const JWT_SECRET = process.env.JWT_SECRET!;

interface Decoded {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.["token_FrontEnd"];
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  console.log("token_FrontEnd received:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as Decoded;
    (req as any).user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}
