import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../types/auth.types';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.json(tokens);
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await authService.getProfile(req.user!.userId);
  res.json(user);
}
