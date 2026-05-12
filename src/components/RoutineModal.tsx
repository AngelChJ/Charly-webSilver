import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader } from 'lucide-react';
import { api } from '../lib/api';
import styles from '../styles/RoutineModal.module.css';

interface Exercise {
    id: number;
    name: string;
    focus_id: number;
}

interface DayExercise {
    exercise_id: number;
    sets: number;
    reps: number;
    rest_seconds: number;
    sort_order: number;
}

interface Day {
    day_label: string;
    exercises: DayExercise[];
    sort_order: number;
}

interface Props {
    athleteId: string;
    athleteName: string;
    existingPlan?: any;
    onClose: () => void;
    onSaved: () => void;
}

const DAY_LABELS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

export default function RoutineModal({ athleteId, athleteName, existingPlan, onClose, onSaved }: Props) {
    const [planName, setPlanName] = useState('');
    const [days, setDays] = useState<Day[]>([]);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/api/exercises')
            .then((data: any[]) => {
                setAllExercises(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Precargar rutina existente
        if (existingPlan) {
            setPlanName(existingPlan.name || '');
            setDays(existingPlan.days?.map((d: any) => ({
                day_label: d.day_label,
                sort_order: d.sort_order,
                exercises: d.exercises?.map((ex: any) => ({
                    exercise_id: ex.exercise_id || ex.exercise?.id || ex.id,
                    sets: ex.sets || 3,
                    reps: ex.reps || 10,
                    rest_seconds: ex.rest_seconds || 90,
                    sort_order: ex.sort_order || 1,
                })) || [],
            })) || []);
        }
    }, [existingPlan]);

    const addDay = () => {
        if (days.length >= 6) return;
        setDays([...days, {
            day_label: DAY_LABELS[days.length],
            exercises: [],
            sort_order: days.length + 1,
        }]);
    };

    const removeDay = (index: number) => setDays(days.filter((_, i) => i !== index));

    const addExercise = (dayIndex: number) => {
        const newDays = [...days];
        newDays[dayIndex].exercises.push({
            exercise_id: 0,
            sets: 3,
            reps: 10,
            rest_seconds: 90,
            sort_order: newDays[dayIndex].exercises.length + 1,
        });
        setDays(newDays);
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        const newDays = [...days];
        newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_, i) => i !== exIndex);
        setDays(newDays);
    };

    const updateExercise = (dayIndex: number, exIndex: number, field: string, value: any) => {
        const newDays = [...days];
        (newDays[dayIndex].exercises[exIndex] as any)[field] = value;
        setDays(newDays);
    };

    const updateDayLabel = (index: number, label: string) => {
        const newDays = [...days];
        newDays[index].day_label = label;
        setDays(newDays);
    };

    const handleSave = async () => {
        if (!planName.trim()) { setError('El nombre del plan es obligatorio.'); return; }
        if (days.length === 0) { setError('Agrega al menos un día.'); return; }

        for (const day of days) {
            if (day.exercises.length === 0) { setError(`"${day.day_label}" no tiene ejercicios.`); return; }
            for (const ex of day.exercises) {
                if (ex.exercise_id === 0) { setError(`Selecciona ejercicios en "${day.day_label}".`); return; }
            }
        }

        setSaving(true);
        setError('');

        try {
            await api('/api/workout', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: athleteId,
                    name: planName,
                    days: days.map(d => ({
                        day_label: d.day_label,
                        sort_order: d.sort_order,
                        exercises: d.exercises.map(ex => ({
                            exercise_id: ex.exercise_id,
                            sets: ex.sets,
                            reps: ex.reps,
                            rest_seconds: ex.rest_seconds,
                            sort_order: ex.sort_order,
                        })),
                    })),
                }),
            });

            setSaving(false);
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    if (loading) return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        </div>
    );

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>{existingPlan ? 'EDITAR RUTINA' : 'ASIGNAR RUTINA'}</h2>
                        <p className={styles.subtitle}>Atleta: {athleteName}</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>

                <input type="text" placeholder="Nombre del plan (ej: FUERZA TITANIUM)" value={planName}
                    onChange={(e) => setPlanName(e.target.value)} className={styles.planNameInput} />

                {days.map((day, di) => (
                    <div key={di} className={styles.dayCard}>
                        <div className={styles.dayHeader}>
                            <select value={day.day_label} onChange={(e) => updateDayLabel(di, e.target.value)} className={styles.daySelect}>
                                {DAY_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <button onClick={() => removeDay(di)} className={styles.removeDayBtn}><Trash2 size={16} /></button>
                        </div>

                        {day.exercises.map((ex, ei) => (
                            <div key={ei} className={styles.exerciseRow}>
                                <select value={ex.exercise_id}
                                    onChange={(e) => updateExercise(di, ei, 'exercise_id', parseInt(e.target.value))}
                                    className={styles.exerciseSelect}>
                                    <option value={0}>Seleccionar ejercicio...</option>
                                    {allExercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                                <input type="number" value={ex.sets} min={1} max={10}
                                    onChange={(e) => updateExercise(di, ei, 'sets', parseInt(e.target.value))}
                                    className={styles.numberInput} title="Series" />
                                <span className={styles.multiplier}>×</span>
                                <input type="number" value={ex.reps} min={1} max={50}
                                    onChange={(e) => updateExercise(di, ei, 'reps', parseInt(e.target.value))}
                                    className={styles.numberInput} title="Repeticiones" />
                                <button onClick={() => removeExercise(di, ei)} className={styles.removeExBtn}><Trash2 size={14} /></button>
                            </div>
                        ))}

                        <button onClick={() => addExercise(di)} className={styles.addExBtn}><Plus size={14} /> AGREGAR EJERCICIO</button>
                    </div>
                ))}

                <button onClick={addDay} className={styles.addDayBtn}><Plus size={16} /> AGREGAR DÍA</button>

                {error && <p className={styles.errorText}>{error}</p>}

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.cancelBtn}>CANCELAR</button>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                        {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                        {saving ? 'GUARDANDO...' : 'GUARDAR RUTINA'}
                    </button>
                </div>
            </div>
        </div>
    );
}