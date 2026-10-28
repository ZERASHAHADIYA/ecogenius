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
                  onClick={() => onNavigate && onNavigate('challenges')}
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
                  onClick={() => onNavigate && onNavigate('leaderboard')}
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
                  onClick={() => onNavigate && onNavigate('rewards')}
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
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: '20px' }}>Admin Dashboard - Manage challenges and monitor platform activity!</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => onNavigate && onNavigate('challenges')}
                  style={{ 
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
                <button 
                  onClick={() => onNavigate && onNavigate('leaderboard')}
                  style={{ 
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
                <button 
                  onClick={() => onNavigate && onNavigate('rewards')}
                  style={{ 
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
      </div>
    </div>
  );
};

export default Dashboard;

    for (let i = 0; i < tiers.length; i++) {
      if (points < tiers[i].min_points) {
        const prevTier = i > 0 ? tiers[i - 1] : { min_points: 0 };
        const progress = ((points - prevTier.min_points) / (tiers[i].min_points - prevTier.min_points)) * 100;
        return {
          current: prevTier,
          next: tiers[i],
          progress: Math.max(0, Math.min(100, progress))
        };
      }
    }
    return { current: tiers[tiers.length - 1], next: null, progress: 100 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const badgeProgress = getNextBadgeProgress(user.eco_points || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Welcome Header */}
            <div className="card mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.name}! 🌿
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Ready to make a positive impact today?
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {user.eco_points || 0}
                  </div>
                  <div className="text-sm text-gray-500">Eco Points</div>
                </div>
              </div>
            </div>

            {/* Create Post */}
            {user.role === 'student' && (
              <div className="card mb-6">
                {!showCreatePost ? (
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full flex items-center space-x-3 p-4 text-left text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=2E7D32&color=fff`}
                      alt="You"
                      className="w-10 h-10 rounded-full"
                    />
                    <span>Share your eco-friendly activities...</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=2E7D32&color=fff`}
                        alt="You"
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <textarea
                          value={newPost.content}
                          onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                          placeholder="Share your sustainability journey..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setNewPost({...newPost, file: e.target.files[0]})}
                        className="text-sm text-gray-500"
                      />
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCreatePost(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={!newPost.content.trim()}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Feed Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <Filter size={20} className="text-gray-500" />
              <div className="flex space-x-2">
                {[
                  { key: 'recent', label: 'Most Recent' },
                  { key: 'trending', label: 'Trending' },
                  { key: 'department', label: 'My Department' }
                ].map(filterOption => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map(post => (
                  <FeedCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    onUpdate={loadDashboardData}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🌱</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500">Be the first to share your eco-journey!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              
              <div className="flex items-center justify-center mb-4">
                <ProgressRing
                  progress={badgeProgress.progress}
                  size={120}
                  color="#2E7D32"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {getBadgeEmoji(user.badges)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {badgeProgress.next ? `${Math.round(badgeProgress.progress)}%` : 'Max Level'}
                    </div>
                  </div>
                </ProgressRing>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {user.badges?.[user.badges.length - 1] || '🌱 Green Beginner'}
                </div>
                {badgeProgress.next && (
                  <div className="text-sm text-gray-500 mt-1">
                    {badgeProgress.next.min_points - (user.eco_points || 0)} points to {badgeProgress.next.emoji} {badgeProgress.next.name}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {(user.role === 'admin' || user.role === 'faculty') && stats.users && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.users.total_students}</div>
                    <div className="text-sm text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.challenges.active_challenges}</div>
                    <div className="text-sm text-gray-500">Active Challenges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.submissions.verified}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{Math.round(stats.users.participation_rate)}%</div>
                    <div className="text-sm text-gray-500">Participation</div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Preview */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Eco-Champions</h3>
                <TrendingUp size={20} className="text-primary" />
              </div>
              
              <div className="space-y-3">
                {topUsers.slice(0, 5).map((topUser, index) => (
                  <div key={topUser._id} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>
                    
                    <img
                      src={topUser.avatar_url || `https://ui-avatars.com/api/?name=${topUser.name}&background=2E7D32&color=fff`}
                      alt={topUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{topUser.name}</div>
                      <div className="text-sm text-gray-500">{topUser.department}</div>
                    </div>
                    
                    <div className="text-sm font-semibold text-primary">
                      {topUser.eco_points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Challenges */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Latest Challenges</h3>
                <Award size={20} className="text-primary" />
              </div>
              
              <div className="space-y-3">
                {recentChallenges.map(challenge => (
                  <div key={challenge._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900 mb-1">{challenge.title}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{challenge.category}</span>
                      <span className="text-primary font-semibold">{challenge.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
