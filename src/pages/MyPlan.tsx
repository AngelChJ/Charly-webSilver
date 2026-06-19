import { useState, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Dumbbell, BookOpen, ChevronDown, Play, LogOut, Menu, X, User, TrendingUp, Loader } from 'lucide-react';
import styles from '../styles/MyPlan.module.css';
import { useWorkout } from '../hooks/useWorkout';
import { useAuth } from '../hooks/useAuth';
import ExerciseDetailModal from '../components/ExerciseDetailModal';

export default function MyPlan() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { user } = useAuth();
    const { plan, loading, error } = useWorkout(user?.id);

    // Estado del acordeón: guarda el ID de los días expandidos. Por defecto, expandimos el primer día.
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });

    // Estado de descripciones expandidas inline (por id único de ejercicio en la rutina)
    const [expandedDesc, setExpandedDesc] = useState<Record<number, boolean>>({});

    // Estado para el modal de detalle del ejercicio
    const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<any>(null);

    const handleLogout = () => {
        localStorage.removeItem('charly_token');
        localStorage.removeItem('charly_user');
        navigate('/login');
    };

    const toggleDay = (index: number) => {
        setExpandedDays((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const toggleDescription = (exerciseId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedDesc((prev) => ({
            ...prev,
            [exerciseId]: !prev[exerciseId],
        }));
    };

    // Abre el modal de detalle
    const handleOpenDetail = (ex: any) => {
        setSelectedExerciseDetail({
            name: ex.exercise?.name ?? 'Ejercicio',
            description: ex.exercise?.description || '',
            video_url: ex.exercise?.video_url || '',
            focus_name: ex.exercise?.focus_name || '',
        });
    };

    return (
        <div className={styles.container}>
            {/* Barra superior móvil */}
            <div className={styles.mobileTopBar}>
                <button className={styles.hamburger} onClick={() => setMenuOpen(true)}>
                    <Menu size={24} />
                </button>
                <span className={styles.mobileLogo}>
                    CHARLY <span className={styles.silverHero}>COACH</span>
                </span>
            </div>

            {/* Overlay para menú móvil */}
            {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

            {/* Menú lateral (Sidebar) */}
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
                    <Link to="/my-plan" className={location.pathname === '/my-plan' ? styles.menuItemActive : styles.menuItem} onClick={() => setMenuOpen(false)}>
                        <BookOpen size={20} /> MI PLAN COMPLETO
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

            {/* Contenido principal */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>
                        {plan?.name ? (
                            <>
                                PLAN: <span className={styles.silverHero}>{plan.name.toUpperCase()}</span>
                            </>
                        ) : (
                            'MI PLAN COMPLETO'
                        )}
                    </h1>
                    <p>Visualiza y consulta la distribución semanal de tu entrenamiento.</p>
                </header>

                {loading ? (
                    <div className={styles.loadingBox}>
                        <Loader size={32} className={styles.spinner} />
                        <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>CARGANDO RUTINA...</p>
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <p style={{ color: '#f87171' }}>Error: {error}</p>
                    </div>
                ) : !plan || !plan.days || plan.days.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Dumbbell size={40} className={styles.emptyIcon} />
                        <h3>SIN RUTINA ASIGNADA</h3>
                        <p>Aún no tienes un plan de entrenamiento asignado por tu coach. Ponte en contacto con Charly para comenzar.</p>
                    </div>
                ) : (
                    <div className={styles.accordionList}>
                        {plan.days.map((day, idx) => {
                            const isOpen = !!expandedDays[idx];
                            return (
                                <div
                                    key={day.id || idx}
                                    className={`${styles.accordionItem} ${isOpen ? styles.accordionItemActive : ''}`}
                                >
                                    <button
                                        className={styles.accordionHeader}
                                        onClick={() => toggleDay(idx)}
                                    >
                                        <div className={styles.exInfo}>
                                            <span className={styles.dayTitle}>{day.day_label}</span>
                                            <span className={styles.daySubtitle}>
                                                {day.exercises?.length || 0} ejercicio(s)
                                            </span>
                                        </div>
                                        <ChevronDown size={20} className={styles.chevron} />
                                    </button>

                                    <div className={`${styles.accordionContent} ${isOpen ? styles.accordionContentOpen : ''}`}>
                                        <div className={styles.exercisesWrapper}>
                                            {day.exercises && day.exercises.length > 0 ? (
                                                day.exercises.map((ex, exIdx) => {
                                                    const desc = ex.exercise?.description || '';
                                                    const isLongDesc = desc.length > 100;
                                                    const isDescExpanded = !!expandedDesc[ex.id];
                                                    const showText = isLongDesc && !isDescExpanded 
                                                        ? `${desc.slice(0, 100)}...` 
                                                        : desc;

                                                    return (
                                                        <div key={ex.id || exIdx} className={styles.exerciseCard}>
                                                            <div className={styles.cardTop}>
                                                                <div className={styles.exInfo}>
                                                                    <span 
                                                                        className={styles.exNameLink}
                                                                        onClick={() => handleOpenDetail(ex)}
                                                                    >
                                                                        {ex.exercise?.name || 'Ejercicio sin nombre'}
                                                                    </span>
                                                                    <span className={styles.seriesReps}>
                                                                        <span className={styles.seriesHighlight}>{ex.sets}</span> series × <span className={styles.seriesHighlight}>{ex.reps}</span> reps
                                                                    </span>
                                                                </div>

                                                                <div className={styles.badgeList}>
                                                                    {ex.exercise?.focus_name && (
                                                                        <span className={styles.focusBadge}>
                                                                            {ex.exercise.focus_name}
                                                                        </span>
                                                                    )}
                                                                    {ex.exercise?.video_url && (
                                                                        <span className={styles.videoBadge}>
                                                                            <Play size={10} fill="currentColor" /> Video
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {desc && (
                                                                <p className={styles.descSection}>
                                                                    {showText}
                                                                    {isLongDesc && (
                                                                        <button 
                                                                            className={styles.moreTextBtn}
                                                                            onClick={(e) => toggleDescription(ex.id, e)}
                                                                        >
                                                                            {isDescExpanded ? 'ver menos' : 'ver más'}
                                                                        </button>
                                                                    )}
                                                                </p>
                                                            )}

                                                            {ex.exercise?.video_url && (
                                                                <div className={styles.cardActions}>
                                                                    <button 
                                                                        className={styles.videoBtn}
                                                                        onClick={() => handleOpenDetail(ex)}
                                                                    >
                                                                        <Play size={12} fill="currentColor" /> Ver Video
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p style={{ fontSize: '0.8rem', color: '#555', fontStyle: 'italic' }}>
                                                    No hay ejercicios registrados para este día.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modal de Detalle de Ejercicio */}
            {selectedExerciseDetail && (
                <ExerciseDetailModal
                    exercise={selectedExerciseDetail}
                    onClose={() => setSelectedExerciseDetail(null)}
                />
            )}
        </div>
    );
}
