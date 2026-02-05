export type InstagramBackClientConfig = {
  baseUrl: string; // com ou sem "/api"
  accessToken: string;
};

function normalizeBaseUrl(input: string) {
  return String(input || '').trim().replace(/\/+$/, '');
}

function buildApiUrl(baseUrlRaw: string, path: string) {
  const baseUrl = normalizeBaseUrl(baseUrlRaw);
  const p = path.startsWith('/') ? path : `/${path}`;
  if (baseUrl.endsWith('/api')) return `${baseUrl}${p}`;
  return `${baseUrl}/api${p}`;
}

async function requestJson<T>(
  cfg: InstagramBackClientConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(cfg.baseUrl, path);
  const r = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const raw = await r.text();
  if (!r.ok) {
    throw new Error(raw || `Falha na requisição (${r.status})`);
  }
  try {
    return (raw ? JSON.parse(raw) : null) as T;
  } catch {
    // alguns endpoints podem retornar texto; ainda assim, padronizamos
    return raw as unknown as T;
  }
}

export function createInstagramBackClient(cfg: InstagramBackClientConfig) {
  return {
    me: () => requestJson<any>(cfg, '/auth/me'),
    listPosts: () => requestJson<any>(cfg, '/posts'),
    createPost: (payload: any) => requestJson<any>(cfg, '/posts', { method: 'POST', body: JSON.stringify(payload) }),
    updatePost: (id: string, payload: any) =>
      requestJson<any>(cfg, `/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deletePost: (id: string) =>
      requestJson<any>(cfg, `/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}



