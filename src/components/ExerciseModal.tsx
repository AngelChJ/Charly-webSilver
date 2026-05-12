import { useState, useEffect } from 'react';
import { X, Loader, Check, Trash2, Plus } from 'lucide-react';
import { api } from '../lib/api';
import styles from '../styles/ExerciseModal.module.css';

interface Exercise {
    id: number;
    name: string;
    description: string;
    focus_id: number;
    file_url?: string;
    video_url?: string;
}

interface Focus {
    id: number;
    name: string;
}

interface Props {
    exercise: Exercise | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function ExerciseModal({ exercise, onClose, onSaved }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [focusId, setFocusId] = useState<number>(1);
    const [videoUrl, setVideoUrl] = useState('');
    const [focuses, setFocuses] = useState<Focus[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Nuevo grupo muscular
    const [newGroupName, setNewGroupName] = useState('');
    const [addingGroup, setAddingGroup] = useState(false);

    const isEditing = !!exercise;

    const loadFocuses = async () => {
        try {
            const data = await api('/api/exercises');
            const focusList = [
                ...new Map(
                    data.map((ex: any) => [ex.focus_id, { id: ex.focus_id, name: ex.focus_name }])
                ).values(),
            ] as Focus[];
            setFocuses(focusList);
        } catch {
            // Si falla, al menos dejar los que ya hay
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFocuses();

        if (exercise) {
            setName(exercise.name);
            setDescription(exercise.description || '');
            setFocusId(exercise.focus_id);
            setVideoUrl(exercise.video_url || '');
        }
    }, [exercise]);

    const handleAddGroup = async () => {
        if (!newGroupName.trim()) return;
        setAddingGroup(true);
        setError('');
        try {
            const res = await api('/api/exercise-focus', {
                method: 'POST',
                body: JSON.stringify({ name: newGroupName.trim() }),
            });
            // Añadir el nuevo grupo a la lista y seleccionarlo
            setFocuses([...focuses, { id: res.id, name: newGroupName.trim() }]);
            setFocusId(res.id);
            setNewGroupName('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAddingGroup(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('El nombre del ejercicio es obligatorio.');
            return;
        }

        setSaving(true);
        setError('');

        const payload = {
            name: name.trim(),
            description: description.trim(),
            focus_id: focusId,
            video_url: videoUrl || null,
        };

        try {
            if (isEditing) {
                await api(`/api/exercises/${exercise!.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                await api('/api/exercises', { method: 'POST', body: JSON.stringify(payload) });
            }
            setSaving(false);
            setSuccess(true);
            setTimeout(() => {
                onSaved();
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !exercise) return;
        if (!confirm(`¿Eliminar "${exercise.name}"?`)) return;

        try {
            await api(`/api/exercises/${exercise.id}`, { method: 'DELETE' });
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {exercise ? 'EDITAR EJERCICIO' : 'NUEVO EJERCICIO'}
                    </h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : success ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#4ade80' }}>
                        <Check size={40} style={{ marginBottom: '0.5rem' }} />
                        <p style={{ fontWeight: 700 }}>{isEditing ? 'EJERCICIO ACTUALIZADO' : 'EJERCICIO CREADO'}</p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        {/* Nombre */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>NOMBRE DEL EJERCICIO</label>
                            <div className={styles.inputContainer}>
                                <input type="text" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>DESCRIPCIÓN (Opcional)</label>
                            <div className={styles.inputContainer}>
                                <textarea className={`${styles.input} ${styles.textarea}`} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
                            </div>
                        </div>

                        {/* Grupo Muscular */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>GRUPO MUSCULAR</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select
                                    value={focusId}
                                    onChange={(e) => setFocusId(parseInt(e.target.value))}
                                    className={styles.select}
                                    style={{ flex: 1 }}
                                >
                                    {focuses.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Nuevo grupo..."
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className={styles.input}
                                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(188,198,204,0.1)', background: 'rgba(188,198,204,0.03)', color: '#BCC6CC', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '120px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddGroup}
                                    disabled={addingGroup || !newGroupName.trim()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(188,198,204,0.15)',
                                        background: 'rgba(188,198,204,0.06)',
                                        color: '#BCC6CC',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Plus size={14} /> AGREGAR
                                </button>
                            </div>
                        </div>

                        {/* Video demostrativo (URL) */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>VIDEO DEMOSTRATIVO (URL)</label>
                            <div className={styles.inputContainer}>
                                <input type="text" placeholder="Pega la URL del video..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={styles.input} />
                            </div>
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        {/* Footer / Botones */}
                        <div className={styles.footer}>
                            {isEditing && (
                                <button type="button" onClick={handleDelete} className={styles.deleteBtn}>
                                    <Trash2 size={16} /> ELIMINAR
                                </button>
                            )}
                            <button type="button" onClick={onClose} className={styles.cancelBtn}>CANCELAR</button>
                            <button type="submit" disabled={saving} className={styles.saveBtn}>
                                {saving ? 'GUARDANDO...' : isEditing ? 'ACTUALIZAR' : 'CREAR'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}