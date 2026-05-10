import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Users, Calendar, TrendingUp, LogOut, Loader, UserPlus, Play, Menu, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import RoutineModal from '../components/RoutineModal';
import AddAthleteModal from '../components/AddAthleteModal';
import SubscriptionModal from '../components/SubscriptionModal';
import ExerciseModal from '../components/ExerciseModal';
import styles from '../styles/CoachDashboard.module.css';

interface Athlete {
    id: number;
    name: string;
    email: string;
    age: number;
    weight_kg: number;
    goal: string;
    sub_end: string | null;
    sub_active: boolean;
    plan_type: string;
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
    const [selectedAthlete, setSelectedAthlete] = useState<{ id: number; name: string } | null>(null);
    const [showAddAthlete, setShowAddAthlete] = useState(false);
    const [selectedAthleteForSub, setSelectedAthleteForSub] = useState<{ id: number; name: string } | null>(null);
    const [exercises, setExercises] = useState<any[]>([]);
    const [focuses, setFocuses] = useState<any[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exerciseFilter, setExerciseFilter] = useState<number | 'all'>('all');
    const [exerciseSort, setExerciseSort] = useState<'name' | 'focus'>('name');
    const [menuOpen, setMenuOpen] = useState(false);

    const loadExercises = async () => {
        try {
            const data = await api('/api/exercises');
            setExercises(data);
            const focusList = [...new Map(data.map((ex: any) => [ex.focus_id, { id: ex.focus_id, name: ex.focus_name }])).values()] as any[];
            setFocuses(focusList);
        } catch { }
    };

    useEffect(() => { if (activeTab === 'exercises') loadExercises(); }, [activeTab]);

