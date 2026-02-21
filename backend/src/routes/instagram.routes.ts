import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db/prisma.js';
import { fetchIgInsights, fetchIgMedia, fetchIgProfile, fetchIgStories, fetchMediaInsights, fetchStoryInsights, fetchAudienceDemographics, fetchCustomGraphApi } from '../services/instagram.service.js';
import { cache } from '../services/cache.service.js';

const router = Router();
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes

async function getAccountForUser(userId: string) {
  return prisma.ig_accounts.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
}

function getToken(account: any): string {
  return account.long_lived_token || account.access_token || '';
}

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized. x-user-id header missing.' });

    // Check cache first
    const cacheKey = `profile:${userId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] profile for ${userId} (TTL ${cache.ttl(cacheKey)}s)`);
      return res.json(cached);
    }

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked. Complete OAuth first.' });

    const profile = await fetchIgProfile(getToken(account));

    // Persist expanded profile data
    await prisma.ig_accounts.update({
      where: { id: account.id },
      data: {
        biography: profile.biography || null,
        profile_picture_url: profile.profile_picture_url || null,
        website: profile.website || null,
        followers_count: profile.followers_count || 0,
        follows_count: profile.follows_count || 0
      }
    });

    const response = { account: { ...account, ...profile }, profile };
    cache.set(cacheKey, response, CACHE_TTL);
    console.log(`[CACHE SET] profile for ${userId}`);
    res.json(response);
  } catch (e) {
    next(e);
  }
});

// ─── Media (with per-media insights) ─────────────────────────────────────────
router.get('/media', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    // Check cache first
    const cacheKey = `media:${userId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] media for ${userId} (TTL ${cache.ttl(cacheKey)}s)`);
      return res.json(cached);
    }

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const token = getToken(account);
    const mediaResponse = await fetchIgMedia(token);
    const media = mediaResponse.data || [];

    for (const m of media) {
      // Fetch per-media insights
      let mediaInsights: any = { impressions: 0, reach: 0, saved: 0, shares: 0, video_views: 0 };
      try {
        const insightsRes = await fetchMediaInsights(token, m.id, m.media_type);
        const insightsData = insightsRes.data || [];
        for (const metric of insightsData) {
          const val = metric.values?.[0]?.value || 0;
          if (metric.name === 'impressions') mediaInsights.impressions = val;
          else if (metric.name === 'reach') mediaInsights.reach = val;
          else if (metric.name === 'saved') mediaInsights.saved = val;
          else if (metric.name === 'shares') mediaInsights.shares = val;
          else if (metric.name === 'video_views') mediaInsights.video_views = val;
        }
      } catch (err) {
        console.warn(`Failed to fetch insights for media ${m.id}:`, (err as Error).message);
      }

      await prisma.ig_media.upsert({
        where: { media_id: m.id },
        create: {
          ig_account_id: account.id,
          media_id: m.id,
          caption: m.caption,
          media_type: m.media_type,
          media_url: m.media_url,
          thumbnail_url: m.thumbnail_url || null,
          permalink: m.permalink,
          timestamp: new Date(m.timestamp),
          like_count: m.like_count || 0,
          comments_count: m.comments_count || 0,
          impressions: mediaInsights.impressions,
          reach: mediaInsights.reach,
          saved: mediaInsights.saved,
          shares: mediaInsights.shares,
          video_views: mediaInsights.video_views
        },
        update: {
          caption: m.caption,
          media_url: m.media_url,
          thumbnail_url: m.thumbnail_url || null,
          like_count: m.like_count || 0,
          comments_count: m.comments_count || 0,
          impressions: mediaInsights.impressions,
          reach: mediaInsights.reach,
          saved: mediaInsights.saved,
          shares: mediaInsights.shares,
          video_views: mediaInsights.video_views
        }
      });
    }

    const response = { count: media.length, media };
    cache.set(cacheKey, response, CACHE_TTL);
    console.log(`[CACHE SET] media for ${userId}`);
    res.json(response);
  } catch (e) {
    next(e);
  }
});

