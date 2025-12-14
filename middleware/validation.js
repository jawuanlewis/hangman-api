import { ZodError } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Defensive programming: only assign if defined in schema
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    if (parsed.params !== undefined) {
      req.params = parsed.params;
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || [];
      const errors = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }
    next(error);
  }
};
