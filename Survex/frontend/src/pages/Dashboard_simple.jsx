import { useState, useEffect } from 'react';

const Dashboard = ({ user, onNavigate }) => {
  const [challenges, setChallenges] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Load challenges
      const challengesRes = await fetch('http://localhost:5000/api/challenges', { headers });
      const challengesData = await challengesRes.json();
      setChallenges(challengesData.challenges || []);

      // Load posts
      const postsRes = await fetch('http://localhost:5000/api/feed', { headers });
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);

    } catch (err) {
      setError('Failed to load data: ' + err.message);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error: {error}</h2>
        <button onClick={loadData} style={{ padding: '10px', marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Navigation Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        color: 'white', 
        padding: '20px',
        boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: 'bold' }}>
              🌿 Windsurf Dashboard
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
              Welcome back, {user?.name || 'User'}! Ready to make a difference?
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              💰 {user?.eco_points || 0} Eco-Points
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white', 
                border: '2px solid rgba(255,255,255,0.3)', 
                padding: '10px 20px', 
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
            >
              👋 Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* User Info Card */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2>👤 Profile Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>Department:</strong> {user?.department}</div>
            <div><strong>Year:</strong> {user?.year}</div>
            <div><strong>Eco Points:</strong> {user?.eco_points || 0}</div>
            <div><strong>Badges:</strong> {user?.badges?.join(', ') || 'None'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Challenges Section */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>🎯 Available Challenges</h2>
            {challenges.length > 0 ? (
              challenges.map(challenge => (
                <div key={challenge._id} style={{ 
                  border: '1px solid #ddd', 
                  padding: '15px', 
                  marginBottom: '10px', 
                  borderRadius: '8px'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>{challenge.title}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666' }}>{challenge.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      backgroundColor: '#4CAF50', 
                      color: 'white', 
                      padding: '5px 10px', 
                      borderRadius: '15px',
                      fontSize: '14px'
                    }}>
                      {challenge.points} Points
                    </span>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      Category: {challenge.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p>No challenges available</p>
            )}
          </div>

          {/* Social Feed Section */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>🌱 Green Hub Feed</h2>
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post._id} style={{ 
                  border: '1px solid #ddd', 
                  padding: '15px', 
                  marginBottom: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: '#2E7D32', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}>
                      {post.student?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{post.student?.name || 'User'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(post.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 10px 0' }}>{post.content}</p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                    <span>👍 {post.likes || 0} likes</span>
                    <span>💬 {post.comments?.length || 0} comments</span>
                    <span>🔄 {post.shares || 0} shares</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No posts yet. Be the first to share!</p>
            )}
          </div>
        </div>

        {/* Role-Based Quick Actions */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <h2>🚀 Quick Actions</h2>
          
          {user?.role === 'student' ? (
            <div>
              <p style={{ color: '#666', marginBottom: '20px' }}>Student Dashboard - Participate in challenges and earn rewards!</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => onNavigate('challenges')}
                  style={{ 
                    backgroundColor: '#2E7D32', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                  🎯 Join New Challenge
                </button>
                <button 
                  onClick={() => onNavigate('leaderboard')}
                  style={{ 
                    backgroundColor: '#1976D2', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                  🏆 View Leaderboard
                </button>
                <button 
                  onClick={() => onNavigate('rewards')}
                  style={{ 
                    backgroundColor: '#F57C00', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                  🎁 Redeem Rewards
                </button>
                <button style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  📱 Share Achievement
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: '20px' }}>Admin Dashboard - Manage challenges and monitor platform activity!</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button style={{ 
                  backgroundColor: '#7B1FA2', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  ➕ Create Challenge
                </button>
                <button style={{ 
                  backgroundColor: '#D32F2F', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  ✅ Verify Submissions
                </button>
                <button style={{ 
                  backgroundColor: '#1976D2', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  📊 View Analytics
                </button>
                <button style={{ 
                  backgroundColor: '#F57C00', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  🎁 Manage Rewards
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role-Specific Features */}
        {user?.role === 'admin' && (
          <div style={{ 
            backgroundColor: '#fff3e0', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '20px',
            border: '2px solid #F57C00'
          }}>
            <h3>👨‍💼 Admin Features</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                <h4>📝 Challenge Management</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Create, edit, and manage sustainability challenges for students</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                <h4>✅ Submission Review</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Review and approve student challenge submissions</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                <h4>📊 Platform Analytics</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Monitor participation rates and environmental impact</p>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'student' && (
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '20px',
            border: '2px solid #2E7D32'
          }}>
            <h3>🎓 Student Progress</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>{user?.eco_points || 0}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Eco Points Earned</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>{user?.badges?.length || 0}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Badges Collected</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>#{Math.floor(Math.random() * 50) + 1}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Leaderboard Rank</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
