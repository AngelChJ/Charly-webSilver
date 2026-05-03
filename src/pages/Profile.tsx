import { useState } from 'react';
import { ChevronLeft, Target, Weight, Crown, LogOut, Save, Check } from 'lucide-react';
import styles from '../styles/Profile.module.css';

// ─── Mocks locales (Basados en tus constantes) ─────────────────
const METAS = {
    muscle_gain: { value: 'muscle_gain', label: 'GANAR MÚSCULO', icon: '💪', desc: 'Hipertrofia y fuerza' },
    fat_loss: { value: 'fat_loss', label: 'PERDER GRASA', icon: '🔥', desc: 'Definición y cardio' },
    maintenance: { value: 'maintenance', label: 'MANTENER', icon: '⚖️', desc: 'Equilibrio y salud' }
};

const PLAN_ACTUAL = {
    nombre: 'TITANIUM PREMIUM',
    precio: '49.99',
    beneficios: ['Rutinas personalizadas', 'Seguimiento 24/7', 'Guía de suplementación']
};

export default function PerfilLocal() {
    const [selectedGoal, setSelectedGoal] = useState('muscle_gain');
    const [weight, setWeight] = useState('82.5');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 1200);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn}><ChevronLeft size={20} /></button>
                <h1 className={styles.title}><span className={styles.silverText}>PERFIL</span></h1>
                <button className={styles.logoutBtn}><LogOut size={18} /></button>
            </header>

            <div className={styles.profileHeader}>
                <div className={styles.avatar}>AC</div>
                <div className={styles.profileInfo}>
                    <h2 className={styles.profileName}>ANGEL CH.</h2>
                    <p className={styles.profileEmail}>angel@charlycoach.com</p>
                </div>
            </div>

            {/* Plan Actual */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Crown size={18} className={styles.sectionIcon} />
                    <h3 className={styles.sectionTitle}>PLAN ACTUAL</h3>
                </div>
                <div className={styles.planCard}>
                    <div className={styles.planInfo}>
                        <h4 className={styles.planName}>{PLAN_ACTUAL.nombre}</h4>
                        <p className={styles.planPrice}>${PLAN_ACTUAL.precio}/mes</p>
                    </div>
                    <ul className={styles.planBenefits}>
                        {PLAN_ACTUAL.beneficios.map((b, i) => (
                            <li key={i} className={styles.benefitItem}>
                                <Check size={14} /> <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Meta */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Target size={18} className={styles.sectionIcon} />
                    <h3 className={styles.sectionTitle}>META DE ENTRENAMIENTO</h3>
                </div>
                <div className={styles.goalGrid}>
                    {Object.values(METAS).map((meta) => (
                        <button
                            key={meta.value}
                            className={`${styles.goalCard} ${selectedGoal === meta.value ? styles.goalCardActive : ''}`}
                            onClick={() => setSelectedGoal(meta.value)}
                        >
                            <span className={styles.goalIcon}>{meta.icon}</span>
                            <div className={styles.goalText}>
                                <span className={styles.goalLabel}>{meta.label}</span>
                                <span className={styles.goalDesc}>{meta.desc}</span>
                            </div>
                            {selectedGoal === meta.value && <span className={styles.goalCheck}><Check size={16} /></span>}
                        </button>
                    ))}
                </div>
            </section>

            {/* Peso */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Weight size={18} className={styles.sectionIcon} />
                    <h3 className={styles.sectionTitle}>PESO ACTUAL</h3>
                </div>
                <div className={styles.weightInputGroup}>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className={styles.weightInput}
                    />
                    <span className={styles.weightUnit}>kg</span>
                </div>
            </section>

            <button
                className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? 'GUARDANDO...' : saved ? <><Check size={18} /> GUARDADO</> : <><Save size={18} /> GUARDAR CAMBIOS</>}
            </button>
        </div>
    );
}