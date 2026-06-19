import { Router } from 'express';
import { z } from 'zod';
import * as entryController from '../controllers/entries.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All entry routes require auth.
router.use(authenticate);

const createEntrySchema = z.object({
  foodId: z.uuid(),
  quantity: z.number().positive(),
  unit: z.enum(['gram', 'piece', 'ml']),
  eatenAt: z.iso.datetime({ offset: true }),
});

const updateEntrySchema = createEntrySchema.partial();

router.get('/', entryController.list);
router.get('/daily/:date', entryController.daily);
router.post('/', validate(createEntrySchema), entryController.create);
router.patch('/:id', validate(updateEntrySchema), entryController.update);
router.delete('/:id', entryController.remove);

export default router;
