import { useState, useEffect } from 'react';

const Dashboard = ({ user, onNavigate }) => {
  const [challenges, setChallenges] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('challenges');
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);

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
        boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
        position: 'relative'
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
              🌿 EcoGenius Dashboard
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
              Welcome back, {user?.name || 'User'}! Ready to make a difference?
            </p>
          </div>
          
          {/* Header Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Eco Points */}
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              💰 {user?.eco_points || 0} Points
            </div>

            {/* Notifications */}
            <button style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'white',
              position: 'relative'
            }}>
              🔔
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                backgroundColor: '#FF4444',
                borderRadius: '50%',
                width: '12px',
                height: '12px',
                fontSize: '8px'
              }}></span>
            </button>

            {/* Achievements */}
            <button 
              onClick={() => onNavigate('achievements')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                cursor: 'pointer',
                fontSize: '20px',
                color: 'white'
              }}
            >
              🏆
            </button>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: 'white'
                }}
              >
                👤
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '55px',
                  right: '0',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  minWidth: '200px',
                  zIndex: 1000
                }}>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#333',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    👤 My Details
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('my-challenges');
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#333',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    🎯 My Challenges
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#333'
                    }}
                  >
                    👋 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Banner Section */}
        <div style={{
          background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
          padding: '30px',
          borderRadius: '15px',
          marginBottom: '30px',
          border: '2px solid #81C784',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#2E7D32', fontSize: '28px', margin: '0 0 10px 0' }}>
            🌱 Welcome to Your Sustainability Journey!
          </h2>
          <p style={{ color: '#1B5E20', fontSize: '16px', margin: 0 }}>
            Track your eco-impact, participate in challenges, and connect with fellow green warriors!
          </p>
        </div>

        {/* GreenHUB Social Media Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          <h2 style={{ color: '#2E7D32', fontSize: '24px', marginBottom: '20px' }}>
            🌱 GreenHUB - Share Your Achievements
          </h2>
          
          {/* Post Creation */}
          <div style={{
            backgroundColor: '#F5F5F5',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your sustainability achievements, eco-friendly activities, or green tips..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '15px',
                border: '2px solid #81C784',
                borderRadius: '10px',
                fontSize: '16px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPostImage(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="post-image"
                />
                <label
                  htmlFor="post-image"
                  style={{
                    backgroundColor: '#81C784',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginRight: '10px'
                  }}
                >
                  📷 Add Photo
                </label>
                {postImage && <span style={{ color: '#2E7D32', fontSize: '14px' }}>✓ Image selected</span>}
              </div>
              <button
                onClick={() => {
                  if (newPost.trim()) {
                    // Add post functionality here
                    setNewPost('');
                    setPostImage(null);
                  }
                }}
                style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🌿 Share Post
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div>
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post._id} style={{
                  backgroundColor: '#F9F9F9',
                  padding: '20px',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  border: '1px solid #E0E0E0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#2E7D32',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      marginRight: '15px'
                    }}>
                      {post.student?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2E7D32' }}>
                        {post.student?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(post.timestamp).toLocaleDateString()} • {post.student?.department}
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 15px 0', fontSize: '16px', lineHeight: '1.5' }}>{post.content}</p>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4CAF50' }}>
                      👍 {post.likes || 0} likes
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2196F3' }}>
                      💬 {post.comments?.length || 0} comments
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF9800' }}>
                      🔄 {post.shares || 0} shares
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌱</div>
                <p>No posts yet. Be the first to share your green journey!</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #E0E0E0',
            marginBottom: '25px'
          }}>
            <button
              onClick={() => setActiveTab('challenges')}
              style={{
                padding: '15px 30px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: activeTab === 'challenges' ? '3px solid #2E7D32' : '3px solid transparent',
                color: activeTab === 'challenges' ? '#2E7D32' : '#666',
                transition: 'all 0.3s'
              }}
            >
              🎯 Available Challenges
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              style={{
                padding: '15px 30px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: activeTab === 'leaderboard' ? '3px solid #2E7D32' : '3px solid transparent',
                color: activeTab === 'leaderboard' ? '#2E7D32' : '#666',
                transition: 'all 0.3s'
              }}
            >
              🏆 View Leaderboard
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'challenges' && (
            <div>
              <h3 style={{ color: '#2E7D32', fontSize: '22px', marginBottom: '20px' }}>
                🎯 Available Challenges
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {challenges.length > 0 ? (
                  challenges.map(challenge => (
                    <div key={challenge._id} style={{
                      border: '2px solid #81C784',
                      padding: '20px',
                      borderRadius: '15px',
                      backgroundColor: '#F9F9F9',
                      transition: 'transform 0.3s, box-shadow 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <h4 style={{ margin: '0 0 10px 0', color: '#2E7D32', fontSize: '18px' }}>
                        {challenge.title}
                      </h4>
                      <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                        {challenge.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '5px 15px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {challenge.points} Points
                        </span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          📂 {challenge.category}
                        </span>
                      </div>
                      
                      {/* Image Upload Section */}
                      <div style={{
                        backgroundColor: '#E8F5E8',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '15px'
                      }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#2E7D32' }}>
                          📷 Submit Your Proof:
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`challenge-${challenge._id}`}
                        />
                        <label
                          htmlFor={`challenge-${challenge._id}`}
                          style={{
                            backgroundColor: '#81C784',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '10px'
                          }}
                        >
                          📸 Upload Image
                        </label>
                        <button
                          style={{
                            backgroundColor: '#2E7D32',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✅ Submit Proof
                        </button>
                      </div>

                      <button
                        style={{
                          width: '100%',
                          backgroundColor: '#2E7D32',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      >
                        🚀 Join Challenge
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
                    <p>No challenges available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div>
              <h3 style={{ color: '#2E7D32', fontSize: '22px', marginBottom: '20px' }}>
                🏆 Leaderboard - Top Eco Warriors
              </h3>
              <div style={{
                backgroundColor: '#F9F9F9',
                borderRadius: '10px',
                padding: '20px'
              }}>
                {/* Leaderboard Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 120px',
                  gap: '15px',
                  padding: '15px',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}>
                  <div>Rank</div>
                  <div>Student</div>
                  <div>Points</div>
                  <div>Challenges</div>
                </div>

                {/* Sample Leaderboard Data */}
                {[
                  { rank: 1, name: user?.name || 'You', points: user?.eco_points || 250, challenges: 5, isUser: true },
                  { rank: 2, name: 'Priya Sharma', points: 320, challenges: 7, isUser: false },
                  { rank: 3, name: 'Rahul Kumar', points: 280, challenges: 6, isUser: false },
                  { rank: 4, name: 'Anita Patel', points: 240, challenges: 5, isUser: false },
                  { rank: 5, name: 'Vikram Singh', points: 220, challenges: 4, isUser: false }
                ].map(student => (
                  <div
                    key={student.rank}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 100px 120px',
                      gap: '15px',
                      padding: '15px',
                      backgroundColor: student.isUser ? '#E8F5E8' : 'white',
                      border: student.isUser ? '2px solid #2E7D32' : '1px solid #E0E0E0',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>
                      {student.rank <= 3 ? ['🥇', '🥈', '🥉'][student.rank - 1] : `#${student.rank}`}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2E7D32' }}>
                        {student.name} {student.isUser && '(You)'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {user?.department || 'Computer Science'}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                      {student.points}
                    </div>
                    <div style={{ color: '#666' }}>
                      {student.challenges} completed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
//   );
// };

// export default Dashboard;
//                   <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>{challenge.title}</h3>
//                   <p style={{ margin: '0 0 10px 0', color: '#666' }}>{challenge.description}</p>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <span style={{ 
//                       backgroundColor: '#4CAF50', 
//                       color: 'white', 
//                       padding: '5px 10px', 
//                       borderRadius: '15px',
//                       fontSize: '14px'
//                     }}>
//                       {challenge.points} Points
//                     </span>
//                     <span style={{ fontSize: '14px', color: '#666' }}>
//                       Category: {challenge.category}
//                     </span>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p>No challenges available</p>
//             )}
//           </div>

//           {/* Social Feed Section */}
//           <div style={{ 
//             backgroundColor: 'white', 
//             padding: '20px', 
//             borderRadius: '10px', 
//             boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//           }}>
//             <h2>🌱 Green Hub Feed</h2>
//             {posts.length > 0 ? (
//               posts.map(post => (
//                 <div key={post._id} style={{ 
//                   border: '1px solid #ddd', 
//                   padding: '15px', 
//                   marginBottom: '15px', 
//                   borderRadius: '8px'
//                 }}>
//                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
//                     <div style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: '#2E7D32', 
//                       borderRadius: '50%', 
//                       display: 'flex', 
//                       alignItems: 'center', 
//                       justifyContent: 'center',
//                       color: 'white',
//                       fontWeight: 'bold',
//                       marginRight: '10px'
//                     }}>
//                       {post.student?.name?.charAt(0) || 'U'}
//                     </div>
//                     <div>
//                       <div style={{ fontWeight: 'bold' }}>{post.student?.name || 'User'}</div>
//                       <div style={{ fontSize: '12px', color: '#666' }}>
//                         {new Date(post.timestamp).toLocaleDateString()}
//                       </div>
//                     </div>
//                   </div>
//                   <p style={{ margin: '0 0 10px 0' }}>{post.content}</p>
//                   <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
//                     <span>👍 {post.likes || 0} likes</span>
//                     <span>💬 {post.comments?.length || 0} comments</span>
//                     <span>🔄 {post.shares || 0} shares</span>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p>No posts yet. Be the first to share!</p>
//             )}
//           </div>
//         </div>

//         {/* Role-Based Quick Actions */}
//         <div style={{ 
//           backgroundColor: 'white', 
//           padding: '20px', 
//           borderRadius: '10px', 
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           marginTop: '20px',
//           textAlign: 'center'
//         }}>
//           <h2>🚀 Quick Actions</h2>
          
//           {user?.role === 'student' ? (
//             <div>
//               <p style={{ color: '#666', marginBottom: '20px' }}>Student Dashboard - Participate in challenges and earn rewards!</p>
//               <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
//                 <button 
//                   onClick={() => onNavigate && onNavigate('challenges')}
//                   style={{ 
//                     backgroundColor: '#2E7D32', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '12px 24px', 
//                     borderRadius: '8px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}>
//                   🎯 Join New Challenge
//                 </button>
//                 <button 
//                   onClick={() => onNavigate && onNavigate('leaderboard')}
//                   style={{ 
//                     backgroundColor: '#1976D2', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '12px 24px', 
//                     borderRadius: '8px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}>
//                   🏆 View Leaderboard
//                 </button>
//                 <button 
//                   onClick={() => onNavigate && onNavigate('rewards')}
//                   style={{ 
//                     backgroundColor: '#F57C00', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '12px 24px', 
//                     borderRadius: '8px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}>
//                   🎁 Redeem Rewards
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div>
//               <p style={{ color: '#666', marginBottom: '20px' }}>Admin Dashboard - Manage challenges and monitor platform activity!</p>
//               <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
//                 <button 
//                   onClick={() => onNavigate && onNavigate('challenges')}
//                   style={{ 
//                     backgroundColor: '#7B1FA2', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '12px 24px', 
//                     borderRadius: '8px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}>
//                   ➕ Create Challenge
//                 </button>
//                 <button style={{ 
//                   backgroundColor: '#D32F2F', 
//                   color: 'white', 
//                   border: 'none', 
//                   padding: '12px 24px', 
//                   borderRadius: '8px',
//                   cursor: 'pointer',
//                   fontSize: '16px'
//                 }}>
//                   ✅ Verify Submissions
//                 </button>
//                 <button 
//                   onClick={() => onNavigate && onNavigate('leaderboard')}
//                   style={{ 
//                     backgroundColor: '#1976D2', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '12px 24px', 
//                     borderRadius: '8px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}>
//                   📊 View Analytics
//                 </button>
//                 <button 
//                   onClick={() => onNavigate && onNavigate('rewards')}
//                   style={{ 
//                     backgroundColor: '#F57C00', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '12px 24px', 
//                     borderRadius: '8px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}>
//                   🎁 Manage Rewards
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

