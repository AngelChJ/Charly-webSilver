const API_URL = import.meta.env.VITE_API_URL || '';

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('charly_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}