import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/errors';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Route not found.', code: 'NOT_FOUND' });
};

const isBadJson = (error: unknown): boolean =>
  error instanceof SyntaxError &&
  (error as { type?: string }).type === 'entity.parse.failed';

// Four-argument signature is what makes Express treat this as an error handler.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      message: 'Validation failed.',
      code: 'VALIDATION_FAILED',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (isBadJson(error)) {
    res.status(422).json({
      message: 'Request body must be valid JSON.',
      code: 'VALIDATION_FAILED',
    });
    return;
  }

  if ((error as { type?: string }).type === 'entity.too.large') {
    res.status(422).json({
      message: 'The uploaded file is too large.',
      code: 'VALIDATION_FAILED',
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }

  console.error('Unhandled API error', error);
  res.status(500).json({
    message: 'Server error. Please try again later.',
    code: 'INTERNAL',
  });
};
