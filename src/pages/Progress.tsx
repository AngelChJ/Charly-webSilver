import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Trophy, Calendar, Activity, Dumbbell, Clock, Flame } from 'lucide-react';
import styles from '../styles/Progress.module.css';

// ─── Mocks de Sesiones Reales ───────────────────────────────────
const MOCK_SESSIONS = [
    { id: '1', routineName: 'PECHO Y TRICEPS', progressPct: 100, durationMinutes: 65, date: 'Hoy' },
    { id: '2', routineName: 'PIERNA (ENFOQUE CUADRICEPS)', progressPct: 85, durationMinutes: 75, date: 'Ayer' },
    { id: '3', routineName: 'ESPALDA Y BICEPS', progressPct: 100, durationMinutes: 60, date: 'Hace 3 días' },
];

export default function ProgressLocal() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sessions');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/dashboard')} ><ChevronLeft size={20} /></button>
                <h1 className={styles.title}><span className={styles.silverText}>PROGRESO</span></h1>
                <div style={{ width: 36 }} />
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <Activity size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>12</p>
                    <p className={styles.statLabel}>SESIONES</p>
                </div>
                <div className={styles.statCard}>
                    <Dumbbell size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>4.2k</p>
                    <p className={styles.statLabel}>VOLUMEN (KG)</p>
                </div>
                <div className={styles.statCard}>
                    <TrendingUp size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>92%</p>
                    <p className={styles.statLabel}>EFECTIVIDAD</p>
                </div>
                <div className={styles.statCard}>
                    <Flame size={20} className={styles.statIcon} />
                    <p className={styles.statValue}>5</p>
                    <p className={styles.statLabel}>RACHA</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'sessions' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    <Clock size={16} /> HISTORIAL
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'weekly' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    <Calendar size={16} /> SEMANAL
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'pbs' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('pbs')}
                >
                    <Trophy size={16} /> PBs
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'sessions' && (
                    <div className={styles.sessionList}>
                        {MOCK_SESSIONS.map((session) => (
                            <div key={session.id} className={styles.sessionCard}>
                                <div className={styles.sessionHeader}>
                                    <div>
                                        <h4 className={styles.sessionName}>{session.routineName}</h4>
                                        <p className={styles.sessionDate}>{session.date}</p>
                                    </div>
                                    <span className={`${styles.sessionProgress} ${session.progressPct >= 100 ? styles.sessionComplete : ''}`}>
                                        {session.progressPct}%
                                    </span>
                                </div>
                                <div className={styles.sessionMeta}>
                                    <span>{session.durationMinutes} min de intensidad</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${session.progressPct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab !== 'sessions' && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#666' }}>
                        <p style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>MÓDULO EN DESARROLLO</p>
                    </div>
                )}
            </div>
        </div>
    );
}