export function mockProfile() {
  return {
    id: 'mock-ig-001',
    username: 'mock.creator',
    name: 'Mock Creator',
    account_type: 'CREATOR',
    media_count: 42,
    followers_count: 12034,
    follows_count: 420,
    biography: '📸 Content Creator | Travel & Tech\n🌍 Mumbai → World\n📩 collab@mock.creator',
    profile_picture_url: 'https://picsum.photos/seed/profile/400/400',
    website: 'https://mockcreator.com'
  };
}

export function mockMedia() {
  const types = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REEL', 'IMAGE', 'VIDEO', 'IMAGE', 'REEL'];
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `mock-media-${i + 1}`,
    caption: `Mock post #${i + 1} — ${['Golden hour vibes ✨', 'New reel just dropped 🎬', 'Carousel of memories 📸', 'Sunday mood 🌊', 'Tech review incoming 💻', 'Behind the scenes 🎥', 'Sunset chasing 🌅', 'Dance reel 💃'][i]}`,
    media_type: types[i],
    media_url: `https://picsum.photos/seed/mock-${i + 1}/1000/1000`,
    thumbnail_url: types[i] === 'VIDEO' || types[i] === 'REEL' ? `https://picsum.photos/seed/thumb-${i + 1}/1000/1000` : null,
    permalink: `https://instagram.com/p/mock-${i + 1}`,
    timestamp: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    like_count: 120 + i * 45,
    comments_count: 10 + i * 7
  }));
}

export function mockMediaInsights(mediaId: string, mediaType: string) {
  const base = [
    { name: 'impressions', values: [{ value: 2500 + Math.floor(Math.random() * 1000) }] },
    { name: 'reach', values: [{ value: 1800 + Math.floor(Math.random() * 500) }] },
    { name: 'saved', values: [{ value: 15 + Math.floor(Math.random() * 30) }] },
    { name: 'shares', values: [{ value: 8 + Math.floor(Math.random() * 20) }] }
  ];
  if (mediaType === 'VIDEO' || mediaType === 'REEL') {
    base.push({ name: 'video_views', values: [{ value: 5000 + Math.floor(Math.random() * 3000) }] });
  }
  return { data: base };
}

export function mockStories() {
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `mock-story-${i + 1}`,
    media_type: i % 2 === 0 ? 'IMAGE' : 'VIDEO',
    media_url: `https://picsum.photos/seed/story-${i + 1}/1080/1920`,
    timestamp: new Date(Date.now() - i * 86400000).toISOString()
  }));
}

export function mockInsights(days = 30) {
  return Array.from({ length: days }).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000),
    impressions: 1000 + i * 15 + Math.floor(Math.random() * 200),
    reach: 700 + i * 11 + Math.floor(Math.random() * 150),
    profile_views: 90 + i + Math.floor(Math.random() * 30),
    follower_count: 11500 + i * 5,
    website_clicks: 5 + Math.floor(Math.random() * 10),
    email_contacts: Math.floor(Math.random() * 3)
  }));
}

export function mockAudienceDemographics() {
  return [
    // Cities
    { dimension: 'city', key: 'Mumbai, Maharashtra', value: 2100 },
    { dimension: 'city', key: 'Delhi, Delhi', value: 1800 },
    { dimension: 'city', key: 'Bangalore, Karnataka', value: 1500 },
    { dimension: 'city', key: 'New York, New York', value: 800 },
    { dimension: 'city', key: 'London, England', value: 650 },
    // Countries
    { dimension: 'country', key: 'IN', value: 7500 },
    { dimension: 'country', key: 'US', value: 2200 },
    { dimension: 'country', key: 'GB', value: 900 },
    { dimension: 'country', key: 'AE', value: 400 },
    { dimension: 'country', key: 'CA', value: 350 },
    // Gender + Age
    { dimension: 'gender_age', key: 'M.18-24', value: 2800 },
    { dimension: 'gender_age', key: 'M.25-34', value: 2200 },
    { dimension: 'gender_age', key: 'F.18-24', value: 2400 },
    { dimension: 'gender_age', key: 'F.25-34', value: 1900 },
    { dimension: 'gender_age', key: 'M.35-44', value: 800 },
    { dimension: 'gender_age', key: 'F.35-44', value: 600 },
    { dimension: 'gender_age', key: 'M.13-17', value: 400 },
    { dimension: 'gender_age', key: 'F.13-17', value: 350 }
  ];
}
