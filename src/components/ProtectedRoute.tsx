import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from 'lucide-react';
import type { JSX } from 'react';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();

    if (loading) {
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
                <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>VERIFICANDO SESIÓN...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}