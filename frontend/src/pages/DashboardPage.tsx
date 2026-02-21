import { useEffect, useState } from 'react';
import { api, session } from '../api/client';

interface MediaItem {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  like_count: number;
  comments_count: number;
  caption?: string;
  timestamp: string;
  impressions?: number;
  reach?: number;
  saved?: number;
  shares?: number;
}

interface ProfileData {
  account: {
    username: string;
    biography?: string;
    profile_picture_url?: string;
    followers_count: number;
    follows_count: number;
  };
  profile: {
    media_count?: number;
  };
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [syncMsg, setSyncMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if (userId) {
      session.setUserId(userId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!session.getUserId()) {
      window.location.href = '/';
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const profileData = await api.profile();
        if (cancelled) return;
        setProfile(profileData);

        const mediaData = await api.media();
        if (cancelled) return;
        setMediaItems(mediaData.media || []);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  async function syncInsights() {
    setSyncMsg('Syncing...');
    try {
      // Invalidate cache so next fetch hits the real API
      await api.invalidateCache();
      const result = await api.syncInsights();
      // Re-fetch fresh data
      const profileData = await api.profile();
      setProfile(profileData);
      const mediaData = await api.media();
      setMediaItems(mediaData.media || []);
      setSyncMsg(`✓ Synced ${result.synced_insights ?? result.synced ?? 0} insights`);
      setTimeout(() => setSyncMsg(''), 3000);
    } catch {
      setSyncMsg('Sync failed');
    }
  }

  const topPost = [...mediaItems].sort((a, b) => b.like_count - a.like_count)[0];
  const postCount = profile?.profile?.media_count || mediaItems.length;

  if (loading) {
    return (
      <div className="ig-dash">
        <div className="ig-loading">
          <div className="ig-loading-ring" />
        </div>
        <style>{dashStyles}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="ig-dash">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p>No linked account yet.</p>
          <button onClick={() => window.location.href = '/'}>Go to Login</button>
        </div>
      </div>
    );
  }

  const { account } = profile;

  return (
    <div className="ig-dash">
      {/* ===== Profile Header ===== */}
      <div className="ig-profile-header">
        <div className="ig-avatar-col">
          {account.profile_picture_url ? (
            <img src={account.profile_picture_url} alt={account.username} className="ig-avatar" />
          ) : (
            <div className="ig-avatar ig-avatar-placeholder">
              {account.username[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="ig-info-col">
          <div className="ig-username-row">
            <h2 className="ig-username">{account.username}</h2>
            <span className="ig-edit-btn" onClick={syncInsights}>
              {syncMsg || '🔄 Sync Data'}
            </span>
            <span className="ig-action-btn" onClick={() => window.location.href = '/wrapped'}>
              ✨ View Wrapped
            </span>
          </div>

          <div className="ig-stats-row">
            <div className="ig-stat">
              <strong>{postCount}</strong> posts
            </div>
            <div className="ig-stat">
              <strong>{account.followers_count.toLocaleString()}</strong> followers
            </div>
            <div className="ig-stat">
              <strong>{account.follows_count.toLocaleString()}</strong> following
            </div>
          </div>

          {account.biography && (
            <div className="ig-bio">
              {account.biography}
            </div>
          )}
        </div>
      </div>

      {/* ===== Top Post Highlight ===== */}
      {topPost && (
        <div className="ig-top-post">
          <div className="ig-top-post-img">
            <img src={topPost.thumbnail_url || topPost.media_url} alt="Top post" />
            <div className="ig-top-post-badge">🏆 Top Post</div>
          </div>
          <div className="ig-top-post-info">
            <h3 className="ig-top-post-title">Your Most Loved Post</h3>
            <div className="ig-top-post-stats">
              <span>❤️ {topPost.like_count.toLocaleString()}</span>
              <span>💬 {topPost.comments_count.toLocaleString()}</span>
              {topPost.saved ? <span>🔖 {topPost.saved.toLocaleString()}</span> : null}
              {topPost.shares ? <span>↗️ {topPost.shares.toLocaleString()}</span> : null}
              {topPost.impressions ? <span>👁 {topPost.impressions.toLocaleString()}</span> : null}
            </div>
            {topPost.caption && (
              <p className="ig-top-post-caption">
                {topPost.caption.length > 120 ? topPost.caption.slice(0, 120) + '…' : topPost.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== Insights Summary (quick stats) ===== */}
      <div className="ig-insights-row">
        <div className="ig-insight-card">
          <span className="ig-insight-val">{mediaItems.reduce((a, m) => a + m.like_count, 0).toLocaleString()}</span>
          <span className="ig-insight-label">Total Likes</span>
        </div>
        <div className="ig-insight-card">
          <span className="ig-insight-val">{mediaItems.reduce((a, m) => a + m.comments_count, 0).toLocaleString()}</span>
          <span className="ig-insight-label">Total Comments</span>
        </div>
        <div className="ig-insight-card">
          <span className="ig-insight-val">{mediaItems.reduce((a, m) => a + (m.saved || 0), 0).toLocaleString()}</span>
          <span className="ig-insight-label">Total Saves</span>
        </div>
        <div className="ig-insight-card">
          <span className="ig-insight-val">{mediaItems.reduce((a, m) => a + (m.impressions || 0), 0).toLocaleString()}</span>
          <span className="ig-insight-label">Impressions</span>
        </div>
      </div>

      {/* ===== Grid Tabs ===== */}
      <div className="ig-tabs">
        <div className="ig-tab ig-tab-active">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" /></svg>
          POSTS
        </div>
      </div>

      {/* ===== Post Grid ===== */}
      <div className="ig-grid">
        {mediaItems.map((item, idx) => (
          <a
            key={idx}
            className="ig-grid-item"
            href={item.permalink || '#'}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={item.thumbnail_url || item.media_url || ''}
              alt={item.caption?.slice(0, 30) || `Post ${idx + 1}`}
              loading="lazy"
            />
            <div className="ig-grid-overlay">
              <span>❤️ {item.like_count}</span>
              <span>💬 {item.comments_count}</span>
            </div>
            {(item.media_type === 'VIDEO' || item.media_type === 'REEL') && (
              <div className="ig-grid-video-icon">▶</div>
            )}
          </a>
        ))}
      </div>

      <style>{dashStyles}</style>
    </div>
  );
}

const dashStyles = `
  .ig-dash {
    width: 100%;
  }

  .ig-loading {
    display: flex;
    justify-content: center;
    padding: 100px 0;
  }
  .ig-loading-ring {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #fff;
    animation: igSpin 0.8s linear infinite;
  }
  @keyframes igSpin {
    to { transform: rotate(360deg); }
  }

  /* ---- Profile Header ---- */
  .ig-profile-header {
    display: flex;
    gap: 40px;
    padding: 30px 20px 24px;
    align-items: flex-start;
  }
  .ig-avatar-col {
    flex-shrink: 0;
  }
  .ig-avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #333;
  }
  .ig-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #262626;
    color: #666;
    font-size: 3rem;
    font-weight: 700;
  }

  .ig-info-col {
    flex: 1;
    min-width: 0;
    padding-top: 8px;
  }

  .ig-username-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .ig-username {
    font-size: 1.25rem;
    font-weight: 400;
    margin: 0;
    color: #f5f5f5;
  }
  .ig-edit-btn, .ig-action-btn {
    display: inline-block;
    background: #363636;
    color: #f5f5f5;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .ig-edit-btn:hover, .ig-action-btn:hover {
    background: #444;
  }
  .ig-action-btn {
    background: #0095f6;
  }
  .ig-action-btn:hover {
    background: #1877f2;
  }

  .ig-stats-row {
    display: flex;
    gap: 32px;
    margin-bottom: 14px;
  }
  .ig-stat {
    font-size: 0.95rem;
    color: #f5f5f5;
  }
  .ig-stat strong {
    font-weight: 700;
  }

  .ig-bio {
    font-size: 0.88rem;
    color: #f5f5f5;
    line-height: 1.5;
    white-space: pre-line;
  }

  /* ---- Top Post ---- */
  .ig-top-post {
    display: flex;
    gap: 20px;
    background: #121212;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 16px;
    margin: 0 20px 20px;
    align-items: center;
  }
  .ig-top-post-img {
    position: relative;
    flex-shrink: 0;
    width: 140px;
    height: 140px;
    border-radius: 10px;
    overflow: hidden;
  }
  .ig-top-post-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .ig-top-post-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0,0,0,0.7);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    backdrop-filter: blur(4px);
  }
  .ig-top-post-info {
    flex: 1;
    min-width: 0;
  }
  .ig-top-post-title {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 700;
    color: #f5f5f5;
  }
  .ig-top-post-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 0.85rem;
    color: #a8a8a8;
    margin-bottom: 8px;
  }
  .ig-top-post-caption {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
    line-height: 1.4;
  }

  /* ---- Insights row ---- */
  .ig-insights-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 0 20px 20px;
  }
  .ig-insight-card {
    background: #121212;
    border: 1px solid #262626;
    border-radius: 10px;
    padding: 16px 12px;
    text-align: center;
  }
  .ig-insight-val {
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
    color: #f5f5f5;
    margin-bottom: 4px;
  }
  .ig-insight-label {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ---- Grid Tabs ---- */
  .ig-tabs {
    display: flex;
    border-top: 1px solid #262626;
    margin: 0 20px;
    justify-content: center;
  }
  .ig-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 20px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #666;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-top: 1px solid transparent;
    margin-top: -1px;
    transition: color 0.2s;
  }
  .ig-tab-active {
    color: #f5f5f5;
    border-top-color: #f5f5f5;
  }

  /* ---- Post Grid ---- */
  .ig-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3px;
    margin: 0 20px 20px;
  }
  .ig-grid-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    background: #121212;
    display: block;
  }
  .ig-grid-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.2s;
  }
  .ig-grid-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    opacity: 0;
    transition: opacity 0.2s;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
  }
  .ig-grid-item:hover .ig-grid-overlay {
    opacity: 1;
  }
  .ig-grid-video-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    color: #fff;
    font-size: 0.7rem;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }

  /* ---- Mobile ---- */
  @media (max-width: 640px) {
    .ig-profile-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
    }
    .ig-avatar { width: 86px; height: 86px; }
    .ig-stats-row { justify-content: center; }
    .ig-username-row { justify-content: center; }
    .ig-insights-row { grid-template-columns: repeat(2, 1fr); }
    .ig-top-post { flex-direction: column; }
    .ig-top-post-img { width: 100%; height: 200px; }
  }
`;
