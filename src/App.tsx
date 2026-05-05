import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import ProtectedRoute from './components/ProtectedRoute';
import CoachDashboard from './pages/CoachDashboard';
import CoachRoute from './components/CoachRoute';

import './App.css';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;