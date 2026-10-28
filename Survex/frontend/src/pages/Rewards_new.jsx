import { useState, useEffect } from 'react';

const Rewards = ({ user, onNavigate }) => {
  const [rewards, setRewards] = useState([]);
  const [userClaims, setUserClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('available');

  useEffect(() => {
    loadRewards();
    if (user?.role === 'student') {
      loadUserClaims();
    }
  }, []);

  const loadRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('http://localhost:5000/api/rewards', { headers });
      const data = await response.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserClaims = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/rewards/my-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUserClaims(data.claims || []);
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const handleClaimReward = async (rewardId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadRewards();
        loadUserClaims();
        // Update user points in localStorage
        const updatedUser = { ...user, eco_points: user.eco_points - rewards.find(r => r._id === rewardId).cost };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const getRewardIcon = (type) => {
    switch (type) {
      case 'certificate': return '🏆';
      case 'meal_token': return '🍽️';
      case 'merchandise': return '🎁';
      case 'voucher': return '🎫';
      default: return '🌟';
    }
  };

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
          🎁 Eco Rewards Store
        </h1>
        <p style={{ fontSize: '20px', margin: 0, opacity: 0.9 }}>
          Redeem your eco-points for amazing sustainable rewards!
        </p>
        
        {user?.role === 'student' && (
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '15px 30px',
            borderRadius: '25px',
            display: 'inline-block',
            marginTop: '20px'
          }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
              💰 {user?.eco_points || 0} Eco-Points Available
            </span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* Tab Navigation for Students */}
        {user?.role === 'student' && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '5px',
            marginBottom: '30px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            display: 'flex'
          }}>
            <button
              onClick={() => setSelectedTab('available')}
              style={{
                flex: 1,
                padding: '15px',
                border: 'none',
                borderRadius: '10px',
                backgroundColor: selectedTab === 'available' ? '#2E7D32' : 'transparent',
                color: selectedTab === 'available' ? 'white' : '#2E7D32',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🛍️ Available Rewards
            </button>
            <button
              onClick={() => setSelectedTab('claimed')}
              style={{
                flex: 1,
                padding: '15px',
                border: 'none',
                borderRadius: '10px',
                backgroundColor: selectedTab === 'claimed' ? '#2E7D32' : 'transparent',
                color: selectedTab === 'claimed' ? 'white' : '#2E7D32',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              📦 My Rewards ({userClaims.length})
            </button>
          </div>
        )}

        {/* Available Rewards */}
        {(selectedTab === 'available' || user?.role === 'admin') && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ color: '#2E7D32', fontSize: '28px', margin: 0 }}>
                🛍️ Available Rewards
              </h2>
              {user?.role === 'admin' && (
                <button style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
                }}>
                  ➕ Add New Reward
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎁</div>
                <p style={{ color: '#2E7D32', fontSize: '18px' }}>Loading rewards...</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '25px' 
              }}>
                {rewards.map(reward => {
                  const canAfford = user?.eco_points >= reward.cost;
                  const isOutOfStock = reward.stock <= 0;
                  
                  return (
                    <div
                      key={reward._id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        border: `2px solid ${canAfford && !isOutOfStock ? '#4CAF50' : '#81C784'}`,
                        opacity: isOutOfStock ? 0.6 : 1,
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        if (!isOutOfStock) {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 15px 35px rgba(46, 125, 50, 0.2)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                          {getRewardIcon(reward.type)}
                        </div>
                        <h3 style={{ 
                          color: '#2E7D32', 
                          fontSize: '22px', 
                          fontWeight: 'bold',
                          margin: '0 0 10px 0'
                        }}>
                          {reward.title}
                        </h3>
                        <p style={{ 
                          color: '#666', 
                          fontSize: '16px', 
                          lineHeight: '1.5',
                          margin: 0
                        }}>
                          {reward.description}
                        </p>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '10px 20px',
                          borderRadius: '20px',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          💰 {reward.cost} points
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: reward.stock > 10 ? '#4CAF50' : '#F57C00',
                          fontWeight: 'bold'
                        }}>
                          📦 {reward.stock} left
                        </div>
                      </div>

                      {user?.role === 'student' ? (
                        <button
                          onClick={() => handleClaimReward(reward._id)}
                          disabled={!canAfford || isOutOfStock}
                          style={{
                            width: '100%',
                            backgroundColor: canAfford && !isOutOfStock ? '#2E7D32' : '#81C784',
                            color: 'white',
                            border: 'none',
                            padding: '15px',
                            borderRadius: '25px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: canAfford && !isOutOfStock ? 'pointer' : 'not-allowed',
                            transition: 'background-color 0.3s'
                          }}
                          onMouseOver={(e) => {
                            if (canAfford && !isOutOfStock) {
                              e.target.style.backgroundColor = '#1B5E20';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (canAfford && !isOutOfStock) {
                              e.target.style.backgroundColor = '#2E7D32';
                            }
                          }}
                        >
                          {isOutOfStock 
                            ? '❌ Out of Stock' 
                            : !canAfford 
                              ? `💸 Need ${reward.cost - user?.eco_points} more points`
                              : '🎁 Claim Reward'
                          }
                        </button>
                      ) : (
                        <button style={{
                          width: '100%',
                          backgroundColor: '#81C784',
                          color: 'white',
                          border: 'none',
                          padding: '15px',
                          borderRadius: '25px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}>
                          ⚙️ Manage Reward
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Claimed Rewards */}
        {selectedTab === 'claimed' && user?.role === 'student' && (
          <div>
            <h2 style={{ color: '#2E7D32', fontSize: '28px', marginBottom: '25px' }}>
              📦 My Claimed Rewards
            </h2>

            {userClaims.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px' 
              }}>
                {userClaims.map(claim => (
                  <div
                    key={claim._id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '15px',
                      padding: '20px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      border: '2px solid #4CAF50'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ fontSize: '32px', marginRight: '15px' }}>
                        {getRewardIcon(claim.reward_type)}
                      </div>
                      <div>
                        <h4 style={{ color: '#2E7D32', margin: '0 0 5px 0' }}>
                          {claim.reward_title}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Claimed on {new Date(claim.claimed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#E8F5E8',
                      padding: '10px 15px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#2E7D32',
                      fontWeight: 'bold'
                    }}>
                      💰 Cost: {claim.cost} points
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
                <h3 style={{ color: '#2E7D32', fontSize: '24px', marginBottom: '10px' }}>
                  No rewards claimed yet
                </h3>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  Start participating in challenges to earn points and claim rewards!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
