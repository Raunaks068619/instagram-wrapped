import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WrappedPage from './pages/WrappedPage';
import { session } from './api/client';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!session.getUserId());
  const location = useLocation();

  useEffect(() => {
    // Check login status on route changes or initial load
    setIsLoggedIn(!!session.getUserId());
  }, [location]);

  const handleLogout = () => {
    session.clear();
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <div className="layout-root">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>IG Wrapped</h1>
        </div>
        <div className="sidebar-links">
          {!isLoggedIn && <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Login</Link>}
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/wrapped" className={location.pathname === '/wrapped' ? 'active' : ''}>Wrapped</Link>
          {isLoggedIn && <button onClick={handleLogout} className="logout-btn">Logout</button>}
        </div>
      </nav>
      <main className="content-area">
        <div className="container">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wrapped" element={<WrappedPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
