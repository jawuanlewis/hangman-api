import { z } from 'zod';

export const GAME_LEVELS = [
  'Movies',
  'Video Games',
  'Sports',
  'Idioms',
  'TV Shows',
  'Food',
  'Animals',
  'Cities',
];

export const createGameSchema = z.object({
  body: z.object({
    level: z.enum(GAME_LEVELS, {
      errorMap: () => ({
        message: `Level must be ${GAME_LEVELS.slice(0, -1).join(', ')}, or ${GAME_LEVELS[GAME_LEVELS.length - 1]}`,
      }),
    }),
  }),
});

export const guessSchema = z.object({
  body: z.object({
    letter: z
      .string()
      .length(1, 'Letter must be a single character')
      .regex(/^[a-zA-Z]$/, 'Letter must be a valid alphabetic character')
      .transform((val) => val.toLowerCase()),
  }),
});

export const gameIdSchema = z.object({
  gameId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid game ID format'),
});
