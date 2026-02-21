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

/**
 * Stream wrapped generation via SSE.
 * Calls onSlide for each slide as it arrives, onStatus for progress updates, onComplete when done.
 */
function generateWrappedStream(
  year: number,
  callbacks: {
    onStatus?: (data: { message: string; phase: string; current?: number; total?: number }) => void;
    onSlide?: (data: { index: number; slide: { title: string; text: string; image_url: string }; total: number }) => void;
    onComplete?: (data: { report: any }) => void;
    onError?: (error: string) => void;
  },
  options?: {
    stylePrompt?: string;
    referenceImages?: string[];
  }
): () => void {
  const userId = session.getUserId();
  const controller = new AbortController();

  fetch(`${API}/api/wrapped/generate/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {})
    },
    body: JSON.stringify({
      year,
      ...(options?.stylePrompt ? { stylePrompt: options.stylePrompt } : {}),
      ...(options?.referenceImages?.length ? { referenceImages: options.referenceImages } : {})
    }),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Generation failed' }));
        callbacks.onError?.(err.error || `HTTP ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('No response stream available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines.
        // Only process complete events (those followed by \n\n).
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const block = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);

          // Parse the event block
          let eventType = '';
          let dataStr = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr += line.slice(6);
            } else if (line.startsWith('data:')) {
              dataStr += line.slice(5);
            }
          }

          if (eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              switch (eventType) {
                case 'status': callbacks.onStatus?.(data); break;
                case 'slide': callbacks.onSlide?.(data); break;
                case 'complete': callbacks.onComplete?.(data); break;
                case 'error': callbacks.onError?.(data.message); break;
              }
            } catch {
              console.warn('SSE parse error for event:', eventType, 'data length:', dataStr.length);
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(err.message);
      }
    });

  // Return abort function
  return () => controller.abort();
}

export const api = {
  startAuth: () => req('/auth/instagram/start'),
  profile: () => req('/api/instagram/profile'),
  media: () => req('/api/instagram/media'),
  stories: () => req('/api/instagram/stories'),
  audience: () => req('/api/instagram/audience'),
  custom: (endpoint: string) => req('/api/instagram/custom', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  invalidateCache: () => req('/api/instagram/cache/invalidate', { method: 'POST' }),
  syncInsights: () => req('/api/instagram/insights/sync', { method: 'POST', body: JSON.stringify({ days: 30 }) }),
  generateWrapped: (year: number) => req('/api/wrapped/generate', { method: 'POST', body: JSON.stringify({ year }) }),
  generateWrappedStream,
  getWrapped: (year: number) => req(`/api/wrapped/${year}`),
  getWrappedData: (year: number) => req(`/api/wrapped/data/${year}`)
};
