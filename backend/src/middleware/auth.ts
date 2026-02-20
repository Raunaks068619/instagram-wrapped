import type { NextFunction, Request, Response } from 'express';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'];
    if (userId && typeof userId === 'string') {
        req.userId = userId;
    }
    next();
}
