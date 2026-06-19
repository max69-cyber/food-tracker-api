import { Router } from 'express';
import { z } from 'zod';
import * as foodController from '../controllers/foods.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

const createFoodSchema = z.object({
  name: z.string().min(1).max(255),
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
});

const updateFoodSchema = createFoodSchema.partial();

router.get('/', foodController.list);
router.get('/:id', foodController.get);
router.post('/', authenticate, validate(createFoodSchema), foodController.create);
router.patch('/:id', authenticate, validate(updateFoodSchema), foodController.update);
router.delete('/:id', authenticate, foodController.remove);
router.post('/:id/upvote', authenticate, foodController.upvote);

export default router;
