import express from 'express';
import gameController from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createGameSchema, guessSchema } from '../schemas/gameSchemas.js';
import { createGameLimiter, guessLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post(
  '/',
  createGameLimiter,
  validate(createGameSchema),
  gameController.createGame
);

router.get('/', authenticateToken, gameController.getGame);

router.patch(
  '/',
  guessLimiter,
  authenticateToken,
  validate(guessSchema),
  gameController.updateGame
);

router.delete('/', authenticateToken, gameController.deleteGame);

export default router;
