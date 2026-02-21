import { useState, useEffect } from 'react';
import { api, session } from '../api/client';
import './TestApiPage.css';

interface ApiEndpoint {
    name: string;
    method: string;
    path: string;
    action: () => Promise<any>;
}

export default function TestApiPage() {
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
    const [customEndpoint, setCustomEndpoint] = useState<string>('/me/media?fields=id,caption');

    useEffect(() => {
        if (!session.getUserId()) {
            window.location.href = '/';
        }
    }, []);

    const endpoints: ApiEndpoint[] = [
        {
            name: 'Get Profile',
            method: 'GET',
            path: '/api/instagram/profile',
            action: api.profile
        },
        {
            name: 'Get Media',
            method: 'GET',
            path: '/api/instagram/media',
            action: api.media
        },
        {
            name: 'Get Stories',
            method: 'GET',
            path: '/api/instagram/stories',
            action: api.stories
        },
        {
            name: 'Get Audience / Demographics',
            method: 'GET',
            path: '/api/instagram/audience',
            action: api.audience
        },
        {
            name: 'Sync Insights',
            method: 'POST',
            path: '/api/instagram/insights/sync',
            action: api.syncInsights
        },
        {
            name: 'Invalidate Cache',
            method: 'POST',
            path: '/api/instagram/cache/invalidate',
            action: api.invalidateCache
        }
    ];

    async function handleTest(endpoint: ApiEndpoint) {
        setLoading(true);
        setActiveEndpoint(endpoint.name);
        setResponse(null);
        try {
            const res = await endpoint.action();
            setResponse({ status: 200, data: res });
        } catch (err: any) {
            setResponse({ status: 'Error', error: err.message || JSON.stringify(err) });
        } finally {
            setLoading(false);
        }
    }

    async function handleCustomTest() {
        if (!customEndpoint.trim()) return;
        setLoading(true);
        setActiveEndpoint('Custom Endpoint');
        setResponse(null);
        try {
            const res = await api.custom(customEndpoint);
            setResponse({ status: 200, data: res });
        } catch (err: any) {
            setResponse({ status: 'Error', error: err.message || JSON.stringify(err) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="test-api-page">
            <div className="test-api-header">
                <h2>API Testing (Swagger Style)</h2>
                <p>Test the raw Instagram API endpoints and view the backend responses directly.</p>
            </div>

            <div className="test-api-content">
                <div className="endpoints-list">
                    <div className="endpoint-card custom-endpoint-card">
                        <div className="endpoint-info">
                            <span className="method-badge get">PROXY</span>
                            <span className="endpoint-name" style={{ marginLeft: '12px', fontWeight: 600, color: '#f3f4f6' }}>Custom Graph Query</span>
                        </div>
                        <div className="custom-input-row" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <span style={{ padding: '8px 0', color: '#a0a0a0', fontFamily: 'monospace' }}>graph.instagram.com/</span>
                            <input
                                type="text"
                                value={customEndpoint}
                                onChange={(e) => setCustomEndpoint(e.target.value)}
                                placeholder="me?fields=id,username"
                                className="custom-endpoint-input"
                            />
                            <button
                                className="execute-btn"
                                onClick={handleCustomTest}
                                disabled={loading && activeEndpoint === 'Custom Endpoint'}
                            >
                                {loading && activeEndpoint === 'Custom Endpoint' ? 'Executing...' : 'Execute'}
                            </button>
                        </div>
                    </div>

                    {endpoints.map((ep) => (
                        <div className="endpoint-card" key={ep.name}>
                            <div className="endpoint-info">
                                <span className={`method-badge ${ep.method.toLowerCase()}`}>{ep.method}</span>
                                <span className="endpoint-path">{ep.path}</span>
                            </div>
                            <div className="endpoint-actions">
                                <span className="endpoint-name">{ep.name}</span>
                                <button
                                    className="execute-btn"
                                    onClick={() => handleTest(ep)}
                                    disabled={loading && activeEndpoint === ep.name}
                                >
                                    {loading && activeEndpoint === ep.name ? 'Executing...' : 'Execute'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="response-viewer">
                    <h3>Response Viewing Area</h3>
                    <div className="viewer-box">
                        {loading ? (
                            <div className="viewer-placeholder loader">Loading response...</div>
                        ) : response ? (
                            <pre className={response.status === 'Error' ? 'error-response' : 'success-response'}>
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        ) : (
                            <div className="viewer-placeholder">Click an "Execute" button to see the JSON response here.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
