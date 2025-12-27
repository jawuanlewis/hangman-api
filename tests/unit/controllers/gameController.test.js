import { describe, it, expect, vi, beforeEach } from 'vitest';
import gameController from '@/controllers/gameController.js';

// Mock dependencies
vi.mock('@/config/db.js', () => ({
  getRandomWord: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
}));

vi.mock('@/config/jwt.js', () => ({
  generateToken: vi.fn(),
}));

import {
  getRandomWord,
  createGame,
  updateGame,
  deleteGame,
} from '@/config/db.js';
import { generateToken } from '@/config/jwt.js';

describe('Game Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      game: null,
      gameId: null,
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  describe('createGame', () => {
    describe('Success Cases', () => {
      it('should create a game with a simple word', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue('JAWS');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(getRandomWord).toHaveBeenCalledWith('movies');
        expect(createGame).toHaveBeenCalledWith({
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '____',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
        expect(generateToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          token: 'mock-jwt-token',
          game: {
            level: 'Movies',
            attempts: 6,
            currentProgress: '____',
            gameOver: false,
          },
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should preserve spaces in multi-word answers', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue('THE MATRIX');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'Movies',
          answer: 'THE MATRIX',
          currentProgress: '___ ______',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should preserve hyphens in answers', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue('SPIDER-MAN');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'Movies',
          answer: 'SPIDER-MAN',
          currentProgress: '______-___',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
      });

      it('should preserve colons in answers', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue('MISSION: IMPOSSIBLE');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'Movies',
          answer: 'MISSION: IMPOSSIBLE',
          currentProgress: '_______: __________',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
      });

      it('should preserve commas in answers', async () => {
        req.body = { level: 'Idioms' };
        getRandomWord.mockResolvedValue('SLOW AND STEADY WINS THE RACE');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'Idioms',
          answer: 'SLOW AND STEADY WINS THE RACE',
          currentProgress: '____ ___ ______ ____ ___ ____',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
      });

      it('should preserve periods in answers', async () => {
        req.body = { level: 'Idioms' };
        getRandomWord.mockResolvedValue('A.K.A.');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'Idioms',
          answer: 'A.K.A.',
          currentProgress: '_._._.', // preserves periods
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
      });

      it('should preserve apostrophes in answers', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue("SCHINDLER'S LIST");
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'Movies',
          answer: "SCHINDLER'S LIST",
          currentProgress: "_________'_ ____",
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
      });

      it('should convert level to lowercase when calling getRandomWord', async () => {
        req.body = { level: 'Video Games' };
        getRandomWord.mockResolvedValue('MINECRAFT');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(getRandomWord).toHaveBeenCalledWith('video games');
      });

      it('should initialize with 6 attempts', async () => {
        req.body = { level: 'Sports' };
        getRandomWord.mockResolvedValue('SOCCER');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith(
          expect.objectContaining({
            attempts: 6,
          })
        );
      });

      it('should initialize with gameOver as false', async () => {
        req.body = { level: 'Animals' };
        getRandomWord.mockResolvedValue('ELEPHANT');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith(
          expect.objectContaining({
            gameOver: false,
          })
        );
      });

      it('should initialize with empty guessedLetters array', async () => {
        req.body = { level: 'Cities' };
        getRandomWord.mockResolvedValue('TOKYO');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith(
          expect.objectContaining({
            guessedLetters: [],
          })
        );
      });

      it('should preserve all special characters together', async () => {
        req.body = { level: 'TV Shows' };
        getRandomWord.mockResolvedValue("IT'S ALWAYS SUNNY: THE SHOW, DAY 1.");
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        generateToken.mockReturnValue('mock-jwt-token');

        await gameController.createGame(req, res, next);

        expect(createGame).toHaveBeenCalledWith({
          level: 'TV Shows',
          answer: "IT'S ALWAYS SUNNY: THE SHOW, DAY 1.",
          currentProgress: "__'_ ______ _____: ___ ____, ___ _.",
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        });
      });
    });

    describe('No Words Found Cases', () => {
      it('should return 404 when no words found for level', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue(null);

        await gameController.createGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'No words found for level: Movies',
        });
        expect(createGame).not.toHaveBeenCalled();
        expect(generateToken).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 404 when getRandomWord returns undefined', async () => {
        req.body = { level: 'Sports' };
        getRandomWord.mockResolvedValue(undefined);

        await gameController.createGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'No words found for level: Sports',
        });
      });

      it('should return 404 when getRandomWord returns empty string', async () => {
        req.body = { level: 'Animals' };
        getRandomWord.mockResolvedValue('');

        await gameController.createGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'No words found for level: Animals',
        });
      });
    });

    describe('Error Handling', () => {
      it('should call next with error when getRandomWord throws', async () => {
        req.body = { level: 'Movies' };
        const error = new Error('Database error');
        getRandomWord.mockRejectedValue(error);

        await gameController.createGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should call next with error when createGame throws', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue('JAWS');
        const error = new Error('Database insert error');
        createGame.mockRejectedValue(error);

        await gameController.createGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should call next with error when generateToken throws', async () => {
        req.body = { level: 'Movies' };
        getRandomWord.mockResolvedValue('JAWS');
        createGame.mockResolvedValue('507f1f77bcf86cd799439011');
        const error = new Error('Token generation error');
        generateToken.mockImplementation(() => {
          throw error;
        });

        await gameController.createGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('getGame', () => {
    describe('Success Cases', () => {
      it('should return game state from req.game', async () => {
        req.game = {
          level: 'Movies',
          attempts: 4,
          currentProgress: 'JA__',
          gameOver: false,
          guessedLetters: ['j', 'a'],
        };

        await gameController.getGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Movies',
            attempts: 4,
            currentProgress: 'JA__',
            gameOver: false,
            guessedLetters: ['j', 'a'],
          },
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return empty guessedLetters array when undefined', async () => {
        req.game = {
          level: 'Sports',
          attempts: 6,
          currentProgress: '______',
          gameOver: false,
          guessedLetters: undefined,
        };

        await gameController.getGame(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Sports',
            attempts: 6,
            currentProgress: '______',
            gameOver: false,
            guessedLetters: [],
          },
        });
      });

      it('should return empty guessedLetters array when null', async () => {
        req.game = {
          level: 'Animals',
          attempts: 5,
          currentProgress: 'E______',
          gameOver: false,
          guessedLetters: null,
        };

        await gameController.getGame(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Animals',
            attempts: 5,
            currentProgress: 'E______',
            gameOver: false,
            guessedLetters: [],
          },
        });
      });

      it('should return game with gameOver true', async () => {
        req.game = {
          level: 'Cities',
          attempts: 0,
          currentProgress: 'TOKYO',
          gameOver: true,
          guessedLetters: ['t', 'o', 'k', 'y'],
        };

        await gameController.getGame(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Cities',
            attempts: 0,
            currentProgress: 'TOKYO',
            gameOver: true,
            guessedLetters: ['t', 'o', 'k', 'y'],
          },
        });
      });

      it('should not include answer in response', async () => {
        req.game = {
          level: 'Movies',
          answer: 'JAWS', // Should not be in response
          attempts: 4,
          currentProgress: 'JA__',
          gameOver: false,
          guessedLetters: ['j', 'a'],
        };

        await gameController.getGame(req, res, next);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData.game).not.toHaveProperty('answer');
      });
    });

    describe('Error Handling', () => {
      it('should call next with error when accessing game throws', async () => {
        const error = new Error('Game access error');
        Object.defineProperty(req, 'game', {
          get() {
            throw error;
          },
        });

        await gameController.getGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should call next with error when res.json throws', async () => {
        req.game = {
          level: 'Movies',
          attempts: 4,
          currentProgress: 'JA__',
          gameOver: false,
          guessedLetters: ['j', 'a'],
        };
        const error = new Error('JSON error');
        res.json.mockImplementation(() => {
          throw error;
        });

        await gameController.getGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('updateGame', () => {
    describe('Success Cases - Correct Guess', () => {
      it('should update progress with correct single letter guess', async () => {
        req.body = { letter: 'a' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '____',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '_A__',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['a'],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Movies',
            attempts: 6,
            currentProgress: '_A__',
            gameOver: false,
            guessedLetters: ['a'],
            isCorrectGuess: true,
            won: false,
          },
        });
      });

      it('should reveal all occurrences of guessed letter', async () => {
        req.body = { letter: 's' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '_A__',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['a'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '_A_S',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['a', 's'],
        });
      });

      it('should handle case-insensitive matching (uppercase answer, lowercase guess)', async () => {
        req.body = { letter: 'j' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '____',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'J___',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['j'],
        });
      });

      it('should maintain original case of answer letters', async () => {
        req.body = { letter: 'm' };
        req.game = {
          level: 'Movies',
          answer: 'Matrix',
          currentProgress: '______',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'M_____',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['m'],
        });
      });

      it('should preserve existing progress when revealing new letters', async () => {
        req.body = { letter: 'w' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: 'JA_S',
          attempts: 5,
          gameOver: false,
          guessedLetters: ['j', 'a', 's'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'JAWS',
          attempts: 5,
          gameOver: true,
          guessedLetters: ['j', 'a', 's', 'w'],
        });
      });
    });

    describe('Success Cases - Incorrect Guess', () => {
      it('should decrement attempts on incorrect guess', async () => {
        req.body = { letter: 'x' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '_A__',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['a'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '_A__',
          attempts: 5,
          gameOver: false,
          guessedLetters: ['a', 'x'],
        });
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Movies',
            attempts: 5,
            currentProgress: '_A__',
            gameOver: false,
            guessedLetters: ['a', 'x'],
            isCorrectGuess: false,
            won: false,
          },
        });
      });

      it('should not change progress on incorrect guess', async () => {
        req.body = { letter: 'z' };
        req.game = {
          level: 'Sports',
          answer: 'SOCCER',
          currentProgress: 'S_____',
          attempts: 4,
          gameOver: false,
          guessedLetters: ['s'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'S_____',
          attempts: 3,
          gameOver: false,
          guessedLetters: ['s', 'z'],
        });
      });
    });

    describe('Win Condition', () => {
      it('should set gameOver true when word is completed', async () => {
        req.body = { letter: 'w' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: 'JA_S',
          attempts: 3,
          gameOver: false,
          guessedLetters: ['j', 'a', 's'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'JAWS',
          attempts: 3,
          gameOver: true,
          guessedLetters: ['j', 'a', 's', 'w'],
        });
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Movies',
            attempts: 3,
            currentProgress: 'JAWS',
            gameOver: true,
            guessedLetters: ['j', 'a', 's', 'w'],
            isCorrectGuess: true,
            won: true,
          },
        });
      });

      it('should set won to true when player wins', async () => {
        req.body = { letter: 'o' };
        req.game = {
          level: 'Cities',
          answer: 'TOKYO',
          currentProgress: 'T_KY_',
          attempts: 2,
          gameOver: false,
          guessedLetters: ['t', 'k', 'y'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData.game.won).toBe(true);
        expect(responseData.game.gameOver).toBe(true);
      });
    });

    describe('Loss Condition', () => {
      it('should set gameOver true when attempts reach 0', async () => {
        req.body = { letter: 'z' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '_A__',
          attempts: 1,
          gameOver: false,
          guessedLetters: ['a'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'JAWS',
          attempts: 0,
          gameOver: true,
          guessedLetters: ['a', 'z'],
        });
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          game: {
            level: 'Movies',
            attempts: 0,
            currentProgress: 'JAWS',
            gameOver: true,
            guessedLetters: ['a', 'z'],
            isCorrectGuess: false,
            won: false,
          },
        });
      });

      it('should reveal answer when game is lost', async () => {
        req.body = { letter: 'x' };
        req.game = {
          level: 'Sports',
          answer: 'SOCCER',
          currentProgress: 'S_____',
          attempts: 1,
          gameOver: false,
          guessedLetters: ['s'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'SOCCER',
          attempts: 0,
          gameOver: true,
          guessedLetters: ['s', 'x'],
        });
      });

      it('should set won to false when player loses', async () => {
        req.body = { letter: 'q' };
        req.game = {
          level: 'Animals',
          answer: 'ELEPHANT',
          currentProgress: 'E_E____T',
          attempts: 1,
          gameOver: false,
          guessedLetters: ['e', 't'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData.game.won).toBe(false);
        expect(responseData.game.gameOver).toBe(true);
        expect(responseData.game.attempts).toBe(0);
      });
    });

    describe('Game Already Over', () => {
      it('should return 400 when game is already over', async () => {
        req.body = { letter: 'a' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: 'JAWS',
          attempts: 0,
          gameOver: true,
          guessedLetters: ['j', 'a', 'w', 's'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Game is already over',
        });
        expect(updateGame).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });

      it('should not update database when game is already over', async () => {
        req.body = { letter: 'x' };
        req.game = {
          level: 'Sports',
          answer: 'SOCCER',
          currentProgress: 'SOCCER',
          attempts: 3,
          gameOver: true,
          guessedLetters: ['s', 'o', 'c', 'e', 'r'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).not.toHaveBeenCalled();
      });
    });

    describe('Letter Already Guessed', () => {
      it('should return 400 when letter already guessed', async () => {
        req.body = { letter: 'a' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '_A__',
          attempts: 5,
          gameOver: false,
          guessedLetters: ['a'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Letter already guessed',
        });
        expect(updateGame).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });

      it('should detect already guessed letter in middle of array', async () => {
        req.body = { letter: 'b' };
        req.game = {
          level: 'Animals',
          answer: 'ELEPHANT',
          currentProgress: 'E_E__A__',
          attempts: 4,
          gameOver: false,
          guessedLetters: ['e', 'b', 'a'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Letter already guessed',
        });
      });

      it('should handle undefined guessedLetters gracefully', async () => {
        req.body = { letter: 'a' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '____',
          attempts: 6,
          gameOver: false,
          guessedLetters: undefined,
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '_A__',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['a'],
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should handle null guessedLetters gracefully', async () => {
        req.body = { letter: 's' };
        req.game = {
          level: 'Sports',
          answer: 'SOCCER',
          currentProgress: '______',
          attempts: 6,
          gameOver: false,
          guessedLetters: null,
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'S_____',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['s'],
        });
      });
    });

    describe('Complex Word Scenarios', () => {
      it('should handle multi-word answers with spaces', async () => {
        req.body = { letter: 'e' };
        req.game = {
          level: 'Movies',
          answer: 'THE MATRIX',
          currentProgress: '___ ______',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '__E ______',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['e'],
        });
      });

      it('should handle words with hyphens', async () => {
        req.body = { letter: 'i' };
        req.game = {
          level: 'Movies',
          answer: 'SPIDER-MAN',
          currentProgress: '______-___',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '__I___-___',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['i'],
        });
      });

      it('should handle duplicate letters in answer', async () => {
        req.body = { letter: 'o' };
        req.game = {
          level: 'Food',
          answer: 'TOMATO',
          currentProgress: '______',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: '_O___O',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['o'],
        });
      });

      it('should handle three occurrences of same letter', async () => {
        req.body = { letter: 'e' };
        req.game = {
          level: 'Animals',
          answer: 'ELEPHANT',
          currentProgress: '________',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
          currentProgress: 'E_E_____',
          attempts: 6,
          gameOver: false,
          guessedLetters: ['e'],
        });
      });
    });

    describe('Error Handling', () => {
      it('should call next with error when updateGame throws', async () => {
        req.body = { letter: 'a' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '____',
          attempts: 6,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';
        const error = new Error('Database update error');
        updateGame.mockRejectedValue(error);

        await gameController.updateGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should call next with error when processing throws', async () => {
        req.body = { letter: 'a' };
        req.game = null; // Will cause error when accessing game.gameOver
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('Edge Cases', () => {
      it('should add letter to guessedLetters even on incorrect guess', async () => {
        req.body = { letter: 'x' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: '____',
          attempts: 3,
          gameOver: false,
          guessedLetters: [],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          expect.objectContaining({
            guessedLetters: ['x'],
          })
        );
      });

      it('should preserve order of guessed letters', async () => {
        req.body = { letter: 'd' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: 'JA__',
          attempts: 4,
          gameOver: false,
          guessedLetters: ['j', 'a', 'x'],
        };
        req.gameId = '507f1f77bcf86cd799439011';

        await gameController.updateGame(req, res, next);

        expect(updateGame).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          expect.objectContaining({
            guessedLetters: ['j', 'a', 'x', 'd'],
          })
        );
      });

      it('should handle winning on last attempt', async () => {
        req.body = { letter: 'w' };
        req.game = {
          level: 'Movies',
          answer: 'JAWS',
          currentProgress: 'JA_S',
          attempts: 1,
          gameOver: false,
          guessedLetters: ['j', 'a', 's'],
        };
        req.gameId = '507f1f77bcf86cd799439011';
        updateGame.mockResolvedValue();

        await gameController.updateGame(req, res, next);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData.game.won).toBe(true);
        expect(responseData.game.attempts).toBe(1);
        expect(responseData.game.gameOver).toBe(true);
      });
    });
  });

  describe('deleteGame', () => {
    describe('Success Cases', () => {
      it('should delete game and return 204', async () => {
        req.gameId = '507f1f77bcf86cd799439011';
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(deleteGame).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalledWith();
        expect(next).not.toHaveBeenCalled();
      });

      it('should call deleteGame with correct gameId', async () => {
        req.gameId = '123abc456def789012345678';
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(deleteGame).toHaveBeenCalledWith('123abc456def789012345678');
      });

      it('should return 204 with no content', async () => {
        req.gameId = '507f1f77bcf86cd799439011';
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalledWith();
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should call deleteGame exactly once', async () => {
        req.gameId = '507f1f77bcf86cd799439011';
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(deleteGame).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Handling', () => {
      it('should call next with error when deleteGame throws', async () => {
        req.gameId = '507f1f77bcf86cd799439011';
        const error = new Error('Database deletion error');
        deleteGame.mockRejectedValue(error);

        await gameController.deleteGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
      });

      it('should call next with error when gameId is missing', async () => {
        req.gameId = null;
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(deleteGame).toHaveBeenCalledWith(null);
      });

      it('should handle game not found scenario', async () => {
        req.gameId = '507f1f77bcf86cd799439011';
        const error = new Error('Game not found');
        deleteGame.mockRejectedValue(error);

        await gameController.deleteGame(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('Edge Cases', () => {
      it('should handle undefined gameId', async () => {
        req.gameId = undefined;
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(deleteGame).toHaveBeenCalledWith(undefined);
      });

      it('should not call res.json', async () => {
        req.gameId = '507f1f77bcf86cd799439011';
        deleteGame.mockResolvedValue();

        await gameController.deleteGame(req, res, next);

        expect(res.json).not.toHaveBeenCalled();
      });
    });
  });
});
