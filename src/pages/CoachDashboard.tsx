import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Users, Calendar, TrendingUp, LogOut, Loader, UserPlus, Play } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import RoutineModal from '../components/RoutineModal';
import AddAthleteModal from '../components/AddAthleteModal';
import SubscriptionModal from '../components/SubscriptionModal';
import ExerciseModal from '../components/ExerciseModal';
import styles from '../styles/CoachDashboard.module.css';

interface Athlete {
    id: string;
    name: string;
    email: string;
    age: number;
    weight_kg: number;
    goal: string;
    subscription_end: string | null;
    subscription_active: boolean;
    current_plan: string | null;
    plan_id: number | null;
    sessions_this_week: number;
}

type Tab = 'athletes' | 'routines' | 'exercises';

export default function CoachDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('athletes');
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAthlete, setSelectedAthlete] = useState<{ id: string; name: string } | null>(null);
    const [showAddAthlete, setShowAddAthlete] = useState(false);
    const [selectedAthleteForSub, setSelectedAthleteForSub] = useState<{ id: string; name: string } | null>(null);
    const [exercises, setExercises] = useState<any[]>([]);
    const [focuses, setFocuses] = useState<any[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exerciseFilter, setExerciseFilter] = useState<number | 'all'>('all');
    const [exerciseSort, setExerciseSort] = useState<'name' | 'focus'>('name');

    const loadExercises = async () => {
        const { data: exData } = await supabase.from('exercises').select('*').order('name');
        const { data: focusData } = await supabase.from('exercise_focus').select('*').order('name');
        if (exData) setExercises(exData);
        if (focusData) setFocuses(focusData);
    };

    useEffect(() => { if (activeTab === 'exercises') { loadExercises(); } }, [activeTab]);

    const fetchAthletes = async () => {
        if (!user) return;
        setLoading(true);
        const { data: athletesData, error: athletesError } = await supabase.from('users').select('id, name, email, age, weight_kg, goal, created_at').eq('role', 'athlete').order('name');
        if (athletesError) { setError(athletesError.message); setLoading(false); return; }

        const formatted: Athlete[] = await Promise.all((athletesData || []).map(async (a) => {
            const { data: sub } = await supabase.from('subscriptions').select('end_date, is_active').eq('user_id', a.id).eq('is_active', true).limit(1).maybeSingle();
            const { data: wp } = await supabase.from('workout_plans').select('id, name').eq('user_id', a.id).eq('is_active', true).limit(1).maybeSingle();
            const today = new Date();
            const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay() + 1); startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
            const { count: sessionCount } = await supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', a.id).gte('date', startOfWeek.toISOString().split('T')[0]).lte('date', endOfWeek.toISOString().split('T')[0]);
            return { id: a.id, name: a.name, email: a.email, age: a.age, weight_kg: a.weight_kg, goal: a.goal, subscription_end: sub?.end_date ?? null, subscription_active: sub?.is_active ?? false, current_plan: wp?.name ?? null, plan_id: wp?.id ?? null, sessions_this_week: sessionCount || 0 };
        }));
        setAthletes(formatted); setLoading(false);
    };

    useEffect(() => { fetchAthletes(); }, [user]);

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

    const tabs = [
        { id: 'athletes' as Tab, label: 'ATLETAS', icon: <Users size={18} /> },
        { id: 'routines' as Tab, label: 'RUTINAS', icon: <Dumbbell size={18} /> },
        { id: 'exercises' as Tab, label: 'EJERCICIOS', icon: <TrendingUp size={18} /> },
    ];

    const getGoalLabel = (goal: string) => { const goals: any = { muscle_gain: 'Ganar Músculo', fat_loss: 'Perder Grasa', maintenance: 'Mantener' }; return goals[goal] ?? goal; };

    const getSubscriptionStatus = (athlete: Athlete) => {
        if (!athlete.subscription_end) return { label: 'SIN PLAN', color: '#666' };
        const endDate = new Date(athlete.subscription_end); const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { label: 'VENCIDO', color: '#f87171' };
        if (daysLeft <= 7) return { label: `${daysLeft} DÍAS`, color: '#fbbf24' };
        return { label: 'ACTIVO', color: '#4ade80' };
    };

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    CHARLY <span className={styles.silverText}>COACH</span>
                </div>
                <nav className={styles.nav}>
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}>{tab.icon} {tab.label}</button>
                    ))}
                </nav>
                <button onClick={handleLogout} className={styles.logoutBtn}><LogOut size={20} /> SALIR</button>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>PANEL DE <span className={styles.silverText}>CONTROL</span></h1>
                    <p className={styles.pageSubtitle}>{activeTab === 'athletes' ? 'Gestión de atletas' : activeTab === 'routines' ? 'Gestión de rutinas' : 'Biblioteca de ejercicios'}</p>
                    {activeTab === 'athletes' && (
                        <button onClick={() => setShowAddAthlete(true)} className={styles.addBtn}><UserPlus size={16} /> AÑADIR ATLETA</button>
                    )}
                </header>

                {activeTab === 'athletes' && (
                    <div>
                        {loading ? <div className={styles.loadingContainer}><Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} /><p>CARGANDO ATLETAS...</p></div>
                            : error ? <div className={styles.errorContainer}>{error}</div>
                                : athletes.length === 0 ? <div className={styles.emptyContainer}><p style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>NO HAY ATLETAS REGISTRADOS</p></div>
                                    : <div className={styles.athletesGrid}>
                                        {athletes.map((athlete) => {
                                            const subStatus = getSubscriptionStatus(athlete);
                                            return (
                                                <div key={athlete.id} className={styles.athleteCard}>
                                                    <div className={styles.athleteHeader}>
                                                        <div className={styles.athleteInfo}>
                                                            <div className={styles.avatar}>{athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                            <div><h3 className={styles.athleteName}>{athlete.name}</h3><p className={styles.athleteEmail}>{athlete.email}</p></div>
                                                        </div>
                                                        <span className={styles.badge} style={{ background: `${subStatus.color}15`, color: subStatus.color, border: `1px solid ${subStatus.color}30` }}>{subStatus.label}</span>
                                                    </div>
                                                    <div className={styles.statsGrid}>
                                                        <div className={styles.statItem}><span className={styles.statLabel}>META</span>{getGoalLabel(athlete.goal)}</div>
                                                        <div className={styles.statItem}><span className={styles.statLabel}>PESO</span>{athlete.weight_kg ?? '-'} kg</div>
                                                        <div className={styles.statItem}><span className={styles.statLabel}>PLAN ACTUAL</span>{athlete.current_plan ?? 'Sin plan'}</div>
                                                        <div className={styles.statItem}><span className={styles.statLabel}>SESIONES (7 DÍAS)</span>{athlete.sessions_this_week}</div>
                                                    </div>
                                                    <div className={styles.actionButtons}>
                                                        <button onClick={() => setSelectedAthlete({ id: athlete.id, name: athlete.name })} className={styles.actionBtnPrimary}><Dumbbell size={14} /> ASIGNAR RUTINA</button>
                                                        <button onClick={() => setSelectedAthleteForSub({ id: athlete.id, name: athlete.name })} className={styles.actionBtnSecondary}><Calendar size={14} /> SUSCRIPCIÓN</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>}
                    </div>
                )}

                {activeTab === 'routines' && (
                    <div className={styles.loadingContainer}>
                        <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>GESTOR DE RUTINAS</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#555' }}>Selecciona la pestaña ATLETAS y haz clic en "ASIGNAR RUTINA"</p>
                    </div>
                )}

                {activeTab === 'exercises' && (
                    <div>
                        <div className={styles.exerciseControls}>
                            <input type="text" placeholder="Buscar ejercicio..." value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} className={styles.searchInput} />
                            <select value={exerciseFilter} onChange={(e) => setExerciseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className={styles.filterSelect}>
                                <option value="all">Todos los grupos</option>
                                {focuses.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                            </select>
                            <select value={exerciseSort} onChange={(e) => setExerciseSort(e.target.value as 'name' | 'focus')} className={styles.filterSelect}>
                                <option value="name">Orden A-Z</option>
                                <option value="focus">Orden Z-A</option>
                            </select>
                            <button onClick={() => { setSelectedExercise(null); setShowExerciseModal(true); }} className={styles.addBtn}><Dumbbell size={16} /> NUEVO</button>
                        </div>
                        {(() => {
                            let filtered = exercises;
                            if (exerciseSearch) { filtered = filtered.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())); }
                            if (exerciseFilter !== 'all') { filtered = filtered.filter(ex => ex.focus_id === exerciseFilter); }
                            filtered = [...filtered].sort((a, b) => exerciseSort === 'name' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
                            return (
                                <>
                                    <p className={styles.exerciseCount}>{filtered.length} de {exercises.length} ejercicios</p>
                                    {filtered.length === 0 ? <div className={styles.emptyContainer}><p style={{ fontSize: '0.8rem' }}>Sin resultados</p></div>
                                        : <div className={styles.exercisesGrid}>
                                            {filtered.map((ex) => {
                                                const focus = focuses.find(f => f.id === ex.focus_id);
                                                return (
                                <div key={ex.id} onClick={() => { setSelectedExercise(ex); setShowExerciseModal(true); }} className={styles.exerciseCard}>
                                    <h4 className={styles.exerciseTitle}>{ex.name}</h4>
                                    {ex.description && <p className={styles.exerciseDesc}>{ex.description.length > 80 ? ex.description.slice(0, 80) + '...' : ex.description}</p>}
                                    <div className={styles.exerciseFooter}>
                                        <span className={styles.exerciseFocus}>{focus?.name || 'Sin grupo'}</span>
                                        {ex.video_url && <span title="Tiene video"><Play size={14} color="#4ade80" /></span>}
                                    </div>
                                </div>
                                                );
                                            })}
                                        </div>}
                                </>
                            );
                        })()}
                    </div>
                )}
            </main>

            {selectedAthlete && <RoutineModal athleteId={selectedAthlete.id} athleteName={selectedAthlete.name} onClose={() => setSelectedAthlete(null)} onSaved={() => { setSelectedAthlete(null); fetchAthletes(); }} />}
            {showAddAthlete && <AddAthleteModal onClose={() => setShowAddAthlete(false)} onCreated={() => { setShowAddAthlete(false); fetchAthletes(); }} />}
            {selectedAthleteForSub && <SubscriptionModal athleteId={selectedAthleteForSub.id} athleteName={selectedAthleteForSub.name} onClose={() => setSelectedAthleteForSub(null)} onSaved={() => { setSelectedAthleteForSub(null); fetchAthletes(); }} />}
            {showExerciseModal && <ExerciseModal exercise={selectedExercise} onClose={() => { setShowExerciseModal(false); setSelectedExercise(null); }} onSaved={() => { setShowExerciseModal(false); setSelectedExercise(null); loadExercises(); }} />}
        </div>
    );
}