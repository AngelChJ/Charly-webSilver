import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ChevronLeft } from 'lucide-react';
import styles from '../styles/Login.module.css';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Ingresa un correo válido.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) throw loginError;

            console.log('✅ Usuario autenticado:', data.user);

            // Redirigir según rol
            const role = data.user?.app_metadata?.role;
            if (role === 'coach' || role === 'admin') {
                navigate('/coach');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('❌ Error de login:', err.message);
            setError('Credenciales incorrectas. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Link to="/" className={styles.backBtn}>
                <ChevronLeft size={20} /> VOLVER
            </Link>

            <div className={styles.loginBox}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        <span className={styles.silverHero}>ACCESO</span>
                    </h1>
                    <p className={styles.subtitle}>SISTEMA DE ALTO RENDIMIENTO</p>
                </header>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <User className={styles.icon} size={20} />
                        <input
                            type="email"
                            placeholder="EMAIL"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock className={styles.icon} size={20} />
                        <input
                            type="password"
                            placeholder="CONTRASEÑA"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {!isLoading ? (
                        <button type="submit" className={styles.AccessBtn}>
                            ENTRAR <ArrowRight size={20} />
                        </button>
                    ) : (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingBar}></div>
                            <p className={styles.loadingText}>VERIFICANDO CREDENCIALES...</p>
                        </div>
                    )}
                </form>

                <footer className={styles.footer}>
                    <p>¿Problemas de acceso? <a href="#">Contacta a soporte técnico</a></p>
                </footer>
            </div>
        </div>
    );
}