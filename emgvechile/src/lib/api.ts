const PRIMARY_URL = 'http://localhost:8000/api';
const FALLBACK_URL = 'http://127.0.0.1:8000/api';

function getToken(): string | null {
  return localStorage.getItem('driver_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${PRIMARY_URL}${path}`, { ...options, headers });
  } catch (primaryErr) {
    // If localhost failed (e.g. IPv6 ::1 vs IPv4 127.0.0.1 on Windows), retry on 127.0.0.1
    try {
      res = await fetch(`${FALLBACK_URL}${path}`, { ...options, headers });
    } catch {
      throw new Error('Failed to fetch from backend API. Using local fallback.');
    }
  }

  if (res.status === 401) {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postMultipart: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${PRIMARY_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch {
      res = await fetch(`${FALLBACK_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? 'Upload failed');
    }
    return res.json() as Promise<T>;
  },
};
