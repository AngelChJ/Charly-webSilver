import { useState, useEffect } from 'react';
import { X, Calendar, Loader, Check, Crown } from 'lucide-react';
import { api } from '../lib/api';
import styles from '../styles/SubscriptionModal.module.css';

interface Props {
    athleteId: string;
    athleteName: string;
    onClose: () => void;
    onSaved: () => void;
}

export default function SubscriptionModal({ athleteId, athleteName, onClose, onSaved }: Props) {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [selectedMonths, setSelectedMonths] = useState(1);

    const plans = [
        { id: 'standard', nombre: 'PLAN ESTÁNDAR', precio: '800', beneficios: 'Acceso al gym, Rutina base, Seguimiento quincenal' },
        { id: 'premium', nombre: 'PLAN PREMIUM', precio: '1200', beneficios: 'Acceso 24/7, Dieta personalizada, Coach por WhatsApp, Registro de progreso' },
        { id: 'avanzado', nombre: 'PLAN AVANZADO', precio: '1800', beneficios: 'Todo lo anterior, Acompañamiento personalizado, Suplementación' },
    ];

    useEffect(() => {
        const future = new Date();
        future.setMonth(future.getMonth() + 1);
        setEndDate(future.toISOString().split('T')[0]);
        setLoading(false);
    }, []);

    const handleSave = async () => {
        if (!startDate || !endDate) { setError('Selecciona ambas fechas.'); return; }
        if (new Date(endDate) <= new Date(startDate)) { setError('La fecha final debe ser posterior.'); return; }
        setSaving(true);
        setError('');
        try {
            await api('/api/subscriptions', {
                method: 'POST',
                body: JSON.stringify({ user_id: athleteId, end_date: endDate, plan_type: selectedPlan }),
            });
            setSaving(false);
            setSuccess(true);
            setTimeout(() => { onSaved(); onClose(); }, 1500);
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div><h2 className={styles.title}>GESTIONAR SUSCRIPCIÓN</h2><p className={styles.subtitle}>Atleta: {athleteName}</p></div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>
                {loading ? <div className={styles.loadingContainer}><Loader size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
                    : success ? <div className={styles.successContainer}><div className={styles.successIconBg}><Check size={28} /></div><p className={styles.successTitle}>SUSCRIPCIÓN ACTUALIZADA</p></div>
                        : <>
                            <div className={styles.section}>
                                <label className={styles.sectionLabel}><Crown size={14} color="#fbbf24" /> TIPO DE PLAN</label>
                                <div className={styles.plansContainer}>
                                    {plans.map((plan) => (
                                        <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className={`${styles.planBtn} ${selectedPlan === plan.id ? styles.active : ''}`}>
                                            <div className={styles.planInfo}><div className={styles.planTitle}>{plan.nombre}</div><div className={styles.planDesc}>{plan.beneficios}</div></div>
                                            <div className={styles.planPriceBox}><div className={styles.planPrice}>${plan.precio}</div><div className={styles.planMonth}>MXN/mes</div></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.dateGrid}>
                                <div><label className={styles.dateLabel}>FECHA DE INICIO</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.dateInput} /></div>
                                <div><label className={styles.dateLabel}>FECHA DE VENCIMIENTO</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.dateInput} /></div>
                            </div>
                            <div className={styles.section}>
                                <label className={styles.sectionLabel}>DURACIÓN RÁPIDA</label>
                                <div className={styles.durationContainer}>
                                    {[1, 3, 6, 12].map((months) => {
                                        const future = new Date(startDate || new Date());
                                        future.setMonth(future.getMonth() + months);
                                        return <button key={months} type="button" onClick={() => { setEndDate(future.toISOString().split('T')[0]); setSelectedMonths(months); }} className={styles.durationBtn}>{months} {months === 1 ? 'MES' : 'MESES'}</button>;
                                    })}
                                </div>
                            </div>
                            <div className={styles.totalBox}><span className={styles.totalLabel}>TOTAL ESTIMADO</span><span className={styles.totalPrice}>${(parseInt(plans.find(p => p.id === selectedPlan)?.precio ?? '0') * selectedMonths).toLocaleString()} MXN</span></div>
                            {error && <p className={styles.errorText}>{error}</p>}
                            <div className={styles.footer}>
                                <button onClick={onClose} disabled={saving} className={styles.cancelBtn}>CANCELAR</button>
                                <button onClick={handleSave} disabled={saving} className={styles.submitBtn}>{saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={16} />}{saving ? 'GUARDANDO...' : 'RENOVAR SUSCRIPCIÓN'}</button>
                            </div>
                        </>}
            </div>
        </div>
    );
}