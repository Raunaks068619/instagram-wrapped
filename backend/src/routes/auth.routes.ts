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
      data: { state, redirect_uri: env.INSTAGRAM_REDIRECT_URI }
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

    // Some query parsers normalize '+' to space in query params.
    // OAuth authorization codes can contain '+', so restore it before token exchange.
    const normalizedCode = code.replace(/ /g, '+');

    const oauth = await prisma.oauth_sessions.findUnique({ where: { state } });
    if (!oauth || oauth.consumed_at) return res.status(400).json({ error: 'Invalid or consumed state' });

    const token = await exchangeCodeForToken(normalizedCode, oauth.redirect_uri);
    const longLived = await exchangeLongLivedToken(token.access_token);
    const profile = await fetchIgProfile(longLived.access_token || token.access_token);

    if (!profile.id) {
      console.error('Instagram profile missing ID:', profile);
      throw new Error('Failed to retrieve Instagram profile ID.');
    }

    const username = profile.username || 'user';

    const user = await prisma.app_users.upsert({
      where: { email: `${username}@local.mock` },
      create: { email: `${username}@local.mock`, name: username },
      update: { name: username }
    });

    await prisma.ig_accounts.upsert({
      where: { instagram_user_id: profile.id },
      create: {
        user_id: user.id,
        instagram_user_id: profile.id,
        username: username,
        access_token: token.access_token,
        long_lived_token: longLived.access_token,
        token_expires_at: new Date(Date.now() + (longLived.expires_in || 3600) * 1000),
        biography: profile.biography || null,
        profile_picture_url: profile.profile_picture_url || null,
        website: profile.website || null,
        followers_count: profile.followers_count || 0,
        follows_count: profile.follows_count || 0
      },
      update: {
        access_token: token.access_token,
        long_lived_token: longLived.access_token,
        username: username,
        biography: profile.biography || null,
        profile_picture_url: profile.profile_picture_url || null,
        website: profile.website || null,
        followers_count: profile.followers_count || 0,
        follows_count: profile.follows_count || 0
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

// ──── DEV-ONLY: Seed account with a tester access token ──────────────────────
router.post('/instagram/dev-login', async (req, res, next) => {
  try {
    if (env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Dev-only endpoint' });
    }

    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'access_token required' });

    // Use the token to fetch the profile
    const profile = await fetchIgProfile(access_token);

    if (!profile.id) {
      console.error('Instagram profile missing ID:', profile);
      return res.status(400).json({ error: 'Token did not return a valid profile', details: profile });
    }

    const username = profile.username || 'tester';

    const user = await prisma.app_users.upsert({
      where: { email: `${username}@local.mock` },
      create: { email: `${username}@local.mock`, name: username },
      update: { name: username }
    });

    await prisma.ig_accounts.upsert({
      where: { instagram_user_id: profile.id },
      create: {
        user_id: user.id,
        instagram_user_id: profile.id,
        username: username,
        access_token: access_token,
        long_lived_token: access_token,
        token_expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000), // 60 days
        biography: profile.biography || null,
        profile_picture_url: profile.profile_picture_url || null,
        website: profile.website || null,
        followers_count: profile.followers_count || 0,
        follows_count: profile.follows_count || 0
      },
      update: {
        access_token: access_token,
        long_lived_token: access_token,
        token_expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        username: username,
        biography: profile.biography || null,
        profile_picture_url: profile.profile_picture_url || null,
        website: profile.website || null,
        followers_count: profile.followers_count || 0,
        follows_count: profile.follows_count || 0
      }
    });

    console.log(`✅ Dev login: ${username} (${profile.id}) -> user ${user.id}`);
    res.json({ success: true, userId: user.id, username });
  } catch (e) {
    next(e);
  }
});

export default router;
