import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader, Check, X } from 'lucide-react';
import { api } from '../lib/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) { setValid(false); setLoading(false); return; }
        api(`/api/verify-reset-token?token=${token}`)
            .then((data: any) => setValid(data.valid))
            .catch(() => setValid(false))
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) { setError('Mínimo 8 caracteres.'); return; }
        if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

        setSaving(true);
        setError('');
        try {
            await api('/api/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, password }),
            });
            setDone(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><Loader size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    if (!valid) return (
        <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#f87171' }}>
                <X size={48} style={{ marginBottom: '1rem' }} />
                <h2>Enlace inválido o expirado</h2>
                <p style={{ color: '#888', marginTop: '0.5rem' }}>Solicita un nuevo enlace de recuperación.</p>
            </div>
        </div>
    );

    if (done) return (
        <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#4ade80' }}>
                <Check size={48} style={{ marginBottom: '1rem' }} />
                <h2>Contraseña actualizada</h2>
                <p style={{ color: '#888', marginTop: '0.5rem' }}>Redirigiendo al inicio de sesión...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(188,198,204,0.1)', borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '420px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#BCC6CC', letterSpacing: '0.05em' }}>NUEVA CONTRASEÑA</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(188,198,204,0.1)', background: 'rgba(188,198,204,0.03)' }}>
                            <Lock size={18} color="#666" />
                            <input type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', color: '#BCC6CC', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(188,198,204,0.1)', background: 'rgba(188,198,204,0.03)' }}>
                            <Lock size={18} color="#666" />
                            <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', color: '#BCC6CC', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%' }} />
                        </div>
                    </div>
                    {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" disabled={saving}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(188,198,204,0.15)', background: 'rgba(188,198,204,0.08)', color: '#BCC6CC', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'GUARDAR CONTRASEÑA'}
                    </button>
                </form>
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}