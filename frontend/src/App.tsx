import { Link, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WrappedPage from './pages/WrappedPage';

export default function App() {
  return (
    <div className="container">
      <nav>
        <h1>Instagram Wrapped</h1>
        <div>
          <Link to="/">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/wrapped">Wrapped</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wrapped" element={<WrappedPage />} />
      </Routes>
    </div>
  );
}
