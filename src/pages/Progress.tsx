import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Trophy, Calendar, Activity, Dumbbell, Clock, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import styles from '../styles/Progress.module.css';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';

export default function Progress() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'sessions' | 'weekly' | 'pbs'>('sessions');
    const [expandedSession, setExpandedSession] = useState<number | null>(null);
    const { user } = useAuth();
    const { sessions, loading } = useSessions(user?.id);

    // Ordenar sesiones por fecha (más reciente primero)
    const allSessions = useMemo(() => {
        return [...sessions].sort((a: any, b: any) => {
            return new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime();
        });
    }, [sessions]);

    // Estadísticas generales
    const totalSessions = allSessions.length;
    const totalVolume = allSessions.reduce((sum: number, s: any) => sum + (s.total_volume || 0), 0);
    const totalExercises = allSessions.reduce((sum: number, s: any) => sum + (s.exercises?.length || 0), 0);

    // Racha de días consecutivos
    const currentStreak = useMemo(() => {
        if (allSessions.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const hasSession = allSessions.some((s: any) => {
                const sessionDate = s.date || s.created_at;
                if (!sessionDate) return false;
                const sessionDateStr = typeof sessionDate === 'string' && sessionDate.includes('T')
                    ? sessionDate.split('T')[0]
                    : new Date(sessionDate).toISOString().split('T')[0];
                return sessionDateStr === dateStr;
            });

            if (hasSession) streak++;
            else break;
        }
        return streak;
    }, [allSessions]);

    // Agrupar sesiones por semana para la pestaña SEMANAL
    const weeklyData = useMemo(() => {
        const weeks: any = {};
        allSessions.forEach((session: any) => {
            const date = new Date(session.date || session.created_at);
            // Obtener el lunes de esa semana
            const monday = new Date(date);
            monday.setDate(date.getDate() - (date.getDay() || 7) + 1);
            const weekKey = monday.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    label: weekKey,
                    sessions: 0,
                    volume: 0,
                    exercises: 0,
                };
            }
            weeks[weekKey].sessions++;
            weeks[weekKey].volume += session.total_volume || 0;
            weeks[weekKey].exercises += session.exercises?.length || 0;
        });
        return Object.values(weeks);
    }, [allSessions]);

    // Récords personales (PBs) - mayor peso por ejercicio
    const personalBests = useMemo(() => {
        const pbs: any = {};
        allSessions.forEach((session: any) => {
            const exercises = session.exercises || [];
            exercises.forEach((ex: any) => {
                const key = ex.name;
                if (!pbs[key] || (ex.weight || 0) > (pbs[key].weight || 0)) {
                    pbs[key] = {
                        name: key,
                        weight: ex.weight || 0,
                        reps: ex.reps || 0,
                        date: session.date || session.created_at,
                    };
                }
            });
        });
        return Object.values(pbs).sort((a: any, b: any) => b.weight - a.weight);
    }, [allSessions]);

    // Formatear fecha
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Fecha desconocida';
        if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
        try {
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) return dateStr;
            return parsed.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.title}><span className={styles.silverText}>PROGRESO</span></h1>
                <div style={{ width: 36 }} />
            </header>

            {/* Stats Grid */}
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
                    <p className={styles.statLabel}>RACHA (DÍAS)</p>
                </div>
            </div>

            {/* Tabs */}
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
                    <Trophy size={16} /> RÉCORDS
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {/* Historial de sesiones */}
                {activeTab === 'sessions' && (
                    <div className={styles.sessionList}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                                <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>CARGANDO HISTORIAL...</p>
                            </div>
                        ) : allSessions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                                <Dumbbell size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                    AÚN NO HAY SESIONES REGISTRADAS
                                </p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#555' }}>
                                    Completa tu primer entrenamiento en el Dashboard
                                </p>
                            </div>
                        ) : (
                            allSessions.map((session: any, index: number) => (
                                <div key={session.id || index} className={styles.sessionCard}>
                                    <div
                                        className={styles.sessionHeader}
                                        onClick={() => setExpandedSession(expandedSession === index ? null : index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div>
                                            <h4 className={styles.sessionName}>{session.routine_name}</h4>
                                            <p className={styles.sessionDate}>{formatDate(session.date || session.created_at)}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span className={styles.sessionProgress}>
                                                {(session.total_volume || 0).toLocaleString()} LBS
                                            </span>
                                            {expandedSession === index ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                    </div>
                                    <div className={styles.sessionMeta}>
                                        <span>{session.exercises?.length || 0} ejercicios</span>
                                    </div>

                                    {/* Ejercicios expandibles */}
                                    {expandedSession === index && session.exercises && session.exercises.length > 0 && (
                                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {session.exercises.map((ex: any, i: number) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.75rem',
                                                    color: '#999',
                                                    padding: '0.4rem 0.5rem',
                                                    borderBottom: '1px solid rgba(188,198,204,0.05)',
                                                    background: 'rgba(188,198,204,0.02)',
                                                    borderRadius: '6px'
                                                }}>
                                                    <span style={{ fontWeight: 600, color: '#BCC6CC' }}>{ex.name}</span>
                                                    <span>{ex.weight > 0 ? `${ex.weight} LBS × ${ex.reps} reps` : `${ex.reps} reps`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Barra de progreso */}
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Vista Semanal */}
                {activeTab === 'weekly' && (
                    <div className={styles.weeklyList}>
                        {weeklyData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                                <p>No hay datos semanales.</p>
                            </div>
                        ) : (
                            weeklyData.map((week: any, i: number) => (
                                <div key={i} className={styles.weeklyCard}>
                                    <div className={styles.weeklyHeader}>
                                        <span className={styles.weekLabel}>Semana del {week.label}</span>
                                        <span className={styles.streakBadge}>
                                            <Flame size={12} /> {week.sessions} sesión(es)
                                        </span>
                                    </div>
                                    <div className={styles.weeklyStats}>
                                        <div className={styles.weeklyStat}>
                                            <span className={styles.weeklyStatValue}>{week.volume.toLocaleString()}</span>
                                            <span className={styles.weeklyStatLabel}>VOLUMEN</span>
                                        </div>
                                        <div className={styles.weeklyStat}>
                                            <span className={styles.weeklyStatValue}>{week.exercises}</span>
                                            <span className={styles.weeklyStatLabel}>EJERCICIOS</span>
                                        </div>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Récords Personales */}
                {activeTab === 'pbs' && (
                    <div className={styles.pbList}>
                        {personalBests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                                <Trophy size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p>No hay récords todavía.</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#555' }}>
                                    Completa entrenamientos con peso para ver tus récords.
                                </p>
                            </div>
                        ) : (
                            personalBests.map((pb: any, i: number) => (
                                <div key={i} className={styles.pbCard}>
                                    <div className={styles.pbInfo}>
                                        <h4 className={styles.pbName}>
                                            {i === 0 && '🥇 '}
                                            {i === 1 && '🥈 '}
                                            {i === 2 && '🥉 '}
                                            {pb.name}
                                        </h4>
                                        <p className={styles.pbDate}>{formatDate(pb.date)}</p>
                                    </div>
                                    <div className={styles.pbWeight}>
                                        <span className={styles.pbWeightValue}>{pb.weight}</span>
                                        <span className={styles.pbWeightUnit}>LBS × {pb.reps}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}