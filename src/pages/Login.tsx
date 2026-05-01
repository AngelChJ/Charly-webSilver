import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ChevronLeft } from 'lucide-react';
import styles from '../styles/Login.module.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 1. Validaciones Simples y Prácticas
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Ingresa un correo válido.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña es demasiado corta.');
            return;
        }

        // 2. Simulacro de Carga de Alto Rendimiento
        setIsLoading(true);

        setTimeout(() => {
            // Credenciales de prueba
            if (email === 'admin@charly.com' && password === '123456') {
                localStorage.setItem('user', JSON.stringify({ email, role: 'admin' }));
                navigate('/Dashboard');
            } else {
                setIsLoading(false);
                setError('Credenciales incorrectas. Intenta de nuevo.');
            }
        }, 2500); // 2.5 segundos para que luzca el brillo plateado
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
                        />
                    </div>

                    {!isLoading ? (
                        <button type="submit" className={styles.AccessBtn}>
                            ENTRAR <ArrowRight size={20} />
                        </button>
                    ) : (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingBar}></div>
                            <p className={styles.loadingText}>COMPROBANDO CREDENCIALES...</p>
                        </div>
                    )}
                </form>

                <footer className={styles.footer}>
                    <p>¿Problemas de acceso? <a href="#">Contacta a soporte técnico</a></p>
                </footer>
            </div>
        </div>
    );
};

export default Login;