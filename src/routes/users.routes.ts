import { Router } from 'express';
import * as authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/auth.types';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json(await authService.getProfile(req.user!.userId));
});

router.get('/:id', authenticate, async (req, res) => {
  const user = await authService.getProfile(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.json(user);
});

export default router;
