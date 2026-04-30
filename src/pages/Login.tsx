import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ChevronLeft } from 'lucide-react';
import styles from '../styles/Login.module.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Lógica temporal (Simulacro)
        if (email === 'admin@charly.com' && password === '123456') {
            localStorage.setItem('user', JSON.stringify({ email, role: 'admin' }));
            navigate('/dashboard');
        } else {
            alert('Credenciales incorrectas. Intenta con las de prueba.');
        }
    };

    return (
        <div className={styles.container}>
            <Link to="/" className={styles.backBtn}>
                <ChevronLeft size={20} /> VOLVER
            </Link>

            <div className={styles.loginBox}>
                <header className={styles.header}>
                    <h1 className={styles.title}>ACCESO<span className={styles.dot}>.</span></h1>
                    <p className={styles.subtitle}>Ingresa al sistema de alto rendimiento</p>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <User className={styles.icon} size={20} />
                        <input
                            type="email"
                            placeholder="EMAIL"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        ENTRAR <ArrowRight size={20} />
                    </button>
                </form>

                <footer className={styles.footer}>
                    <p>¿Olvidaste tu acceso? <a href="#">Contacta al Coach</a></p>
                </footer>
            </div>
        </div>
    );
};

export default Login;