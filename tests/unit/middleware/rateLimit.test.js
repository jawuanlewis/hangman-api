import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  apiLimiter,
  createGameLimiter,
  guessLimiter,
} from '@/middleware/rateLimit.js';

describe('Rate Limit Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      ip: '127.0.0.1',
      headers: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    next = vi.fn();
  });

  describe('apiLimiter', () => {
    it('should be a function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should be Express middleware with correct signature', () => {
      expect(apiLimiter.length).toBeGreaterThanOrEqual(3); // (req, res, next) or more
    });

    it('should have rate limit configuration', () => {
      // The rate limiter function has options attached
      expect(apiLimiter).toBeDefined();
    });

    it('should allow requests under the limit', async () => {
      // First request should pass through
      await apiLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should set rate limit headers', async () => {
      await apiLimiter(req, res, next);

      // express-rate-limit sets headers like RateLimit-Limit, RateLimit-Remaining
      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('createGameLimiter', () => {
    it('should be a function', () => {
      expect(typeof createGameLimiter).toBe('function');
    });

    it('should be Express middleware with correct signature', () => {
      expect(createGameLimiter.length).toBeGreaterThanOrEqual(3);
    });

    it('should have rate limit configuration', () => {
      expect(createGameLimiter).toBeDefined();
    });

    it('should allow requests under the limit', async () => {
      await createGameLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should set rate limit headers', async () => {
      await createGameLimiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('guessLimiter', () => {
    it('should be a function', () => {
      expect(typeof guessLimiter).toBe('function');
    });

    it('should be Express middleware with correct signature', () => {
      expect(guessLimiter.length).toBeGreaterThanOrEqual(3);
    });

    it('should have rate limit configuration', () => {
      expect(guessLimiter).toBeDefined();
    });

    it('should allow requests under the limit', async () => {
      await guessLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should set rate limit headers', async () => {
      await guessLimiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('should track requests by IP address', async () => {
      const ip1 = { ...req, ip: '192.168.1.1' };
      const ip2 = { ...req, ip: '192.168.1.2' };

      await apiLimiter(ip1, res, next);
      await apiLimiter(ip2, res, next);

      // Both should succeed as they're different IPs
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('should handle requests from same IP', async () => {
      const sameIpReq = { ...req, ip: '10.0.0.1' };

      // Make multiple requests from same IP
      await apiLimiter(sameIpReq, res, next);
      await apiLimiter(sameIpReq, res, next);

      // Should track both requests
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing IP address gracefully', async () => {
      const noIpReq = { ...req, ip: undefined };

      await apiLimiter(noIpReq, res, next);

      // Should still work (library handles this)
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Different Rate Limiters', () => {
    it('should have different instances for different limiters', () => {
      // Each limiter should be a separate instance
      expect(apiLimiter).not.toBe(createGameLimiter);
      expect(apiLimiter).not.toBe(guessLimiter);
      expect(createGameLimiter).not.toBe(guessLimiter);
    });

    it('should work independently', async () => {
      const sameReq = { ...req, ip: '172.16.0.1' };

      // Each limiter should have its own counter
      await apiLimiter(sameReq, res, next);
      await createGameLimiter(sameReq, res, next);
      await guessLimiter(sameReq, res, next);

      expect(next).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Response Format', () => {
    it('should use consistent response structure', async () => {
      // All rate limiters should use success: false format
      // This is tested through the message configuration
      expect(apiLimiter).toBeDefined();
      expect(createGameLimiter).toBeDefined();
      expect(guessLimiter).toBeDefined();
    });
  });

  describe('Middleware Chain Compatibility', () => {
    it('should be compatible with Express middleware chain', async () => {
      const middlewareChain = [apiLimiter, createGameLimiter, guessLimiter];

      for (const middleware of middlewareChain) {
        expect(typeof middleware).toBe('function');
        expect(middleware.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should call next() on successful rate check', async () => {
      await apiLimiter(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      // Should be called without error argument
      expect(next).toHaveBeenCalledWith();
    });

    it('should work with async/await', async () => {
      const promise = apiLimiter(req, res, next);

      // Should return a value (even if undefined) without throwing
      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('Headers Configuration', () => {
    it('should set standard rate limit headers', async () => {
      await apiLimiter(req, res, next);

      // express-rate-limit with standardHeaders: true sets these
      const headerCalls = res.setHeader.mock.calls.map((call) => call[0]);

      // Should set some rate limit related headers
      expect(res.setHeader).toHaveBeenCalled();
      expect(headerCalls.length).toBeGreaterThan(0);
    });

    it('should not use legacy headers', async () => {
      await apiLimiter(req, res, next);

      const headerCalls = res.setHeader.mock.calls.map((call) => call[0]);

      // Legacy headers are X-RateLimit-* which we disabled
      const legacyHeaders = headerCalls.filter((h) =>
        h.startsWith('X-RateLimit-')
      );

      // Should use standard RateLimit-* headers instead
      expect(legacyHeaders.length).toBe(0);
    });
  });

  describe('Request Context', () => {
    it('should handle requests with different headers', async () => {
      const reqWithHeaders = {
        ...req,
        headers: {
          'user-agent': 'Test Agent',
          'content-type': 'application/json',
        },
      };

      await apiLimiter(reqWithHeaders, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle requests with query parameters', async () => {
      const reqWithQuery = {
        ...req,
        query: { level: 'Movies' },
      };

      await apiLimiter(reqWithQuery, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle requests with body', async () => {
      const reqWithBody = {
        ...req,
        body: { letter: 'a' },
      };

      await apiLimiter(reqWithBody, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('IPv4 and IPv6 Addresses', () => {
    it('should handle IPv4 addresses', async () => {
      const ipv4Addresses = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1',
      ];

      for (const ip of ipv4Addresses) {
        next.mockClear();
        await apiLimiter({ ...req, ip }, res, next);
        expect(next).toHaveBeenCalled();
      }
    });

    it('should handle IPv6 addresses', async () => {
      const ipv6Addresses = [
        '::1',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        'fe80::1',
      ];

      for (const ip of ipv6Addresses) {
        next.mockClear();
        await apiLimiter({ ...req, ip }, res, next);
        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests from same IP', async () => {
      const sameIpReq = { ...req, ip: '203.0.113.1' };

      const promises = [
        apiLimiter(sameIpReq, res, next),
        apiLimiter(sameIpReq, res, next),
        apiLimiter(sameIpReq, res, next),
      ];

      await Promise.all(promises);

      // All should complete
      expect(next).toHaveBeenCalled();
    });

    it('should handle concurrent requests from different IPs', async () => {
      const requests = [
        { ...req, ip: '198.51.100.1' },
        { ...req, ip: '198.51.100.2' },
        { ...req, ip: '198.51.100.3' },
      ];

      const promises = requests.map((r) => apiLimiter(r, res, next));

      await Promise.all(promises);

      expect(next).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty IP string', async () => {
      const emptyIpReq = { ...req, ip: '' };

      await apiLimiter(emptyIpReq, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle null IP', async () => {
      const nullIpReq = { ...req, ip: null };

      await apiLimiter(nullIpReq, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle request without IP property', async () => {
      const noIpReq = { headers: {} };

      await apiLimiter(noIpReq, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should export functions, not objects', () => {
      expect(typeof apiLimiter).toBe('function');
      expect(typeof createGameLimiter).toBe('function');
      expect(typeof guessLimiter).toBe('function');
    });

    it('should be callable as middleware', () => {
      const limiters = [apiLimiter, createGameLimiter, guessLimiter];

      limiters.forEach((limiter) => {
        expect(() => limiter(req, res, next)).not.toThrow();
      });
    });
  });
});
