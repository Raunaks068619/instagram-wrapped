const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  startAuth: () => req('/auth/instagram/start'),
  profile: () => req('/api/instagram/profile'),
  media: () => req('/api/instagram/media'),
  syncInsights: () => req('/api/instagram/insights/sync', { method: 'POST', body: JSON.stringify({ days: 30 }) }),
  generateWrapped: (year: number) => req('/api/wrapped/generate', { method: 'POST', body: JSON.stringify({ year }) }),
  getWrapped: (year: number) => req(`/api/wrapped/${year}`)
};
