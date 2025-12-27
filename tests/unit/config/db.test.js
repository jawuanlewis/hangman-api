import { describe, it, expect, beforeEach } from 'vitest';
import {
  connectToDB,
  createGame,
  getGameById,
  updateGame,
  deleteGame,
  getRandomWord,
} from '@/config/db.js';
import { ObjectId } from 'mongodb';

describe('Database Operations', () => {
  let testGameId;

  // Clean up test data before each test
  beforeEach(async () => {
    const collections = await globalThis.testDb.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  describe('Test Environment Safety', () => {
    it('should use test database URI from MongoDB Memory Server', async () => {
      const testUri = globalThis.testDbUri;
      const configUri = process.env.MONGO_URI;

      // Verify we're using the in-memory test database
      expect(configUri).toBe(testUri);
      expect(configUri).toContain('mongodb://127.0.0.1');
      expect(process.env.DB_NAME).toBe('hangman-test');
    });

    it('should connect to test database, not production', async () => {
      const db = await connectToDB();
      const dbName = db.databaseName;

      expect(dbName).toBe('hangman-test');
      expect(dbName).not.toContain('prod');
      expect(dbName).not.toContain('production');
    });
  });

  describe('createGame', () => {
    it('should create a game with valid data', async () => {
      const gameData = {
        answer: 'JAVASCRIPT',
        progress: '__________',
        attempts: 6,
        guessedLetters: [],
        level: 'Movies',
      };

      const gameId = await createGame(gameData);

      expect(gameId).toBeDefined();
      expect(gameId).toBeInstanceOf(ObjectId);
    });

    it('should add createdAt and expiresAt timestamps', async () => {
      const gameData = {
        answer: 'TYPESCRIPT',
        progress: '__________',
        attempts: 6,
        guessedLetters: [],
        level: 'Video Games',
      };

      const gameId = await createGame(gameData);
      const game = await getGameById(gameId.toString());

      expect(game.createdAt).toBeInstanceOf(Date);
      expect(game.expiresAt).toBeInstanceOf(Date);
    });

    it('should set expiresAt to 24 hours from creation', async () => {
      const gameData = {
        answer: 'PYTHON',
        progress: '______',
        attempts: 6,
        guessedLetters: [],
        level: 'Sports',
      };

      const gameId = await createGame(gameData);
      const game = await getGameById(gameId.toString());

      const timeDiff = game.expiresAt - game.createdAt;
      const expectedDiff = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      expect(timeDiff).toBe(expectedDiff);
    });

    it('should preserve all game data fields', async () => {
      const gameData = {
        answer: 'HANGMAN',
        progress: '_______',
        attempts: 3,
        guessedLetters: ['A', 'E', 'I'],
        level: 'Idioms',
        customField: 'test',
      };

      const gameId = await createGame(gameData);
      const game = await getGameById(gameId.toString());

      expect(game.answer).toBe('HANGMAN');
      expect(game.progress).toBe('_______');
      expect(game.attempts).toBe(3);
      expect(game.guessedLetters).toEqual(['A', 'E', 'I']);
      expect(game.level).toBe('Idioms');
      expect(game.customField).toBe('test');
    });

    it('should create multiple games independently', async () => {
      const game1 = { answer: 'FIRST', progress: '_____', attempts: 6 };
      const game2 = { answer: 'SECOND', progress: '______', attempts: 5 };

      const id1 = await createGame(game1);
      const id2 = await createGame(game2);

      expect(id1).not.toEqual(id2);

      // Verify both games exist
      const game1Retrieved = await getGameById(id1.toString());
      const game2Retrieved = await getGameById(id2.toString());

      expect(game1Retrieved).toBeDefined();
      expect(game2Retrieved).toBeDefined();
      expect(game1Retrieved.answer).toBe('FIRST');
      expect(game2Retrieved.answer).toBe('SECOND');
    });
  });

  describe('getGameById', () => {
    beforeEach(async () => {
      const gameData = {
        answer: 'TEST',
        progress: '____',
        attempts: 6,
        guessedLetters: [],
        level: 'Movies',
      };
      testGameId = await createGame(gameData);
    });

    it('should retrieve a game by valid ObjectId', async () => {
      const game = await getGameById(testGameId.toString());

      expect(game).toBeDefined();
      expect(game.answer).toBe('TEST');
      expect(game.progress).toBe('____');
      expect(game.attempts).toBe(6);
    });

    it('should return game with all fields including timestamps', async () => {
      const game = await getGameById(testGameId.toString());

      expect(game._id).toEqual(testGameId);
      expect(game.createdAt).toBeInstanceOf(Date);
      expect(game.expiresAt).toBeInstanceOf(Date);
      expect(game.guessedLetters).toEqual([]);
    });

    it('should return null for non-existent game ID', async () => {
      const fakeId = new ObjectId();
      const game = await getGameById(fakeId.toString());

      expect(game).toBeNull();
    });

    it('should handle valid ObjectId format but non-existent game', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const game = await getGameById(nonExistentId);

      expect(game).toBeNull();
    });

    it('should throw error for invalid ObjectId format', async () => {
      const invalidIds = ['invalid-id', '123', 'not-an-objectid'];

      for (const id of invalidIds) {
        await expect(getGameById(id)).rejects.toThrow();
      }
    });
  });

  describe('updateGame', () => {
    beforeEach(async () => {
      const gameData = {
        answer: 'UPDATE',
        progress: '______',
        attempts: 6,
        guessedLetters: [],
        level: 'Movies',
      };
      testGameId = await createGame(gameData);
    });

    it('should update game data and return true', async () => {
      const updateData = {
        progress: 'U_____',
        guessedLetters: ['U'],
        attempts: 5,
      };

      const result = await updateGame(testGameId.toString(), updateData);

      expect(result).toBe(true);
    });

    it('should persist updated data in database', async () => {
      const updateData = {
        progress: 'UP____',
        guessedLetters: ['U', 'P'],
        attempts: 4,
      };

      await updateGame(testGameId.toString(), updateData);

      const game = await getGameById(testGameId.toString());
      expect(game.progress).toBe('UP____');
      expect(game.guessedLetters).toEqual(['U', 'P']);
      expect(game.attempts).toBe(4);
    });

    it('should only update specified fields', async () => {
      const updateData = { attempts: 3 };

      await updateGame(testGameId.toString(), updateData);

      const game = await getGameById(testGameId.toString());
      expect(game.attempts).toBe(3);
      expect(game.answer).toBe('UPDATE'); // Unchanged
      expect(game.progress).toBe('______'); // Unchanged
    });

    it('should return false for non-existent game ID', async () => {
      const fakeId = new ObjectId();
      const result = await updateGame(fakeId.toString(), { attempts: 1 });

      expect(result).toBe(false);
    });

    it('should handle updating with empty object', async () => {
      const result = await updateGame(testGameId.toString(), {});

      // MongoDB updateOne with empty $set returns modifiedCount: 0
      expect(result).toBe(false);
    });

    it('should throw error for invalid ObjectId format', async () => {
      await expect(updateGame('invalid-id', { attempts: 5 })).rejects.toThrow();
    });

    it('should handle multiple consecutive updates', async () => {
      await updateGame(testGameId.toString(), { attempts: 5 });
      await updateGame(testGameId.toString(), { attempts: 4 });
      await updateGame(testGameId.toString(), { attempts: 3 });

      const game = await getGameById(testGameId.toString());
      expect(game.attempts).toBe(3);
    });
  });

  describe('deleteGame', () => {
    beforeEach(async () => {
      const gameData = {
        answer: 'DELETE',
        progress: '______',
        attempts: 6,
        guessedLetters: [],
        level: 'Movies',
      };
      testGameId = await createGame(gameData);
    });

    it('should delete a game and return true', async () => {
      const result = await deleteGame(testGameId.toString());

      expect(result).toBe(true);
    });

    it('should remove game from database', async () => {
      await deleteGame(testGameId.toString());

      const game = await getGameById(testGameId.toString());
      expect(game).toBeNull();
    });

    it('should return false for non-existent game ID', async () => {
      const fakeId = new ObjectId();
      const result = await deleteGame(fakeId.toString());

      expect(result).toBe(false);
    });

    it('should return false when deleting already deleted game', async () => {
      await deleteGame(testGameId.toString());
      const result = await deleteGame(testGameId.toString());

      expect(result).toBe(false);
    });

    it('should throw error for invalid ObjectId format', async () => {
      await expect(deleteGame('invalid-id')).rejects.toThrow();
    });

    it('should not affect other games when deleting one', async () => {
      const game2Id = await createGame({
        answer: 'KEEP',
        progress: '____',
        attempts: 6,
      });

      await deleteGame(testGameId.toString());

      const game2 = await getGameById(game2Id.toString());
      expect(game2).toBeDefined();
      expect(game2.answer).toBe('KEEP');
    });
  });

  describe('getRandomWord', () => {
    beforeEach(async () => {
      // Seed test words in different categories
      const db = await connectToDB();
      await db.collection('words').insertMany([
        { word: 'INCEPTION', category: 'Movies' },
        { word: 'TITANIC', category: 'Movies' },
        { word: 'AVATAR', category: 'Movies' },
        { word: 'MINECRAFT', category: 'Video Games' },
        { word: 'ZELDA', category: 'Video Games' },
        { word: 'BASKETBALL', category: 'Sports' },
        { word: 'FOOTBALL', category: 'Sports' },
      ]);
    });

    it('should return a word from the specified category', async () => {
      const word = await getRandomWord('Movies');

      expect(word).toBeDefined();
      expect(['INCEPTION', 'TITANIC', 'AVATAR']).toContain(word);
    });

    it('should return different category words correctly', async () => {
      const movieWord = await getRandomWord('Movies');
      const gameWord = await getRandomWord('Video Games');
      const sportsWord = await getRandomWord('Sports');

      expect(['INCEPTION', 'TITANIC', 'AVATAR']).toContain(movieWord);
      expect(['MINECRAFT', 'ZELDA']).toContain(gameWord);
      expect(['BASKETBALL', 'FOOTBALL']).toContain(sportsWord);
    });

    it('should return null for category with no words', async () => {
      const word = await getRandomWord('NonExistentCategory');

      expect(word).toBeNull();
    });

    it('should return null for empty category', async () => {
      const word = await getRandomWord('');

      expect(word).toBeNull();
    });

    it('should handle category with single word', async () => {
      const db = await connectToDB();
      await db.collection('words').insertOne({
        word: 'SOLITAIRE',
        category: 'Unique',
      });

      const word = await getRandomWord('Unique');

      expect(word).toBe('SOLITAIRE');
    });

    it('should return random selection from category', async () => {
      // Get multiple words to test randomness (statistical test)
      const words = new Set();
      for (let i = 0; i < 20; i++) {
        const word = await getRandomWord('Movies');
        words.add(word);
      }

      // With 20 samples from 3 options, we should get at least 2 different words
      expect(words.size).toBeGreaterThanOrEqual(2);
    });

    it('should return only word field without _id', async () => {
      const word = await getRandomWord('Sports');

      expect(typeof word).toBe('string');
      expect(word).toBeTruthy();
    });
  });

  describe('Integration: Full CRUD Lifecycle', () => {
    it('should support complete game lifecycle', async () => {
      // Create
      const gameData = {
        answer: 'LIFECYCLE',
        progress: '_________',
        attempts: 6,
        guessedLetters: [],
        level: 'Movies',
      };
      const gameId = await createGame(gameData);
      expect(gameId).toBeDefined();

      // Read
      let game = await getGameById(gameId.toString());
      expect(game.answer).toBe('LIFECYCLE');
      expect(game.attempts).toBe(6);

      // Update
      const updated = await updateGame(gameId.toString(), {
        progress: 'L________',
        guessedLetters: ['L'],
        attempts: 5,
      });
      expect(updated).toBe(true);

      // Verify update
      game = await getGameById(gameId.toString());
      expect(game.progress).toBe('L________');
      expect(game.attempts).toBe(5);

      // Delete
      const deleted = await deleteGame(gameId.toString());
      expect(deleted).toBe(true);

      // Verify deletion
      game = await getGameById(gameId.toString());
      expect(game).toBeNull();
    });

    it('should handle multiple games independently', async () => {
      // Create multiple games
      const game1Id = await createGame({
        answer: 'FIRST',
        progress: '_____',
        attempts: 6,
      });
      const game2Id = await createGame({
        answer: 'SECOND',
        progress: '______',
        attempts: 6,
      });

      // Update one game
      await updateGame(game1Id.toString(), { attempts: 3 });

      // Verify only one game was updated
      const game1 = await getGameById(game1Id.toString());
      const game2 = await getGameById(game2Id.toString());

      expect(game1.attempts).toBe(3);
      expect(game2.attempts).toBe(6);

      // Delete one game
      await deleteGame(game1Id.toString());

      // Verify only one game was deleted
      const game1AfterDelete = await getGameById(game1Id.toString());
      const game2AfterDelete = await getGameById(game2Id.toString());

      expect(game1AfterDelete).toBeNull();
      expect(game2AfterDelete).toBeDefined();
    });
  });
});
