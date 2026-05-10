import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useSessions(userId: number | string | undefined) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    api('/api/sessions')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return { sessions, loading };
}