import { env } from '../config/env.js';
import { mockInsights, mockMedia, mockProfile } from './mockData.service.js';

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

export async function fetchIgProfile(_token: string) {
  if (env.MOCK_MODE) return mockProfile();
  const res = await fetch(`${graphBase}/me?fields=id,username,account_type,media_count&access_token=${_token}`);
  return checkResponse(res, 'fetchIgProfile');
}

export async function fetchIgMedia(_token: string) {
  if (env.MOCK_MODE) return { data: mockMedia() };
  const res = await fetch(`${graphBase}/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${_token}`);
  return checkResponse(res, 'fetchIgMedia');
}

export async function fetchIgInsights(_token: string) {
  if (env.MOCK_MODE) return mockInsights();
  // TODO: Implement actual Instagram Graph API insights call here
  return []; // Return empty instead of mock if not in mock mode
}
