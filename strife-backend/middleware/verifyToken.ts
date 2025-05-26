import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY!) as jwt.JwtPayload;
    req.user = { id: decoded.sub! };
    next();
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};
