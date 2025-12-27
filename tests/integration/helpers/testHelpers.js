import request from 'supertest';

/**
 * Create a test game with the specified level
 * @param {Express.Application} app - Express app instance
 * @param {string} level - Game level (e.g., 'Movies', 'Sports')
 * @returns {Promise<{token: string, game: object, response: object}>}
 */
export const createTestGame = async (app, level = 'Movies') => {
  const response = await request(app)
    .post('/api/v1/games')
    .send({ level })
    .expect(201);

  return {
    token: response.body.token,
    game: response.body.game,
    response: response,
  };
};

/**
 * Submit a letter guess for a game
 * @param {Express.Application} app - Express app instance
 * @param {string} token - JWT token for the game
 * @param {string} letter - Letter to guess
 * @returns {Promise<Response>}
 */
export const submitGuess = async (app, token, letter) => {
  return request(app)
    .patch('/api/v1/games')
    .set('Authorization', `Bearer ${token}`)
    .send({ letter });
};

/**
 * Get the current game state
 * @param {Express.Application} app - Express app instance
 * @param {string} token - JWT token for the game
 * @returns {Promise<Response>}
 */
export const getGameState = async (app, token) => {
  return request(app)
    .get('/api/v1/games')
    .set('Authorization', `Bearer ${token}`);
};

/**
 * Delete a game
 * @param {Express.Application} app - Express app instance
 * @param {string} token - JWT token for the game
 * @returns {Promise<Response>}
 */
export const deleteGame = async (app, token) => {
  return request(app)
    .delete('/api/v1/games')
    .set('Authorization', `Bearer ${token}`);
};

/**
 * Play a complete game by guessing letters until win or loss
 * @param {Express.Application} app - Express app instance
 * @param {string} token - JWT token for the game
 * @param {string[]} letters - Array of letters to guess in order
 * @returns {Promise<object>} Final game state
 */
export const playGameWithLetters = async (app, token, letters) => {
  let lastResponse;

  for (const letter of letters) {
    lastResponse = await submitGuess(app, token, letter);

    // Stop if game is over
    if (lastResponse.body.game?.gameOver) {
      break;
    }
  }

  return lastResponse.body.game;
};

/**
 * Create a game and play until it's won
 * @param {Express.Application} app - Express app instance
 * @param {string} level - Game level
 * @param {string[]} winningLetters - Letters that will win the game
 * @returns {Promise<{token: string, finalState: object}>}
 */
export const createAndWinGame = async (app, level, winningLetters) => {
  const { token } = await createTestGame(app, level);
  const finalState = await playGameWithLetters(app, token, winningLetters);

  return { token, finalState };
};

/**
 * Create a game and play until it's lost
 * @param {Express.Application} app - Express app instance
 * @param {string} level - Game level
 * @param {string[]} wrongLetters - Letters that will lose the game (should be 6+ wrong guesses)
 * @returns {Promise<{token: string, finalState: object}>}
 */
export const createAndLoseGame = async (app, level, wrongLetters) => {
  const { token } = await createTestGame(app, level);
  const finalState = await playGameWithLetters(app, token, wrongLetters);

  return { token, finalState };
};

/**
 * Make multiple rapid requests to test rate limiting
 * @param {Function} requestFn - Function that returns a request promise
 * @param {number} count - Number of requests to make
 * @returns {Promise<Response[]>}
 */
export const makeRapidRequests = async (requestFn, count) => {
  const promises = Array(count)
    .fill(null)
    .map(() => requestFn());
  return Promise.all(promises);
};

/**
 * Extract game ID from JWT token (for debugging/testing)
 * @param {string} token - JWT token
 * @returns {string} Game ID
 */
export const extractGameIdFromToken = (token) => {
  // JWT format: header.payload.signature
  const payload = token.split('.')[1];
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
  return decoded.gameId;
};

/**
 * Wait for specified milliseconds (for rate limit testing)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Assert response has standard success format
 * @param {object} body - Response body
 * @param {number} expectedStatus - Expected HTTP status
 */
export const assertSuccessResponse = (body) => {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('game');
};

/**
 * Assert response has standard error format
 * @param {object} body - Response body
 */
export const assertErrorResponse = (body) => {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  expect(typeof body.error).toBe('string');
};

/**
 * Assert game state has expected properties
 * @param {object} game - Game object from response
 */
export const assertGameState = (game) => {
  expect(game).toHaveProperty('level');
  expect(game).toHaveProperty('attempts');
  expect(game).toHaveProperty('currentProgress');
  expect(game).toHaveProperty('gameOver');
  expect(typeof game.level).toBe('string');
  expect(typeof game.attempts).toBe('number');
  expect(typeof game.currentProgress).toBe('string');
  expect(typeof game.gameOver).toBe('boolean');
};
