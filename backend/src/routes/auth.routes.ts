import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db/prisma.js';
import { exchangeCodeForToken, exchangeLongLivedToken, fetchIgProfile, getInstagramOAuthUrl } from '../services/instagram.service.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/instagram/start', async (_req, res, next) => {
  try {
    const state = crypto.randomUUID();
    await prisma.oauth_sessions.create({
      data: { state, redirect_uri: '/auth/instagram/callback' }
    });
    res.json({ authUrl: getInstagramOAuthUrl(state), state });
  } catch (e) {
    next(e);
  }
});

router.get('/instagram/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return res.status(400).json({ error: 'Missing code/state' });

    const oauth = await prisma.oauth_sessions.findUnique({ where: { state } });
    if (!oauth || oauth.consumed_at) return res.status(400).json({ error: 'Invalid or consumed state' });

    const token = await exchangeCodeForToken(code);
    const longLived = await exchangeLongLivedToken(token.access_token);
    const profile = await fetchIgProfile(longLived.access_token || token.access_token);

    const user = await prisma.app_users.upsert({
      where: { email: `${profile.username || 'ig-user'}@local.mock` },
      create: { email: `${profile.username || 'ig-user'}@local.mock`, name: profile.username || 'Instagram User' },
      update: { name: profile.username || 'Instagram User' }
    });

    await prisma.ig_accounts.upsert({
      where: { instagram_user_id: profile.id || 'mock-ig-001' },
      create: {
        user_id: user.id,
        instagram_user_id: profile.id || 'mock-ig-001',
        username: profile.username || 'mock.creator',
        access_token: token.access_token,
        long_lived_token: longLived.access_token,
        token_expires_at: new Date(Date.now() + (longLived.expires_in || 3600) * 1000)
      },
      update: {
        access_token: token.access_token,
        long_lived_token: longLived.access_token,
        username: profile.username || 'mock.creator'
      }
    });

    await prisma.oauth_sessions.update({
      where: { state },
      data: { consumed_at: new Date(), user_id: user.id }
    });

    const redirect = new URL('/dashboard', env.FRONTEND_URL);
    redirect.searchParams.set('userId', user.id);
    res.redirect(302, redirect.toString());
  } catch (e) {
    next(e);
  }
});

export default router;
