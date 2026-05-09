import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import CoachRoute from './components/CoachRoute';

import './App.css';

// Carga inmediata (páginas públicas)
import Home from './pages/Home';
import Login from './pages/Login';

// Carga diferida (páginas protegidas)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute><Progress /></ProtectedRoute>
          } />
          <Route path="/coach" element={
            <CoachRoute><CoachDashboard /></CoachRoute>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;