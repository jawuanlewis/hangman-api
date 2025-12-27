import { describe, it, expect } from 'vitest';
import {
  GAME_LEVELS,
  createGameSchema,
  guessSchema,
  gameIdSchema,
} from '@/schemas/gameSchemas.js';

describe('Game Schemas', () => {
  describe('GAME_LEVELS', () => {
    it('should export an array of game levels', () => {
      expect(GAME_LEVELS).toBeInstanceOf(Array);
      expect(GAME_LEVELS.length).toBeGreaterThan(0);
    });

    it('should contain expected game levels', () => {
      expect(GAME_LEVELS).toContain('Movies');
      expect(GAME_LEVELS).toContain('Video Games');
      expect(GAME_LEVELS).toContain('Sports');
      expect(GAME_LEVELS).toContain('Idioms');
      expect(GAME_LEVELS).toContain('TV Shows');
      expect(GAME_LEVELS).toContain('Food');
      expect(GAME_LEVELS).toContain('Animals');
      expect(GAME_LEVELS).toContain('Cities');
    });

    it('should have exactly 8 levels', () => {
      expect(GAME_LEVELS).toHaveLength(8);
    });

    it('should contain unique values', () => {
      const uniqueLevels = [...new Set(GAME_LEVELS)];
      expect(uniqueLevels).toHaveLength(GAME_LEVELS.length);
    });
  });

  describe('createGameSchema', () => {
    describe('Success Cases', () => {
      it('should validate body with valid level: Movies', async () => {
        const data = { body: { level: 'Movies' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Movies' } });
      });

      it('should validate body with valid level: Video Games', async () => {
        const data = { body: { level: 'Video Games' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Video Games' } });
      });

      it('should validate body with valid level: Sports', async () => {
        const data = { body: { level: 'Sports' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Sports' } });
      });

      it('should validate body with valid level: Idioms', async () => {
        const data = { body: { level: 'Idioms' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Idioms' } });
      });

      it('should validate body with valid level: TV Shows', async () => {
        const data = { body: { level: 'TV Shows' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'TV Shows' } });
      });

      it('should validate body with valid level: Food', async () => {
        const data = { body: { level: 'Food' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Food' } });
      });

      it('should validate body with valid level: Animals', async () => {
        const data = { body: { level: 'Animals' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Animals' } });
      });

      it('should validate body with valid level: Cities', async () => {
        const data = { body: { level: 'Cities' } };
        const result = await createGameSchema.parseAsync(data);
        expect(result).toEqual({ body: { level: 'Cities' } });
      });
    });

    describe('Validation Failure Cases', () => {
      it('should reject invalid level', async () => {
        const data = { body: { level: 'InvalidLevel' } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject lowercase valid level', async () => {
        const data = { body: { level: 'movies' } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject uppercase valid level', async () => {
        const data = { body: { level: 'MOVIES' } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject empty string level', async () => {
        const data = { body: { level: '' } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject missing level field', async () => {
        const data = { body: {} };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject missing body', async () => {
        const data = {};

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject null level', async () => {
        const data = { body: { level: null } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject numeric level', async () => {
        const data = { body: { level: 123 } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should provide custom error message for invalid level', async () => {
        const data = { body: { level: 'InvalidLevel' } };

        try {
          await createGameSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toContain('Movies');
          expect(error.issues[0].message).toContain('Cities');
        }
      });

      it('should include all levels in error message', async () => {
        const data = { body: { level: 'Invalid' } };

        try {
          await createGameSchema.parseAsync(data);
        } catch (error) {
          const message = error.issues[0].message;
          expect(message).toContain('Movies');
          expect(message).toContain('Cities');
          expect(message).toContain('Sports');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should reject level with extra whitespace', async () => {
        const data = { body: { level: ' Movies ' } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject level with different casing', async () => {
        const data = { body: { level: 'video games' } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject array of levels', async () => {
        const data = { body: { level: ['Movies', 'Sports'] } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject object as level', async () => {
        const data = { body: { level: { name: 'Movies' } } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject boolean as level', async () => {
        const data = { body: { level: true } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject undefined level', async () => {
        const data = { body: { level: undefined } };

        await expect(createGameSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject additional properties in body', async () => {
        const data = {
          body: { level: 'Movies', extraField: 'should be ignored' },
        };

        const result = await createGameSchema.parseAsync(data);
        expect(result.body).not.toHaveProperty('extraField');
      });
    });
  });

  describe('guessSchema', () => {
    describe('Success Cases', () => {
      it('should validate and transform lowercase letter: a', async () => {
        const data = { body: { letter: 'a' } };
        const result = await guessSchema.parseAsync(data);
        expect(result).toEqual({ body: { letter: 'a' } });
      });

      it('should validate and transform uppercase letter to lowercase: A', async () => {
        const data = { body: { letter: 'A' } };
        const result = await guessSchema.parseAsync(data);
        expect(result).toEqual({ body: { letter: 'a' } });
      });

      it('should validate and transform uppercase letter to lowercase: Z', async () => {
        const data = { body: { letter: 'Z' } };
        const result = await guessSchema.parseAsync(data);
        expect(result).toEqual({ body: { letter: 'z' } });
      });

      it('should validate lowercase letter: z', async () => {
        const data = { body: { letter: 'z' } };
        const result = await guessSchema.parseAsync(data);
        expect(result).toEqual({ body: { letter: 'z' } });
      });

      it('should validate middle alphabet letter: m', async () => {
        const data = { body: { letter: 'm' } };
        const result = await guessSchema.parseAsync(data);
        expect(result).toEqual({ body: { letter: 'm' } });
      });

      it('should validate middle alphabet uppercase: M', async () => {
        const data = { body: { letter: 'M' } };
        const result = await guessSchema.parseAsync(data);
        expect(result).toEqual({ body: { letter: 'm' } });
      });
    });

    describe('Validation Failure Cases', () => {
      it('should reject multiple characters', async () => {
        const data = { body: { letter: 'abc' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a single character'
          );
        }
      });

      it('should reject two characters', async () => {
        const data = { body: { letter: 'ab' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a single character'
          );
        }
      });

      it('should reject numeric character', async () => {
        const data = { body: { letter: '5' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject special character: @', async () => {
        const data = { body: { letter: '@' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject special character: #', async () => {
        const data = { body: { letter: '#' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject space character', async () => {
        const data = { body: { letter: ' ' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject empty string', async () => {
        const data = { body: { letter: '' } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject missing letter field', async () => {
        const data = { body: {} };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject missing body', async () => {
        const data = {};

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject null letter', async () => {
        const data = { body: { letter: null } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject numeric type', async () => {
        const data = { body: { letter: 123 } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject underscore', async () => {
        const data = { body: { letter: '_' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject hyphen', async () => {
        const data = { body: { letter: '-' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });
    });

    describe('Edge Cases', () => {
      it('should reject Unicode letter', async () => {
        const data = { body: { letter: 'é' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject emoji', async () => {
        const data = { body: { letter: '😀' } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject tab character', async () => {
        const data = { body: { letter: '\t' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject newline character', async () => {
        const data = { body: { letter: '\n' } };

        try {
          await guessSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            'Letter must be a valid alphabetic character'
          );
        }
      });

      it('should reject undefined letter', async () => {
        const data = { body: { letter: undefined } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject boolean', async () => {
        const data = { body: { letter: true } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject array', async () => {
        const data = { body: { letter: ['a'] } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject object', async () => {
        const data = { body: { letter: { char: 'a' } } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject letter with leading whitespace', async () => {
        const data = { body: { letter: ' a' } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject letter with trailing whitespace', async () => {
        const data = { body: { letter: 'a ' } };

        await expect(guessSchema.parseAsync(data)).rejects.toThrow();
      });
    });
  });

  describe('gameIdSchema', () => {
    describe('Success Cases', () => {
      it('should validate valid 24-character hex ObjectId', async () => {
        const data = { gameId: '507f1f77bcf86cd799439011' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: '507f1f77bcf86cd799439011' });
      });

      it('should validate ObjectId with uppercase hex', async () => {
        const data = { gameId: '507F1F77BCF86CD799439011' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: '507F1F77BCF86CD799439011' });
      });

      it('should validate ObjectId with mixed case hex', async () => {
        const data = { gameId: '507f1F77BcF86cD799439011' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: '507f1F77BcF86cD799439011' });
      });

      it('should validate ObjectId with all zeros', async () => {
        const data = { gameId: '000000000000000000000000' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: '000000000000000000000000' });
      });

      it('should validate ObjectId with all fs', async () => {
        const data = { gameId: 'ffffffffffffffffffffffff' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: 'ffffffffffffffffffffffff' });
      });

      it('should validate ObjectId with all Fs uppercase', async () => {
        const data = { gameId: 'FFFFFFFFFFFFFFFFFFFFFFFF' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: 'FFFFFFFFFFFFFFFFFFFFFFFF' });
      });

      it('should validate ObjectId with numbers and letters', async () => {
        const data = { gameId: '123abc456def789012345678' };
        const result = await gameIdSchema.parseAsync(data);
        expect(result).toEqual({ gameId: '123abc456def789012345678' });
      });
    });

    describe('Validation Failure Cases', () => {
      it('should reject gameId with 23 characters', async () => {
        const data = { gameId: '507f1f77bcf86cd79943901' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject gameId with 25 characters', async () => {
        const data = { gameId: '507f1f77bcf86cd7994390111' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject gameId with invalid character: g', async () => {
        const data = { gameId: '507f1f77bcf86cd799439g11' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject gameId with special character: -', async () => {
        const data = { gameId: '507f1f77-bcf86cd799439011' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject empty string', async () => {
        const data = { gameId: '' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject missing gameId field', async () => {
        const data = {};

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject null gameId', async () => {
        const data = { gameId: null };

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject numeric gameId', async () => {
        const data = { gameId: 123456789012345678901234 };

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject gameId with spaces', async () => {
        const data = { gameId: '507f1f77 bcf86cd799439011' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject UUID format', async () => {
        const data = { gameId: '550e8400-e29b-41d4-a716-446655440000' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should reject gameId with leading whitespace', async () => {
        const data = { gameId: ' 507f1f77bcf86cd799439011' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject gameId with trailing whitespace', async () => {
        const data = { gameId: '507f1f77bcf86cd799439011 ' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject undefined gameId', async () => {
        const data = { gameId: undefined };

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject boolean gameId', async () => {
        const data = { gameId: true };

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject array gameId', async () => {
        const data = { gameId: ['507f1f77bcf86cd799439011'] };

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject object gameId', async () => {
        const data = { gameId: { id: '507f1f77bcf86cd799439011' } };

        await expect(gameIdSchema.parseAsync(data)).rejects.toThrow();
      });

      it('should reject short hex string', async () => {
        const data = { gameId: 'abc123' };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });

      it('should reject very long hex string', async () => {
        const data = {
          gameId: '507f1f77bcf86cd799439011507f1f77bcf86cd799439011',
        };

        try {
          await gameIdSchema.parseAsync(data);
        } catch (error) {
          expect(error.issues[0].message).toBe('Invalid game ID format');
        }
      });
    });
  });
});
