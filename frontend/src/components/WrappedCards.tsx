import './WrappedCards.css';

/* ---- Shared types ---- */
export interface WrappedCardData {
    username: string;
    profilePicUrl?: string;
    followerCount: number;
    year: number;
    totalLikes: number;
    totalComments: number;
    totalSaved: number;
    totalShares: number;
    totalVideoViews: number;
    totalImpressions: number;
    avgReach: number;
    postCount: number;
    storyCount: number;
    topPosts: { caption: string; likeCount: number; thumbnailUrl?: string; mediaUrl?: string }[];
    contentMix: { images: number; reels: number; carousels: number; videos: number };
    topMoment?: { caption: string; likeCount: number; mediaUrl?: string; thumbnailUrl?: string };
    topCity?: string;
    topCountry?: string;
    topAgeGroup?: string;
}

/* ---- IG brand header ---- */
function BrandHeader() {
    return (
        <div className="wcard-brand">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Instagram
        </div>
    );
}

function fmtNum(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
}

/* ============================================== */
/*  CARD 1 – Intro                                */
/* ============================================== */
export function CardIntro({ data }: { data: WrappedCardData }) {
    return (
        <div className="wcard wcard-aurora-1">
            <div className="wcard-content">
                <BrandHeader />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="wcard-avatar-wrap">
                        {data.profilePicUrl ? (
                            <img src={data.profilePicUrl} alt={data.username} className="wcard-avatar" crossOrigin="anonymous" />
                        ) : (
                            <div className="wcard-avatar" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900 }}>
                                {data.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h2 className="wcard-username">@{data.username}</h2>
                    <p className="wcard-follower-count">{fmtNum(data.followerCount)} followers</p>
                    <h1 className="wcard-heading">Your {data.year} on Instagram</h1>
                </div>
            </div>
        </div>
    );
}

/* ============================================== */
/*  CARD 2 – Your Impact                          */
/* ============================================== */
export function CardImpact({ data }: { data: WrappedCardData }) {
    return (
        <div className="wcard wcard-aurora-2">
            <div className="wcard-content">
                <BrandHeader />
                <h2 className="wcard-heading">Your Impact</h2>
                <div className="wcard-stat-hero">
                    <span className="wcard-stat-number">{fmtNum(data.totalLikes)}</span>
                    <span className="wcard-stat-label">Total Likes</span>
                </div>
                <div className="wcard-substats">
                    <div className="wcard-substat">
                        <span className="wcard-substat-val">{fmtNum(data.totalComments)}</span>
                        <span className="wcard-substat-label">Comments</span>
                    </div>
                    <div className="wcard-substat">
                        <span className="wcard-substat-val">{fmtNum(data.totalSaved)}</span>
                        <span className="wcard-substat-label">Saves</span>
                    </div>
                    <div className="wcard-substat">
                        <span className="wcard-substat-val">{fmtNum(data.totalShares)}</span>
                        <span className="wcard-substat-label">Shares</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ============================================== */
/*  CARD 3 – Top Posts                            */
/* ============================================== */
export function CardTopPosts({ data }: { data: WrappedCardData }) {
    const top5 = data.topPosts.slice(0, 5);
    return (
        <div className="wcard wcard-posts-grid">
            <div className="wcard-content" style={{ padding: '0', position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10 }}>
                    <BrandHeader />
                    <h2 className="wcard-heading" style={{ margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Your top posts</h2>
                </div>

                <div className="wcard-photo-grid">
                    {top5.map((post, i) => (
                        <div key={i} className={`wcard-grid-photo photo-${i + 1}`} style={{
                            backgroundImage: `url(${post.thumbnailUrl || post.mediaUrl || ''})`,
                            backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'
                        }}>
                            <div className="photo-overlay">
                                <span className="photo-rank">#{i + 1}</span>
                                <div className="photo-info">
                                    <span className="photo-likes">{fmtNum(post.likeCount)} likes</span>
                                    {post.caption && <span className="photo-caption">{post.caption.slice(0, 40)}...</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================== */
/*  CARD 4 – The Numbers                          */
/* ============================================== */
export function CardNumbers({ data }: { data: WrappedCardData }) {
    const stats = [
        { label: 'Impressions', val: data.totalImpressions },
        { label: 'Avg Reach', val: data.avgReach },
        { label: 'Saves', val: data.totalSaved },
        { label: 'Shares', val: data.totalShares },
        { label: 'Video Views', val: data.totalVideoViews },
        { label: 'Comments', val: data.totalComments },
    ];
    return (
        <div className="wcard wcard-aurora-4">
            <div className="wcard-content">
                <BrandHeader />
                <h2 className="wcard-heading">The Numbers</h2>
                <div className="wcard-grid">
                    {stats.map((s, i) => (
                        <div key={i} className="wcard-grid-item">
                            <span className="wcard-grid-val">{fmtNum(s.val)}</span>
                            <span className="wcard-grid-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================== */
/*  CARD 5 – Content Mix                          */
/* ============================================== */
export function CardContentMix({ data }: { data: WrappedCardData }) {
    const { images, reels, carousels, videos } = data.contentMix;
    const total = images + reels + carousels + videos || 1;
    const bars = [
        { label: 'Images', count: images, cls: 'bar-images' },
        { label: 'Reels', count: reels, cls: 'bar-reels' },
        { label: 'Carousels', count: carousels, cls: 'bar-carousels' },
        { label: 'Videos', count: videos, cls: 'bar-videos' },
    ].filter(b => b.count > 0);

    return (
        <div className="wcard wcard-aurora-5">
            <div className="wcard-content">
                <BrandHeader />
                <h2 className="wcard-heading">Content Mix</h2>
                <div className="wcard-bars">
                    {bars.map((b, i) => (
                        <div key={i} className="wcard-bar-row">
                            <span className="wcard-bar-label">{b.label}</span>
                            <div className="wcard-bar-track">
                                <div
                                    className={`wcard-bar-fill ${b.cls}`}
                                    style={{ width: `${Math.max((b.count / total) * 100, 12)}%` }}
                                >
                                    {b.count}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================== */
/*  CARD 6 – Top Moment                           */
/* ============================================== */
export function CardTopMoment({ data }: { data: WrappedCardData }) {
    const post = data.topMoment;
    return (
        <div className="wcard wcard-aurora-6">
            <div className="wcard-content">
                <BrandHeader />
                <h2 className="wcard-heading">Top Moment</h2>
                {post ? (
                    <>
                        <div className="wcard-hero-img-wrap">
                            {(post.thumbnailUrl || post.mediaUrl) && (
                                <img
                                    src={post.thumbnailUrl || post.mediaUrl}
                                    alt="Top post"
                                    className="wcard-hero-img"
                                    crossOrigin="anonymous"
                                />
                            )}
                        </div>
                        <div className="wcard-stat-hero" style={{ flex: 'none', marginTop: '16px' }}>
                            <span className="wcard-stat-number" style={{ fontSize: '2.5rem' }}>{fmtNum(post.likeCount)}</span>
                            <span className="wcard-stat-label">Likes on your best post</span>
                        </div>
                        {post.caption && <p className="wcard-hero-caption">{post.caption}</p>}
                    </>
                ) : (
                    <div className="wcard-stat-hero">
                        <span className="wcard-stat-number">✨</span>
                        <span className="wcard-stat-label">You showed up consistently!</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================== */
/*  CARD 7 – The Verdict                          */
/* ============================================== */
export function CardVerdict({ data }: { data: WrappedCardData }) {
    return (
        <div className="wcard wcard-aurora-7">
            <div className="wcard-content">
                <BrandHeader />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="wcard-year-big">{data.year}</div>
                    <h2 className="wcard-heading" style={{ marginBottom: '16px' }}>You Crushed It</h2>
                    <div className="wcard-substats" style={{ marginTop: 0 }}>
                        <div className="wcard-substat">
                            <span className="wcard-substat-val">{data.postCount}</span>
                            <span className="wcard-substat-label">Posts</span>
                        </div>
                        <div className="wcard-substat">
                            <span className="wcard-substat-val">{data.storyCount}</span>
                            <span className="wcard-substat-label">Stories</span>
                        </div>
                    </div>
                    <p className="wcard-verdict-tagline">
                        Your year of connection.<br />Keep creating, keep inspiring.
                        {data.topCity && <><br /><br />Most loved in <b>{data.topCity}</b> by the <b>{data.topAgeGroup || 'young'}</b> demographic.</>}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ---- Export all cards as an array renderer ---- */
export const ALL_CARDS = [CardIntro, CardImpact, CardTopPosts, CardNumbers, CardContentMix, CardTopMoment, CardVerdict];
