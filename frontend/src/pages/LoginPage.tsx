import { useState } from 'react';
import { api } from '../api/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function connectInstagram() {
    setLoading(true);
    setError('');
    try {
      const data = await api.startAuth();
      window.location.href = data.authUrl;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Login with Instagram</h2>
      <p>Connect your Instagram account to generate a personalized Wrapped report.</p>
      <button onClick={connectInstagram} disabled={loading}>{loading ? 'Redirecting...' : 'Continue with Instagram'}</button>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
