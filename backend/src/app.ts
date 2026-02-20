import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import instagramRoutes from './routes/instagram.routes.js';
import wrappedRoutes from './routes/wrapped.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { prisma } from './db/prisma.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(authMiddleware);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up' });
  } catch {
    res.json({ ok: true, db: 'down' });
  }
});

app.use('/auth', authRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/wrapped', wrappedRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
