import rateLimit from 'express-rate-limit';

// Disable rate limiting in test environment
const isTestMode = process.env.NODE_ENV === 'test';
const noOpLimiter = (req, res, next) => next();

// General API rate limiter
export const apiLimiter = isTestMode
  ? noOpLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Stricter rate limiter for game creation
export const createGameLimiter = isTestMode
  ? noOpLimiter
  : rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // Limit each IP to 10 game initializations per 5 minutes
      message: {
        success: false,
        error: 'Too many games created, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Rate limiter for guesses (prevent brute force)
export const guessLimiter = isTestMode
  ? noOpLimiter
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 guesses per minute (covers rapid gameplay)
      message: {
        success: false,
        error: 'Too many guesses, slow down',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
