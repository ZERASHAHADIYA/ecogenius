import { useState, useEffect } from 'react';

const Leaderboard = ({ user, onNavigate }) => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [departmentLeaderboard, setDepartmentLeaderboard] = useState([]);
  const [selectedTab, setSelectedTab] = useState('global');
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [globalRes, departmentRes] = await Promise.all([
        fetch('http://localhost:5000/api/leaderboard/global', { headers }),
        fetch(`http://localhost:5000/api/leaderboard/department/${user?.department}`, { headers })
      ]);

      const globalData = await globalRes.json();
      const departmentData = await departmentRes.json();

      setGlobalLeaderboard(globalData.leaderboard || []);
      setDepartmentLeaderboard(departmentData.leaderboard || []);

      const userIndex = globalData.leaderboard?.findIndex(u => u._id === user?._id);
      if (userIndex !== -1) {
        setUserRank(userIndex + 1);
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#4CAF50';
    }
  };

  const getBadgeEmoji = (badges) => {
    if (!badges || badges.length === 0) return '🌱';
    const lastBadge = badges[badges.length - 1];
    if (lastBadge.includes('🏅')) return '🏅';
    if (lastBadge.includes('🌳')) return '🌳';
    if (lastBadge.includes('🌾')) return '🌾';
    if (lastBadge.includes('🌿')) return '🌿';
    return '🌱';
  };

  const renderLeaderboardCard = (users, title, description) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
      border: '2px solid #81C784'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#2E7D32', fontSize: '28px', margin: '0 0 10px 0' }}>
          {title}
        </h2>
        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
          {description}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div>
          <p style={{ color: '#2E7D32', fontSize: '18px' }}>Loading rankings...</p>
        </div>
      ) : users.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {users.slice(0, 10).map((leaderUser, index) => {
            const rank = index + 1;
            const isCurrentUser = leaderUser._id === user?._id;
            
            return (
              <div
                key={leaderUser._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  borderRadius: '15px',
                  backgroundColor: isCurrentUser ? '#E8F5E8' : '#F5F5F5',
                  border: isCurrentUser ? '3px solid #2E7D32' : '2px solid transparent',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  if (!isCurrentUser) {
                    e.currentTarget.style.backgroundColor = '#E8F5E8';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isCurrentUser) {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: getRankColor(rank),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginRight: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                  {rank <= 3 ? getRankIcon(rank) : rank}
                </div>

                {/* User Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <h3 style={{ 
                      color: '#2E7D32', 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      margin: '0 10px 0 0'
                    }}>
                      {leaderUser.name}
                      {isCurrentUser && (
                        <span style={{ 
                          color: '#4CAF50', 
                          fontSize: '16px', 
                          marginLeft: '10px' 
                        }}>
                          (You!)
                        </span>
                      )}
                    </h3>
                    <div style={{ fontSize: '20px' }}>
                      {getBadgeEmoji(leaderUser.badges)}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {leaderUser.department} • {leaderUser.role}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#81C784',
                    fontWeight: 'bold'
                  }}>
                    {leaderUser.badges?.join(' • ') || 'New Member'}
                  </div>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {leaderUser.eco_points || 0} pts
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666' 
                  }}>
                    Eco Points
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <p>No data available yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F5F5F5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <button 
          onClick={() => onNavigate('dashboard')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          🏆 Eco Leaderboard
        </h1>
        <p style={{ fontSize: '20px', margin: 0, opacity: 0.9 }}>
          See who's leading the sustainability movement on campus!
        </p>
        
        {userRank && (
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '15px 30px',
            borderRadius: '25px',
            display: 'inline-block',
            marginTop: '20px'
          }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              🎯 Your Rank: #{userRank} • {user?.eco_points || 0} Points
            </span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* Tab Navigation */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '5px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          display: 'flex'
        }}>
          <button
            onClick={() => setSelectedTab('global')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: selectedTab === 'global' ? '#2E7D32' : 'transparent',
              color: selectedTab === 'global' ? 'white' : '#2E7D32',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            🌍 Global Leaderboard
          </button>
          <button
            onClick={() => setSelectedTab('department')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: selectedTab === 'department' ? '#2E7D32' : 'transparent',
              color: selectedTab === 'department' ? 'white' : '#2E7D32',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            🏢 {user?.department || 'Department'} Leaderboard
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #FFD700'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🥇</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {globalLeaderboard[0]?.eco_points || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Top Score</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #4CAF50'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {globalLeaderboard.length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Active Users</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #81C784'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {user?.eco_points || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Your Points</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #2E7D32'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📈</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              #{userRank || '?'}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Your Rank</div>
          </div>
        </div>

        {/* Leaderboard Content */}
        {selectedTab === 'global' && renderLeaderboardCard(
          globalLeaderboard,
          '🌍 Global Leaderboard',
          'Top eco-warriors across all departments'
        )}

        {selectedTab === 'department' && renderLeaderboardCard(
          departmentLeaderboard,
          `🏢 ${user?.department || 'Department'} Leaderboard`,
          `Top performers in ${user?.department || 'your department'}`
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
