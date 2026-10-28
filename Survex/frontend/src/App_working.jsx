import { useState, useEffect } from 'react';
import Login from './pages/Login_simple';
import Dashboard from './pages/Dashboard_simple';
import Challenges from './pages/Challenges_new';
import Rewards from './pages/Rewards_new';
import Leaderboard from './pages/Leaderboard_new';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2E7D32',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading Platform...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  const renderCurrentPage = () => {
    if (!user) {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'challenges':
        return <Challenges user={user} onNavigate={handleNavigate} />;
      case 'rewards':
        return <Rewards user={user} onNavigate={handleNavigate} />;
      case 'leaderboard':
        return <Leaderboard user={user} onNavigate={handleNavigate} />;
      case 'dashboard':
      default:
        return <Dashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
      {renderCurrentPage()}
    </div>
  );
}

export default App;
