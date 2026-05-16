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
        { id: 0, nombre: "PLAN ESTÁNDAR", precio: "800", beneficios: ["Dieta personalizada", "Rutina base", "Seguimiento quincenal"], mensaje: "Hola%20Charly%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20el%20plan%20est%C3%A1ndar" },
        { id: 1, nombre: "PLAN PREMIUM", precio: "1200", beneficios: ["Acceso 24/7", "Coach por WhatsApp", "Registro de progreso"], mensaje: "Hola%20Charly%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20el%20plan%20premium" },
        { id: 2, nombre: "PLAN AVANZADO", precio: "1800", beneficios: ["Todo lo anterior", "Acompañamiento personalizado", "Suplementación"], mensaje: "Hola%20Charly%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20el%20plan%20avanzado" }
    ];

    const COACH_WHATSAPP = '+522216395801';
    const COACH_INSTAGRAM = 'https://www.instagram.com/04carlosr/';

    const whatsappGeneral = `https://wa.me/${COACH_WHATSAPP}?text=Hola%20Charly%2C%20estoy%20interesado%20en%20uno%20de%20tus%20planes%20de%20entrenamiento%2C%20podr%C3%ADas%20darme%20m%C3%A1s%20informaci%C3%B3n`;

    const whatsappPlan = `https://wa.me/${COACH_WHATSAPP}?text=${planes[planSeleccionado]?.mensaje}`;

    return (
        <div className={styles.container}>
            <nav className={styles.nav}>
                <div className={styles.logo}>CHARLY<span className={styles.silverText}>COACH</span></div>
                <div className={styles.navLinks}>
                    <a href="#programas">SISTEMAS</a>
                    <a href="#planes">PLANES</a>
                    <a href="#contacto">CONTACTO</a>
                </div>
                <Link to="/login" className={styles.loginBtn}>ACCEDER</Link>
            </nav>

            <header className={styles.hero}>
                <span className={styles.taglineTitanium}>LEGACY OF STRENGTH</span>
                <h1 className={styles.heroTitle}>
                    DOMINA <br /> <span className={styles.silverHero}>TU CUERPO</span>
                </h1>
                <p className={styles.heroDesc}>
                    Entrenamiento de élite y nutrición inteligente. Resultados reales para personas reales.
                </p>
                <a href={whatsappGeneral} target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
                    ESCRÍBEME POR WHATSAPP <ArrowRight size={16} />
                </a>
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
                        <div
                            key={p.id}
                            onClick={() => {
                                setPlanSeleccionado(p.id);
                                window.open(`https://wa.me/${COACH_WHATSAPP}?text=${p.mensaje}`, '_blank');
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <TarjetaPrecio
                                {...p}
                                popular={planSeleccionado === p.id}
                            />
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <a
                        href={whatsappPlan}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 2rem',
                            borderRadius: '50px',
                            background: 'linear-gradient(180deg, #ffffffb9 0%, #BCC6CC 50%, #808080 100%)',
                            color: '#000',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            textDecoration: 'none',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <MessageCircle size={18} /> QUIERO EL {planes[planSeleccionado]?.nombre}
                    </a>
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
                        <a href={COACH_INSTAGRAM} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                            <div className={styles.instagramIcon} />
                        </a>
                        <a href={whatsappGeneral} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                            <MessageCircle size={18} />
                        </a>
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