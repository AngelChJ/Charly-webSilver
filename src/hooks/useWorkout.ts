import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface ExerciseItem {
  id: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  exercise: {
    id: number;
    name: string;
    description: string;
    focus_id: number;
    video_url: string;
    focus_name: string;
  };
}

interface Day {
  id: number;
  day_label: string;
  exercises: ExerciseItem[];
}

interface WorkoutPlan {
  id: number;
  name: string;
  days: Day[];
}

export function useWorkout(userId: number | string | undefined) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    // ✅ Llamar a /api/workout (la rutina activa), NO a /api/exercises
    api('/api/workout')
      .then(data => setPlan(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { plan, loading, error };
}