import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../db/prisma.js';
import { generateWrappedImage } from '../services/openai.service.js';
import { fetchIgProfile, fetchIgMedia, fetchIgStories, fetchMediaInsights, fetchIgInsights, fetchAudienceDemographics, fetchStoryInsights } from '../services/instagram.service.js';

const router = Router();

// ---------- helpers ----------
function buildSlideData(account: any, media: any[], insights: any[], stories: any[], demographics: any[], year: number, stylePrompt?: string) {
  const totalLikes = media.reduce((a, m) => a + m.like_count, 0);
  const totalComments = media.reduce((a, m) => a + m.comments_count, 0);
  const totalSaved = media.reduce((a, m) => a + m.saved, 0);
  const totalShares = media.reduce((a, m) => a + m.shares, 0);
  const totalVideoViews = media.filter(m => m.media_type === 'VIDEO' || m.media_type === 'REEL').reduce((a, m) => a + m.video_views, 0);
  const totalImpressions = media.reduce((a, m) => a + m.impressions, 0);
  const topPost = [...media].sort((a, b) => b.like_count - a.like_count)[0] || null;
  const avgReach = insights.length ? Math.round(insights.reduce((a, i) => a + i.reach, 0) / insights.length) : 0;
  const totalWebsiteClicks = insights.reduce((a, i) => a + i.website_clicks, 0);
  const topCity = demographics.find((d: any) => d.dimension === 'city');
  const topCountry = demographics.find((d: any) => d.dimension === 'country');
  const topAgeGroup = demographics.filter((d: any) => d.dimension === 'gender_age').sort((a: any, b: any) => b.value - a.value)[0];
  const followersCount = account.followers_count || 0;

  const sortedByLikes = [...media].sort((a, b) => b.like_count - a.like_count);
  const topMediaUrls = sortedByLikes.filter(m => m.media_url).map(m => m.media_url!);
  const profilePicUrl = account.profile_picture_url;
  const recentPosts = [...media].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).filter(m => m.media_url);
  const reels = media.filter(m => (m.media_type === 'VIDEO' || m.media_type === 'REEL') && (m.thumbnail_url || m.media_url));

  const defaultStyle = `Spotify Wrapped–style Instagram carousel slide.
    STRICT RULES:
    - Flat 2D digital illustration only
    - No photos, no realism, no 3D
    - No Spotify logo or trademarks
    - Square 1:1 (Instagram post)
    - Ultra-sharp typography
    - High contrast, readable on mobile
    Visual Style:
    - Bold neon gradients
    - Abstract blobs, waves, flowing shapes
    - Soft grain texture
    - Modern playful typography
    - Energetic, celebratory vibe`;

  const userStyle = stylePrompt?.trim() || defaultStyle;

  // Build comprehensive user data context for the AI
  const topCityName = topCity?.key?.split(',')[0] || 'Global';
  const topCountryName = topCountry?.key || 'Unknown';
  const contentTypes = {
    images: media.filter(m => m.media_type === 'IMAGE').length,
    reels: media.filter(m => m.media_type === 'REEL').length,
    carousels: media.filter(m => m.media_type === 'CAROUSEL_ALBUM').length,
    videos: media.filter(m => m.media_type === 'VIDEO').length,
  };

  const userDataContext = `
    CREATOR PROFILE (use this data to make the design personalized):
    - Username: @${account.username}
    - Followers: ${followersCount.toLocaleString()}
    - Profile picture URL: ${profilePicUrl || 'not available'}
    - Year: ${year}

    ENGAGEMENT STATS:
    - Total Likes: ${totalLikes.toLocaleString()}
    - Total Comments: ${totalComments.toLocaleString()}
    - Total Saves: ${totalSaved.toLocaleString()}
    - Total Shares: ${totalShares.toLocaleString()}
    - Total Impressions: ${totalImpressions.toLocaleString()}
    - Average Daily Reach: ${avgReach.toLocaleString()}
    - Total Video Views: ${totalVideoViews.toLocaleString()}
    - Website Clicks: ${totalWebsiteClicks.toLocaleString()}

    CONTENT BREAKDOWN:
    - ${media.length} total posts (${contentTypes.images} images, ${contentTypes.reels} reels, ${contentTypes.carousels} carousels, ${contentTypes.videos} videos)
    - ${stories.length} stories

    AUDIENCE:
    - Top City: ${topCityName}
    - Top Country: ${topCountryName}
    - Core Demographic: ${topAgeGroup?.key?.replace('.', ' ') || 'Diverse'}

    TOP POST:
    - Best post got ${topPost?.like_count?.toLocaleString() || 0} likes
    ${topPost?.caption ? `- Caption: "${topPost.caption.slice(0, 100)}"` : ''}
    ${topPost?.media_url ? `- Image URL: ${topPost.media_url}` : ''}

    AVAILABLE REFERENCE IMAGES (use these for personalization when the user requests it):
    ${profilePicUrl ? `- Creator's face/profile: ${profilePicUrl}` : ''}
    ${topMediaUrls.slice(0, 5).map((url, i) => `- Top post #${i + 1}: ${url}`).join('\n    ')}
  `;

  const buildPrompt = ({ headline, stat, subtext, theme }: { headline: string; stat: string; subtext?: string; theme: string }) => `
    Create an Instagram carousel slide with the following style:
    ${userStyle}
    Color theme for this slide: ${theme}
    Layout:
    - Large headline text: "${headline}"
    - Massive central stat text: "${stat}"
    ${subtext ? `- Supporting text: "${subtext}"` : ''}
    - Center-aligned composition
    - Clean spacing, no clutter
    Mood: Personalized, Fun, Confident, Social-media optimized

    ${userDataContext}
  `;

  return {
    stats: { totalLikes, totalComments, totalSaved, totalShares, totalVideoViews, totalImpressions, avgReach, totalWebsiteClicks, followersCount },
    slides: [
      {
        title: `${year} Wrapped`,
        text: `Your year on Instagram, @${account.username}. ${followersCount.toLocaleString()} followers strong.`,
        prompt: buildPrompt({ headline: `Your ${year} Wrapped`, stat: `@${account.username}`, subtext: `${followersCount.toLocaleString()} followers`, theme: 'purple, neon green, pink, black' }),
        refImages: profilePicUrl ? [profilePicUrl] : topMediaUrls.slice(0, 1)
      },
      {
        title: 'Your Impact',
        text: `${totalLikes.toLocaleString()} likes • ${totalComments.toLocaleString()} comments • ${totalSaved.toLocaleString()} saves`,
        prompt: buildPrompt({ headline: 'Your Impact', stat: `${totalLikes.toLocaleString()} Likes`, subtext: `${totalComments.toLocaleString()} Comments · ${totalSaved.toLocaleString()} Saves`, theme: 'hot pink, deep purple, black' }),
        refImages: topMediaUrls.slice(0, 1)
      },
      {
        title: 'The Numbers',
        text: `${totalImpressions.toLocaleString()} impressions • ${totalShares.toLocaleString()} shares • ${totalVideoViews.toLocaleString()} video views`,
        prompt: buildPrompt({ headline: 'The Numbers', stat: `${totalImpressions.toLocaleString()}`, subtext: `Total Impressions · ${totalShares.toLocaleString()} Shares`, theme: 'electric blue, cyan, black' }),
        refImages: reels.length > 0 ? [(reels[0].thumbnail_url || reels[0].media_url)!] : topMediaUrls.slice(1, 2)
      },
      {
        title: 'Daily Reach',
        text: `Your content reached an average of ${avgReach.toLocaleString()} people every day.${totalWebsiteClicks ? ` ${totalWebsiteClicks.toLocaleString()} website clicks!` : ''}`,
        prompt: buildPrompt({ headline: 'Daily Reach', stat: `${avgReach.toLocaleString()}`, subtext: 'People reached per day', theme: 'neon green, black, dark gray' }),
        refImages: topMediaUrls.slice(2, 3)
      },
      {
        title: 'Your Audience',
        text: topCity ? `Top city: ${topCity.key} • Top country: ${topCountry?.key || 'Global'} • Core demo: ${topAgeGroup?.key?.replace('.', ' ') || 'Diverse'}` : 'Your audience is diverse and growing!',
        prompt: buildPrompt({ headline: 'Your Tribe', stat: topCity ? topCity.key.split(',')[0] : 'Global', subtext: `${topCountry?.key || ''} · ${topAgeGroup?.key?.replace('.', ' ') || 'All Ages'}`, theme: 'orange, magenta, deep blue' }),
        refImages: recentPosts.length > 0 ? [recentPosts[0].media_url!] : []
      },
      {
        title: 'Top Moment',
        text: topPost ? `Your most loved post got ${topPost.like_count.toLocaleString()} likes.${stories.length > 0 ? ` Plus ${stories.length} stories shared!` : ''}` : 'You showed up consistently!',
        prompt: buildPrompt({ headline: 'Top Moment', stat: topPost ? `${topPost.like_count.toLocaleString()} Likes` : 'Consistency Wins', subtext: 'Your biggest highlight', theme: 'yellow, purple, pink' }),
        refImages: topPost?.media_url ? [topPost.media_url] : []
      },
      {
        title: 'The Verdict',
        text: `${year} was your year of connection. ${media.length} posts. ${stories.length} stories. Keep creating.`,
        prompt: buildPrompt({ headline: 'You Crushed It', stat: `${year}`, subtext: `${media.length} Posts · ${stories.length} Stories`, theme: 'multi-color neon gradient' }),
        refImages: topMediaUrls.slice(0, 1)
      }
    ]
  };
}

// ---------- SSE streaming endpoint ----------
router.post('/generate/stream', body('year').isInt({ min: 2020, max: 2100 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const year = Number(req.body.year);
    const stylePrompt = req.body.stylePrompt as string | undefined;
    const userRefImages = (req.body.referenceImages || []) as string[];
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await prisma.ig_accounts.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const user = await prisma.app_users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'No app user found.' });

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Fetch all data
    send('status', { message: 'Fetching your Instagram data...', phase: 'data' });

    const [media, insights, stories, demographics] = await Promise.all([
      prisma.ig_media.findMany({ where: { ig_account_id: account.id } }),
      prisma.ig_insights_daily.findMany({ where: { ig_account_id: account.id } }),
      prisma.ig_stories.findMany({ where: { ig_account_id: account.id } }),
      prisma.ig_audience_demographics.findMany({ where: { ig_account_id: account.id }, orderBy: { value: 'desc' } })
    ]);

    const { stats, slides: slideData } = buildSlideData(account, media, insights, stories, demographics, year, stylePrompt);

    send('status', { message: 'Data loaded! Generating your slides...', phase: 'generating', total: slideData.length });

    // Generate slides one by one (sequential, not parallel)
    const completedSlides: any[] = [];

    for (let i = 0; i < slideData.length; i++) {
      const s = slideData[i];
      send('status', { message: `Creating slide ${i + 1} of ${slideData.length}: ${s.title}`, phase: 'generating', current: i + 1, total: slideData.length });

      const allRefImages = [...(userRefImages || []), ...(s.refImages || [])];
      const imageUrl = await generateWrappedImage(s.prompt, allRefImages);
      const slide = { title: s.title, text: s.text, image_url: imageUrl };
      completedSlides.push(slide);

      // Stream each slide as it's ready
      send('slide', { index: i, slide, total: slideData.length });
    }

    // Send complete immediately so frontend can show the carousel
    const reportPayload = {
      user_id: user.id,
      year,
      title: `${account.username}'s ${year} Wrapped`,
      summary: `Total likes ${stats.totalLikes}, comments ${stats.totalComments}, avg reach ${stats.avgReach}`,
      slides_json: completedSlides,
    };

    send('complete', { report: reportPayload });

    // Save to DB asynchronously (don't block the stream)
    prisma.wrapped_reports.upsert({
      where: { user_id_year: { user_id: user.id, year } },
      create: { ...reportPayload, ai_image_ref: completedSlides[0]?.image_url?.slice(0, 500) || '' },
      update: { ...reportPayload, ai_image_ref: completedSlides[0]?.image_url?.slice(0, 500) || '' }
    }).then(() => {
      console.log(`Wrapped report saved for ${account.username} / ${year}`);
    }).catch((err: any) => {
      console.error('Failed to save wrapped report:', err.message);
    });

    res.end();
  } catch (e) {
    // If SSE headers already sent, send error event
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (e as Error).message })}\n\n`);
      res.end();
    } else {
      next(e);
    }
  }
});

// ---------- Original non-streaming endpoint (kept for backwards compat) ----------
router.post('/generate', body('year').isInt({ min: 2020, max: 2100 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const year = Number(req.body.year);
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await prisma.ig_accounts.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const user = await prisma.app_users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'No app user found.' });

    const [media, insights, stories, demographics] = await Promise.all([
      prisma.ig_media.findMany({ where: { ig_account_id: account.id } }),
      prisma.ig_insights_daily.findMany({ where: { ig_account_id: account.id } }),
      prisma.ig_stories.findMany({ where: { ig_account_id: account.id } }),
      prisma.ig_audience_demographics.findMany({ where: { ig_account_id: account.id }, orderBy: { value: 'desc' } })
    ]);

    const { stats, slides: slideData } = buildSlideData(account, media, insights, stories, demographics, year);

    const completedSlides = [];
    for (const s of slideData) {
      const imageUrl = await generateWrappedImage(s.prompt, s.refImages);
      completedSlides.push({ title: s.title, text: s.text, image_url: imageUrl });
    }

    const report = await prisma.wrapped_reports.upsert({
      where: { user_id_year: { user_id: user.id, year } },
      create: {
        user_id: user.id, year,
        title: `${account.username}'s ${year} Wrapped`,
        summary: `Total likes ${stats.totalLikes}, comments ${stats.totalComments}, avg reach ${stats.avgReach}`,
        slides_json: completedSlides,
        ai_image_ref: completedSlides[0]?.image_url || ''
      },
      update: {
        title: `${account.username}'s ${year} Wrapped`,
        summary: `Total likes ${stats.totalLikes}, comments ${stats.totalComments}, avg reach ${stats.avgReach}`,
        slides_json: completedSlides,
        ai_image_ref: completedSlides[0]?.image_url || ''
      }
    });

    res.json({ report });
  } catch (e) {
    next(e);
  }
});

