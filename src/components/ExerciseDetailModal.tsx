import { X, Play } from 'lucide-react';
import styles from '../styles/ExerciseDetailModal.module.css';

interface Props {
    exercise: {
        name: string;
        description?: string;
        video_url?: string;
        focus_name?: string;
        tips?: string;
    } | null;
    onClose: () => void;
}

export default function ExerciseDetailModal({ exercise, onClose }: Props) {
    if (!exercise) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.exerciseName}>{exercise.name}</h2>
                        {exercise.focus_name && (
                            <span className={styles.focusBadge}>{exercise.focus_name}</span>
                        )}
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* Video */}
                {exercise.video_url && (
                    <div className={styles.videoContainer}>
                        <div className={styles.videoWrapper}>
                            <video src={exercise.video_url} controls className={styles.video} />
                        </div>
                    </div>
                )}

                {/* Descripción */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>DESCRIPCIÓN</h4>
                    <p className={styles.descriptionText}>
                        {exercise.description || 'Sin descripción disponible.'}
                    </p>
                </div>

                {/* Recomendaciones */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>RECOMENDACIONES</h4>
                    <div className={styles.tipsBox}>
                        <ul className={styles.tipsList}>
                            <li>Mantén una técnica controlada en cada repetición.</li>
                            <li>Realiza un calentamiento previo con peso ligero.</li>
                            <li>Exhala al ejercer fuerza, inhala al relajar.</li>
                            <li>Si sientes dolor articular, detente y revisa tu postura.</li>
                            <li>Descansa 60-90 segundos entre series.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.footerBtn}>CERRAR</button>
                </div>
            </div>
        </div>
    );
}