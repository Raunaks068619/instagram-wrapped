import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../db/prisma.js';
import { generateWrappedImage } from '../services/openai.service.js';

const router = Router();

router.post('/generate', body('year').isInt({ min: 2020, max: 2100 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const year = Number(req.body.year);
    const account = await prisma.ig_accounts.findFirst({ orderBy: { created_at: 'asc' } });
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const user = await prisma.app_users.findUnique({ where: { id: account.user_id } });
    if (!user) return res.status(404).json({ error: 'No app user found.' });

    const media = await prisma.ig_media.findMany({ where: { ig_account_id: account.id } });
    const insights = await prisma.ig_insights_daily.findMany({ where: { ig_account_id: account.id } });

    const totalLikes = media.reduce((a, m) => a + m.like_count, 0);
    const totalComments = media.reduce((a, m) => a + m.comments_count, 0);
    const topPost = media.sort((a, b) => b.like_count - a.like_count)[0] || null;
    const avgReach = insights.length ? Math.round(insights.reduce((a, i) => a + i.reach, 0) / insights.length) : 0;

    const slides = [
      { title: `${year} Wrapped`, text: `@${account.username}, you posted ${media.length} pieces of content.` },
      { title: 'Engagement', text: `You got ${totalLikes} likes and ${totalComments} comments in total.` },
      { title: 'Reach', text: `Average daily reach: ${avgReach}. Keep creating!` },
      { title: 'Top Post', text: topPost ? `${topPost.caption || 'Untitled'} (${topPost.like_count} likes)` : 'No posts found.' }
    ];

    const imagePrompt = `Instagram wrapped poster for @${account.username} in ${year}, neon gradients, confetti, social media analytics vibe`;
    const aiImageRef = await generateWrappedImage(imagePrompt);

    const report = await prisma.wrapped_reports.upsert({
      where: { user_id_year: { user_id: user.id, year } },
      create: {
        user_id: user.id,
        year,
        title: `${account.username}'s ${year} Wrapped`,
        summary: `Total likes ${totalLikes}, comments ${totalComments}, avg reach ${avgReach}`,
        slides_json: slides,
        ai_image_ref: aiImageRef
      },
      update: {
        title: `${account.username}'s ${year} Wrapped`,
        summary: `Total likes ${totalLikes}, comments ${totalComments}, avg reach ${avgReach}`,
        slides_json: slides,
        ai_image_ref: aiImageRef
      }
    });

    res.json({ report });
  } catch (e) {
    next(e);
  }
});

router.get('/:year', param('year').isInt({ min: 2020, max: 2100 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const yearParam = req.params?.year;
    const year = Number(yearParam);
    const account = await prisma.ig_accounts.findFirst({ orderBy: { created_at: 'asc' } });
    if (!account) return res.status(404).json({ error: 'No Instagram account linked.' });

    const report = await prisma.wrapped_reports.findFirst({
      where: { user_id: account.user_id, year }
    });

    if (!report) return res.status(404).json({ error: 'Wrapped report not found for year' });
    res.json({ report });
  } catch (e) {
    next(e);
  }
});

export default router;
