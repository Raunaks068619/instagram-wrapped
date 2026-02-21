import { useEffect, useState, useRef } from 'react';
import { api, session } from '../api/client';
import WrappedCarousel from '../components/WrappedCarousel';
import type { WrappedCardData } from '../components/WrappedCards';

type Mode = 'cards' | 'ai';

export default function WrappedPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [mode, setMode] = useState<Mode>('cards');
  const [cardData, setCardData] = useState<WrappedCardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // AI mode state
  const [stylePrompt, setStylePrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [aiSlides, setAiSlides] = useState<{ title: string; text: string; image_url: string }[]>([]);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 7 });
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!session.getUserId()) {
      window.location.href = '/';
    }
  }, []);

  /* ---- HTML Cards mode ---- */
  async function generateCards() {
    setError('');
    setCardData(null);
    setAiSlides([]);
    setLoading(true);
    setLoadingMsg('Syncing your Instagram data...');
    try {
      const res = await api.getWrappedData(year);
      setCardData(res.cardData);
      setLoadingMsg('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  /* ---- AI mode ---- */
  function generateAI() {
    setError('');
    setCardData(null);
    setAiSlides([]);
    setLoading(true);
    setLoadingMsg('Generating AI images...');
    setAiProgress({ current: 0, total: 7 });

    const cancel = (api as any).generateWrappedStream(
      year,
      {
        onStatus: (data: any) => {
          setLoadingMsg(data.message || 'Generating...');
          if (data.current && data.total) setAiProgress({ current: data.current, total: data.total });
        },
        onSlide: (data: any) => {
          setAiSlides((prev) => {
            const next = [...prev];
            next[data.index] = data.slide;
            return next;
          });
          setAiProgress({ current: data.index + 1, total: data.total });
        },
        onComplete: () => {
          setLoading(false);
          setLoadingMsg('');
        },
        onError: (err: string) => {
          setError(err);
          setLoading(false);
        },
      },
      {
        stylePrompt: stylePrompt || undefined,
        referenceImages: referenceImages.length ? referenceImages : undefined,
      }
    );
    cancelRef.current = cancel;
  }

  function handleGenerate() {
    if (mode === 'cards') generateCards();
    else generateAI();
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setReferenceImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(i: number) {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="wrapped-page">
      <section className="card" style={{ padding: '40px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #ffffff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
              Your {year} Wrapped
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0 0', fontSize: '1rem' }}>
              Relive your best Instagram moments.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="wp-back-btn"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* ---- Premium Control Panel ---- */}
        <div className="wp-controls-panel">
          <div className="wp-control-group">
            <label className="wp-control-label">Target Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={loading}
              className="wp-year-input"
            />
          </div>

          <div className="wp-divider"></div>

          <div className="wp-control-group">
            <label className="wp-control-label">Output Format</label>
            <div className="wp-segment-control">
              <button
                className={`wp-segment-btn ${mode === 'cards' ? 'active' : ''}`}
                onClick={() => setMode('cards')}
                disabled={loading}
              >
                ⚡ Instant HTML
              </button>
              <button
                className={`wp-segment-btn ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
                disabled={loading}
              >
                🎨 AI Studio
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}></div>

          <button onClick={handleGenerate} disabled={loading} className={`wp-generate-btn ${loading ? 'loading' : ''} ${mode}`}>
            {loading ? '⏳ Generating...' : mode === 'cards' ? '✨ Generate Wrapped' : '✨ Generate AI Wrapped'}
          </button>
        </div>

        {/* ---- Style Settings (AI mode only) ---- */}
        {mode === 'ai' && (
          <div className="wp-style-panel">
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Style Settings</h4>
            <label className="wp-label">Style Prompt (optional)</label>
            <textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="e.g. &quot;Minimalist dark mode, neon gradients, include my face from my profile picture...&quot;"
              rows={3}
              disabled={loading}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <label className="wp-label" style={{ marginTop: '12px' }}>Reference Images</label>
            <div className="wp-ref-images">
              {referenceImages.map((src, i) => (
                <div key={i} className="wp-ref-thumb-wrap">
                  <img src={src} alt={`ref-${i}`} className="wp-ref-thumb" />
                  <button className="wp-ref-remove" onClick={() => removeImage(i)}>×</button>
                </div>
              ))}
              <label className="wp-ref-add">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                <span>+ Add</span>
              </label>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {/* ---- Loading spinner ---- */}
        {loading && (
          <div className="wp-loader">
            <div className="wp-pulse" />
            <h3 className="wp-loader-title">
              {mode === 'cards' ? 'Syncing & Computing' : `Generating ${aiProgress.current}/${aiProgress.total}`}
            </h3>
            <p className="wp-loader-sub">{loadingMsg || 'Please wait...'}</p>
          </div>
        )}

        {/* ---- HTML Cards Carousel ---- */}
        {cardData && mode === 'cards' && (
          <div style={{ animation: 'wpFadeIn 0.6s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '2rem', marginBottom: '4px', background: 'linear-gradient(to right, #f43f5e, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                @{cardData.username}'s {year} Wrapped
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                {cardData.totalLikes.toLocaleString()} likes • {cardData.totalComments.toLocaleString()} comments • {cardData.postCount} posts
              </p>
            </div>
            <WrappedCarousel cardData={cardData} />
          </div>
        )}

        {/* ---- AI Generated Slides ---- */}
        {aiSlides.length > 0 && mode === 'ai' && (
          <div style={{ animation: 'wpFadeIn 0.6s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '2rem', marginBottom: '4px', background: 'linear-gradient(to right, #f43f5e, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Generated Wrapped
              </h3>
            </div>
            <div className="wp-ai-grid">
              {aiSlides.map((slide, i) => slide && (
                <div key={i} className="wp-ai-slide">
                  <img src={slide.image_url} alt={slide.title} />
                  <div className="wp-ai-slide-info">
                    <strong>{slide.title}</strong>
                    <span>{slide.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <style>{`
        .wp-back-btn {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 8px; color: #a0a0a0; font-weight: 500; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
        }
        .wp-back-btn:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.2); }
        
        .wp-controls-panel {
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 40px;
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          padding: 24px 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .wp-control-group {
          display: flex; flex-direction: column; gap: 8px;
        }
        .wp-control-label {
          font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;
        }
        .wp-divider {
          width: 1px; height: 48px; background: rgba(255,255,255,0.08); margin: 0 8px;
        }
        .wp-year-input {
          background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 16px; border-radius: 12px; font-size: 1rem; font-weight: 600; width: 120px;
          transition: all 0.2s; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); font-family: inherit;
        }
        .wp-year-input:focus {
          border-color: rgba(168,85,247,0.5); box-shadow: 0 0 0 3px rgba(168,85,247,0.15), inset 0 2px 4px rgba(0,0,0,0.5);
          background: rgba(0,0,0,0.6);
        }

        .wp-segment-control {
          display: flex; background: rgba(0,0,0,0.4); padding: 6px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
        }
        .wp-segment-btn {
          padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
          color: #888; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; background: transparent; outline: none; position: relative; z-index: 1;
        }
        .wp-segment-btn.active {
          color: #fff; background: rgba(255,255,255,0.1); box-shadow: 0 2px 10px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2);
        }
        .wp-segment-btn:not(.active):hover { color: #d0d0d0; background: rgba(255,255,255,0.03); }

        .wp-generate-btn {
          padding: 14px 28px; border-radius: 12px; border: none; color: #fff; font-weight: 700; font-size: 0.95rem;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); outline: none;
        }
        .wp-generate-btn.cards {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          box-shadow: 0 4px 15px rgba(168,85,247,0.3);
        }
        .wp-generate-btn.cards:hover:not(:disabled) {
          background: linear-gradient(135deg, #b975f8, #f067ad); box-shadow: 0 6px 20px rgba(168,85,247,0.5); transform: translateY(-1px);
        }
        .wp-generate-btn.ai {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          box-shadow: 0 4px 15px rgba(59,130,246,0.3);
        }
        .wp-generate-btn.ai:hover:not(:disabled) {
          background: linear-gradient(135deg, #60a5fa, #22d3ee); box-shadow: 0 6px 20px rgba(59,130,246,0.5); transform: translateY(-1px);
        }
        .wp-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .wp-style-panel {
          background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px;
          border: 1px solid var(--border-color); margin-bottom: 24px;
        }
        .wp-style-panel textarea {
          background: rgba(255,255,255,0.06); color: #e0e0e0; border: 1px solid var(--border-color);
          border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
        }
        .wp-style-panel textarea::placeholder { color: rgba(255,255,255,0.25); }
        .wp-style-panel textarea:focus {
          border-color: rgba(168,85,247,0.5); box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
        }
        .wp-ref-images {
          display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;
        }
        .wp-ref-thumb-wrap {
          position: relative; width: 64px; height: 64px;
        }
        .wp-ref-thumb {
          width: 64px; height: 64px; border-radius: 8px; object-fit: cover;
          border: 1px solid var(--border-color);
        }
        .wp-ref-remove {
          position: absolute; top: -6px; right: -6px; background: #f43f5e;
          color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px;
          font-size: 0.7rem; cursor: pointer; display: flex; align-items: center;
          justify-content: center; line-height: 1; padding: 0;
        }
        .wp-ref-add {
          width: 64px; height: 64px; border-radius: 8px; border: 1px dashed var(--border-color);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          color: var(--text-secondary); font-size: 0.75rem; transition: border-color 0.2s;
        }
        .wp-ref-add:hover { border-color: rgba(255,255,255,0.3); }

        .wp-loader {
          text-align: center; padding: 60px 20px 40px;
        }
        .wp-pulse {
          display: inline-block; width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #f43f5e, #9333ea, #3b82f6);
          margin-bottom: 16px; animation: wpPulse 2s ease-in-out infinite;
          box-shadow: 0 0 24px rgba(147,51,234,0.3);
        }
        .wp-loader-title {
          font-size: 1.5rem; font-weight: 800;
          background: linear-gradient(to right, #f43f5e, #a855f7, #3b82f6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 8px;
        }
        .wp-loader-sub { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0; }

        .wp-ai-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .wp-ai-slide {
          border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);
          background: rgba(255,255,255,0.03);
        }
        .wp-ai-slide img { width: 100%; aspect-ratio: 9/16; object-fit: cover; }
        .wp-ai-slide-info { padding: 12px; }
        .wp-ai-slide-info strong { display: block; font-size: 0.85rem; margin-bottom: 4px; }
        .wp-ai-slide-info span { font-size: 0.75rem; color: var(--text-secondary); }

        @keyframes wpPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.75; }
        }
        @keyframes wpFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
