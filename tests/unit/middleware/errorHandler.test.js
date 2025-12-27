import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;
  let consoleErrorSpy;
  let originalEnv;

  beforeEach(() => {
    vi.clearAllMocks();

    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Mock console.error to avoid polluting test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      method: 'GET',
      path: '/api/test',
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  describe('errorHandler', () => {
    describe('MongoDB Errors', () => {
      it('should handle MongoServerError with 500 status', () => {
        const error = new Error('Duplicate key error');
        error.name = 'MongoServerError';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Database error occurred',
        });
      });

      it('should include error details in development mode', () => {
        process.env.NODE_ENV = 'development';

        const error = new Error('Connection timeout');
        error.name = 'MongoServerError';

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Database error occurred',
          details: 'Connection timeout',
        });
      });

      it('should not include error details in production mode', () => {
        process.env.NODE_ENV = 'production';

        const error = new Error('Sensitive database info');
        error.name = 'MongoServerError';

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Database error occurred',
        });
      });

      it('should log MongoDB errors', () => {
        const error = new Error('DB error');
        error.name = 'MongoServerError';

        errorHandler(error, req, res, next);

        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error:', error);
      });
    });

    describe('JWT Errors', () => {
      it('should handle JsonWebTokenError with 401 status', () => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid authentication token',
        });
      });

      it('should handle TokenExpiredError with 401 status', () => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication token expired',
        });
      });

      it('should not include details for JWT errors', () => {
        process.env.NODE_ENV = 'development';

        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';

        errorHandler(error, req, res, next);

        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall).not.toHaveProperty('details');
        expect(jsonCall).not.toHaveProperty('stack');
      });

      it('should log JWT errors', () => {
        const error = new Error('jwt error');
        error.name = 'JsonWebTokenError';

        errorHandler(error, req, res, next);

        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error:', error);
      });
    });

    describe('Generic Errors', () => {
      it('should handle generic error with default 500 status', () => {
        const error = new Error('Something went wrong');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Something went wrong',
        });
      });

      it('should use custom statusCode if provided', () => {
        const error = new Error('Bad request');
        error.statusCode = 400;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad request',
        });
      });

      it('should handle different custom status codes', () => {
        const testCases = [
          { statusCode: 400, message: 'Bad Request' },
          { statusCode: 403, message: 'Forbidden' },
          { statusCode: 404, message: 'Not Found' },
          { statusCode: 422, message: 'Unprocessable Entity' },
        ];

        testCases.forEach(({ statusCode, message }) => {
          const error = new Error(message);
          error.statusCode = statusCode;

          errorHandler(error, req, res, next);

          expect(res.status).toHaveBeenCalledWith(statusCode);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: message,
          });
        });
      });

      it('should use default message if error message is missing', () => {
        const error = new Error();

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        });
      });

      it('should include stack trace in development mode', () => {
        process.env.NODE_ENV = 'development';

        const error = new Error('Test error');
        error.stack = 'Error: Test error\n    at test.js:1:1';

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Test error',
          stack: 'Error: Test error\n    at test.js:1:1',
        });
      });

      it('should not include stack trace in production mode', () => {
        process.env.NODE_ENV = 'production';

        const error = new Error('Production error');
        error.stack = 'Error: Production error\n    at prod.js:1:1';

        errorHandler(error, req, res, next);

        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall).not.toHaveProperty('stack');
      });

      it('should log generic errors', () => {
        const error = new Error('Generic error');

        errorHandler(error, req, res, next);

        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error:', error);
      });
    });

    describe('Environment-Specific Behavior', () => {
      it('should behave differently in test environment', () => {
        process.env.NODE_ENV = 'test';

        const error = new Error('Test env error');

        errorHandler(error, req, res, next);

        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall).not.toHaveProperty('stack');
      });

      it('should handle undefined NODE_ENV', () => {
        delete process.env.NODE_ENV;

        const error = new Error('Undefined env');

        errorHandler(error, req, res, next);

        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall).not.toHaveProperty('stack');
      });

      it('should handle development environment case-sensitively', () => {
        process.env.NODE_ENV = 'Development'; // Different case

        const error = new Error('Case test');

        errorHandler(error, req, res, next);

        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall).not.toHaveProperty('stack');
      });
    });

    describe('Error Object Variations', () => {
      it('should handle Error without name property', () => {
        const error = new Error('Nameless error');
        delete error.name;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Nameless error',
        });
      });

      it('should handle custom error classes', () => {
        class CustomError extends Error {
          constructor(message) {
            super(message);
            this.name = 'CustomError';
            this.statusCode = 418;
          }
        }

        const error = new CustomError('Custom error message');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(418);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Custom error message',
        });
      });

      it('should handle errors with additional properties', () => {
        const error = new Error('Rich error');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.field = 'email';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Rich error',
        });
      });

      it('should handle very long error messages', () => {
        const longMessage = 'A'.repeat(1000);
        const error = new Error(longMessage);

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: longMessage,
        });
      });

      it('should handle error with empty string message', () => {
        const error = new Error('');

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
        });
      });
    });

    describe('Response Object Behavior', () => {
      it('should not call next() after handling error', () => {
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(next).not.toHaveBeenCalled();
      });

      it('should chain status and json calls correctly', () => {
        const error = new Error('Chain test');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledBefore(res.json);
      });

      it('should always include success: false', () => {
        const errors = [
          new Error('Generic'),
          Object.assign(new Error('JWT'), { name: 'JsonWebTokenError' }),
          Object.assign(new Error('Mongo'), { name: 'MongoServerError' }),
        ];

        errors.forEach((error) => {
          res.json.mockClear();
          errorHandler(error, req, res, next);

          const jsonCall = res.json.mock.calls[0][0];
          expect(jsonCall.success).toBe(false);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle error thrown as string', () => {
        // In JavaScript, you can throw any value
        const error = 'String error';

        // This would typically be wrapped in Error by Express
        const wrappedError = new Error(error);

        errorHandler(wrappedError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
      });

      it('should handle statusCode of 0', () => {
        const error = new Error('Zero status');
        error.statusCode = 0;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500); // Falls back to 500
      });

      it('should handle negative statusCode', () => {
        const error = new Error('Negative status');
        error.statusCode = -1;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(-1); // Uses provided value
      });

      it('should handle statusCode > 599', () => {
        const error = new Error('High status');
        error.statusCode = 999;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 status', () => {
      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return proper error message', () => {
      notFoundHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
      });
    });

    it('should handle different request methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        res.status.mockClear();
        res.json.mockClear();

        req.method = method;
        notFoundHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Route not found',
        });
      });
    });

    it('should handle different request paths', () => {
      const paths = [
        '/api/unknown',
        '/not/a/route',
        '/api/v1/nonexistent',
        '/',
      ];

      paths.forEach((path) => {
        res.status.mockClear();
        res.json.mockClear();

        req.path = path;
        notFoundHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Route not found',
        });
      });
    });

    it('should not require next parameter', () => {
      expect(() => {
        notFoundHandler(req, res);
      }).not.toThrow();
    });

    it('should always return success: false', () => {
      notFoundHandler(req, res);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(false);
    });
  });
});
