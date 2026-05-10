import { useState } from 'react';
import { X, User, Mail, Lock, Loader, Check, Crown } from 'lucide-react';
import { api } from '../lib/api';
import styles from '../styles/AddAthleteModal.module.css';

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export default function AddAthleteModal({ onClose, onCreated }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [planMonths, setPlanMonths] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [planPrice, setPlanPrice] = useState('1200');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const planTypes = [
        { id: 'standard', nombre: 'ESTÁNDAR', precio: 800, beneficios: 'Gym + Rutina base + Seguimiento quincenal' },
        { id: 'premium', nombre: 'PREMIUM', precio: 1200, beneficios: '24/7 + Dieta + Coach WhatsApp + Progreso' },
        { id: 'avanzado', nombre: 'AVANZADO', precio: 1800, beneficios: 'Todo + Acompañamiento + Suplementación' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
        if (!email.includes('@')) { setError('Ingresa un correo válido.'); return; }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('La contraseña debe tener al menos 8 caracteres, una letra y un número.');
            return;
        }
        setLoading(true);

        try {
            await api('/api/athletes', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    planMonths,
                    planType: selectedPlan,
                }),
            });

            setSuccess(true);
            setTimeout(() => { onCreated(); onClose(); }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>AÑADIR ATLETA</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>

                {success ? (
                    <div className={styles.successContainer}>
                        <div className={styles.successIconBg}><Check size={28} /></div>
                        <p className={styles.successTitle}>ATLETA CREADO</p>
                        <p className={styles.successText}>{name}</p>
                        <p className={styles.successSub}>{email}</p>
                        <p className={styles.successHighlight}>{planTypes.find(p => p.id === selectedPlan)?.nombre} · {planMonths} {planMonths === 1 ? 'mes' : 'meses'}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>NOMBRE COMPLETO</label>
                            <div className={styles.inputContainer}>
                                <User size={18} color="#666" />
                                <input type="text" placeholder="Ej: Carlos Rodríguez" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className={styles.input} />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>CORREO ELECTRÓNICO</label>
                            <div className={styles.inputContainer}>
                                <Mail size={18} color="#666" />
                                <input type="email" placeholder="atleta@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} autoComplete="off" className={styles.input} />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>CONTRASEÑA</label>
                            <div className={styles.inputContainer}>
                                <Lock size={18} color="#666" />
                                <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} autoComplete="new-password" className={styles.input} />
                            </div>
                        </div>

                        {/* Plan de suscripción */}
                        <div className={styles.section}>
                            <label className={styles.sectionLabel}>
                                <Crown size={14} color="#fbbf24" /> PLAN DE SUSCRIPCIÓN
                            </label>
                            <div className={styles.plansContainer}>
                                {planTypes.map((plan) => (
                                    <button key={plan.id} type="button"
                                        onClick={() => { setSelectedPlan(plan.id); setPlanPrice(plan.precio.toString()); }}
                                        className={`${styles.planBtn} ${selectedPlan === plan.id ? styles.active : ''}`}>
                                        <div>
                                            <div className={styles.planInfo}>{plan.nombre}</div>
                                            <div className={styles.planDesc}>{plan.beneficios}</div>
                                        </div>
                                        <div className={styles.planPriceBox}>
                                            <span className={styles.planPrice}>${plan.precio}</span>
                                            <span className={styles.planMonth}>/mes</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <label className={styles.durationLabel}>DURACIÓN</label>
                            <div className={styles.durationContainer}>
                                {[1, 3, 6, 12].map((m) => (
                                    <button key={m} type="button" onClick={() => setPlanMonths(m)}
                                        className={`${styles.durationBtn} ${planMonths === m ? styles.active : ''}`}>
                                        {m} {m === 1 ? 'MES' : 'MESES'}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.totalText}>
                                Total: ${(parseInt(planPrice) * planMonths).toLocaleString()} MXN
                            </div>
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <div className={styles.footer}>
                            <button type="button" onClick={onClose} disabled={loading} className={styles.cancelBtn}>CANCELAR</button>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <User size={16} />}
                                {loading ? 'CREANDO...' : 'CREAR ATLETA'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}