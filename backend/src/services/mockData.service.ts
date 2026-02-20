export function mockProfile() {
  return {
    id: 'mock-ig-001',
    username: 'mock.creator',
    account_type: 'CREATOR',
    media_count: 42,
    followers_count: 12034,
    follows_count: 420
  };
}

export function mockMedia() {
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `mock-media-${i + 1}`,
    caption: `Mock post #${i + 1}`,
    media_type: i % 2 === 0 ? 'IMAGE' : 'VIDEO',
    media_url: `https://picsum.photos/seed/mock-${i + 1}/1000/1000`,
    permalink: `https://instagram.com/p/mock-${i + 1}`,
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    like_count: 120 + i * 12,
    comments_count: 10 + i * 2
  }));
}

export function mockInsights(days = 30) {
  return Array.from({ length: days }).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000),
    impressions: 1000 + i * 15,
    reach: 700 + i * 11,
    profile_views: 90 + i,
    follower_count: 11500 + i * 5
  }));
}
