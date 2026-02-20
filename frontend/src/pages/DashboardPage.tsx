import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    api.profile().then(setProfile).catch(() => setProfile(null));
    api.media().then((d) => setMediaCount(d.count || 0)).catch(() => setMediaCount(0));
  }, []);

  async function syncInsights() {
    const result = await api.syncInsights();
    setSyncMsg(`Synced ${result.synced} insights rows`);
  }

  return (
    <section className="card">
      <h2>Dashboard</h2>
      {profile ? (
        <>
          <p><b>Username:</b> {profile.account.username}</p>
          <p><b>Media synced:</b> {mediaCount}</p>
          <button onClick={syncInsights}>Sync Insights</button>
          {syncMsg && <p>{syncMsg}</p>}
        </>
      ) : (
        <p>No linked account yet. Complete login first.</p>
      )}
    </section>
  );
}
