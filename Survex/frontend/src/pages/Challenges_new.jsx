import { useState, useEffect } from 'react';

const Challenges = ({ user, onNavigate }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    category: 'Waste Management',
    points: 50
  });

  const categories = [
    'all',
    'Waste Management',
    'Green Campus Activities', 
    'Energy Conservation',
    'Water Conservation',
    'Sustainable Mobility',
    'Awareness & Innovation',
    'Community Impact'
  ];

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('http://localhost:5000/api/challenges', { headers });
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newChallenge)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewChallenge({ title: '', description: '', category: 'Waste Management', points: 50 });
        loadChallenges();
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const filteredChallenges = selectedCategory === 'all' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

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
          🎯 EcoQuest Challenges
        </h1>
        <p style={{ fontSize: '20px', margin: 0, opacity: 0.9 }}>
          {user?.role === 'student' 
            ? 'Join sustainability challenges and earn eco-points!'
            : 'Create and manage sustainability challenges for students'
          }
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* Admin Create Challenge */}
        {user?.role === 'admin' && (
          <div style={{ marginBottom: '30px' }}>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
              }}
            >
              ➕ Create New Challenge
            </button>

            {showCreateForm && (
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '15px',
                marginTop: '20px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                border: '2px solid #81C784'
              }}>
                <h3 style={{ color: '#2E7D32', marginBottom: '20px' }}>Create New Challenge</h3>
                <form onSubmit={handleCreateChallenge}>
                  <input
                    type="text"
                    placeholder="Challenge Title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '15px',
                      marginBottom: '15px',
                      border: '2px solid #81C784',
                      borderRadius: '10px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <textarea
                    placeholder="Challenge Description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    required
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '15px',
                      marginBottom: '15px',
                      border: '2px solid #81C784',
                      borderRadius: '10px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <select
                      value={newChallenge.category}
                      onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})}
                      style={{
                        flex: 1,
                        padding: '15px',
                        border: '2px solid #81C784',
                        borderRadius: '10px',
                        fontSize: '16px'
                      }}
                    >
                      {categories.slice(1).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Points"
                      value={newChallenge.points}
                      onChange={(e) => setNewChallenge({...newChallenge, points: parseInt(e.target.value)})}
                      min="10"
                      max="500"
                      style={{
                        width: '120px',
                        padding: '15px',
                        border: '2px solid #81C784',
                        borderRadius: '10px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#2E7D32',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Create Challenge
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      style={{
                        backgroundColor: '#81C784',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '15px' }}>Filter by Category</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  backgroundColor: selectedCategory === category ? '#2E7D32' : '#81C784',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s'
                }}
              >
                {category === 'all' ? '🌍 All Categories' : `🌱 ${category}`}
              </button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌿</div>
            <p style={{ color: '#2E7D32', fontSize: '18px' }}>Loading challenges...</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '25px' 
          }}>
            {filteredChallenges.map(challenge => (
              <div
                key={challenge._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '25px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  border: '2px solid #81C784',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(46, 125, 50, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ 
                    color: '#2E7D32', 
                    fontSize: '22px', 
                    fontWeight: 'bold',
                    margin: 0,
                    lineHeight: '1.3'
                  }}>
                    {challenge.title}
                  </h3>
                  <div style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    minWidth: 'fit-content'
                  }}>
                    {challenge.points} pts
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#81C784',
                  color: 'white',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  marginBottom: '15px'
                }}>
                  {challenge.category}
                </div>

                <p style={{ 
                  color: '#666', 
                  fontSize: '16px', 
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  {challenge.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#81C784' }}>
                    👥 {challenge.participants?.length || 0} participants
                  </div>
                  
                  {user?.role === 'student' ? (
                    <button style={{
                      backgroundColor: '#2E7D32',
                      color: 'white',
                      border: 'none',
                      padding: '12px 25px',
                      borderRadius: '25px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#1B5E20'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#2E7D32'}
                    >
                      🎯 Join Challenge
                    </button>
                  ) : (
                    <button style={{
                      backgroundColor: '#81C784',
                      color: 'white',
                      border: 'none',
                      padding: '12px 25px',
                      borderRadius: '25px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}>
                      ⚙️ Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredChallenges.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌱</div>
            <h3 style={{ color: '#2E7D32', fontSize: '24px', marginBottom: '10px' }}>
              No challenges found
            </h3>
            <p style={{ color: '#666', fontSize: '16px' }}>
              {selectedCategory === 'all' 
                ? 'No challenges available yet.' 
                : `No challenges in "${selectedCategory}" category.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
