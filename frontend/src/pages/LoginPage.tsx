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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <section className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📸</div>
        <h2>Welcome Back</h2>
        <p>Ready to see your year in review? Connect your Instagram to get started.</p>
        <div style={{ marginTop: '32px' }}>
          <button 
            onClick={connectInstagram} 
            disabled={loading}
            style={{ width: '100%', padding: '16px' }}
          >
            {loading ? 'Redirecting to Instagram...' : 'Continue with Instagram'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <p style={{ fontSize: '0.8rem', marginTop: '24px', opacity: 0.6 }}>
          We only sync your public media and basic insights. Your data is safe with us.
        </p>
      </section>
    </div>
  );
}
