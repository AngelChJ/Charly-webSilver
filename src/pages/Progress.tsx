import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Trophy, Calendar, Activity, Dumbbell, Clock, Flame } from 'lucide-react';
import styles from '../styles/Progress.module.css';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';

export default function Progress() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sessions');
    const { user } = useAuth();
    const { sessions, loading } = useSessions(user?.id);

    const allSessions = useMemo(() => {
        return [...sessions].sort((a: any, b: any) => {
            return new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime();
        });
    }, [sessions]);

    const totalSessions = allSessions.length;
    const totalVolume = allSessions.reduce((sum: number, s: any) => sum + (s.total_volume || 0), 0);
    const totalExercises = allSessions.reduce((sum: number, s: any) => sum + (s.exercises?.length || 0), 0);

    const currentStreak = useMemo(() => {
        if (allSessions.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const hasSession = allSessions.some((s: any) => {
                const sessionDate = s.date || s.created_at;
                if (!sessionDate) return false;
                return sessionDate.startsWith?.(dateStr);
            });
            if (hasSession) streak++;
            else break;
        }
        return streak;
    }, [allSessions]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.title}><span className={styles.silverText}>PROGRESO</span></h1>
                <div style={{ width: 36 }} />
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <Activity size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>{totalSessions}</p>
                    <p className={styles.statLabel}>SESIONES</p>
                </div>
                <div className={styles.statCard}>
                    <Dumbbell size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>{totalVolume.toLocaleString()}</p>
                    <p className={styles.statLabel}>VOLUMEN (LBS)</p>
                </div>
                <div className={styles.statCard}>
                    <TrendingUp size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>{totalExercises}</p>
                    <p className={styles.statLabel}>EJERCICIOS</p>
                </div>
                <div className={styles.statCard}>
                    <Flame size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>{currentStreak}</p>
                    <p className={styles.statLabel}>RACHA</p>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'sessions' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    <Clock size={16} /> HISTORIAL
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'weekly' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    <Calendar size={16} /> SEMANAL
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'pbs' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('pbs')}
                >
                    <Trophy size={16} /> PBs
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'sessions' && (
                    <div className={styles.sessionList}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                                <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>CARGANDO HISTORIAL...</p>
                            </div>
                        ) : allSessions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                                <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                    AÚN NO HAY SESIONES REGISTRADAS
                                </p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#555' }}>
                                    Completa tu primer entrenamiento en el Dashboard
                                </p>
                            </div>
                        ) : (
                            allSessions.map((session: any) => (
                                <div key={session.id} className={styles.sessionCard}>
                                    <div className={styles.sessionHeader}>
                                        <div>
                                            <h4 className={styles.sessionName}>{session.routine_name}</h4>
                                            <p className={styles.sessionDate}>
                                                {(() => {
                                                    const dateStr = session.date || session.created_at;
                                                    if (!dateStr) return 'FECHA DESCONOCIDA';
                                                    if (typeof dateStr === 'string' && dateStr.includes('/')) {
                                                        return dateStr;
                                                    }
                                                    const parsed = new Date(dateStr);
                                                    if (isNaN(parsed.getTime())) {
                                                        return typeof dateStr === 'string' ? dateStr : 'FECHA DESCONOCIDA';
                                                    }
                                                    return parsed.toLocaleDateString('es-MX', {
                                                        weekday: 'long', day: 'numeric', month: 'long'
                                                    }).toUpperCase();
                                                })()}
                                            </p>
                                        </div>
                                        <span className={styles.sessionProgress}>
                                            {(session.total_volume || 0).toLocaleString()} LBS
                                        </span>
                                    </div>
                                    <div className={styles.sessionMeta}>
                                        <span>{session.exercises?.length || 0} ejercicios</span>
                                    </div>
                                    {session.exercises && session.exercises.length > 0 && (
                                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {session.exercises.map((ex: any, i: number) => (
                                                <div key={i} style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    fontSize: '0.75rem', color: '#999', padding: '0.25rem 0',
                                                    borderBottom: '1px solid rgba(188,198,204,0.05)'
                                                }}>
                                                    <span>{ex.name}</span>
                                                    <span>{ex.sets}×{ex.reps}×{ex.weight} = {(ex.sets * ex.reps * ex.weight).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab !== 'sessions' && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#666' }}>
                        <p style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>MÓDULO EN DESARROLLO</p>
                    </div>
                )}
            </div>
        </div>
    );
}