import { Loader } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#080808',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <Loader size={48} style={{
                animation: 'spin 1s linear infinite',
                color: '#BCC6CC'
            }} />
            <p style={{
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                fontWeight: 600
            }}>
                CARGANDO...
            </p>
        </div>
    );
}