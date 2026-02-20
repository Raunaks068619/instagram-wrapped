const API = import.meta.env.VITE_API_BASE_URL ?? '';

const SESSION_KEY = 'ig_wrapped_user_id';

export const session = {
  getUserId: () => localStorage.getItem(SESSION_KEY),
  setUserId: (id: string) => localStorage.setItem(SESSION_KEY, id),
  clear: () => localStorage.removeItem(SESSION_KEY)
};

async function req(path: string, init?: RequestInit) {
  const userId = session.getUserId();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  const res = await fetch(`${API}${path}`, {
    headers,
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
