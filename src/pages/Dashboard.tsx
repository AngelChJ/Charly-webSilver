import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Dumbbell, Check, User, LogOut, TrendingUp, Calendar, Menu, X, Flag, MessageCircle } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';

// ─── Mocks para la "Fortaleza" ──────────────────────────────────
const TODAY = {
    day: new Date().toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase(),
    num: new Date().getDate(),
    month: new Date().toLocaleDateString('es-MX', { month: 'long' }).toUpperCase(),
    focus: 'PECHO Y BICEPS'
};

const INITIAL_EXERCISES = [
    { name: 'Press de Banca', sets: '4 series', reps: '10 reps', weight: 80, done: false },
    { name: 'Press Inclinado', sets: '3 series', reps: '12 reps', weight: 60, done: false },
    { name: 'Curl con Barra', sets: '4 series', reps: '10 reps', weight: 35, done: false },
    { name: 'Martillos', sets: '3 series', reps: '12 reps', weight: 15, done: false },
];

const WEEK_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const WEEK_DATA = [80, 65, 90, 45, 100, 0, 0]; // Simulación de esfuerzo

export default function DashboardLocal() {
    const navigate = useNavigate();
    const location = useLocation();
    const [exercises, setExercises] = useState(INITIAL_EXERCISES);
    const [menuOpen, setMenuOpen] = useState(false);
    const [unit, setUnit] = useState('Lbs'); // Opción para kg/lbs, por ahora fija en lbs

    // Lógica de progreso
    const completed = exercises.filter(e => e.done).length;
    const progressPct = Math.round((completed / exercises.length) * 100);

    const toggleExercise = (index: number) => {
        const newEx = [...exercises];
        newEx[index].done = !newEx[index].done;
        setExercises(newEx);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            {/* ─── Mobile Header ─── */}
            <div className={styles.mobileTopBar}>
                <button className={styles.hamburger} onClick={() => setMenuOpen(true)}>
                    <Menu size={24} />
                </button>
                <span className={styles.mobileLogo}>
                    CHARLY <span className={styles.silverHero}>COACH</span>
                </span>
            </div>

            {/* ─── Sidebar (Navegación) ─── */}
            {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <Dumbbell size={20} />
                        <span>CHARLY <span className={styles.silverHero}>COACH</span></span>
                    </div>
                    <button className={styles.closeMenu} onClick={() => setMenuOpen(false)}><X size={20}/></button>
                </div>

                <nav className={styles.menu}>
                    <Link 
                        to="/dashboard" 
                        className={location.pathname === '/dashboard' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setMenuOpen(false)}
                    >
                        <Dumbbell size={20}/> MI PLAN
                    </Link>
                    <Link 
                        to="/progress" 
                        className={location.pathname === '/progress' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setMenuOpen(false)}
                    >
                        <TrendingUp size={20}/> PROGRESO
                    </Link>
                    <Link 
                        to="/dashboard" 
                        className={location.pathname === '/historial' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setMenuOpen(false)}
                    >
                        <Calendar size={20}/> HISTORIAL
                    </Link>
                    <Link 
                        to="/profile" 
                        className={location.pathname === '/profile' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => setMenuOpen(false)}
                    >
                        <User size={20}/> PERFIL
                    </Link>
                </nav>

                <button className={styles.logout} onClick={handleLogout}>
                    <LogOut size={20}/> SALIR
                </button>
            </aside>

            {/* ─── Contenido Principal ─── */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>{TODAY.day} <span className={styles.silverHero}>{TODAY.num}</span></h1>
                    <p>{TODAY.month} · Hoy toca: <strong>{TODAY.focus}</strong></p>
                </header>

                <div className={styles.contentGrid}>
                    {/* Columna de Entrenamiento */}
                    <section className={styles.workoutBox}>
                        <h2 className={styles.sectionTitle}>RUTINA OPERATIVA</h2>
                        <div className={styles.exerciseList}>
                            {exercises.map((ex, i) => (
                                <div key={i} 
                                     className={ex.done ? styles.exerciseDone : styles.exerciseCard}
                                     onClick={() => toggleExercise(i)}>
                                    <div className={styles.exerciseInfo}>
                                        <span className={styles.exName}>{ex.name}</span>
                                        <span className={styles.exMeta}>{ex.sets} · {ex.reps}</span>
                                        <div className={styles.weightRow}>
                                            <span className={styles.weightUnit}>{ex.weight} {unit}</span>
                                        </div>
                                    </div>
                                    <div className={styles.checkCircle}>
                                        {ex.done && <Check size={20} color="#4ade80" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className={styles.finishBtn}>
                            <Flag size={18} /> FINALIZAR SESIÓN
                        </button>
                    </section>

                    {/* Columna de Stats */}
                    <aside className={styles.summaryBox}>
                        <div className={styles.statCard}>
                            <h3 className={styles.statCardTitle}>PROGRESO DE HOY</h3>
                            <div className={styles.progressLarge}>
                                <div className={styles.progressCircle}>
                                    <span className={styles.progressCircleValue}>{progressPct}%</span>
                                </div>
                                <span className={styles.progressLabel}>{completed} de {exercises.length} completados</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <h3 className={styles.statCardTitle}>CONSISTENCIA SEMANAL</h3>
                            <div className={styles.chartBars}>
                                {WEEK_DATA.map((val, i) => (
                                    <div key={i} className={styles.bar} style={{ height: `${val}%` }} />
                                ))}
                            </div>
                            <div className={styles.barLabels}>
                                {WEEK_LABELS.map(l => <span key={l} className={styles.barLabel}>{l}</span>)}
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