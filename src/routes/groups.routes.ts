import { Router } from 'express';
import { z } from 'zod';
import * as groupController from '../controllers/groups.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isPrivate: z.boolean().optional(),
  maxMembers: z.number().int().positive().optional(),
});

const voteSchema = z.object({
  foodId: z.uuid(),
  voteDate: z.iso.date(),
});

const closeVotingSchema = z.object({
  voteDate: z.iso.date(),
});

router.get('/', groupController.list);
router.post('/', validate(createGroupSchema), groupController.create);
router.get('/:id', groupController.get);

router.post('/:id/join', groupController.join);
router.delete('/:id/leave', groupController.leave);
router.get('/:id/members', groupController.members);

router.post('/:id/votes', validate(voteSchema), groupController.vote);
router.get('/:id/votes', groupController.voteResults);
router.post('/:id/votes/close', validate(closeVotingSchema), groupController.closeVoting);
router.get('/:id/winners', groupController.winners);

export default router;
