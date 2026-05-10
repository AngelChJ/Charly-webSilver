import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader, Check } from 'lucide-react';
import { api } from '../lib/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.includes('@')) {
            setError('Ingresa un correo válido.');
            return;
        }

        setLoading(true);
        try {
            await api('/api/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setDone(true);
        } catch (err: any) {
            setError(err.message || 'Error al enviar el correo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080808',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                background: '#0a0a0a',
                border: '1px solid rgba(188,198,204,0.1)',
                borderRadius: '20px',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '420px',
            }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link
                        to="/login"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: '#666',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            letterSpacing: '0.08em',
                            marginBottom: '1.5rem',
                        }}
                    >
                        <ArrowLeft size={14} /> VOLVER AL LOGIN
                    </Link>
                    <h1 style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: '#BCC6CC',
                        margin: 0,
                        letterSpacing: '0.05em',
                    }}>
                        RECUPERAR ACCESO
                    </h1>
                    <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
                        TE ENVIAREMOS UN ENLACE A TU CORREO
                    </p>
                </div>

                {/* Estado de éxito */}
                {done ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '2rem 0',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'rgba(74, 222, 128, 0.1)',
                            border: '1px solid rgba(74, 222, 128, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Check size={24} color="#4ade80" />
                        </div>
                        <div>
                            <p style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>
                                CORREO ENVIADO
                            </p>
                            <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                                Revisa tu bandeja de entrada y sigue las instrucciones.
                            </p>
                            <p style={{ color: '#444', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                                El enlace expira en 15 minutos.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            style={{
                                marginTop: '0.5rem',
                                color: '#666',
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Volver al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Input email */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(188,198,204,0.1)',
                                background: 'rgba(188,198,204,0.03)',
                            }}>
                                <Mail size={18} color="#666" />
                                <input
                                    type="email"
                                    placeholder="TU CORREO"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    autoComplete="email"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        outline: 'none',
                                        color: '#BCC6CC',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        letterSpacing: '0.05em',
                                        width: '100%',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p style={{
                                color: '#f87171',
                                fontSize: '0.75rem',
                                marginBottom: '1rem',
                                letterSpacing: '0.03em',
                            }}>
                                {error}
                            </p>
                        )}

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(188,198,204,0.15)',
                                background: loading
                                    ? 'rgba(188,198,204,0.04)'
                                    : 'rgba(188,198,204,0.08)',
                                color: '#BCC6CC',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading
                                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> ENVIANDO...</>
                                : 'ENVIAR ENLACE'
                            }
                        </button>
                    </form>
                )}
            </div>

            {/* Animación spin para el loader */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
