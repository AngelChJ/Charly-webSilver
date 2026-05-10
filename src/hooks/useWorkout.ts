import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useWorkout(userId: number | string | undefined) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    api('/api/exercises')
      .then((data: any[]) => {
        if (data && data.length > 0) {
          setPlan({
            id: 1,
            name: 'RUTINA',
            days: [{
              day_label: 'LUNES',
              exercises: data.map((ex: any) => ({
                id: ex.id,
                exercise: ex,
                sets: 3,
                reps: 10,
              })),
            }],
          });
        } else {
          setPlan(null);
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { plan, loading, error };
}