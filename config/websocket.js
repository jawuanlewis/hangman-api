import { Server } from 'socket.io';

/**
 * WebSocket Setup for Future Multiplayer Support
 *
 * This file provides a skeleton structure for Socket.io integration.
 * Uncomment and implement when ready to add multiplayer features.
 */

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.PROD_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for JWT authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    // Verify token and attach user/game info to socket
    // verifyToken(token);
    next();
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join a game room
    socket.on('join-game', (gameId) => {
      socket.join(gameId);
      console.log(`✅ Socket ${socket.id} joined game ${gameId}`);
    });

    // Handle multiplayer guess
    socket.on('multiplayer-guess', (data) => {
      const { gameId, letter, playerId } = data;
      // Process guess and broadcast to room
      io.to(gameId).emit('guess-result', {
        playerId,
        letter,
        // ... game state updates
      });
    });

    // Handle player leaving
    socket.on('disconnect', () => {
      console.log('ℹ️ Client disconnected:', socket.id);
    });
  });

  return io;
};

/**
 * Future Multiplayer Game Flow:
 *
 * 1. POST /api/game/multiplayer/create
 *    - Create multiplayer game session
 *    - Return game room ID and JWT
 *
 * 2. POST /api/game/multiplayer/join/:roomId
 *    - Join existing game room
 *    - Return JWT with room access
 *
 * 3. WebSocket Events:
 *    - 'join-game': Player joins game room
 *    - 'player-guess': Player makes a guess
 *    - 'game-update': Broadcast game state to all players
 *    - 'player-left': Handle player disconnection
 *    - 'game-over': Announce winner/end game
 *
 * 4. Database Schema Updates Needed:
 *    - Add 'multiplayerGames' collection
 *    - Schema: {
 *        roomId,
 *        players: [{id, name, score}],
 *        currentTurn,
 *        gameState,
 *        createdAt,
 *        status: 'waiting' | 'active' | 'finished'
 *      }
 */

// Dependencies to install when implementing:
// npm install socket.io
