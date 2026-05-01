import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Activity, Dumbbell, Heart,
    ArrowRight, MessageCircle
} from 'lucide-react';
import { TarjetaPrograma, TarjetaPrecio } from '../components/ui/Tarjetas';
import styles from '../styles/Home.module.css';

const Home = () => {
    const [progActivo, setProgActivo] = useState(0);
    const [planSeleccionado, setPlanSeleccionado] = useState(1);

    const programas = [
        { titulo: "FUERZA CARDIO", desc: "Mejora tu potencia y resistencia con circuitos de alta intensidad.", icono: <Zap size={20} /> },
        { titulo: "PÉRDIDA DE GRASA", desc: "Aumenta la quema calórica manteniendo la masa muscular intacta.", icono: <Activity size={20} /> },
        { titulo: "GANANCIA MUSCULAR", desc: "Plan diseñado para el aumento de volumen y progreso.", icono: <Dumbbell size={20} /> },
        { titulo: "NUTRICIÓN", desc: "Rutinas de dieta para optimizar la recuperación y energía.", icono: <Heart size={20} /> }
    ];

    const planes = [
        { id: 0, nombre: "PLAN ESTÁNDAR", precio: "800", beneficios: ["Acceso al gym", "Rutina base", "Seguimiento quincenal"] },
        { id: 1, nombre: "PLAN PREMIUM", precio: "1200", beneficios: ["Acceso 24/7", "Dieta personalizada", "Coach por WhatsApp", "Registro de progreso"] },
        { id: 2, nombre: "PLAN AVANZADO", precio: "1800", beneficios: ["Todo lo anterior", "Acompañamiento personalizado", "Suplementación",] }
    ];

    return (
        <div className={styles.container}>
            <nav className={styles.nav}>
                <div className={styles.logo}>CHARLY<span className={styles.silverText}>COACH</span></div>
                <div className={styles.navLinks}>
                    <a href="#programas">SISTEMAS</a>
                    <a href="#planes">PLANES</a>
                    <a href="#contacto">CONTACTO</a>
                </div>
                <Link to="../Login" className={styles.loginBtn}>UNIRME</Link>
            </nav>

            <header className={styles.hero}>
                <span className={styles.taglineTitanium}>LEGACY OF STRENGTH</span>
                <h1 className={styles.heroTitle}>
                    DOMINA <br /> <span className={styles.silverHero}>TU CUERPO</span>
                </h1>
                <p className={styles.heroDesc}>
                    Entrenamiento de élite y nutrición inteligente. Resultados reales para personas reales.
                </p>
                <button className={styles.ctaButton}>
                    ESCRÍBEME POR WHATSAPP <ArrowRight size={16} />
                </button>
            </header>

            <section id="programas" className={styles.section}>
                <h2 className={styles.sectionTitle}>EXPLORA EL <span className={styles.accentWord}>SISTEMA</span></h2>
                <div className={styles.grid}>
                    {programas.map((prog, i) => (
                        <TarjetaPrograma
                            key={i}
                            {...prog}
                            activo={progActivo === i}
                            onClick={() => setProgActivo(i)}
                        />
                    ))}
                </div>
            </section>

            <section id="planes" className={`${styles.section} text-center`}>
                <h2 className={`${styles.sectionTitle} justify-center mb-4`}>NUESTROS <span className={styles.accentWord}>PLANES</span></h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-20">SELECCIONA EL TUYO AHORA</p>
                <div className={styles.gridPricing}>
                    {planes.map((p) => (
                        <div key={p.id} onClick={() => setPlanSeleccionado(p.id)}>
                            <TarjetaPrecio
                                {...p}
                                popular={planSeleccionado === p.id}
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section id="contacto" className={styles.aboutSection}>
                <div className={styles.aboutImage}>
                    <span className={styles.aboutImageText}>CHARLY</span>
                </div>
                <div className={styles.aboutContent}>
                    <h2 className={styles.aboutTitle}>CHARLY COACH</h2>
                    <p className={styles.aboutQuote}>
                        "No busco clientes, busco resultados. Si estás dispuesto a trabajar duro, yo te daré el camino exacto hacia tu mejor versión."
                    </p>
                    <div className={styles.socialRow}>
                        <a href="#" className={styles.socialBtn}><div className={styles.instagramIcon} /></a>
                        <a href="#" className={styles.socialBtn}><MessageCircle size={18} /></a>
                    </div>
                </div>
            </section>

            <footer className={styles.footer}>
                <div className={styles.footerLogo}>CHARLY<span className={styles.logoAccent}>COACH</span></div>
                <p className={styles.footerDesc}>© 2026 CHARLY COACH SYSTEM • ALL RIGHTS RESERVED</p>
            </footer>
        </div>
    );
};

export default Home;