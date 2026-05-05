import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProfile(userId: string | undefined) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
            .then(({ data, error }: any) => {
                if (!error) setProfile(data);
                setLoading(false);
            });
    }, [userId]);

    const updateProfile = async (updates: any) => {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);
        if (!error) setProfile({ ...profile, ...updates });
        return error;
    };

    return { profile, loading, updateProfile };
}