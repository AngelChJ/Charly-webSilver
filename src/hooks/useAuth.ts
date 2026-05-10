import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Solo verifica expiración — el JWT no lleva role ni name
function parseJwtExpiry(token: string): { id: number; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.id, email: payload.email };
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
      const jwtPayload = parseJwtExpiry(token);
      if (jwtPayload) {
        // role y name NO están en el JWT (el token solo tiene id y email).
        // Los leemos de charly_user, guardado en login desde la respuesta de la API.
        const storedUser = localStorage.getItem('charly_user');
        if (storedUser) {
          try {
            const { role, name } = JSON.parse(storedUser);
            setUser({ id: jwtPayload.id, email: jwtPayload.email, role, name });
          } catch {
            localStorage.removeItem('charly_token');
            localStorage.removeItem('charly_user');
          }
        } else {
          localStorage.removeItem('charly_token');
        }
      } else {
        // Token expirado
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