    const fetchAthletes = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await api('/api/athletes');
            setAthletes(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAthletes(); }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('charly_token');
        localStorage.removeItem('charly_user');
        navigate('/login');
    };

    const tabs = [
        { id: 'athletes' as Tab, label: 'ATLETAS', icon: <Users size={18} /> },
        { id: 'routines' as Tab, label: 'RUTINAS', icon: <Dumbbell size={18} /> },
        { id: 'exercises' as Tab, label: 'EJERCICIOS', icon: <TrendingUp size={18} /> },
    ];

    const getGoalLabel = (goal: string) => {
        const goals: any = { muscle_gain: 'Ganar Músculo', fat_loss: 'Perder Grasa', maintenance: 'Mantener' };
        return goals[goal] ?? goal;
    };

    const getSubscriptionStatus = (athlete: Athlete) => {
        if (!athlete.sub_end) return { label: 'SIN PLAN', color: '#666' };
        const endDate = new Date(athlete.sub_end);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { label: 'VENCIDO', color: '#f87171' };
        if (daysLeft <= 7) return { label: `${daysLeft} DÍAS`, color: '#fbbf24' };
        return { label: 'ACTIVO', color: '#4ade80' };
    };

    return (
        <div className={styles.container}>
            <div className={styles.mobileTopBar}>
                <button className={styles.hamburger} onClick={() => setMenuOpen(true)}><Menu size={24} /></button>
                <span className={styles.mobileLogo}>CHARLY <span className={styles.silverText}>COACH</span></span>
            </div>
            {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>CHARLY <span className={styles.silverText}>COACH</span></div>
                    <button className={styles.closeMenu} onClick={() => setMenuOpen(false)}><X size={20} /></button>
                </div>
                <nav className={styles.nav}>
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }} className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}>{tab.icon} {tab.label}</button>
                    ))}
                </nav>
                <button onClick={handleLogout} className={styles.logoutBtn}><LogOut size={20} /> SALIR</button>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>PANEL DE <span className={styles.silverText}>CONTROL</span></h1>
                    <p className={styles.pageSubtitle}>{activeTab === 'athletes' ? 'Gestión de atletas' : activeTab === 'routines' ? 'Gestión de rutinas' : 'Biblioteca de ejercicios'}</p>
                    {activeTab === 'athletes' && <button onClick={() => setShowAddAthlete(true)} className={styles.addBtn}><UserPlus size={16} /> AÑADIR ATLETA</button>}
                </header>

                {/* El resto del JSX es igual que antes, solo cambia athlete.id por Number y los datos vienen de la API */}
                {activeTab === 'athletes' && (
                    <div>
                        {loading ? <div className={styles.loadingContainer}><Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} /><p>CARGANDO ATLETAS...</p></div>
                            : error ? <div className={styles.errorContainer}>{error}</div>
                                : athletes.length === 0 ? <div className={styles.emptyContainer}><p>NO HAY ATLETAS REGISTRADOS</p></div>
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
                                                        <div className={styles.statItem}><span className={styles.statLabel}>PLAN ACTUAL</span>{athlete.plan_type ?? 'Sin plan'}</div>
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

                {/* Pestañas routines y exercises mantienen la misma estructura */}
                {activeTab === 'routines' && (
                    <div>
                        {loading ? (
                            <div className={styles.loadingContainer}><Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} /><p>CARGANDO RUTINAS...</p></div>
                        ) : athletes.length === 0 ? (
                            <div className={styles.emptyContainer}><p>NO HAY ATLETAS REGISTRADOS</p></div>
                        ) : (
                            <div className={styles.athletesGrid}>
                                {athletes.map((athlete) => (
                                    <div key={athlete.id} className={styles.athleteCard}>
                                        <div className={styles.athleteHeader}>
                                            <div className={styles.athleteInfo}>
                                                <div className={styles.avatar}>{athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                <div>
                                                    <h3 className={styles.athleteName}>{athlete.name}</h3>
                                                    <p className={styles.athleteEmail}>{athlete.plan_type ?? 'Sin plan'} · {athlete.sub_end ? new Date(athlete.sub_end).toLocaleDateString('es-MX') : 'Sin suscripción'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.actionButtons}>
                                            <button onClick={() => setSelectedAthlete({ id: athlete.id, name: athlete.name })} className={styles.actionBtnPrimary} style={{ flex: 1 }}>
                                                <Dumbbell size={14} /> ASIGNAR / VER RUTINA
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'exercises' && (
                    <div>
                        <div className={styles.exerciseControls}>
                            <input type="text" placeholder="Buscar ejercicio..." value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} className={styles.searchInput} />
                            <select value={exerciseFilter} onChange={(e) => setExerciseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className={styles.filterSelect}>
                                <option value="all">Todos los grupos</option>
                                {focuses.map((f: any) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                            </select>
                            <select value={exerciseSort} onChange={(e) => setExerciseSort(e.target.value as 'name' | 'focus')} className={styles.filterSelect}>
                                <option value="name">Orden A-Z</option>
                                <option value="focus">Orden Z-A</option>
                            </select>
                            <button onClick={() => { setSelectedExercise(null); setShowExerciseModal(true); }} className={styles.addBtn}><Dumbbell size={16} /> NUEVO</button>
                        </div>
                        {exercises.length === 0 ? <div className={styles.emptyContainer}><p>No hay ejercicios</p></div>
                            : <div className={styles.exercisesGrid}>
                                {exercises.filter((ex: any) => exerciseSearch ? ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) : true).map((ex: any) => (
                                    <div key={ex.id} onClick={() => { setSelectedExercise(ex); setShowExerciseModal(true); }} className={styles.exerciseCard}>
                                        <h4 className={styles.exerciseTitle}>{ex.name}</h4>
                                        {ex.description && <p className={styles.exerciseDesc}>{ex.description.slice(0, 80)}</p>}
                                        <div className={styles.exerciseFooter}>
                                            <span className={styles.exerciseFocus}>{ex.focus_name || 'Sin grupo'}</span>
                                            {ex.video_url && <Play size={14} color="#4ade80" />}
                                        </div>
                                    </div>
                                ))}
                            </div>}
                    </div>
                )}
            </main>

            {selectedAthlete && (
                <RoutineModal
                    athleteId={String(selectedAthlete.id)}
                    athleteName={selectedAthlete.name}
                    onClose={() => setSelectedAthlete(null)}
                    onSaved={() => { setSelectedAthlete(null); fetchAthletes(); }}
                />
            )}
            {showAddAthlete && <AddAthleteModal onClose={() => setShowAddAthlete(false)} onCreated={() => { setShowAddAthlete(false); fetchAthletes(); }} />}
            {selectedAthleteForSub && <SubscriptionModal athleteId={String(selectedAthleteForSub.id)} athleteName={selectedAthleteForSub.name} onClose={() => setSelectedAthleteForSub(null)} onSaved={() => { setSelectedAthleteForSub(null); fetchAthletes(); }} />}
            {showExerciseModal && <ExerciseModal exercise={selectedExercise} onClose={() => { setShowExerciseModal(false); setSelectedExercise(null); }} onSaved={() => { setShowExerciseModal(false); setSelectedExercise(null); loadExercises(); }} />}
        </div>
    );
}