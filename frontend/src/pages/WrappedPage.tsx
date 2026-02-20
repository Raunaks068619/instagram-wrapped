import { useEffect, useState } from 'react';
import { api, session } from '../api/client';
import WrappedSlides from '../components/WrappedSlides';

export default function WrappedPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session.getUserId()) {
      window.location.href = '/';
    }
  }, []);

  async function generate() {
    setError('');
    try {
      const data = await api.generateWrapped(year);
      setReport(data.report);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function fetchExisting() {
    setError('');
    try {
      const data = await api.getWrapped(year);
      setReport(data.report);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="wrapped-page">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ margin: 0 }}>Your 2024 Wrapped</h2>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', boxShadow: 'none', color: 'var(--text-secondary)' }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="row" style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enter Year</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ maxWidth: '120px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <button onClick={generate}>✨ Generate New</button>
            <button onClick={fetchExisting} style={{ background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', boxShadow: 'none' }}>📦 Fetch Saved</button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        {
          report && (
            <div className="report-content" style={{ animation: 'fadeIn 0.8s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h3 style={{ fontSize: '2.5rem', marginBottom: '8px', background: 'linear-gradient(to right, #f43f5e, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{report.title}</h3>
                <p style={{ fontSize: '1.2rem' }}>{report.summary}</p>
              </div>

              {report.ai_image_ref && (
                <div style={{ position: 'relative', marginBottom: '48px' }}>
                  <img src={report.ai_image_ref} alt="Wrapped Visual" className="hero" style={{ border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                  <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '40px', fontSize: '0.8rem', backdropFilter: 'blur(10px)' }}>AI Generated Poster</div>
                </div>
              )}

              <WrappedSlides report={report} />
            </div>
          )
        }
      </section >
    </div >
  );
}
