import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Dumbbell, Check, User, LogOut, TrendingUp, Menu, X, Flag, MessageCircle, Loader, Plus, Trash2 } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';
import { api } from '../lib/api';
import { useWorkout } from '../hooks/useWorkout';
import { useAuth } from '../hooks/useAuth';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import { useState, useMemo, useEffect } from 'react';

interface SetState {
    weight: number;
    reps: number;
    done: boolean;
}

interface ExerciseState {
    id: number;
    name: string;
    sets: SetState[];
}

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [unit] = useState('Lbs');

    const { user } = useAuth();
    const { plan, loading, error } = useWorkout(user?.id);

    const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<any>(null);

    // ─── Día actual según mapeo semanal ───
    const todayDay = useMemo(() => {
        if (!plan || !plan.days || plan.days.length === 0) return null;
        const todayIndex = new Date().getDay();
        const totalDays = plan.days.length;
        if (todayIndex === 0) return null;
        const trainingDays = [1, 2, 3, 4, 5, 6];
        const dayPosition = trainingDays.indexOf(todayIndex);
        if (dayPosition === -1) return null;
        const dayIndex = dayPosition % totalDays;
        return plan.days[dayIndex];
    }, [plan]);

    // ─── Transformar ejercicios del día actual ───
    const exercises: ExerciseState[] = useMemo(() => {
        if (!todayDay) return [];
        return todayDay.exercises.map((ex: any) => ({
            id: ex.id,
            name: ex.exercise?.name ?? 'Ejercicio sin nombre',
            sets: [{ weight: 0, reps: ex.reps || 10, done: false }],
        }));
    }, [todayDay]);

    const [exState, setExState] = useState<ExerciseState[]>([]);

    useEffect(() => {
        if (exercises.length > 0) {
            const currentIds = exState.map((e) => e.id).join(',');
            const newIds = exercises.map((e) => e.id).join(',');
            if (currentIds !== newIds) setExState(exercises);
        } else {
            setExState([]);
        }
    }, [exercises]);

    const currentExercises = exState.length > 0 ? exState : exercises;

    const completed = currentExercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0
    );
    const totalSets = currentExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const progressPct = totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0;
    const totalVolume = currentExercises.reduce(
        (sum, ex) =>
            sum + ex.sets.filter((s) => s.done).reduce((acc, s) => acc + s.reps * s.weight, 0),
        0
    );

    const toggleSet = (exIndex: number, setIndex: number) => {
        const newEx = [...currentExercises];
        newEx[exIndex].sets[setIndex].done = !newEx[exIndex].sets[setIndex].done;
        setExState(newEx);
    };

    const updateSet = (exIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
        const newEx = [...currentExercises];
        newEx[exIndex].sets[setIndex][field] = value;
        setExState(newEx);
    };

    const addSet = (exIndex: number) => {
        const newEx = [...currentExercises];
        newEx[exIndex].sets.push({ weight: 0, reps: 10, done: false });
        setExState(newEx);
    };

    const removeSet = (exIndex: number, setIndex: number) => {
        const newEx = [...currentExercises];
        if (newEx[exIndex].sets.length <= 1) return;
        newEx[exIndex].sets = newEx[exIndex].sets.filter((_, i) => i !== setIndex);
        setExState(newEx);
    };

    const handleFinishSession = async () => {
        const allSets = currentExercises.flatMap((ex) =>
            ex.sets.filter((s) => s.done).map((s) => ({
                name: ex.name,
                reps: s.reps,
                weight: s.weight,
            }))
        );
        if (allSets.length === 0) {
            alert('Completa al menos una serie antes de finalizar.');
            return;
        }

        try {
            await api('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    routine_name: todayDay?.day_label ?? plan?.name ?? 'RUTINA',
                    date: new Date().toISOString().split('T')[0],
                    exercises: allSets,
                    total_volume: totalVolume,
                }),
            });

            setAlreadyTrained(true);
            navigate('/progress');
        } catch (err: any) {
            alert('Error al guardar la sesión');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('charly_token');
        localStorage.removeItem('charly_user');
        navigate('/login');
    };

    const TODAY = {
        day: new Date().toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase(),
        num: new Date().getDate(),
        month: new Date().toLocaleDateString('es-MX', { month: 'long' }).toUpperCase(),
    };

    const WEEK_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    const [alreadyTrained, setAlreadyTrained] = useState(false);
    const [sessionCheckLoading, setSessionCheckLoading] = useState(true);
    const [weekSessions, setWeekSessions] = useState<any[]>([]);

    useEffect(() => {
        if (!user?.id) return;
        api('/api/sessions')
            .then((data: any[]) => {
                const today = new Date().toISOString().split('T')[0];
                const todaySessions = data.filter((s: any) => s.date?.startsWith?.(today));
                if (todaySessions.length > 0) setAlreadyTrained(true);
                setWeekSessions(data);
            })
            .catch(() => { })
            .finally(() => setSessionCheckLoading(false));
    }, [user?.id]);

    const WEEK_DATA = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        return WEEK_LABELS.map((_, i) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dayStr = dayDate.toISOString().split('T')[0];
            const daySessions = weekSessions.filter((s: any) => s.date === dayStr);
            return daySessions.length === 0 ? 0 : 100;
        });
    }, [weekSessions]);

    return (
        <div className={styles.container}>
            <div className={styles.mobileTopBar}>
                <button className={styles.hamburger} onClick={() => setMenuOpen(true)}>
                    <Menu size={24} />
                </button>
                <span className={styles.mobileLogo}>
                    CHARLY <span className={styles.silverHero}>COACH</span>
                </span>
            </div>

            {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <Dumbbell size={20} />
                        <span>CHARLY <span className={styles.silverHero}>COACH</span></span>
                    </div>
                    <button className={styles.closeMenu} onClick={() => setMenuOpen(false)}>
                        <X size={20} />
                    </button>
                </div>
                <nav className={styles.menu}>
                    <Link to="/dashboard" className={location.pathname === '/dashboard' ? styles.menuItemActive : styles.menuItem} onClick={() => setMenuOpen(false)}>
                        <Dumbbell size={20} /> MI PLAN
                    </Link>
                    <Link to="/exercises" className={location.pathname === '/exercises' ? styles.menuItemActive : styles.menuItem} onClick={() => setMenuOpen(false)}>
                        <Dumbbell size={20} /> EJERCICIOS
                    </Link>
                    <Link to="/progress" className={location.pathname === '/progress' ? styles.menuItemActive : styles.menuItem} onClick={() => setMenuOpen(false)}>
                        <TrendingUp size={20} /> PROGRESO
                    </Link>
                    <Link to="/profile" className={location.pathname === '/profile' ? styles.menuItemActive : styles.menuItem} onClick={() => setMenuOpen(false)}>
                        <User size={20} /> PERFIL
                    </Link>
                </nav>
                <button className={styles.logout} onClick={handleLogout}>
                    <LogOut size={20} /> SALIR
                </button>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>{TODAY.day} <span className={styles.silverHero}>{TODAY.num}</span></h1>
                    <p>{TODAY.month} · Hoy toca: <strong>{todayDay ? TODAY.day : 'DESCANSO'}</strong></p>
                </header>

                <div className={styles.contentGrid}>
                    <section className={styles.workoutBox}>
                        <h2 className={styles.sectionTitle}>RUTINA OPERATIVA</h2>

                        {sessionCheckLoading || loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                                <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>CARGANDO RUTINA...</p>
                            </div>
                        ) : alreadyTrained ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#BCC6CC' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏆</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>¡OBJETIVO CUMPLIDO!</h3>
                                <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
                                    Cumpliste con los objetivos de hoy. Mañana te esperan nuevos logros.
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                                    <button onClick={() => navigate('/progress')} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(188,198,204,0.15)', background: 'rgba(188,198,204,0.04)', color: '#BCC6CC', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>VER PROGRESO</button>
                                </div>
                            </div>
                        ) : error ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>Error: {error}</div>
                        ) : !todayDay ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                <p>DÍA DE DESCANSO</p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.exerciseList}>
                                    {currentExercises.map((ex, i) => (
                                        <div key={i} className={styles.exerciseCard}>
                                            <div className={styles.exerciseInfo} style={{ width: '100%' }}>
                                                <span
                                                    className={styles.exName}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const fullExercise = todayDay?.exercises?.find((fe: any) => fe.exercise?.name === ex.name);
                                                        setSelectedExerciseDetail({
                                                            name: ex.name,
                                                            description: fullExercise?.exercise?.description || '',
                                                            video_url: fullExercise?.exercise?.video_url || '',
                                                            focus_name: fullExercise?.exercise?.focus_name || '',
                                                        });
                                                    }}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                                                >
                                                    {ex.name}
                                                </span>
                                                {ex.sets.map((set, j) => (
                                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: set.done ? '2px solid #4ade80' : '2px solid rgba(188,198,204,0.15)' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#666', width: '40px' }}>Serie {j + 1}</span>
                                                        <input type="number" className={styles.weightInput} value={set.weight || ''} placeholder="0" onClick={(e) => e.stopPropagation()} onChange={(e) => updateSet(i, j, 'weight', +e.target.value)} style={{ width: '60px' }} />
                                                        <span className={styles.weightUnit}>{unit}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>×</span>
                                                        <input type="number" className={styles.weightInput} value={set.reps || ''} placeholder="0" onClick={(e) => e.stopPropagation()} onChange={(e) => updateSet(i, j, 'reps', +e.target.value)} style={{ width: '50px' }} />
                                                        <span style={{ fontSize: '0.65rem', color: '#666' }}>reps</span>
                                                        <button onClick={(e) => { e.stopPropagation(); toggleSet(i, j); }} style={{ marginLeft: 'auto', width: '28px', height: '28px', borderRadius: '50%', border: set.done ? '2px solid #4ade80' : '2px solid rgba(188,198,204,0.2)', background: set.done ? 'rgba(74,222,128,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                            {set.done && <Check size={14} color="#4ade80" />}
                                                        </button>
                                                        {ex.sets.length > 1 && (
                                                            <button onClick={(e) => { e.stopPropagation(); removeSet(i, j); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px' }}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={(e) => { e.stopPropagation(); addSet(i); }} style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px dashed rgba(188,198,204,0.15)', background: 'transparent', color: '#666', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Plus size={12} /> Agregar serie
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className={styles.finishBtn} onClick={handleFinishSession}>
                                    <Flag size={18} /> FINALIZAR SESIÓN
                                </button>
                            </>
                        )}
                    </section>

                    <aside className={styles.summaryBox}>
                        <div className={styles.statCard}>
                            <h3 className={styles.statCardTitle}>PROGRESO DE HOY</h3>
                            <div className={styles.progressLarge}>
                                <div className={styles.progressCircle}>
                                    <span className={styles.progressCircleValue}>{progressPct}%</span>
                                </div>
                                <span className={styles.progressLabel}>{completed} de {totalSets} series</span>
                                {totalVolume > 0 && <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#888' }}>VOLUMEN: {totalVolume.toLocaleString()} {unit}</p>}
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3 className={styles.statCardTitle}>CONSISTENCIA SEMANAL</h3>
                            <div className={styles.chartBars}>
                                {WEEK_DATA.map((val: number, i: number) => (<div key={i} className={styles.bar} style={{ height: `${val}%` }} />))}
                            </div>
                            <div className={styles.barLabels}>
                                {WEEK_LABELS.map((l) => (<span key={l} className={styles.barLabel}>{l}</span>))}
                            </div>
                        </div>
                        <div className={styles.actionCard}>
                            <p>¿Alguna duda con la técnica?</p>
                            <button className={styles.whatsappBtn}>
                                <MessageCircle size={14} /> CONTACTAR A CHARLY
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            {selectedExerciseDetail && (
                <ExerciseDetailModal
                    exercise={selectedExerciseDetail}
                    onClose={() => setSelectedExerciseDetail(null)}
                />
            )}
        </div>
    );
}