import { describe, it, expect, beforeEach, vi } from 'vitest';
import { corsOptions } from '@/config/cors.js';

describe('CORS Configuration', () => {
  describe('corsOptions', () => {
    it('should have correct structure with required fields', () => {
      expect(corsOptions).toHaveProperty('origin');
      expect(corsOptions).toHaveProperty('credentials', true);
      expect(corsOptions).toHaveProperty('methods');
      expect(corsOptions).toHaveProperty('allowedHeaders');
    });

    it('should have correct credentials setting', () => {
      expect(corsOptions.credentials).toBe(true);
    });

    it('should have correct HTTP methods', () => {
      const expectedMethods = [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ];
      expect(corsOptions.methods).toEqual(expectedMethods);
    });

    it('should have correct allowed headers', () => {
      const expectedHeaders = ['Content-Type', 'Authorization'];
      expect(corsOptions.allowedHeaders).toEqual(expectedHeaders);
    });

    it('should have origin as a function', () => {
      expect(typeof corsOptions.origin).toBe('function');
    });
  });

  describe('origin function', () => {
    let mockCallback;

    beforeEach(() => {
      mockCallback = vi.fn();
    });

    it('should allow requests with no origin', () => {
      corsOptions.origin(undefined, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow requests from localhost:5173', () => {
      corsOptions.origin('http://localhost:5173', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow requests from localhost:3000', () => {
      corsOptions.origin('http://localhost:3000', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow requests from CUSTOM_URL environment variable', () => {
      const customUrl = process.env.CUSTOM_URL;
      if (customUrl) {
        corsOptions.origin(customUrl, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      }
    });

    it('should allow requests from PROD_URL environment variable', () => {
      const prodUrl = process.env.PROD_URL;
      if (prodUrl) {
        corsOptions.origin(prodUrl, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      }
    });

    it('should allow requests from STAGING_URL environment variable', () => {
      const stagingUrl = process.env.STAGING_URL;
      if (stagingUrl) {
        corsOptions.origin(stagingUrl, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      }
    });

    it('should reject requests from unauthorized origins', () => {
      const unauthorizedOrigin = 'http://malicious-site.com';

      corsOptions.origin(unauthorizedOrigin, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.any(Error), false);
      const error = mockCallback.mock.calls[0][0];
      expect(error.message).toBe(
        'CORS policy does not allow access from this origin.'
      );
    });

    it('should reject multiple unauthorized origins', () => {
      const unauthorizedOrigins = [
        'http://evil.com',
        'https://hacker.net',
        'http://random-domain.org',
      ];

      unauthorizedOrigins.forEach((origin) => {
        const callback = vi.fn();
        corsOptions.origin(origin, callback);

        expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
        const error = callback.mock.calls[0][0];
        expect(error.message).toBe(
          'CORS policy does not allow access from this origin.'
        );
      });
    });

    it('should reject origin with similar but incorrect localhost port', () => {
      const callback = vi.fn();
      corsOptions.origin('http://localhost:4000', callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('should reject https localhost origins not in allowed list', () => {
      const callback = vi.fn();
      corsOptions.origin('https://localhost:5173', callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('should handle callback invocation correctly', () => {
      const callback = vi.fn();

      corsOptions.origin('http://localhost:5173', callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]).toHaveLength(2);
    });
  });
});
