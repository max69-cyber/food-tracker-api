import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
