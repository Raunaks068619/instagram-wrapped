import { useEffect, useState } from 'react';
import { api, session } from '../api/client';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if (userId) {
      session.setUserId(userId);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!session.getUserId()) {
      window.location.href = '/';
      return;
    }

    api.profile().then(setProfile).catch(() => setProfile(null));
    api.media().then((d) => setMediaCount(d.count || 0)).catch(() => setMediaCount(0));
  }, []);

  async function syncInsights() {
    const result = await api.syncInsights();
    setSyncMsg(`Synced ${result.synced} insights rows`);
  }

  return (
    <div className="dashboard">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ margin: 0 }}>Insights Dashboard</h2>
          <button
            onClick={syncInsights}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
          >
            🔄 Sync Data
          </button>
        </div>

        {profile ? (
          <>
            <div className="dashboard-grid">
              <div className="stat-card">
                <span className="stat-label">Username</span>
                <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: '8px' }}>@{profile.account.username}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Media Synced</span>
                <span className="stat-value">{mediaCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Status</span>
                <span className="stat-value" style={{ color: '#10b981', fontSize: '1.2rem', marginTop: '8px' }}>Connected</span>
              </div>
            </div>

            {syncMsg && <p className="error" style={{ borderColor: 'var(--primary-color)', color: 'var(--text-primary)', background: 'rgba(37, 99, 235, 0.1)' }}>{syncMsg}</p>}

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <p>Your data is ready! Head over to the Wrapped section to see your report.</p>
              <button onClick={() => window.location.href = '/wrapped'} style={{ marginTop: '12px' }}>
                View 2024 Wrapped
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>No linked account yet.</p>
            <button onClick={() => window.location.href = '/'}>Go to Login</button>
          </div>
        )}
      </section>
    </div>
  );
}
