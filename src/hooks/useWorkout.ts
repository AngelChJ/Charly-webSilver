import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ExerciseItem {
    id: number;
    sets: number;
    reps: number;
    rest_seconds: number;
    exercise: {
        id: number;
        name: string;
        description: string;
        file_url: string;
        focus_id: number;
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

export function useWorkout(userId: string | undefined) {
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        async function fetchPlan() {
            try {
                // 1. Plan activo
                const { data: activePlan, error: planError } = await supabase
                    .from('workout_plans')
                    .select('id, name')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .maybeSingle();

                if (planError) throw planError;
                if (!activePlan) {
                    setPlan(null);
                    setLoading(false);
                    return;
                }

                // 2. Días del plan
                const { data: days, error: daysError } = await supabase
                    .from('plan_days')
                    .select('id, day_label, sort_order')
                    .eq('plan_id', activePlan.id)
                    .order('sort_order');

                if (daysError) throw daysError;

                // 3. Ejercicios por día
                const daysWithExercises = await Promise.all(
                    days.map(async (day) => {
                        const { data: exercises, error: exError } = await supabase
                            .from('plan_exercises')
                            .select(`
                id, sets, reps, rest_seconds,
                exercise:exercises ( id, name, description, file_url, focus_id )
              `)
                            .eq('day_id', day.id)
                            .order('sort_order');

                        if (exError) throw exError;

                        const formattedExercises = (exercises || []).map((ex: any) => ({
                            ...ex,
                            exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise
                        }));

                        return { ...day, exercises: formattedExercises as any };
                    })
                );

                setPlan({ ...activePlan, days: daysWithExercises });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchPlan();
    }, [userId]);

    return { plan, loading, error };
}