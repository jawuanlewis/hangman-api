import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateToken } from '@/middleware/auth.js';
import { verifyToken } from '@/config/jwt.js';
import { getGameById } from '@/config/db.js';

// Mock the dependencies
vi.mock('@/config/jwt.js');
vi.mock('@/config/db.js');

describe('Authentication Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock request, response, and next function
    req = {
      headers: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  describe('authenticateToken', () => {
    describe('Success Cases', () => {
      it('should authenticate valid token and attach game to request', async () => {
        const mockGameId = '507f1f77bcf86cd799439011';
        const mockGame = {
          _id: mockGameId,
          answer: 'TEST',
          progress: '____',
          attempts: 6,
        };

        req.headers.authorization = 'Bearer valid-token-123';

        vi.mocked(verifyToken).mockReturnValue({ gameId: mockGameId });
        vi.mocked(getGameById).mockResolvedValue(mockGame);

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith('valid-token-123');
        expect(getGameById).toHaveBeenCalledWith(mockGameId);
        expect(req.gameId).toBe(mockGameId);
        expect(req.game).toEqual(mockGame);
        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should handle Bearer token with different casing', async () => {
        const mockGameId = 'game-123';
        const mockGame = { _id: mockGameId, answer: 'WORD' };

        req.headers.authorization = 'bearer lowercase-token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: mockGameId });
        vi.mocked(getGameById).mockResolvedValue(mockGame);

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith('lowercase-token');
        expect(next).toHaveBeenCalledOnce();
      });

      it('should attach complete game object to request', async () => {
        const mockGame = {
          _id: '123',
          answer: 'COMPLETE',
          progress: '________',
          attempts: 5,
          guessedLetters: ['A', 'E'],
          level: 'Movies',
          createdAt: new Date(),
        };

        req.headers.authorization = 'Bearer token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockResolvedValue(mockGame);

        await authenticateToken(req, res, next);

        expect(req.game).toEqual(mockGame);
        expect(req.game.guessedLetters).toEqual(['A', 'E']);
        expect(req.game.createdAt).toBeInstanceOf(Date);
      });
    });

    describe('Missing Token Cases', () => {
      it('should return 401 when no authorization header', async () => {
        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access token required',
        });
        expect(next).not.toHaveBeenCalled();
        expect(verifyToken).not.toHaveBeenCalled();
      });

      it('should return 401 when authorization header is empty string', async () => {
        req.headers.authorization = '';

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access token required',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 401 when authorization header has no token part', async () => {
        req.headers.authorization = 'Bearer';

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access token required',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 401 when authorization header has only spaces', async () => {
        req.headers.authorization = 'Bearer   ';

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 401 when authorization header is malformed', async () => {
        req.headers.authorization = 'InvalidFormat';

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access token required',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Invalid Token Cases', () => {
      it('should return 403 for invalid token signature', async () => {
        req.headers.authorization = 'Bearer invalid-token';

        vi.mocked(verifyToken).mockImplementation(() => {
          throw new Error('Invalid or expired token');
        });

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid or expired token',
        });
        expect(next).not.toHaveBeenCalled();
        expect(getGameById).not.toHaveBeenCalled();
      });

      it('should return 403 for expired token', async () => {
        req.headers.authorization = 'Bearer expired-token';

        vi.mocked(verifyToken).mockImplementation(() => {
          throw new Error('Token has expired');
        });

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token has expired',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 403 with generic message for error without message', async () => {
        req.headers.authorization = 'Bearer bad-token';

        vi.mocked(verifyToken).mockImplementation(() => {
          throw new Error();
        });

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 403 for malformed JWT', async () => {
        req.headers.authorization = 'Bearer not.a.valid.jwt';

        vi.mocked(verifyToken).mockImplementation(() => {
          throw new Error('jwt malformed');
        });

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'jwt malformed',
        });
      });
    });

    describe('Game Not Found Cases', () => {
      it('should return 404 when game does not exist', async () => {
        const mockGameId = 'nonexistent-game';

        req.headers.authorization = 'Bearer valid-token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: mockGameId });
        vi.mocked(getGameById).mockResolvedValue(null);

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith('valid-token');
        expect(getGameById).toHaveBeenCalledWith(mockGameId);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Game not found or expired',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 404 when game has expired and been deleted', async () => {
        req.headers.authorization = 'Bearer valid-but-expired-game-token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: 'expired-game' });
        vi.mocked(getGameById).mockResolvedValue(null);

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Game not found or expired',
        });
      });

      it('should verify game exists even with valid token', async () => {
        req.headers.authorization = 'Bearer token-for-deleted-game';

        vi.mocked(verifyToken).mockReturnValue({ gameId: 'deleted-123' });
        vi.mocked(getGameById).mockResolvedValue(null);

        await authenticateToken(req, res, next);

        expect(getGameById).toHaveBeenCalledWith('deleted-123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Database Error Cases', () => {
      it('should return 403 when database query fails', async () => {
        req.headers.authorization = 'Bearer valid-token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockRejectedValue(
          new Error('Database connection failed')
        );

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should handle database timeout errors', async () => {
        req.headers.authorization = 'Bearer valid-token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockRejectedValue(
          new Error('Operation timeout')
        );

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Operation timeout',
        });
      });
    });

    describe('Request Mutation', () => {
      it('should attach gameId to request object', async () => {
        const gameId = 'game-456';
        req.headers.authorization = 'Bearer token';

        vi.mocked(verifyToken).mockReturnValue({ gameId });
        vi.mocked(getGameById).mockResolvedValue({ _id: gameId });

        await authenticateToken(req, res, next);

        expect(req.gameId).toBe(gameId);
      });

      it('should not mutate request on authentication failure', async () => {
        req.headers.authorization = 'Bearer invalid';

        vi.mocked(verifyToken).mockImplementation(() => {
          throw new Error('Invalid token');
        });

        await authenticateToken(req, res, next);

        expect(req.gameId).toBeUndefined();
        expect(req.game).toBeUndefined();
      });

      it('should not mutate request when game not found', async () => {
        req.headers.authorization = 'Bearer token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockResolvedValue(null);

        await authenticateToken(req, res, next);

        expect(req.gameId).toBe('123'); // gameId is set before game lookup
        expect(req.game).toBeUndefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle token with special characters', async () => {
        const specialToken = 'abc123-_.~+/=';
        req.headers.authorization = `Bearer ${specialToken}`;

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockResolvedValue({ _id: '123' });

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith(specialToken);
        expect(next).toHaveBeenCalledOnce();
      });

      it('should handle very long tokens', async () => {
        const longToken = 'a'.repeat(1000);
        req.headers.authorization = `Bearer ${longToken}`;

        vi.mocked(verifyToken).mockReturnValue({ gameId: 'test' });
        vi.mocked(getGameById).mockResolvedValue({ _id: 'test' });

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith(longToken);
        expect(next).toHaveBeenCalledOnce();
      });

      it('should handle authorization header with proper spacing', async () => {
        req.headers.authorization = 'Bearer proper-token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockResolvedValue({ _id: '123' });

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith('proper-token');
        expect(next).toHaveBeenCalledOnce();
      });

      it('should handle decoded token with additional fields', async () => {
        const decodedToken = {
          gameId: '123',
          iat: 1234567890,
          exp: 1234567890,
          extraField: 'should-be-ignored',
        };

        req.headers.authorization = 'Bearer token';

        vi.mocked(verifyToken).mockReturnValue(decodedToken);
        vi.mocked(getGameById).mockResolvedValue({ _id: '123' });

        await authenticateToken(req, res, next);

        expect(req.gameId).toBe('123');
        expect(next).toHaveBeenCalledOnce();
      });
    });

    describe('Function Call Order', () => {
      it('should call verifyToken before getGameById', async () => {
        const callOrder = [];

        req.headers.authorization = 'Bearer token';

        vi.mocked(verifyToken).mockImplementation(() => {
          callOrder.push('verifyToken');
          return { gameId: '123' };
        });

        vi.mocked(getGameById).mockImplementation(async () => {
          callOrder.push('getGameById');
          return { _id: '123' };
        });

        await authenticateToken(req, res, next);

        expect(callOrder).toEqual(['verifyToken', 'getGameById']);
      });

      it('should not call getGameById if verifyToken fails', async () => {
        req.headers.authorization = 'Bearer invalid';

        vi.mocked(verifyToken).mockImplementation(() => {
          throw new Error('Invalid token');
        });

        await authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalled();
        expect(getGameById).not.toHaveBeenCalled();
      });

      it('should not call next if game not found', async () => {
        req.headers.authorization = 'Bearer token';

        vi.mocked(verifyToken).mockReturnValue({ gameId: '123' });
        vi.mocked(getGameById).mockResolvedValue(null);

        await authenticateToken(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
      });
    });
  });
});
