import { env } from '../config/env.js';
import { mockInsights, mockMedia, mockProfile, mockStories, mockMediaInsights, mockAudienceDemographics } from './mockData.service.js';

const graphBase = 'https://graph.instagram.com';
const instagramAuthorizeBase = 'https://www.instagram.com/oauth/authorize';
const instagramTokenEndpoint = 'https://api.instagram.com/oauth/access_token';

async function checkResponse(res: Response, context: string) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const apiError = errorData?.error || errorData || {};
    const message = apiError?.message || apiError?.error_message || res.statusText || 'Unknown error';

    console.error(`Instagram API Error [${context}]:`, {
      status: res.status,
      statusText: res.statusText,
      message,
      type: apiError?.type,
      code: apiError?.code,
      error_subcode: apiError?.error_subcode,
      error_user_title: apiError?.error_user_title,
      error_user_msg: apiError?.error_user_msg,
      fbtrace_id: apiError?.fbtrace_id,
      raw: errorData
    });

    throw new Error(
      `Instagram API ${context} failed: ${message}${apiError?.code ? ` (code ${apiError.code})` : ''}${apiError?.error_subcode ? ` (subcode ${apiError.error_subcode})` : ''}`
    );
  }
  return res.json();
}

export function getInstagramOAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.INSTAGRAM_CLIENT_ID || 'mock-client-id',
    redirect_uri: env.INSTAGRAM_REDIRECT_URI,
    scope: env.INSTAGRAM_SCOPES,
    response_type: 'code',
    state
  });
  params.set('force_reauth', 'true');
  const url = `${instagramAuthorizeBase}?${params.toString()}`;
  console.log('Generated OAuth URL:', url);
  return url;
}

export async function exchangeCodeForToken(code: string, redirectUri?: string) {
  if (env.MOCK_MODE) {
    return { access_token: `mock-access-${code}`, token_type: 'bearer', expires_in: 3600 };
  }

  const res = await fetch(instagramTokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.INSTAGRAM_CLIENT_ID || '',
      client_secret: env.INSTAGRAM_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri || env.INSTAGRAM_REDIRECT_URI,
      code
    })
  });
  return checkResponse(res, 'exchangeCodeForToken');
}

export async function exchangeLongLivedToken(shortToken: string) {
  if (env.MOCK_MODE) {
    return { access_token: `mock-long-${shortToken}`, token_type: 'bearer', expires_in: 60 * 60 * 24 * 60 };
  }

  const url = `${graphBase}/access_token?grant_type=ig_exchange_token&client_secret=${env.INSTAGRAM_CLIENT_SECRET}&access_token=${shortToken}`;
  const res = await fetch(url);
  return checkResponse(res, 'exchangeLongLivedToken');
}

