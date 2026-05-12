import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Dumbbell, Search, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api';
import styles from '../styles/Exercises.module.css';

export default function Exercises() {
    const [exercises, setExercises] = useState<any[]>([]);
    const [focuses, setFocuses] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filterFocus, setFilterFocus] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api('/api/exercises')
            .then(data => {
                setExercises(data);
                const uniqueFocuses = [
                    ...new Map(data.map((ex: any) => [ex.focus_id, { id: ex.focus_id, name: ex.focus_name }])).values(),
                ] as any[];
                setFocuses(uniqueFocuses);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = exercises.filter(ex => {
        const matchSearch =
            !search ||
            ex.name.toLowerCase().includes(search.toLowerCase()) ||
            (ex.description && ex.description.toLowerCase().includes(search.toLowerCase()));
        const matchFocus = filterFocus === 'all' || ex.focus_id === parseInt(filterFocus);
        return matchSearch && matchFocus;
    });

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={() => navigate('/dashboard')} className={styles.backBtn}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>
                    BIBLIOTECA DE <span className={styles.silverText}>EJERCICIOS</span>
                </h1>
            </div>

            {/* Contenido principal */}
            <div className={styles.content}>
                {/* Barra de búsqueda y filtro */}
                <div className={styles.controls}>
                    <div className={styles.searchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar ejercicio por nombre o descripción..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <select
                        value={filterFocus}
                        onChange={e => setFilterFocus(e.target.value)}
                        className={styles.filterSelect}>
                        <option value="all">Todos los grupos musculares</option>
                        {focuses.map((f: any) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                    </select>
                </div>

                {/* Resultados */}
                {loading ? (
                    <p className={styles.loading}>Cargando ejercicios...</p>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <Dumbbell size={40} className={styles.emptyIcon} />
                        <p>No se encontraron ejercicios.</p>
                    </div>
                ) : (
                    <>
                        <p className={styles.resultCount}>{filtered.length} ejercicio(s)</p>
                        <div className={styles.grid}>
                            {filtered.map(ex => (
                                <div key={ex.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.exerciseName}>{ex.name}</h3>
                                        {ex.video_url && <Play size={16} className={styles.videoIcon} />}
                                    </div>
                                    {ex.description && (
                                        <p className={styles.exerciseDesc}>
                                            {ex.description.length > 120 ? ex.description.slice(0, 120) + '...' : ex.description}
                                        </p>
                                    )}
                                    <div className={styles.cardFooter}>
                                        <span className={styles.focusBadge}>{ex.focus_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}