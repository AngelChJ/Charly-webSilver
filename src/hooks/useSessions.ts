import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSessions(userId: string | undefined) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        supabase
            .from('workout_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .then(({ data, error }: any) => {
                if (!error && data) setSessions(data);
                setLoading(false);
            });
    }, [userId]);

    return { sessions, loading };
}