// ─── Custom Graph API Payload Proxy ───────────────────────────────────────────
export async function fetchCustomGraphApi(_token: string, endpoint: string) {
  // strip leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // If user passes query params, we need to append access_token appropriately
  const separator = path.includes('?') ? '&' : '?';
  const res = await fetch(`${graphBase}/${path}${separator}access_token=${_token}`);
  return checkResponse(res, `fetchCustomGraphApi(${endpoint})`);
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function fetchIgProfile(_token: string) {
  if (env.MOCK_MODE) return mockProfile();
  const fields = 'id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url,website,name';
  const res = await fetch(`${graphBase}/me?fields=${fields}&access_token=${_token}`);
  return checkResponse(res, 'fetchIgProfile');
}

// ─── Media ────────────────────────────────────────────────────────────────────
export async function fetchIgMedia(_token: string) {
  if (env.MOCK_MODE) return { data: mockMedia() };
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
  const res = await fetch(`${graphBase}/me/media?fields=${fields}&access_token=${_token}`);
  return checkResponse(res, 'fetchIgMedia');
}

// ─── Per-Media Insights ───────────────────────────────────────────────────────
export async function fetchMediaInsights(_token: string, mediaId: string, mediaType: string) {
  if (env.MOCK_MODE) return mockMediaInsights(mediaId, mediaType);

  // Instagram API v21+ uses different metrics per media type
  let metrics: string;
  if (mediaType === 'REEL') {
    metrics = 'reach,saved,shares,comments,likes';
  } else if (mediaType === 'VIDEO') {
    metrics = 'reach,saved,shares';
  } else if (mediaType === 'CAROUSEL_ALBUM') {
    metrics = 'reach,saved,shares';
  } else {
    // IMAGE
    metrics = 'reach,saved,shares,likes';
  }

  const res = await fetch(`${graphBase}/${mediaId}/insights?metric=${metrics}&access_token=${_token}`);
  return checkResponse(res, `fetchMediaInsights(${mediaId})`);
}

// ─── Stories ──────────────────────────────────────────────────────────────────
export async function fetchIgStories(_token: string) {
  if (env.MOCK_MODE) return { data: mockStories() };
  const fields = 'id,media_type,media_url,timestamp';
  const res = await fetch(`${graphBase}/me/stories?fields=${fields}&access_token=${_token}`);
  return checkResponse(res, 'fetchIgStories');
}

// ─── Per-Story Insights ───────────────────────────────────────────────────────
export async function fetchStoryInsights(_token: string, storyId: string) {
  if (env.MOCK_MODE) return { data: [{ name: 'impressions', values: [{ value: 200 }] }, { name: 'reach', values: [{ value: 150 }] }, { name: 'replies', values: [{ value: 5 }] }, { name: 'exits', values: [{ value: 20 }] }] };
  const metrics = 'impressions,reach,replies,exits';
  const res = await fetch(`${graphBase}/${storyId}/insights?metric=${metrics}&access_token=${_token}`);
  return checkResponse(res, `fetchStoryInsights(${storyId})`);
}

// ─── Account-Level Insights (Daily) ──────────────────────────────────────────
export async function fetchIgInsights(_token: string, period: string = 'day', days: number = 30) {
  if (env.MOCK_MODE) return mockInsights(days);

  const since = Math.floor((Date.now() - days * 86400000) / 1000);
  const until = Math.floor(Date.now() / 1000);
  // Valid metrics for Instagram API v21+
  const metrics = 'reach,follower_count,profile_views,accounts_engaged,total_interactions,profile_links_taps';
  const url = `${graphBase}/me/insights?metric=${metrics}&period=${period}&since=${since}&until=${until}&access_token=${_token}`;
  const res = await fetch(url);
  const data = await checkResponse(res, 'fetchIgInsights');

  // Transform the raw API response into the row format our app expects
  const metricsMap: Record<string, Record<string, number>> = {};

  for (const metric of data.data || []) {
    for (const val of metric.values || []) {
      const dateKey = val.end_time?.split('T')[0] || 'unknown';
      if (!metricsMap[dateKey]) metricsMap[dateKey] = {};
      metricsMap[dateKey][metric.name] = val.value || 0;
    }
  }

  return Object.entries(metricsMap).map(([date, vals]) => ({
    date,
    impressions: vals.reach || 0,  // use reach as proxy for impressions
    reach: vals.reach || 0,
    profile_views: vals.profile_views || 0,
    follower_count: vals.follower_count || 0,
    website_clicks: vals.profile_links_taps || 0,
    email_contacts: 0  // no longer available
  }));
}

// ─── Audience Demographics ───────────────────────────────────────────────────
export async function fetchAudienceDemographics(_token: string) {
  if (env.MOCK_MODE) return mockAudienceDemographics();

  const metrics = 'audience_city,audience_country,audience_gender_age';
  const url = `${graphBase}/me/insights?metric=${metrics}&period=lifetime&access_token=${_token}`;
  const res = await fetch(url);
  const data = await checkResponse(res, 'fetchAudienceDemographics');

  const results: { dimension: string; key: string; value: number }[] = [];

  for (const metric of data.data || []) {
    let dimension = 'unknown';
    if (metric.name === 'audience_city') dimension = 'city';
    else if (metric.name === 'audience_country') dimension = 'country';
    else if (metric.name === 'audience_gender_age') dimension = 'gender_age';

    const values = metric.values?.[0]?.value || {};
    for (const [key, val] of Object.entries(values)) {
      results.push({ dimension, key, value: val as number });
    }
  }

  return results;
}
