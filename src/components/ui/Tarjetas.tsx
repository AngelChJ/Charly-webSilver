import { Check } from 'lucide-react';
import styles from './Tarjetas.module.css';

interface ProgramaProps {
    titulo: string;
    desc: string;
    icono: React.ReactNode;
    activo: boolean;
    onClick: () => void;
}

export const TarjetaPrograma = ({ titulo, desc, icono, activo, onClick }: ProgramaProps) => {
    return (
        <div
            className={`${styles.progCard} ${activo ? styles.progActivo : ''}`}
            onClick={onClick}
        >
            <div className={styles.progIcon}>{icono}</div>
            <h3 className={styles.progTitle}>{titulo}</h3>
            <p className={styles.progDesc}>{desc}</p>
        </div>
    );
};

interface PrecioProps {
    nombre: string;
    precio: string;
    beneficios: string[];
    popular: boolean;
}

export const TarjetaPrecio = ({ nombre, precio, beneficios, popular }: PrecioProps) => {
    return (
        <div className={`${styles.priceCard} ${popular ? styles.pricePopular : ''}`}>
            <h3 className={styles.priceName}>{nombre}</h3>
            <div className={styles.priceValue}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{precio}</span>
                <span className={styles.period}>/MES</span>
            </div>
            <ul className={styles.benefitList}>
                {beneficios.map((b, i) => (
                    <li key={i} className={styles.benefitItem}>
                        <Check size={14} className={styles.checkIcon} />
                        <span className="text-gray-400">{b}</span>
                    </li>
                ))}
            </ul>
            <button className={styles.selectBtn}>
                {popular ? 'LO QUIERO - CONTACTAR AL COACH' : 'PREGUNTAR POR ESTE PLAN'}
            </button>
        </div>
    );
};