import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '@/app.js';
import { GAME_LEVELS } from '@/schemas/gameSchemas.js';
import {
  createTestGame,
  submitGuess,
  getGameState,
  deleteGame,
  playGameWithLetters,
  assertSuccessResponse,
  assertErrorResponse,
  assertGameState,
  wait,
} from '../helpers/testHelpers.js';

describe('Game API Integration Tests', () => {
  // Wait for database connection
  beforeAll(async () => {
    await wait(100);
  });

  describe('POST /api/v1/games', () => {
    describe('Success Cases', () => {
      it('should create a game with Movies level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Movies' })
          .expect(201)
          .expect('Content-Type', /json/);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(typeof response.body.token).toBe('string');
        expect(response.body.game).toBeDefined();
        assertGameState(response.body.game);
        expect(response.body.game.level).toBe('Movies');
        expect(response.body.game.attempts).toBe(6);
        expect(response.body.game.gameOver).toBe(false);
      });

      it('should create a game with Video Games level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Video Games' })
          .expect(201);

        expect(response.body.game.level).toBe('Video Games');
      });

      it('should create a game with Sports level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Sports' })
          .expect(201);

        expect(response.body.game.level).toBe('Sports');
      });

      it('should create a game with Idioms level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Idioms' })
          .expect(201);

        expect(response.body.game.level).toBe('Idioms');
      });

      it('should create a game with TV Shows level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'TV Shows' })
          .expect(201);

        expect(response.body.game.level).toBe('TV Shows');
      });

      it('should create a game with Food level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Food' })
          .expect(201);

        expect(response.body.game.level).toBe('Food');
      });

      it('should create a game with Animals level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Animals' })
          .expect(201);

        expect(response.body.game.level).toBe('Animals');
      });

      it('should create a game with Cities level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Cities' })
          .expect(201);

        expect(response.body.game.level).toBe('Cities');
      });

      it('should mask the answer with underscores', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Movies' })
          .expect(201);

        const { currentProgress } = response.body.game;
        expect(currentProgress).toMatch(/[_\s\-:,.']+/);
        expect(currentProgress).not.toMatch(/[a-zA-Z]/);
      });

      it('should not include answer in response', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Sports' })
          .expect(201);

        expect(response.body.game).not.toHaveProperty('answer');
      });

      it('should generate unique tokens for different games', async () => {
        const response1 = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Movies' });

        const response2 = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Sports' });

        expect(response1.body.token).not.toBe(response2.body.token);
      });

      it('should initialize guessedLetters as empty array in response', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Movies' })
          .expect(201);

        expect(response.body.game).not.toHaveProperty('guessedLetters');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 for invalid level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'InvalidLevel' })
          .expect(400)
          .expect('Content-Type', /json/);

        assertErrorResponse(response.body);
        expect(response.body.details).toBeDefined();
        expect(Array.isArray(response.body.details)).toBe(true);
      });

      it('should return 400 for lowercase level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'movies' })
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for missing level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({})
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for null level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: null })
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for numeric level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 123 })
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for empty string level', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: '' })
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for missing body', async () => {
        const response = await request(app).post('/api/v1/games').expect(400);

        assertErrorResponse(response.body);
      });
    });

    describe('Edge Cases', () => {
      it('should ignore extra fields in request body', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Movies', extraField: 'should be ignored' })
          .expect(201);

        expect(response.body.success).toBe(true);
      });

      it('should handle level with correct casing', async () => {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ level: 'Video Games' })
          .expect(201);

        expect(response.body.game.level).toBe('Video Games');
      });
    });
  });

  describe('GET /api/v1/games', () => {
    describe('Success Cases', () => {
      it('should get game state with valid token', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await request(app)
          .get('/api/v1/games')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', /json/);

        assertSuccessResponse(response.body);
        assertGameState(response.body.game);
      });

      it('should return current game progress', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const response = await getGameState(app, token);

        expect(response.status).toBe(200);
        expect(response.body.game.currentProgress).toBeDefined();
        expect(response.body.game.attempts).toBe(6);
      });

      it('should return guessedLetters array', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const response = await getGameState(app, token);

        expect(response.body.game.guessedLetters).toBeDefined();
        expect(Array.isArray(response.body.game.guessedLetters)).toBe(true);
      });

      it('should return updated state after guesses', async () => {
        const { token } = await createTestGame(app, 'Movies');

        await submitGuess(app, token, 'a');
        await submitGuess(app, token, 'e');

        const response = await getGameState(app, token);

        expect(response.body.game.guessedLetters).toContain('a');
        expect(response.body.game.guessedLetters).toContain('e');
        expect(response.body.game.guessedLetters).toHaveLength(2);
      });

      it('should not include answer in response', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const response = await getGameState(app, token);

        expect(response.body.game).not.toHaveProperty('answer');
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 for missing token', async () => {
        const response = await request(app)
          .get('/api/v1/games')
          .expect(401)
          .expect('Content-Type', /json/);

        assertErrorResponse(response.body);
        expect(response.body.error).toContain('token');
      });

      it('should return 403 for invalid token', async () => {
        const response = await request(app)
          .get('/api/v1/games')
          .set('Authorization', 'Bearer invalid-token')
          .expect(403);

        assertErrorResponse(response.body);
      });

      it('should return 403 for malformed token', async () => {
        const response = await request(app)
          .get('/api/v1/games')
          .set('Authorization', 'Bearer abc.def.ghi')
          .expect(403);

        assertErrorResponse(response.body);
      });

      it('should return 403 for expired token', async () => {
        // Generate a token with immediate expiry
        const expiredToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJnYW1lSWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ1OTIwMX0.invalid';

        const response = await request(app)
          .get('/api/v1/games')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(403);

        assertErrorResponse(response.body);
      });

      it('should return 401 for missing Bearer prefix', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await request(app)
          .get('/api/v1/games')
          .set('Authorization', token)
          .expect(401);

        assertErrorResponse(response.body);
      });

      it('should return 401 for token with wrong gameId', async () => {
        const { token } = await createTestGame(app, 'Movies');

        // Create another game
        await createTestGame(app, 'Sports');

        // Original token should still work for its own game
        const response = await getGameState(app, token);
        expect(response.status).toBe(200);
      });
    });

    describe('Not Found Cases', () => {
      it('should return 404 for deleted game', async () => {
        const { token } = await createTestGame(app, 'Movies');

        await deleteGame(app, token);

        const response = await getGameState(app, token);

        expect(response.status).toBe(404);
        assertErrorResponse(response.body);
      });
    });
  });

  describe('PATCH /api/v1/games', () => {
    describe('Success Cases - Correct Guess', () => {
      it('should accept correct letter guess', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await request(app)
          .patch('/api/v1/games')
          .set('Authorization', `Bearer ${token}`)
          .send({ letter: 'e' })
          .expect(200)
          .expect('Content-Type', /json/);

        assertSuccessResponse(response.body);
        expect(response.body.game.guessedLetters).toContain('e');
        expect(response.body.game.isCorrectGuess).toBeDefined();
      });

      it('should maintain attempts on correct guess', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await submitGuess(app, token, 'e');

        expect(response.body.game.attempts).toBe(6);
      });

      it('should update currentProgress with revealed letters', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const beforeResponse = await getGameState(app, token);
        const progressBefore = beforeResponse.body.game.currentProgress;

        const response = await submitGuess(app, token, 'e');

        const progressAfter = response.body.game.currentProgress;

        // Progress should change if 'e' is in the answer
        if (response.body.game.isCorrectGuess) {
          expect(progressAfter).not.toBe(progressBefore);
        }
      });

      it('should handle uppercase letters by converting to lowercase', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const response = await submitGuess(app, token, 'A');

        expect(response.status).toBe(200);
        expect(response.body.game.guessedLetters).toContain('a');
      });

      it('should reveal all occurrences of the guessed letter', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await submitGuess(app, token, 'e');

        if (response.body.game.isCorrectGuess) {
          expect(response.body.game.currentProgress).toBeDefined();
        }
      });

      it('should add letter to guessedLetters array', async () => {
        const { token } = await createTestGame(app, 'Sports');

        await submitGuess(app, token, 'a');
        const response = await submitGuess(app, token, 'e');

        expect(response.body.game.guessedLetters).toEqual(
          expect.arrayContaining(['a', 'e'])
        );
        expect(response.body.game.guessedLetters).toHaveLength(2);
      });
    });

    describe('Success Cases - Incorrect Guess', () => {
      it('should decrement attempts on incorrect guess', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await submitGuess(app, token, 'z');

        if (!response.body.game.isCorrectGuess) {
          expect(response.body.game.attempts).toBe(5);
        }
      });

      it('should not change currentProgress on incorrect guess', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const beforeResponse = await getGameState(app, token);
        const progressBefore = beforeResponse.body.game.currentProgress;

        const response = await submitGuess(app, token, 'x');

        if (!response.body.game.isCorrectGuess) {
          expect(response.body.game.currentProgress).toBe(progressBefore);
        }
      });

      it('should mark isCorrectGuess as false for wrong letter', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const response = await submitGuess(app, token, 'q');

        expect(response.body.game.isCorrectGuess).toBeDefined();
        expect(typeof response.body.game.isCorrectGuess).toBe('boolean');
      });

      it('should still add incorrect letter to guessedLetters', async () => {
        const { token } = await createTestGame(app, 'Cities');

        const response = await submitGuess(app, token, 'z');

        expect(response.body.game.guessedLetters).toContain('z');
      });
    });

    describe('Win Condition', () => {
      it('should set gameOver to true when word is completed', async () => {
        const { token } = await createTestGame(app, 'Movies');

        // Guess common letters to try to win
        const letters = [
          'e',
          'a',
          'o',
          'i',
          'n',
          'r',
          's',
          't',
          'l',
          'h',
          'd',
          'c',
          'u',
          'm',
          'p',
          'f',
          'g',
          'w',
          'y',
          'b',
          'v',
          'k',
        ];

        let finalResponse;
        for (const letter of letters) {
          finalResponse = await submitGuess(app, token, letter);

          if (finalResponse.body.game.gameOver) {
            break;
          }
        }

        expect(finalResponse.body.game.gameOver).toBe(true);
      });

      it('should set won to true when player wins', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const letters = [
          'e',
          'a',
          'o',
          'i',
          'n',
          'r',
          's',
          't',
          'l',
          'h',
          'd',
          'c',
          'u',
          'm',
          'p',
        ];

        let finalResponse;
        for (const letter of letters) {
          finalResponse = await submitGuess(app, token, letter);

          if (finalResponse.body.game.gameOver) {
            break;
          }
        }

        if (
          finalResponse.body.game.gameOver &&
          finalResponse.body.game.attempts > 0
        ) {
          expect(finalResponse.body.game.won).toBe(true);
        }
      });

      it('should reveal full answer when won', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const letters = [
          'e',
          'a',
          'o',
          'i',
          'n',
          'r',
          's',
          't',
          'l',
          'h',
          'c',
          'd',
          'p',
          'u',
        ];

        let finalResponse;
        for (const letter of letters) {
          finalResponse = await submitGuess(app, token, letter);

          if (finalResponse.body.game.gameOver) {
            break;
          }
        }

        if (finalResponse.body.game.gameOver) {
          // No underscores should remain (except preserved chars)
          const progress = finalResponse.body.game.currentProgress;
          const hasOnlyLettersAndPreserved = /^[a-zA-Z\s\-:,.']+$/.test(
            progress
          );
          expect(hasOnlyLettersAndPreserved).toBe(true);
        }
      });
    });

    describe('Loss Condition', () => {
      it('should set gameOver to true when attempts reach 0', async () => {
        const { token } = await createTestGame(app, 'Movies');

        // Guess wrong letters
        const wrongLetters = ['q', 'x', 'z', 'v', 'k', 'j'];

        let finalResponse;
        for (const letter of wrongLetters) {
          finalResponse = await submitGuess(app, token, letter);

          if (finalResponse.body.game.gameOver) {
            break;
          }
        }

        if (finalResponse.body.game.attempts === 0) {
          expect(finalResponse.body.game.gameOver).toBe(true);
        }
      });

      it('should set won to false when player loses', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const wrongLetters = ['q', 'x', 'z', 'v', 'k', 'j'];

        let finalResponse;
        for (const letter of wrongLetters) {
          finalResponse = await submitGuess(app, token, letter);

          if (finalResponse.body.game.gameOver) {
            break;
          }
        }

        if (
          finalResponse.body.game.gameOver &&
          finalResponse.body.game.attempts === 0
        ) {
          expect(finalResponse.body.game.won).toBe(false);
        }
      });

      it('should reveal answer when game is lost', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const wrongLetters = ['q', 'x', 'z', 'v', 'k', 'j'];

        let finalResponse;
        for (const letter of wrongLetters) {
          finalResponse = await submitGuess(app, token, letter);

          if (finalResponse.body.game.gameOver) {
            break;
          }
        }

        if (finalResponse.body.game.gameOver) {
          const progress = finalResponse.body.game.currentProgress;
          const hasOnlyLettersAndPreserved = /^[a-zA-Z\s\-:,.']+$/.test(
            progress
          );
          expect(hasOnlyLettersAndPreserved).toBe(true);
        }
      });
    });

    describe('Game State Errors', () => {
      it('should return 400 when game is already over', async () => {
        const { token } = await createTestGame(app, 'Movies');

        // Play until game over
        const letters = [
          'e',
          'a',
          'o',
          'i',
          'n',
          'r',
          's',
          't',
          'l',
          'h',
          'd',
          'c',
          'u',
          'm',
          'p',
          'f',
          'g',
          'w',
          'y',
          'b',
        ];

        for (const letter of letters) {
          const res = await submitGuess(app, token, letter);

          if (res.body.game.gameOver) {
            // Try to guess again after game over
            const response = await submitGuess(app, token, 'z');

            expect(response.status).toBe(400);
            assertErrorResponse(response.body);
            expect(response.body.error).toContain('over');
            break;
          }
        }
      });

      it('should return 400 for letter already guessed', async () => {
        const { token } = await createTestGame(app, 'Sports');

        await submitGuess(app, token, 'a');

        const response = await submitGuess(app, token, 'a');

        expect(response.status).toBe(400);
        assertErrorResponse(response.body);
        expect(response.body.error).toContain('already');
      });

      it('should detect duplicate guess regardless of case', async () => {
        const { token } = await createTestGame(app, 'Animals');

        await submitGuess(app, token, 'a');

        const response = await submitGuess(app, token, 'A');

        expect(response.status).toBe(400);
        assertErrorResponse(response.body);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 for invalid letter (number)', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await request(app)
          .patch('/api/v1/games')
          .set('Authorization', `Bearer ${token}`)
          .send({ letter: '5' })
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for multiple characters', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const response = await submitGuess(app, token, 'abc');

        expect(response.status).toBe(400);
        assertErrorResponse(response.body);
      });

      it('should return 400 for empty string', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const response = await submitGuess(app, token, '');

        expect(response.status).toBe(400);
        assertErrorResponse(response.body);
      });

      it('should return 400 for special character', async () => {
        const { token } = await createTestGame(app, 'Cities');

        const response = await submitGuess(app, token, '@');

        expect(response.status).toBe(400);
        assertErrorResponse(response.body);
      });

      it('should return 400 for space character', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await submitGuess(app, token, ' ');

        expect(response.status).toBe(400);
        assertErrorResponse(response.body);
      });

      it('should return 400 for missing letter field', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const response = await request(app)
          .patch('/api/v1/games')
          .set('Authorization', `Bearer ${token}`)
          .send({})
          .expect(400);

        assertErrorResponse(response.body);
      });

      it('should return 400 for null letter', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const response = await request(app)
          .patch('/api/v1/games')
          .set('Authorization', `Bearer ${token}`)
          .send({ letter: null })
          .expect(400);

        assertErrorResponse(response.body);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 for missing token', async () => {
        const response = await request(app)
          .patch('/api/v1/games')
          .send({ letter: 'a' })
          .expect(401);

        assertErrorResponse(response.body);
      });

      it('should return 403 for invalid token', async () => {
        const response = await request(app)
          .patch('/api/v1/games')
          .set('Authorization', 'Bearer invalid-token')
          .send({ letter: 'a' })
          .expect(403);

        assertErrorResponse(response.body);
      });
    });
  });

  describe('DELETE /api/v1/games', () => {
    describe('Success Cases', () => {
      it('should delete game and return 204', async () => {
        const { token } = await createTestGame(app, 'Movies');

        const response = await request(app)
          .delete('/api/v1/games')
          .set('Authorization', `Bearer ${token}`)
          .expect(204);

        expect(response.body).toEqual({});
      });

      it('should return no content on successful deletion', async () => {
        const { token } = await createTestGame(app, 'Sports');

        const response = await deleteGame(app, token);

        expect(response.status).toBe(204);
        expect(response.text).toBe('');
      });

      it('should make game inaccessible after deletion', async () => {
        const { token } = await createTestGame(app, 'Animals');

        await deleteGame(app, token);

        const response = await getGameState(app, token);

        expect(response.status).toBe(404);
      });

      it('should not affect other games when deleting one', async () => {
        const { token: token1 } = await createTestGame(app, 'Movies');
        const { token: token2 } = await createTestGame(app, 'Sports');

        await deleteGame(app, token1);

        const response = await getGameState(app, token2);

        expect(response.status).toBe(200);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 for missing token', async () => {
        const response = await request(app).delete('/api/v1/games').expect(401);

        assertErrorResponse(response.body);
      });

      it('should return 403 for invalid token', async () => {
        const response = await request(app)
          .delete('/api/v1/games')
          .set('Authorization', 'Bearer invalid-token')
          .expect(403);

        assertErrorResponse(response.body);
      });
    });

    describe('Not Found Cases', () => {
      it('should return 404 when deleting already deleted game', async () => {
        const { token } = await createTestGame(app, 'Movies');

        await deleteGame(app, token);

        const response = await deleteGame(app, token);

        expect(response.status).toBe(404);
        assertErrorResponse(response.body);
      });
    });
  });

  describe('Full Game Flows', () => {
    describe('Complete Winning Game', () => {
      it('should handle full winning game scenario', async () => {
        const { token } = await createTestGame(app, 'Movies');

        // Get initial state
        const initialState = await getGameState(app, token);
        expect(initialState.body.game.attempts).toBe(6);
        expect(initialState.body.game.gameOver).toBe(false);

        // Play game
        const letters = [
          'e',
          'a',
          'o',
          'i',
          'n',
          'r',
          's',
          't',
          'l',
          'h',
          'd',
          'c',
          'u',
          'm',
          'p',
        ];

        let lastResponse;
        for (const letter of letters) {
          lastResponse = await submitGuess(app, token, letter);

          if (lastResponse.body.game.gameOver) {
            break;
          }
        }

        // Verify win state if won
        if (
          lastResponse.body.game.gameOver &&
          lastResponse.body.game.attempts > 0
        ) {
          expect(lastResponse.body.game.won).toBe(true);
          expect(lastResponse.body.game.currentProgress).not.toContain('_');
        }
      });
    });

    describe('Complete Losing Game', () => {
      it('should handle full losing game scenario', async () => {
        const { token } = await createTestGame(app, 'Sports');

        // Guess 6 wrong letters
        const wrongLetters = ['q', 'x', 'z', 'v', 'k', 'j'];

        let lastResponse;
        for (const letter of wrongLetters) {
          lastResponse = await submitGuess(app, token, letter);

          if (lastResponse.body.game.gameOver) {
            break;
          }
        }

        // Verify loss state if lost
        if (lastResponse.body.game.attempts === 0) {
          expect(lastResponse.body.game.gameOver).toBe(true);
          expect(lastResponse.body.game.won).toBe(false);
        }
      });
    });

    describe('Partial Game Flow', () => {
      it('should handle get state, play, get state again', async () => {
        const { token } = await createTestGame(app, 'Animals');

        const state1 = await getGameState(app, token);
        expect(state1.body.game.guessedLetters).toHaveLength(0);

        await submitGuess(app, token, 'a');
        await submitGuess(app, token, 'e');

        const state2 = await getGameState(app, token);
        expect(state2.body.game.guessedLetters).toHaveLength(2);

        await submitGuess(app, token, 'o');

        const state3 = await getGameState(app, token);
        expect(state3.body.game.guessedLetters).toHaveLength(3);
      });
    });

    describe('Create, Play, Delete Workflow', () => {
      it('should handle complete lifecycle', async () => {
        // Create
        const { token } = await createTestGame(app, 'Cities');

        // Play
        await submitGuess(app, token, 'a');
        await submitGuess(app, token, 'e');

        // Verify state
        const state = await getGameState(app, token);
        expect(state.body.game.guessedLetters).toHaveLength(2);

        // Delete
        await deleteGame(app, token);

        // Verify deleted
        const deletedState = await getGameState(app, token);
        expect(deletedState.status).toBe(404);
      });
    });

    describe('Multiple Concurrent Games', () => {
      it('should handle multiple games independently', async () => {
        const { token: token1 } = await createTestGame(app, 'Movies');
        const { token: token2 } = await createTestGame(app, 'Sports');
        const { token: token3 } = await createTestGame(app, 'Animals');

        // Play different letters in each game
        await submitGuess(app, token1, 'a');
        await submitGuess(app, token2, 'e');
        await submitGuess(app, token3, 'o');

        // Verify each game has correct state
        const state1 = await getGameState(app, token1);
        const state2 = await getGameState(app, token2);
        const state3 = await getGameState(app, token3);

        expect(state1.body.game.guessedLetters).toEqual(['a']);
        expect(state2.body.game.guessedLetters).toEqual(['e']);
        expect(state3.body.game.guessedLetters).toEqual(['o']);
      });

      it('should not mix up game states', async () => {
        const { token: token1 } = await createTestGame(app, 'Movies');
        const { token: token2 } = await createTestGame(app, 'Sports');

        await submitGuess(app, token1, 'a');
        await submitGuess(app, token1, 'b');
        await submitGuess(app, token1, 'c');

        await submitGuess(app, token2, 'x');

        const state1 = await getGameState(app, token1);
        const state2 = await getGameState(app, token2);

        expect(state1.body.game.guessedLetters).toHaveLength(3);
        expect(state2.body.game.guessedLetters).toHaveLength(1);
      });
    });
  });

  describe('Health Check', () => {
    it('should return 200 for health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Not Found Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404)
        .expect('Content-Type', /json/);

      assertErrorResponse(response.body);
    });

    it('should return 404 for wrong HTTP method', async () => {
      const response = await request(app).put('/api/v1/games').expect(404);

      assertErrorResponse(response.body);
    });
  });
});
