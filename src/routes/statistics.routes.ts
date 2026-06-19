import { Router } from 'express';
import * as statsController from '../controllers/statistics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/me', statsController.userStats);
router.get('/groups/:id', statsController.groupStats);

export default router;
