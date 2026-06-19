import { Router } from 'express';
import { z } from 'zod';
import * as messageController from '../controllers/messages.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

// Mounted at /api — paths are absolute to keep group/message routes unambiguous.
const router = Router();

router.use(authenticate);

const createMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

router.get('/groups/:id/messages', messageController.list);
router.post('/groups/:id/messages', validate(createMessageSchema), messageController.create);

router.post(
  '/messages/:messageId/reactions',
  validate(reactionSchema),
  messageController.react,
);
router.delete('/messages/:messageId/reactions', messageController.unreact);

export default router;
