import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Dumbbell, Check, User, LogOut, TrendingUp, Calendar, Menu, X, Flag, MessageCircle, Loader } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';
import { api } from '../lib/api';
import { useWorkout } from '../hooks/useWorkout';
import { useAuth } from '../hooks/useAuth';
import { useState, useMemo, useEffect } from 'react';

interface ExerciseState {
    id: number;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    done: boolean;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [unit] = useState('Lbs');

    const { user } = useAuth();
    const { plan, loading, error } = useWorkout(user?.id);

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

    const exercises: ExerciseState[] = useMemo(() => {
        if (!todayDay) return [];
        return todayDay.exercises.map((ex: any) => ({
            id: ex.id,
            name: ex.exercise?.name ?? 'Ejercicio sin nombre',
            sets: ex.sets,
            reps: ex.reps,
            weight: 0,
            done: false,
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

    const completed = currentExercises.filter((e) => e.done).length;
    const progressPct = currentExercises.length > 0 ? Math.round((completed / currentExercises.length) * 100) : 0;
    const totalVolume = currentExercises.filter((e) => e.done).reduce((sum, ex) => sum + ex.sets * ex.reps * ex.weight, 0);

    const toggleExercise = (index: number) => {
        const newEx = [...currentExercises];
        newEx[index].done = !newEx[index].done;
        setExState(newEx);
    };

    const updateWeight = (index: number, weight: number) => {
        const newEx = [...currentExercises];
        newEx[index].weight = weight;
        setExState(newEx);
    };

    const handleFinishSession = async () => {
        const completedEx = currentExercises.filter((e) => e.done);
        if (completedEx.length === 0) {
            alert('Completa al menos un ejercicio antes de finalizar.');
            return;
        }

        try {
            await api('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    routine_name: todayDay?.day_label ?? plan?.name ?? 'RUTINA',
                    date: new Date().toISOString().split('T')[0],
                    exercises: completedEx.map((ex) => ({
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight: ex.weight,
                    })),
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
        api('/api/sessions').then((data: any[]) => {
            const today = new Date().toISOString().split('T')[0];
            const todaySessions = data.filter((s: any) => s.date?.startsWith?.(today));
            if (todaySessions.length > 0) setAlreadyTrained(true);
            setWeekSessions(data);
        }).catch(() => { }).finally(() => setSessionCheckLoading(false));
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
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(188,198,204,0.3))' }}>🏆</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.75rem', background: 'linear-gradient(110deg, #808080 0%, #BCC6CC 45%, #FFFFFF 50%, #BCC6CC 55%, #808080 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>¡OBJETIVO CUMPLIDO!</h3>
                                <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto 1.5rem' }}>Cumpliste con los objetivos de hoy. Mañana te esperan nuevos logros por alcanzar.</p>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={() => navigate('/progress')} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(188,198,204,0.15)', background: 'rgba(188,198,204,0.04)', color: '#BCC6CC', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}>VER MI PROGRESO</button>
                                    <button onClick={() => navigate('/profile')} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(188,198,204,0.08)', background: 'transparent', color: '#666', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}>ACTUALIZAR PERFIL</button>
                                </div>
                            </div>
                        ) : error ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
                                <p>Error al cargar la rutina</p>
                                <p style={{ fontSize: '0.65rem', marginTop: '0.5rem', color: '#888' }}>{error}</p>
                            </div>
                        ) : !todayDay ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                <p style={{ fontSize: '0.85rem', letterSpacing: '0.08em' }}>DÍA DE DESCANSO</p>
                                <p style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: '#555' }}>
                                    {plan ? 'Vuelve mañana para tu próxima sesión.' : 'No tienes una rutina activa. Contacta a tu coach.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.exerciseList}>
                                    {currentExercises.map((ex, i) => (
                                        <div key={i} className={ex.done ? styles.exerciseDone : styles.exerciseCard} onClick={() => toggleExercise(i)}>
                                            <div className={styles.exerciseInfo}>
                                                <span className={styles.exName}>{ex.name}</span>
                                                <span className={styles.exMeta}>{ex.sets} series · {ex.reps} reps</span>
                                                <div className={styles.weightRow}>
                                                    <input type="number" className={styles.weightInput} value={ex.weight || ''} placeholder="0" onChange={(e) => updateWeight(i, +e.target.value)} onClick={(e) => e.stopPropagation()} />
                                                    <span className={styles.weightUnit}>{unit}</span>
                                                </div>
                                            </div>
                                            <div className={styles.checkCircle}>
                                                {ex.done && <Check size={20} color="#4ade80" />}
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
                                <span className={styles.progressLabel}>{completed} de {currentExercises.length} completados</span>
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
        </div>
    );
}