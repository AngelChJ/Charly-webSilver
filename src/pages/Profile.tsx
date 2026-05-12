import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Weight, Crown, LogOut, Save, Check, Loader, Lock } from 'lucide-react';
import styles from '../styles/Profile.module.css';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

const METAS = {
    muscle_gain: { value: 'muscle_gain', label: 'GANAR MÚSCULO', icon: '💪', desc: 'Hipertrofia y fuerza' },
    fat_loss: { value: 'fat_loss', label: 'PERDER GRASA', icon: '🔥', desc: 'Definición y cardio' },
    maintenance: { value: 'maintenance', label: 'MANTENER', icon: '⚖️', desc: 'Equilibrio y salud' },
};

export default function Profile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile, loading, updateProfile } = useProfile(user?.id);

    const [selectedGoal, setSelectedGoal] = useState('muscle_gain');
    const [weight, setWeight] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Cargar suscripción activa desde /api/me
    useEffect(() => {
        if (!user?.id) return;
        api('/api/me')
            .then((data: any) => {
                if (data.sub_end && data.sub_active) {
                    setSubscription({
                        plan_type: data.plan_type || 'premium',
                        end_date: data.sub_end,
                    });
                }
            })
            .catch(() => {});
    }, [user?.id]);

    useEffect(() => {
        if (profile) {
            setWeight(profile.weight_kg?.toString() ?? '');
            setSelectedGoal(profile.goal ?? 'muscle_gain');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await updateProfile({
                weight_kg: parseFloat(weight) || null,
                goal: selectedGoal,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            alert('Error al guardar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('Llena todos los campos.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('Mínimo 8 caracteres.');
            return;
        }

        setChangingPassword(true);
        setPasswordError('');
        setPasswordChanged(false);

        try {
            await api('/api/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            setPasswordChanged(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordChanged(false), 3000);
        } catch (err: any) {
            setPasswordError(err.message);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('charly_token');
        localStorage.removeItem('charly_user');
        navigate('/login');
    };

    const getUserInitials = () => {
        const name = profile?.name ?? user?.email?.split('@')[0] ?? '??';
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getUserName = () => profile?.name ?? 'Sin nombre';
    const getUserEmail = () => profile?.email ?? user?.email ?? '';

    const getPlanName = () => {
        if (!subscription) return 'PLAN BÁSICO';
        const daysLeft = Math.ceil(
            (new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft <= 0) return 'PLAN VENCIDO';
        if (daysLeft <= 7) return `PREMIUM (${daysLeft} días restantes)`;
        return 'PLAN PREMIUM ACTIVO';
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                <p style={{ color: '#666' }}>CARGANDO PERFIL...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.title}>
                    <span className={styles.silverText}>PERFIL</span>
                </h1>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </header>

            <div className={styles.profileHeader}>
                <div className={styles.avatar}>{getUserInitials()}</div>
                <div className={styles.profileInfo}>
                    <h2 className={styles.profileName}>{getUserName()}</h2>
                    <p className={styles.profileEmail}>{getUserEmail()}</p>
                </div>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Crown size={18} className={styles.sectionIcon} />
                    <h3 className={styles.sectionTitle}>PLAN ACTUAL</h3>
                </div>
                <div className={styles.planCard}>
                    <div className={styles.planInfo}>
                        <h4 className={styles.planName}>{getPlanName()}</h4>
                        <p className={styles.planPrice}>$49.99/mes</p>
                    </div>
                    {subscription && (
                        <p style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.75rem', letterSpacing: '0.05em' }}>
                            VENCE: {new Date(subscription.end_date).toLocaleDateString('es-MX')}
                        </p>
                    )}
                </div>
            </section>

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
                            {selectedGoal === meta.value && (
                                <span className={styles.goalCheck}><Check size={16} /></span>
                            )}
                        </button>
                    ))}
                </div>
            </section>

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
                        step="0.1"
                        min="20"
                        max="300"
                    />
                    <span className={styles.weightUnit}>kg</span>
                </div>
                {profile?.weight_kg && (
                    <p style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.5rem' }}>
                        Último registro: {profile.weight_kg} kg
                    </p>
                )}
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Lock size={18} className={styles.sectionIcon} />
                    <h3 className={styles.sectionTitle}>CAMBIAR CONTRASEÑA</h3>
                </div>
                <div className={styles.passwordField}>
                    <input
                        type="password"
                        placeholder="Contraseña actual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={styles.passwordInput}
                    />
                    <input
                        type="password"
                        placeholder="Nueva contraseña (mín. 8 caracteres, letra y número)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.passwordInput}
                    />
                    <input
                        type="password"
                        placeholder="Confirmar nueva contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.passwordInput}
                    />
                    <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className={styles.changePasswordBtn}
                    >
                        {changingPassword ? 'CAMBIANDO...' : passwordChanged ? '¡CONTRASEÑA ACTUALIZADA!' : 'CAMBIAR CONTRASEÑA'}
                    </button>
                    {passwordError && <p className={styles.passwordError}>{passwordError}</p>}
                </div>
            </section>

            <button
                className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? (
                    'GUARDANDO...'
                ) : saved ? (
                    <><Check size={18} /> GUARDADO</>
                ) : (
                    <><Save size={18} /> GUARDAR CAMBIOS</>
                )}
            </button>
        </div>
    );
}