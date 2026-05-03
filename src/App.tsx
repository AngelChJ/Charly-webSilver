import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login'
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import './App.css'; // Mantenemos el css global si hay configuraciones importantes, o puedes quitarlo si prefieres.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
