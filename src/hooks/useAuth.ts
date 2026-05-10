import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('charly_token');
    const userData = localStorage.getItem('charly_user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch { }
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem('charly_token');
    localStorage.removeItem('charly_user');
    window.location.href = '/login';
  };

  return { user, loading, signOut };
}