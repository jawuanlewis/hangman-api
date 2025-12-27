import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validate } from '@/middleware/validation.js';
import { z } from 'zod';

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      query: {},
      params: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  describe('validate', () => {
    describe('Success Cases', () => {
      it('should pass validation with valid body data', async () => {
        const schema = z.object({
          body: z.object({
            name: z.string(),
            age: z.number(),
          }),
        });

        req.body = { name: 'John', age: 30 };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should assign parsed body to request', async () => {
        const schema = z.object({
          body: z.object({
            value: z.string(),
          }),
        });

        req.body = { value: 'test' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ value: 'test' });
        expect(next).toHaveBeenCalledOnce();
      });

      it('should validate and transform body data', async () => {
        const schema = z.object({
          body: z.object({
            letter: z.string().transform((val) => val.toUpperCase()),
          }),
        });

        req.body = { letter: 'a' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ letter: 'A' });
        expect(next).toHaveBeenCalledOnce();
      });

      it('should validate params when provided', async () => {
        const schema = z.object({
          params: z.object({
            id: z.string(),
          }),
        });

        req.params = { id: '123' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.params).toEqual({ id: '123' });
        expect(next).toHaveBeenCalledOnce();
      });

      it('should validate query when provided', async () => {
        const schema = z.object({
          query: z.object({
            search: z.string(),
          }),
        });

        req.query = { search: 'test' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
      });

      it('should validate body and params together', async () => {
        const schema = z.object({
          body: z.object({
            name: z.string(),
          }),
          params: z.object({
            id: z.string(),
          }),
        });

        req.body = { name: 'Test' };
        req.params = { id: '456' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ name: 'Test' });
        expect(req.params).toEqual({ id: '456' });
        expect(next).toHaveBeenCalledOnce();
      });

      it('should only assign body if defined in schema', async () => {
        const schema = z.object({
          params: z.object({
            id: z.string(),
          }),
        });

        req.body = { shouldNotChange: 'value' };
        req.params = { id: '789' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ shouldNotChange: 'value' }); // Unchanged
        expect(req.params).toEqual({ id: '789' }); // Changed
        expect(next).toHaveBeenCalledOnce();
      });

      it('should only assign params if defined in schema', async () => {
        const schema = z.object({
          body: z.object({
            data: z.string(),
          }),
        });

        req.body = { data: 'test' };
        req.params = { shouldNotChange: 'value' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ data: 'test' }); // Changed
        expect(req.params).toEqual({ shouldNotChange: 'value' }); // Unchanged
        expect(next).toHaveBeenCalledOnce();
      });
    });

    describe('Validation Failure Cases', () => {
      it('should return 400 for invalid body data', async () => {
        const schema = z.object({
          body: z.object({
            name: z.string(),
          }),
        });

        req.body = { name: 123 }; // Should be string

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.any(Array),
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should format validation errors correctly', async () => {
        const schema = z.object({
          body: z.object({
            email: z.string().email(),
          }),
        });

        req.body = { email: 'invalid-email' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: [
            {
              field: 'body.email',
              message: expect.stringContaining('email'),
            },
          ],
        });
      });

      it('should handle multiple validation errors', async () => {
        const schema = z.object({
          body: z.object({
            name: z.string().min(3),
            age: z.number().positive(),
            email: z.string().email(),
          }),
        });

        req.body = {
          name: 'ab', // Too short
          age: -5, // Not positive
          email: 'not-email', // Invalid email
        };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall.details).toHaveLength(3);
        expect(jsonCall.details[0]).toHaveProperty('field');
        expect(jsonCall.details[0]).toHaveProperty('message');
      });

      it('should handle missing required fields', async () => {
        const schema = z.object({
          body: z.object({
            required: z.string(),
          }),
        });

        req.body = {}; // Missing required field

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'body.required',
            }),
          ]),
        });
      });

      it('should validate enum values correctly', async () => {
        const schema = z.object({
          body: z.object({
            status: z.enum(['active', 'inactive']),
          }),
        });

        req.body = { status: 'invalid' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.any(Array),
        });
      });

      it('should handle nested validation errors', async () => {
        const schema = z.object({
          body: z.object({
            user: z.object({
              name: z.string(),
              address: z.object({
                city: z.string(),
              }),
            }),
          }),
        });

        req.body = {
          user: {
            name: 'John',
            address: {
              city: 123, // Should be string
            },
          },
        };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall.details[0].field).toBe('body.user.address.city');
      });

      it('should handle array validation errors', async () => {
        const schema = z.object({
          body: z.object({
            items: z.array(z.string()),
          }),
        });

        req.body = { items: [1, 2, 3] }; // Should be strings

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.any(Array),
        });
      });

      it('should validate params errors', async () => {
        const schema = z.object({
          params: z.object({
            id: z.string().regex(/^[0-9]+$/),
          }),
        });

        req.params = { id: 'invalid-id' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'params.id',
            }),
          ]),
        });
      });

      it('should handle empty error issues array', async () => {
        const schema = z.object({
          body: z.object({
            test: z.string(),
          }),
        });

        req.body = { test: 123 };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        const jsonCall = res.json.mock.calls[0][0];
        expect(Array.isArray(jsonCall.details)).toBe(true);
      });
    });

    describe('Non-Zod Error Cases', () => {
      it('should pass non-Zod errors to next()', async () => {
        const schema = {
          parseAsync: vi.fn().mockRejectedValue(new Error('Custom error')),
        };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe('Custom error');
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should pass TypeError to next()', async () => {
        const schema = {
          parseAsync: vi.fn().mockRejectedValue(new TypeError('Type error')),
        };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(TypeError));
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should handle schema parsing errors', async () => {
        const schema = {
          parseAsync: vi
            .fn()
            .mockRejectedValue(new Error('Schema parsing failed')),
        };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Schema parsing failed',
          })
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty request objects', async () => {
        const schema = z.object({
          body: z.object({}).optional(),
          query: z.object({}).optional(),
          params: z.object({}).optional(),
        });

        req.body = {};
        req.query = {};
        req.params = {};

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
      });

      it('should handle very long error paths', async () => {
        const schema = z.object({
          body: z.object({
            level1: z.object({
              level2: z.object({
                level3: z.object({
                  level4: z.string(),
                }),
              }),
            }),
          }),
        });

        req.body = {
          level1: { level2: { level3: { level4: 123 } } },
        };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall.details[0].field).toBe(
          'body.level1.level2.level3.level4'
        );
      });

      it('should handle custom error messages in schema', async () => {
        const schema = z.object({
          body: z.object({
            custom: z
              .string()
              .min(5, { message: 'Custom error: must be at least 5 chars' }),
          }),
        });

        req.body = { custom: 'abc' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: [
            {
              field: 'body.custom',
              message: 'Custom error: must be at least 5 chars',
            },
          ],
        });
      });

      it('should handle complex transformations', async () => {
        const schema = z.object({
          body: z.object({
            value: z
              .string()
              .transform((v) => v.trim())
              .transform((v) => v.toUpperCase()),
          }),
        });

        req.body = { value: '  hello  ' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ value: 'HELLO' });
        expect(next).toHaveBeenCalledOnce();
      });

      it('should not mutate request on validation failure', async () => {
        const originalBody = { invalid: 123 };
        const schema = z.object({
          body: z.object({
            invalid: z.string(),
          }),
        });

        req.body = originalBody;

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toBe(originalBody); // Still the original object
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Real Schema Examples', () => {
      it('should validate game level enum', async () => {
        const GAME_LEVELS = ['Movies', 'Sports', 'Animals'];
        const schema = z.object({
          body: z.object({
            level: z.enum(GAME_LEVELS),
          }),
        });

        req.body = { level: 'Movies' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
      });

      it('should reject invalid game level', async () => {
        const GAME_LEVELS = ['Movies', 'Sports', 'Animals'];
        const schema = z.object({
          body: z.object({
            level: z.enum(GAME_LEVELS),
          }),
        });

        req.body = { level: 'Invalid' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should validate single letter guess', async () => {
        const schema = z.object({
          body: z.object({
            letter: z
              .string()
              .length(1)
              .regex(/^[a-zA-Z]$/)
              .transform((val) => val.toLowerCase()),
          }),
        });

        req.body = { letter: 'A' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body).toEqual({ letter: 'a' });
        expect(next).toHaveBeenCalledOnce();
      });

      it('should reject multi-character letter', async () => {
        const schema = z.object({
          body: z.object({
            letter: z.string().length(1, 'Letter must be a single character'),
          }),
        });

        req.body = { letter: 'ABC' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: [
            {
              field: 'body.letter',
              message: 'Letter must be a single character',
            },
          ],
        });
      });

      it('should validate MongoDB ObjectId format', async () => {
        const schema = z.object({
          params: z.object({
            gameId: z.string().regex(/^[0-9a-fA-F]{24}$/),
          }),
        });

        req.params = { gameId: '507f1f77bcf86cd799439011' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
      });

      it('should reject invalid MongoDB ObjectId', async () => {
        const schema = z.object({
          params: z.object({
            gameId: z
              .string()
              .regex(/^[0-9a-fA-F]{24}$/, 'Invalid game ID format'),
          }),
        });

        req.params = { gameId: 'invalid-id' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: [
            {
              field: 'params.gameId',
              message: 'Invalid game ID format',
            },
          ],
        });
      });
    });
  });
});
