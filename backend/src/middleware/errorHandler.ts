import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
}
