import {
  getRandomWord,
  createGame,
  getGameById,
  updateGame,
  deleteGame,
} from '../config/db.js';
import { generateToken } from '../config/jwt.js';

const gameController = {
  // POST /api/game/init - Initialize new game
  initializeGame: async (req, res, next) => {
    try {
      const { level } = req.body;
      const answer = await getRandomWord(level.toLowerCase());

      if (!answer) {
        return res.status(404).json({
          success: false,
          error: `No words found for level: ${level}`,
        });
      }

      const preserveChars = [' ', '-', ':', ',', '.', "'"];
      const currentProgress = answer
        .split('')
        .map((char) => (preserveChars.includes(char) ? char : '_'))
        .join('');

      const gameData = {
        level,
        answer,
        currentProgress,
        attempts: 6,
        gameOver: false,
        guessedLetters: [],
      };

      const gameId = await createGame(gameData);
      const token = generateToken(gameId.toString());

      res.status(201).json({
        success: true,
        token,
        game: {
          level: gameData.level,
          attempts: gameData.attempts,
          currentProgress: gameData.currentProgress,
          gameOver: gameData.gameOver,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/game/current - Get current game state
  getCurrentGame: async (req, res, next) => {
    try {
      const game = req.game; // From auth middleware

      res.json({
        success: true,
        game: {
          level: game.level,
          attempts: game.attempts,
          currentProgress: game.currentProgress,
          gameOver: game.gameOver,
          guessedLetters: game.guessedLetters || [],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/game/guess - Make a letter guess
  makeGuess: async (req, res, next) => {
    try {
      const { letter } = req.body;
      const game = req.game;
      const gameId = req.gameId;

      if (game.gameOver) {
        return res.status(400).json({
          success: false,
          error: 'Game is already over',
        });
      }

      if (game.guessedLetters && game.guessedLetters.includes(letter)) {
        return res.status(400).json({
          success: false,
          error: 'Letter already guessed',
        });
      }

      const answer = game.answer;
      let currentProgress = game.currentProgress;
      let isCorrectGuess = false;

      let updatedProgress = '';
      for (let i = 0; i < answer.length; i++) {
        if (answer[i].toLowerCase() === letter) {
          updatedProgress += answer[i];
          isCorrectGuess = true;
        } else {
          updatedProgress += currentProgress[i];
        }
      }

      let attempts = game.attempts;
      if (!isCorrectGuess) {
        attempts -= 1;
      }

      const gameOver = attempts <= 0 || updatedProgress === answer;
      if (gameOver) {
        updatedProgress = answer; // Reveal answer
      }

      // Update game in database
      const updateData = {
        currentProgress: updatedProgress,
        attempts,
        gameOver,
        guessedLetters: [...(game.guessedLetters || []), letter],
      };

      await updateGame(gameId, updateData);

      res.json({
        success: true,
        game: {
          level: game.level,
          attempts: updateData.attempts,
          currentProgress: updateData.currentProgress,
          gameOver: updateData.gameOver,
          guessedLetters: updateData.guessedLetters,
          isCorrectGuess,
          won: gameOver && attempts > 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/game/reset - Delete current game
  resetGame: async (req, res, next) => {
    try {
      const gameId = req.gameId;
      await deleteGame(gameId);

      res.json({
        success: true,
        message: 'Game deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

export default gameController;
