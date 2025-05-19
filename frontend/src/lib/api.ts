const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
}