// ─── Stories ──────────────────────────────────────────────────────────────────
router.get('/stories', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const token = getToken(account);
    const storiesResponse = await fetchIgStories(token);
    const stories = storiesResponse.data || [];

    for (const s of stories) {
      let storyInsights = { impressions: 0, reach: 0, replies: 0, exits: 0 };
      try {
        const insightsRes = await fetchStoryInsights(token, s.id);
        const insightsData = insightsRes.data || [];
        for (const metric of insightsData) {
          const val = metric.values?.[0]?.value || 0;
          if (metric.name === 'impressions') storyInsights.impressions = val;
          else if (metric.name === 'reach') storyInsights.reach = val;
          else if (metric.name === 'replies') storyInsights.replies = val;
          else if (metric.name === 'exits') storyInsights.exits = val;
        }
      } catch (err) {
        console.warn(`Failed to fetch insights for story ${s.id}:`, (err as Error).message);
      }

      await prisma.ig_stories.upsert({
        where: { story_id: s.id },
        create: {
          ig_account_id: account.id,
          story_id: s.id,
          media_type: s.media_type,
          media_url: s.media_url || null,
          timestamp: new Date(s.timestamp),
          impressions: storyInsights.impressions,
          reach: storyInsights.reach,
          replies: storyInsights.replies,
          exits: storyInsights.exits
        },
        update: {
          media_url: s.media_url || null,
          impressions: storyInsights.impressions,
          reach: storyInsights.reach,
          replies: storyInsights.replies,
          exits: storyInsights.exits
        }
      });
    }

    res.json({ count: stories.length, stories });
  } catch (e) {
    next(e);
  }
});

// ─── Account-Level Insights Sync ─────────────────────────────────────────────
// ─── Cache Invalidation (for Sync Data button) ──────────────────────────────
router.post('/cache/invalidate', async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  cache.delPrefix(`profile:${userId}`);
  cache.delPrefix(`media:${userId}`);
  console.log(`[CACHE CLEAR] invalidated cache for ${userId}`);
  res.json({ success: true, message: 'Cache cleared. Next request will fetch fresh data.' });
});

// ─── Account-Level Insights Sync ─────────────────────────────────────────────
router.post('/insights/sync', body('days').optional().isInt({ min: 7, max: 365 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const token = getToken(account);
    const days = Number(req.body.days) || 30;

    // Sync daily insights
    const rows = await fetchIgInsights(token, 'day', days);

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
          follower_count: row.follower_count,
          website_clicks: row.website_clicks || 0,
          email_contacts: row.email_contacts || 0
        },
        update: {
          impressions: row.impressions,
          reach: row.reach,
          profile_views: row.profile_views,
          follower_count: row.follower_count,
          website_clicks: row.website_clicks || 0,
          email_contacts: row.email_contacts || 0
        }
      });
    }

    // Sync audience demographics
    const demographics = await fetchAudienceDemographics(token);
    for (const d of demographics) {
      await prisma.ig_audience_demographics.upsert({
        where: {
          ig_account_id_dimension_key: {
            ig_account_id: account.id,
            dimension: d.dimension,
            key: d.key
          }
        },
        create: {
          ig_account_id: account.id,
          dimension: d.dimension,
          key: d.key,
          value: d.value
        },
        update: {
          value: d.value,
          snapshot_date: new Date()
        }
      });
    }

    res.json({ synced_insights: rows.length, synced_demographics: demographics.length });
  } catch (e) {
    next(e);
  }
});

// ─── Audience Demographics ───────────────────────────────────────────────────
router.get('/audience', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const demographics = await prisma.ig_audience_demographics.findMany({
      where: { ig_account_id: account.id },
      orderBy: { value: 'desc' }
    });

    // Group by dimension
    const grouped = {
      cities: demographics.filter(d => d.dimension === 'city'),
      countries: demographics.filter(d => d.dimension === 'country'),
      gender_age: demographics.filter(d => d.dimension === 'gender_age')
    };

    res.json(grouped);
  } catch (e) {
    next(e);
  }
});

// ─── Custom Proxy ─────────────────────────────────────────────────────────────
router.post('/custom', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint path is required.' });

    const account = await getAccountForUser(userId);
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const result = await fetchCustomGraphApi(getToken(account), endpoint);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
