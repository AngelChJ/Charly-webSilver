import { useState, useEffect } from 'react';
import { X, Loader, Check, Upload, Trash2, Video } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
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
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const isEditing = !!exercise;

    useEffect(() => {
        supabase
            .from('exercise_focus')
            .select('id, name')
            .order('name')
            .then(({ data }: any) => {
                if (data) setFocuses(data);
                setLoading(false);
            });

        if (exercise) {
            setName(exercise.name);
            setDescription(exercise.description || '');
            setFocusId(exercise.focus_id);
            setVideoUrl(exercise.video_url || '');
        }
    }, [exercise]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('video/')) {
            setError('Solo se permiten archivos de video (MP4, WEBM, etc.)');
            return;
        }

        // Validar tamaño (máx 50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('El video no puede superar los 50MB');
            return;
        }

        setUploading(true);
        setError('');

        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const filePath = `videos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('exercise-videos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            setError('Error al subir video: ' + uploadError.message);
            setUploading(false);
            return;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('exercise-videos')
            .getPublicUrl(filePath);

        setVideoUrl(urlData.publicUrl);
        setUploading(false);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('El nombre del ejercicio es obligatorio.');
            return;
        }

        setSaving(true);
        setError('');

        const payload = {
            name,
            description,
            focus_id: focusId,
            video_url: videoUrl || null,
        };

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('exercises')
                .update(payload)
                .eq('id', exercise!.id);

            if (updateError) {
                setError(updateError.message);
                setSaving(false);
                return;
            }
        } else {
            const { error: insertError } = await supabase
                .from('exercises')
                .insert(payload);

            if (insertError) {
                setError(insertError.message);
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        setSuccess(true);
        setTimeout(() => {
            onSaved();
            onClose();
        }, 1000);
    };

    const handleDelete = async () => {
        if (!isEditing || !exercise) return;
        if (!confirm(`¿Eliminar "${exercise.name}"?`)) return;

        // Eliminar video asociado
        if (exercise.video_url) {
            const urlParts = exercise.video_url.split('/exercise-videos/');
            if (urlParts.length > 1) {
                await supabase.storage.from('exercise-videos').remove([`videos/${urlParts[1]}`]);
            }
        }

        const { error } = await supabase.from('exercises').delete().eq('id', exercise.id);

        if (error) {
            setError(error.message);
            return;
        }

        onSaved();
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
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
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>NOMBRE DEL EJERCICIO</label>
                            <input type="text" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>DESCRIPCIÓN (Opcional)</label>
                            <textarea className={`${styles.input} ${styles.textarea}`} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>GRUPO MUSCULAR</label>
                            <select value={focusId} onChange={(e) => setFocusId(parseInt(e.target.value))} className={styles.select}>
                                {focuses.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>VIDEO DEMOSTRATIVO</label>
                            <div className={`${styles.uploadContainer} ${videoUrl ? styles.hasVideo : ''}`}>
                                <input type="file" accept="video/*" onChange={handleFileChange} disabled={uploading || saving} className={styles.fileInput} />
                                {uploading ? (
                                    <div><Loader className={styles.uploadIcon} style={{ animation: 'spin 1s linear infinite' }} /></div>
                                ) : (
                                    <div>
                                        {videoUrl ? <Video className={styles.uploadIcon} /> : <Upload className={styles.uploadIcon} />}
                                        <p className={styles.uploadTitle}>{videoUrl ? 'VIDEO CARGADO' : 'SELECCIONAR VIDEO'}</p>
                                    </div>
                                )}
                            </div>

                            {/* URL manual */}
                            <div className={styles.inputContainer} style={{ marginTop: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="O pega la URL del video..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            {videoUrl && !uploading && <video src={videoUrl} controls className={styles.videoPreview} />}
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <div className={styles.footer}>
                            {isEditing && (
                                <button type="button" onClick={handleDelete} className={styles.deleteBtn}>
                                    <Trash2 size={16} /> ELIMINAR
                                </button>
                            )}
                            <button type="button" onClick={onClose} className={styles.cancelBtn}>CANCELAR</button>
                            <button type="submit" disabled={saving || uploading} className={styles.saveBtn}>
                                {saving ? 'GUARDANDO...' : isEditing ? 'ACTUALIZAR' : 'CREAR'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}