import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useProfile(userId: number | string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    api('/api/profile')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const updateProfile = async (updates: any) => {
    await api('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setProfile((prev: any) => ({ ...prev, ...updates }));
  };

  return { profile, loading, updateProfile };
}