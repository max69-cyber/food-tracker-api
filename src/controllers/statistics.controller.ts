import { Response } from 'express';
import * as statsService from '../services/statistics.service';
import { assertMember } from '../services/groups.service';
import { AuthRequest } from '../types/auth.types';

export async function userStats(req: AuthRequest, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string>;
  const stats = await statsService.getUserStats(req.user!.userId, from, to);
  res.json(stats);
}

export async function groupStats(req: AuthRequest, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string>;
  await assertMember(req.params.id, req.user!.userId);
  const stats = await statsService.getGroupStats(req.params.id, from, to);
  res.json(stats);
}
