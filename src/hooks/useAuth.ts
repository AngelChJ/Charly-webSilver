import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

function parseJwt(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('charly_token');
    if (token) {
      const parsed = parseJwt(token);
      if (parsed) {
        setUser(parsed);
      } else {
        localStorage.removeItem('charly_token');
        localStorage.removeItem('charly_user');
      }
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('charly_token')}` },
      });
    } catch { }
    localStorage.removeItem('charly_token');
    localStorage.removeItem('charly_user');
    window.location.href = '/login';
  };

  return { user, loading, signOut };
}