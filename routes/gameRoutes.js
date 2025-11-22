import express from 'express';
import gameController from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { initGameSchema, guessSchema } from '../schemas/gameSchemas.js';
import { initGameLimiter, guessLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post(
  '/init',
  initGameLimiter,
  validate(initGameSchema),
  gameController.initializeGame
);

// Protected routes (require JWT)
router.get('/current', authenticateToken, gameController.getCurrentGame);

router.post(
  '/guess',
  guessLimiter,
  authenticateToken,
  validate(guessSchema),
  gameController.makeGuess
);

router.delete('/reset', authenticateToken, gameController.resetGame);

export default router;
