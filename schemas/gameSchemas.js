import { z } from 'zod';

export const createGameSchema = z.object({
  body: z.object({
    level: z.enum(['easy', 'medium', 'hard', 'expert'], {
      errorMap: () => ({
        message: 'Level must be easy, medium, hard, or expert',
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
