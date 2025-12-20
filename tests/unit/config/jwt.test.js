import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '@/config/jwt.js';

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const gameId = 'test-game-123';
      const token = generateToken(gameId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
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

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not-a-token')).toThrow();
    });
  });
});