// ---------- GET saved report ----------
router.get('/:year', param('year').isInt({ min: 2020, max: 2100 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const year = Number(req.params?.year);
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const report = await prisma.wrapped_reports.findFirst({ where: { user_id: userId, year } });
    if (!report) return res.status(404).json({ error: 'Wrapped report not found for year' });
    res.json({ report });
  } catch (e) {
    next(e);
  }
});

// ---------- GET computed data for HTML card rendering (auto-syncs fresh data) ----------
router.get('/data/:year', param('year').isInt({ min: 2020, max: 2100 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const year = Number(req.params?.year);
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const account = await prisma.ig_accounts.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const token = account.long_lived_token || account.access_token || '';

    // ---- Auto-sync: fetch fresh data from Instagram API ----
    console.log(`[WRAPPED] Auto-syncing data for @${account.username}...`);

    // 1) Profile
    try {
      const profile = await fetchIgProfile(token);
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
    } catch (e) { console.warn('[WRAPPED] Profile sync failed:', (e as Error).message); }

    // 2) Media + per-media insights
    try {
      const mediaResponse = await fetchIgMedia(token);
      const apiMedia = mediaResponse.data || [];
      for (const m of apiMedia) {
        let mediaInsights: any = { impressions: 0, reach: 0, saved: 0, shares: 0, video_views: 0 };
        try {
          const insightsRes = await fetchMediaInsights(token, m.id, m.media_type);
          for (const metric of insightsRes.data || []) {
            const val = metric.values?.[0]?.value || 0;
            if (metric.name === 'impressions') mediaInsights.impressions = val;
            else if (metric.name === 'reach') mediaInsights.reach = val;
            else if (metric.name === 'saved') mediaInsights.saved = val;
            else if (metric.name === 'shares') mediaInsights.shares = val;
            else if (metric.name === 'video_views') mediaInsights.video_views = val;
          }
        } catch (err) { console.warn(`[WRAPPED] Insights for media ${m.id} failed`); }

        await prisma.ig_media.upsert({
          where: { media_id: m.id },
          create: {
            ig_account_id: account.id, media_id: m.id, caption: m.caption,
            media_type: m.media_type, media_url: m.media_url, thumbnail_url: m.thumbnail_url || null,
            permalink: m.permalink, timestamp: new Date(m.timestamp),
            like_count: m.like_count || 0, comments_count: m.comments_count || 0,
            impressions: mediaInsights.impressions, reach: mediaInsights.reach,
            saved: mediaInsights.saved, shares: mediaInsights.shares, video_views: mediaInsights.video_views
          },
          update: {
            caption: m.caption, media_url: m.media_url, thumbnail_url: m.thumbnail_url || null,
            like_count: m.like_count || 0, comments_count: m.comments_count || 0,
            impressions: mediaInsights.impressions, reach: mediaInsights.reach,
            saved: mediaInsights.saved, shares: mediaInsights.shares, video_views: mediaInsights.video_views
          }
        });
      }
      console.log(`[WRAPPED] Synced ${apiMedia.length} media items`);
    } catch (e) { console.warn('[WRAPPED] Media sync failed:', (e as Error).message); }

    // 3) Stories (accumulate — IG only returns last 24h)
    try {
      const storiesResponse = await fetchIgStories(token);
      const apiStories = storiesResponse.data || [];
      for (const s of apiStories) {
        let storyInsights = { impressions: 0, reach: 0, replies: 0, exits: 0 };
        try {
          const insightsRes = await fetchStoryInsights(token, s.id);
          for (const metric of insightsRes.data || []) {
            const val = metric.values?.[0]?.value || 0;
            if (metric.name === 'impressions') storyInsights.impressions = val;
            else if (metric.name === 'reach') storyInsights.reach = val;
            else if (metric.name === 'replies') storyInsights.replies = val;
            else if (metric.name === 'exits') storyInsights.exits = val;
          }
        } catch (err) { /* skip */ }
        await prisma.ig_stories.upsert({
          where: { story_id: s.id },
          create: {
            ig_account_id: account.id, story_id: s.id, media_type: s.media_type,
            media_url: s.media_url || null, timestamp: new Date(s.timestamp),
            impressions: storyInsights.impressions, reach: storyInsights.reach,
            replies: storyInsights.replies, exits: storyInsights.exits
          },
          update: {
            media_url: s.media_url || null, impressions: storyInsights.impressions,
            reach: storyInsights.reach, replies: storyInsights.replies, exits: storyInsights.exits
          }
        });
      }
      console.log(`[WRAPPED] Synced ${apiStories.length} stories`);
    } catch (e) { console.warn('[WRAPPED] Stories sync failed:', (e as Error).message); }

    // 4) Account-level insights + demographics
    try {
      const rows = await fetchIgInsights(token, 'day', 30);
      for (const row of rows) {
        await prisma.ig_insights_daily.upsert({
          where: { ig_account_id_date: { ig_account_id: account.id, date: new Date(row.date) } },
          create: { ig_account_id: account.id, date: new Date(row.date), impressions: row.impressions, reach: row.reach, profile_views: row.profile_views, follower_count: row.follower_count, website_clicks: row.website_clicks || 0, email_contacts: row.email_contacts || 0 },
          update: { impressions: row.impressions, reach: row.reach, profile_views: row.profile_views, follower_count: row.follower_count, website_clicks: row.website_clicks || 0, email_contacts: row.email_contacts || 0 }
        });
      }
    } catch (e) { console.warn('[WRAPPED] Insights sync failed:', (e as Error).message); }

    try {
      const demographics = await fetchAudienceDemographics(token);
      for (const d of demographics) {
        await prisma.ig_audience_demographics.upsert({
          where: { ig_account_id_dimension_key: { ig_account_id: account.id, dimension: d.dimension, key: d.key } },
          create: { ig_account_id: account.id, dimension: d.dimension, key: d.key, value: d.value },
          update: { value: d.value, snapshot_date: new Date() }
        });
      }
    } catch (e) { console.warn('[WRAPPED] Demographics sync failed:', (e as Error).message); }

    console.log(`[WRAPPED] Auto-sync complete for @${account.username}`);

    // ---- Now read fresh data from DB ----
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const refreshedAccount = await prisma.ig_accounts.findFirst({ where: { id: account.id } });
    const [media, insights, stories, demographics] = await Promise.all([
      prisma.ig_media.findMany({
        where: { ig_account_id: account.id, timestamp: { gte: startDate, lte: endDate } }
      }),
      prisma.ig_insights_daily.findMany({
        where: { ig_account_id: account.id, date: { gte: startDate, lte: endDate } }
      }),
      prisma.ig_stories.findMany({
        where: { ig_account_id: account.id, timestamp: { gte: startDate, lte: endDate } }
      }),
      prisma.ig_audience_demographics.findMany({
        where: { ig_account_id: account.id }, orderBy: { value: 'desc' }
      })
    ]);

    // Aggregate Demographics
    const cities = demographics.filter(d => d.dimension === 'city');
    const countries = demographics.filter(d => d.dimension === 'country');
    const genderAges = demographics.filter(d => d.dimension === 'gender_age');

    // Pick the top of each
    const topCity = cities.length > 0 ? cities[0].key : undefined;
    const topCountry = countries.length > 0 ? countries[0].key : undefined;
    const topAgeGroup = genderAges.length > 0 ? genderAges[0].key : undefined;

    const totalLikes = media.reduce((a, m) => a + m.like_count, 0);
    const totalComments = media.reduce((a, m) => a + m.comments_count, 0);
    const totalSaved = media.reduce((a, m) => a + m.saved, 0);
    const totalShares = media.reduce((a, m) => a + m.shares, 0);
    const totalVideoViews = media.filter(m => m.media_type === 'VIDEO' || m.media_type === 'REEL').reduce((a, m) => a + m.video_views, 0);
    const totalImpressions = media.reduce((a, m) => a + m.impressions, 0);
    const avgReach = insights.length ? Math.round(insights.reduce((a, i) => a + i.reach, 0) / insights.length) : 0;
    const topPostsSorted = [...media].sort((a, b) => b.like_count - a.like_count);
    const topMoment = topPostsSorted[0] || null;

    const contentMix = {
      images: media.filter(m => m.media_type === 'IMAGE').length,
      reels: media.filter(m => m.media_type === 'REEL').length,
      carousels: media.filter(m => m.media_type === 'CAROUSEL_ALBUM').length,
      videos: media.filter(m => m.media_type === 'VIDEO').length,
    };

    res.json({
      cardData: {
        username: refreshedAccount?.username || account.username,
        profilePicUrl: refreshedAccount?.profile_picture_url || undefined,
        followerCount: refreshedAccount?.followers_count || 0,
        year,
        totalLikes, totalComments, totalSaved, totalShares,
        totalVideoViews, totalImpressions, avgReach,
        postCount: media.length,
        storyCount: stories.length,
        topCity, topCountry, topAgeGroup,
        topPosts: topPostsSorted.slice(0, 5).map(p => ({
          caption: p.caption?.slice(0, 80) || '',
          likeCount: p.like_count,
          thumbnailUrl: p.thumbnail_url || undefined,
          mediaUrl: p.media_url || undefined,
        })),
        contentMix,
        topMoment: topMoment ? {
          caption: topMoment.caption?.slice(0, 120) || '',
          likeCount: topMoment.like_count,
          mediaUrl: topMoment.media_url || undefined,
          thumbnailUrl: topMoment.thumbnail_url || undefined,
        } : undefined,
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
