const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  tools: {
    list: () => fetchAPI<any[]>('/v1/tools/'),
    get: (id: string) => fetchAPI<any>(`/v1/tools/${id}`),
  },
  coach: {
    chat: (message: string, conversationId?: string) =>
      fetchAPI<any>('/v1/coach/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversation_id: conversationId }),
      }),
    capabilities: () => fetchAPI<any>('/v1/coach/capabilities'),
  },
  methodology: {
    getDMAIC: () => fetchAPI<any[]>('/v1/methodology/dmaic'),
    getPhase: (id: string) => fetchAPI<any>(`/v1/methodology/dmaic/${id}`),
  },
};
