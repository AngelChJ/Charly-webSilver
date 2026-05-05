import { useState, useEffect } from 'react';
import { X, Calendar, Loader, Check, Crown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
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
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [currentSub, setCurrentSub] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [selectedMonths, setSelectedMonths] = useState(1);

    const plans = [
        {
            id: 'standard',
            nombre: 'PLAN ESTÁNDAR',
            precio: '800',
            beneficios: 'Acceso al gym, Rutina base, Seguimiento quincenal'
        },
        {
            id: 'premium',
            nombre: 'PLAN PREMIUM',
            precio: '1200',
            beneficios: 'Acceso 24/7, Dieta personalizada, Coach por WhatsApp, Registro de progreso'
        },
        {
            id: 'avanzado',
            nombre: 'PLAN AVANZADO',
            precio: '1800',
            beneficios: 'Todo lo anterior, Acompañamiento personalizado, Suplementación'
        },
    ];

    useEffect(() => {
        supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', athleteId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()
            .then(({ data }: any) => {
                if (data) {
                    setCurrentSub(data);
                    setEndDate(data.end_date);
                    setStartDate(data.start_date);
                    if (data.plan_type) setSelectedPlan(data.plan_type);
                } else {
                    const future = new Date();
                    future.setMonth(future.getMonth() + 1);
                    setEndDate(future.toISOString().split('T')[0]);
                    setSelectedMonths(1);
                }
                setLoading(false);
            });
    }, [athleteId]);

    const handleSave = async () => {
        if (!startDate || !endDate) {
            setError('Selecciona ambas fechas.');
            return;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            setError('La fecha final debe ser posterior a la inicial.');
            return;
        }

        setSaving(true);
        setError('');

        await supabase
            .from('subscriptions')
            .update({ is_active: false })
            .eq('user_id', athleteId)
            .eq('is_active', true);

        const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: athleteId,
                start_date: startDate,
                end_date: endDate,
                is_active: true,
            });

        if (insertError) {
            setError(insertError.message);
            setSaving(false);
            return;
        }

        await supabase
            .from('users')
            .update({ plan_type: selectedPlan })
            .eq('id', athleteId);

        setSaving(false);
        setSuccess(true);

        setTimeout(() => {
            onSaved();
            onClose();
        }, 1500);
    };

    const getDaysLeft = () => {
        if (!currentSub?.end_date) return 0;
        const end = new Date(currentSub.end_date);
        const today = new Date();
        return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getPlanName = (id: string) => {
        return plans.find(p => p.id === id)?.nombre ?? 'PLAN PREMIUM';
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>GESTIONAR SUSCRIPCIÓN</h2>
                        <p className={styles.subtitle}>Atleta: {athleteName}</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : success ? (
                    <div className={styles.successContainer}>
                        <div className={styles.successIconBg}>
                            <Check size={28} />
                        </div>
                        <p className={styles.successTitle}>SUSCRIPCIÓN ACTUALIZADA</p>
                        <p className={styles.successText}>{getPlanName(selectedPlan)}</p>
                    </div>
                ) : (
                    <>
                        {currentSub && (
                            <div className={styles.currentSubCard}>
                                <div className={styles.currentSubHeader}>
                                    <Crown size={16} color="#fbbf24" />
                                    <span className={styles.currentSubTitle}>SUSCRIPCIÓN ACTUAL</span>
                                </div>
                                <p className={styles.currentSubDate}>
                                    Vence: {new Date(currentSub.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className={styles.currentSubDays} style={{ color: getDaysLeft() <= 7 ? '#fbbf24' : '#666' }}>{getDaysLeft()} días restantes</p>
                            </div>
                        )}

                        <div className={styles.section}>
                            <label className={styles.sectionLabel}>
                                <Crown size={14} color="#fbbf24" /> TIPO DE PLAN
                            </label>
                            <div className={styles.plansContainer}>
                                {plans.map((plan) => (
                                    <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                                        className={`${styles.planBtn} ${selectedPlan === plan.id ? styles.active : ''}`}>
                                        <div className={styles.planInfo}>
                                            <div className={styles.planTitle}>{plan.nombre}</div>
                                            <div className={styles.planDesc}>{plan.beneficios}</div>
                                        </div>
                                        <div className={styles.planPriceBox}>
                                            <div className={styles.planPrice}>${plan.precio}</div>
                                            <div className={styles.planMonth}>MXN/mes</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.dateGrid}>
                            <div>
                                <label className={styles.dateLabel}>FECHA DE INICIO</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                    className={styles.dateInput} />
                            </div>
                            <div>
                                <label className={styles.dateLabel}>FECHA DE VENCIMIENTO</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                    className={styles.dateInput} />
                            </div>
                        </div>

                        <div className={styles.section}>
                            <label className={styles.sectionLabel}>DURACIÓN RÁPIDA</label>
                            <div className={styles.durationContainer}>
                                {[1, 3, 6, 12].map((months) => {
                                    const future = new Date(startDate || new Date());
                                    future.setMonth(future.getMonth() + months);
                                    return (
                                        <button key={months} type="button"
                                            onClick={() => { setEndDate(future.toISOString().split('T')[0]); setSelectedMonths(months); }}
                                            className={styles.durationBtn}>
                                            {months} {months === 1 ? 'MES' : 'MESES'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.totalBox}>
                            <span className={styles.totalLabel}>TOTAL ESTIMADO</span>
                            <span className={styles.totalPrice}>
                                ${(parseInt(plans.find(p => p.id === selectedPlan)?.precio ?? '0') * selectedMonths).toLocaleString()} MXN
                            </span>
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <div className={styles.footer}>
                            <button onClick={onClose} disabled={saving} className={styles.cancelBtn}>
                                CANCELAR
                            </button>
                            <button onClick={handleSave} disabled={saving} className={styles.submitBtn}>
                                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={16} />}
                                {saving ? 'GUARDANDO...' : 'RENOVAR SUSCRIPCIÓN'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}