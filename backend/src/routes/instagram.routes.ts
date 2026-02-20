import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db/prisma.js';
import { fetchIgInsights, fetchIgMedia, fetchIgProfile } from '../services/instagram.service.js';

const router = Router();

async function getAccountForUser(userId: string) {
  return prisma.ig_accounts.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
}

router.get('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized. x-user-id header missing.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked. Complete OAuth first.' });
    const profile = await fetchIgProfile(account.long_lived_token || account.access_token || '');
    res.json({ account, profile });
  } catch (e) {
    next(e);
  }
});

router.get('/media', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });
    const mediaResponse = await fetchIgMedia(account.long_lived_token || account.access_token || '');
    const media = mediaResponse.data || [];

    for (const m of media) {
      await prisma.ig_media.upsert({
        where: { media_id: m.id },
        create: {
          ig_account_id: account.id,
          media_id: m.id,
          caption: m.caption,
          media_type: m.media_type,
          media_url: m.media_url,
          permalink: m.permalink,
          timestamp: new Date(m.timestamp),
          like_count: m.like_count || 0,
          comments_count: m.comments_count || 0
        },
        update: {
          caption: m.caption,
          media_url: m.media_url,
          like_count: m.like_count || 0,
          comments_count: m.comments_count || 0
        }
      });
    }

    res.json({ count: media.length, media });
  } catch (e) {
    next(e);
  }
});

router.post('/insights/sync', body('days').optional().isInt({ min: 7, max: 365 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const rows = await fetchIgInsights(account.long_lived_token || account.access_token || '');

    for (const row of rows) {
      await prisma.ig_insights_daily.upsert({
        where: {
          ig_account_id_date: {
            ig_account_id: account.id,
            date: new Date(row.date)
          }
        },
        create: {
          ig_account_id: account.id,
          date: new Date(row.date),
          impressions: row.impressions,
          reach: row.reach,
          profile_views: row.profile_views,
          follower_count: row.follower_count
        },
        update: {
          impressions: row.impressions,
          reach: row.reach,
          profile_views: row.profile_views,
          follower_count: row.follower_count
        }
      });
    }

    res.json({ synced: rows.length });
  } catch (e) {
    next(e);
  }
});

export default router;
