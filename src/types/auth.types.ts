import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  // Express 5 types params as `string | string[]`; our routes only use
  // single-value params, so narrow it for ergonomic access.
  params: Record<string, string>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
