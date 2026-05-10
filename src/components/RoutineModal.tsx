import { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { api } from '../lib/api';
import styles from '../styles/RoutineModal.module.css';

interface Props {
    athleteId: string;
    athleteName: string;
    onClose: () => void;
    onSaved: () => void;
}

export default function RoutineModal({ athleteId, athleteName, onClose, onSaved }: Props) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            // Placeholder - las rutinas se implementarán después
            await new Promise(resolve => setTimeout(resolve, 500));
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div><h2 className={styles.title}>ASIGNAR RUTINA</h2><p className={styles.subtitle}>Atleta: {athleteName}</p></div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>
                <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Módulo de rutinas en desarrollo</p>
                {error && <p className={styles.errorText}>{error}</p>}
                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.cancelBtn}>CANCELAR</button>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>{saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}GUARDAR</button>
                </div>
            </div>
        </div>
    );
}