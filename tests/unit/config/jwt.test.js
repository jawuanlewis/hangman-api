import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, decodeToken } from '@/config/jwt.js';
import jwt from 'jsonwebtoken';

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const gameId = 'test-game-123';
      const token = generateToken(gameId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with correct payload structure', () => {
      const gameId = 'abc123xyz';
      const token = generateToken(gameId);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('gameId', gameId);
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiry
    });

    it('should handle different gameId formats', () => {
      const gameIds = [
        '507f1f77bcf86cd799439011', // MongoDB ObjectId format
        'simple-id',
        'id-with-dashes-123',
        'UPPERCASE',
        '12345',
      ];

      gameIds.forEach((gameId) => {
        const token = generateToken(gameId);
        const decoded = jwt.decode(token);

        expect(decoded.gameId).toBe(gameId);
      });
    });

    it('should set correct expiration time', () => {
      const gameId = 'test-game';
      const token = generateToken(gameId);
      const decoded = jwt.decode(token);

      // JWT_EXPIRY is set to '24h' in test setup
      const expectedExpiry = decoded.iat + 24 * 60 * 60; // 24 hours in seconds
      expect(decoded.exp).toBe(expectedExpiry);
    });

    it('should generate unique tokens for same gameId at different times', async () => {
      const gameId = 'same-id';
      const token1 = generateToken(gameId);

      // Wait 1 second to ensure different iat (JWT uses seconds, not ms)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const token2 = generateToken(gameId);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const gameId = 'test-game-123';
      const token = generateToken(gameId);

      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.gameId).toBe('test-game-123');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should verify and return complete payload', () => {
      const gameId = '507f1f77bcf86cd799439011';
      const token = generateToken(gameId);

      const decoded = verifyToken(token);

      expect(decoded).toMatchObject({
        gameId: gameId,
      });
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should throw error for invalid token signature', () => {
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJnYW1lSWQiOiJ0ZXN0IiwiaWF0IjoxNjE2MjM5MDIyfQ.invalid_signature';

      expect(() => verifyToken(invalidToken)).toThrow(
        'Invalid or expired token'
      );
    });

    it('should throw error for malformed token', () => {
      const malformedTokens = [
        'not-a-token',
        'only.two',
        '',
        'a.b.c.d.e', // too many parts
      ];

      malformedTokens.forEach((token) => {
        expect(() => verifyToken(token)).toThrow('Invalid or expired token');
      });
    });

    it('should throw error for null or undefined token', () => {
      expect(() => verifyToken(null)).toThrow();
      expect(() => verifyToken(undefined)).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const gameId = 'expired-game';
      const expiredToken = jwt.sign(
        { gameId },
        process.env.JWT_SECRET,
        { expiresIn: '0s' } // Already expired
      );

      // Wait a bit to ensure it's expired
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => verifyToken(expiredToken)).toThrow(
            'Invalid or expired token'
          );
          resolve();
        }, 10);
      });
    });

    it('should throw error with custom message for any JWT error', () => {
      const invalidToken = 'invalid.jwt.token';

      try {
        verifyToken(invalidToken);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Invalid or expired token');
      }
    });

    it('should throw error for token signed with different secret', () => {
      const gameId = 'test-game';
      const tokenWithDifferentSecret = jwt.sign(
        { gameId },
        'different-secret-key',
        { expiresIn: '24h' }
      );

      expect(() => verifyToken(tokenWithDifferentSecret)).toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const gameId = 'test-game-123';
      const token = generateToken(gameId);

      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.gameId).toBe(gameId);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should decode token payload structure correctly', () => {
      const gameId = '507f1f77bcf86cd799439011';
      const token = generateToken(gameId);

      const decoded = decodeToken(token);

      expect(decoded).toMatchObject({
        gameId: gameId,
      });
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
    });

    it('should decode expired token without throwing error', () => {
      // Create an expired token
      const gameId = 'expired-game';
      const expiredToken = jwt.sign({ gameId }, process.env.JWT_SECRET, {
        expiresIn: '0s',
      });

      // decodeToken should still work (doesn't verify)
      const decoded = decodeToken(expiredToken);

      expect(decoded).toBeDefined();
      expect(decoded.gameId).toBe(gameId);
    });

    it('should decode token with invalid signature without throwing error', () => {
      const gameId = 'test-game';
      const tokenWithWrongSecret = jwt.sign({ gameId }, 'wrong-secret', {
        expiresIn: '24h',
      });

      // decodeToken doesn't verify signature, so this should work
      const decoded = decodeToken(tokenWithWrongSecret);

      expect(decoded).toBeDefined();
      expect(decoded.gameId).toBe(gameId);
    });

    it('should return null for malformed token', () => {
      const malformedTokens = [
        'not-a-token',
        'invalid.token',
        '',
        'only.two.parts',
      ];

      malformedTokens.forEach((token) => {
        const decoded = decodeToken(token);
        expect(decoded).toBeNull();
      });
    });

    it('should return null for null or undefined token', () => {
      expect(decodeToken(null)).toBeNull();
      expect(decodeToken(undefined)).toBeNull();
    });

    it('should decode without validating expiration', () => {
      const gameId = 'test-game';
      const expiredToken = jwt.sign(
        { gameId },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      // verifyToken would throw, but decodeToken should work
      expect(() => verifyToken(expiredToken)).toThrow();

      const decoded = decodeToken(expiredToken);
      expect(decoded).toBeDefined();
      expect(decoded.gameId).toBe(gameId);
    });

    it('should decode complete payload with all JWT fields', () => {
      const gameId = 'complete-test';
      const token = generateToken(gameId);

      const decoded = decodeToken(token);

      expect(decoded).toHaveProperty('gameId');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(Object.keys(decoded).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Integration: generateToken -> verifyToken -> decodeToken', () => {
    it('should work together in complete flow', () => {
      const gameId = 'integration-test-123';

      // Generate token
      const token = generateToken(gameId);
      expect(token).toBeDefined();

      // Verify token
      const verified = verifyToken(token);
      expect(verified.gameId).toBe(gameId);

      // Decode token
      const decoded = decodeToken(token);
      expect(decoded.gameId).toBe(gameId);

      // Verified and decoded should have same payload
      expect(verified.gameId).toBe(decoded.gameId);
      expect(verified.iat).toBe(decoded.iat);
      expect(verified.exp).toBe(decoded.exp);
    });

    it('should show difference between verify and decode for invalid tokens', () => {
      const token = jwt.sign({ gameId: 'test' }, 'wrong-secret', {
        expiresIn: '1h',
      });

      // verifyToken should throw
      expect(() => verifyToken(token)).toThrow('Invalid or expired token');

      // decodeToken should still work
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.gameId).toBe('test');
    });
  });
});
