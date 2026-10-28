import React, { useState, useEffect } from 'react';
import StudentHeaderNav from '../components/StudentHeaderNav';
import { triggerToast, addNotification } from '../services/notificationService';

const INITIAL_REWARDS = [
  {
    id: 'rew_1',
    title: 'SECE Bamboo Thermal Eco-Flask (750ml)',
    description: 'Double-walled vacuum insulated organic bamboo flask with Sri Eshwar green insignia. Keeps drinks cold for 24h or hot for 12h. Replaces 300+ plastic bottles annually.',
    category: 'merch',
    categoryLabel: 'Campus Merch',
    points_required: 150,
    stock: 24,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    impact: 'Prevents ~35kg plastic waste / yr',
    pickupLocation: 'Green Campus Cell, Block 1 - Desk 4'
  },
  {
    id: 'rew_2',
    title: 'SECE Food Court Green Dining Meal Voucher',
    description: 'Complimentary wholesome nutritious lunch or organic fresh cold-pressed juice combo at the Sri Eshwar Food Court. Valid for 30 days from claim.',
    category: 'dining',
    categoryLabel: 'Campus Dining',
    points_required: 200,
    stock: 45,
    badge: 'Best Value',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    impact: 'Supports sustainable campus farm-to-table dining',
    pickupLocation: 'SECE Central Food Court - Counter 1'
  },
  {
    id: 'rew_3',
    title: 'Zero-Waste Organic Cotton Tote Bag',
    description: 'Heavy-duty 100% GOTS certified organic unbleached canvas tote with dual reinforced straps. Screen printed with eco-friendly water-based ink.',
    category: 'merch',
    categoryLabel: 'Campus Merch',
    points_required: 120,
    stock: 38,
    badge: 'Essential',
    image: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=600&q=80',
    impact: 'Eliminates 500+ single-use polythene bags',
    pickupLocation: 'Green Campus Cell, Block 1 - Desk 4'
  },
  {
    id: 'rew_4',
    title: 'Solar Desk Study Lamp & Emergency Powerbank',
    description: 'Multi-functional foldable LED study lamp equipped with a monocrystalline solar panel and a 4000mAh backup USB battery for phone charging.',
    category: 'impact',
    categoryLabel: 'Green Tech',
    points_required: 350,
    stock: 12,
    badge: 'High Impact',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    impact: 'Saves 48 kWh grid electricity / semester',
    pickupLocation: 'Renewable Energy Lab, Electrical Block'
  },
  {
    id: 'rew_5',
    title: 'Campus Geo-Tagged Tree Sapling Adoption',
    description: 'A native neem or teak sapling will be planted in the campus green belt with your customized laser-engraved metallic honor plaque and GPS tracking coordinates.',
    category: 'impact',
    categoryLabel: 'Living Impact',
    points_required: 500,
    stock: 15,
    badge: 'Honor Roll',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    impact: 'Offsets ~22kg CO2 annually for 30+ years',
    pickupLocation: 'Campus Botanical Garden nursery (Ceremony on 1st of month)'
  },
  {
    id: 'rew_6',
    title: "Dean's Sustainability Excellence Certificate",
    description: 'Official physical parchment & cryptographically signed digital credential endorsed by SECE Dean of Student Affairs and Head of Environmental Cell. Perfect for resume & LinkedIn.',
    category: 'academic',
    categoryLabel: 'Academic Honours',
    points_required: 300,
    stock: 99,
    badge: 'Credential',
    image: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
    impact: 'Verified verified placement / graduate school sustainability credit',
    pickupLocation: 'Academic Dean Office, Admin Block - Window 2'
  },
  {
    id: 'rew_7',
    title: 'Campus Green Bicycle 30-Day Express Pass',
    description: 'Unlimited access to campus commuter bicycles located across Block 1, Block 3, Library, and Sports Arena docks. Fast RFID card or mobile unlock.',
    category: 'merch',
    categoryLabel: 'Campus Transit',
    points_required: 180,
    stock: 30,
    badge: 'Active Living',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
    impact: 'Zero-emission campus transport & physical wellness',
    pickupLocation: 'Campus Transport Desk, Near Main Gate'
  },
  {
    id: 'rew_8',
    title: 'Air-Purifying Desk Succulent in Coconut Coir Pot',
    description: 'Hardy Sansevieria (Snake Plant) or Jade succulent in 100% biodegradable coconut coir planter with customized care instructions. Natural indoor air cleaner.',
    category: 'dining',
    categoryLabel: 'Dorm Living',
    points_required: 160,
    stock: 22,
    badge: 'Wellness',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80',
    impact: 'Filters benzene & formaldehyde in hostel rooms',
    pickupLocation: 'Green Campus Cell, Block 1 - Desk 4'
  }
];

const Rewards = ({
  user,
  onNavigate,
  onOpenNotifications,
  onLogout,
  onUpdateUser
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'my-claims'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReward, setSelectedReward] = useState(null);
  const [claimedVoucher, setClaimedVoucher] = useState(null);
  const [claimedList, setClaimedList] = useState([]);
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // Dynamic user points synced with state/localStorage
  const userPoints = user?.eco_points ?? 0;

  useEffect(() => {
    // Load previously claimed rewards
    try {
      const savedClaims = localStorage.getItem('user_claimed_rewards');
      if (savedClaims) {
        setClaimedList(JSON.parse(savedClaims));
      }
    } catch (e) {
      console.error('Error loading claims:', e);
    }
  }, []);

  const handleOpenClaimModal = (reward) => {
    setSelectedReward(reward);
  };

  const handleConfirmClaim = () => {
    if (!selectedReward) return;

    if (userPoints < selectedReward.points_required) {
      alert(`Insufficient Eco-Points! You need ${selectedReward.points_required - userPoints} more points to redeem this item.`);
      return;
    }

    setIsProcessingClaim(true);

    setTimeout(() => {
      const voucherCode = `ECO-SECE-${Math.floor(100000 + Math.random() * 900000)}`;
      const newClaim = {
        voucherId: voucherCode,
        rewardId: selectedReward.id,
        rewardTitle: selectedReward.title,
        rewardImage: selectedReward.image,
        category: selectedReward.categoryLabel,
        pointsDeducted: selectedReward.points_required,
        pickupLocation: selectedReward.pickupLocation,
        claimedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'READY_FOR_PICKUP'
      };

      const updatedClaims = [newClaim, ...claimedList];
      setClaimedList(updatedClaims);
      localStorage.setItem('user_claimed_rewards', JSON.stringify(updatedClaims));

      // Deduct points
      const newPoints = userPoints - selectedReward.points_required;
      const updatedUser = {
        ...user,
        eco_points: newPoints
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      // Add student notification
      addNotification({
        userId: user._id || user.id,
        type: 'reward',
        title: '🎁 Reward Redeemed Successfully!',
        message: `Voucher ${voucherCode} generated for '${selectedReward.title}'. Collect from ${selectedReward.pickupLocation}.`,
        points: -selectedReward.points_required
      });

      triggerToast({
        type: 'approval',
        title: '🎉 Reward Redeemed!',
        message: `-${selectedReward.points_required} pts. Voucher ${voucherCode} is ready!`
      });

      setClaimedVoucher(newClaim);
      setSelectedReward(null);
      setIsProcessingClaim(false);
    }, 600);
  };

  const filteredRewards = INITIAL_REWARDS.filter(rew => {
    const matchCat = activeCategory === 'all' || rew.category === activeCategory;
    const matchQuery = rew.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rew.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rew.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F4F7F4',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
    }}>
      {/* Student Navigation Header */}
      <StudentHeaderNav
        user={{ ...user, eco_points: userPoints }}
        currentPage="rewards"
        onNavigate={onNavigate}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 20px' }}>
        
        {/* Hero Banner Card */}
        <section style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
          borderRadius: '20px',
          padding: '36px 32px',
          color: 'white',
          boxShadow: '0 12px 30px -10px rgba(27, 94, 32, 0.4)',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative floating bubbles */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            right: '180px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '14px',
                letterSpacing: '0.3px'
              }}>
                <span>🌿</span> Sri Eshwar Campus Sustainability Redemption Store
              </div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                margin: '0 0 10px 0',
                letterSpacing: '-0.5px',
                lineHeight: '1.2'
              }}>
                The EcoStore
              </h1>
              <p style={{
                fontSize: '15px',
                margin: 0,
                opacity: 0.92,
                lineHeight: '1.5',
                color: '#E8F5E9'
              }}>
                Turn your verified green campus actions into tangible rewards. Redeem eco-points for sustainable campus merchandise, food court meals, tree adoptions, and official dean credentials.
              </p>
            </div>

            {/* User Live Balance Pill Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: '20px 28px',
              minWidth: '240px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
            }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: '600', marginBottom: '6px' }}>
                Your Available Balance
              </div>
              <div style={{
                fontSize: '40px',
                fontWeight: '900',
                color: '#FFEB3B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                lineHeight: '1'
              }}>
                <span>🪙</span>
                <span>{userPoints}</span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                Eco-Points ready to redeem
              </div>
              <button
                onClick={() => onNavigate('all-challenges')}
                style={{
                  marginTop: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#1B5E20',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                + Earn More Points
              </button>
            </div>
          </div>
        </section>

        {/* Tab Switcher: Store vs My Claimed Vouchers */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Main Tabs */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#E0EAE0',
            padding: '4px',
            borderRadius: '12px'
          }}>
            <button
              onClick={() => setActiveTab('store')}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'store' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'store' ? '#1B5E20' : '#555',
                boxShadow: activeTab === 'store' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🎁 Available Eco Rewards ({INITIAL_REWARDS.length})
            </button>
            <button
              onClick={() => setActiveTab('my-claims')}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'my-claims' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'my-claims' ? '#1B5E20' : '#555',
                boxShadow: activeTab === 'my-claims' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🎟️ My Claimed Vouchers</span>
              {claimedList.length > 0 && (
                <span style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {claimedList.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          {activeTab === 'store' && (
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <input
                type="text"
                placeholder="Search rewards or merch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 38px',
                  borderRadius: '12px',
                  border: '1px solid #C8D8C8',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '15px',
                color: '#888'
              }}>
                🔍
              </span>
            </div>
          )}
        </div>

        {/* Categories Bar (when on Store tab) */}
        {activeTab === 'store' && (
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '28px'
          }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'merch', label: '👕 Campus Merchandise' },
              { id: 'dining', label: '🍽️ Food Court & Dining' },
              { id: 'impact', label: '🌱 Green Impact & Solar' },
              { id: 'academic', label: '📜 Dean Honors' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: activeCategory === cat.id ? '#1B5E20' : '#FFFFFF',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#444',
                  boxShadow: activeCategory === cat.id ? '0 4px 12px rgba(27,94,32,0.25)' : '0 2px 5px rgba(0,0,0,0.04)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Content: STORE GRID */}
        {activeTab === 'store' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {filteredRewards.map(reward => {
              const canAfford = userPoints >= reward.points_required;
              return (
                <div
                  key={reward.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #E8EFE8',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  {/* Reward Photo Header */}
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={reward.image}
                      alt={reward.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s'
                      }}
                    />
                    {/* Category Tag */}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(6px)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {reward.categoryLabel}
                    </span>

                    {/* Badge */}
                    {reward.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#FFD54F',
                        color: '#3E2723',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        ★ {reward.badge}
                      </span>
                    )}

                    {/* Stock counter */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: '#2E7D32',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      {reward.stock} in stock
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#1B5E20',
                      lineHeight: '1.3'
                    }}>
                      {reward.title}
                    </h3>
                    
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      lineHeight: '1.45',
                      margin: '0 0 14px 0',
                      flex: 1
                    }}>
                      {reward.description}
                    </p>

                    {/* Eco Impact Pill */}
                    <div style={{
                      backgroundColor: '#E8F5E9',
                      color: '#2E7D32',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🌱</span>
                      <span>{reward.impact}</span>
                    </div>

                    {/* Price and Action Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #F0F4F0',
                      paddingTop: '14px',
                      marginTop: 'auto'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>REDEEM COST</div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '900',
                          color: '#2E7D32',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>🪙</span>
                          <span>{reward.points_required}</span>
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>pts</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenClaimModal(reward)}
                        disabled={!canAfford}
                        style={{
                          backgroundColor: canAfford ? '#1B5E20' : '#E0E0E0',
                          color: canAfford ? '#FFFFFF' : '#888',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                          boxShadow: canAfford ? '0 4px 12px rgba(27, 94, 32, 0.25)' : 'none'
                        }}
                      >
                        {canAfford ? 'Redeem Item' : `Need ${reward.points_required - userPoints} pts`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content: MY CLAIMED VOUCHERS */}
        {activeTab === 'my-claims' && (
          <div>
            {claimedList.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '60px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '54px', marginBottom: '16px' }}>🎟️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1B5E20', margin: '0 0 8px 0' }}>
                  No Claimed Vouchers Yet
                </h3>
                <p style={{ color: '#666', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '14px' }}>
                  Participate in challenges, submit proof for AI and faculty approval, and earn eco-points to claim exciting rewards!
                </p>
                <button
                  onClick={() => setActiveTab('store')}
                  style={{
                    backgroundColor: '#1B5E20',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Browse Available Rewards
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {claimedList.map(voucher => (
                  <div
                    key={voucher.voucherId}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '1.5px solid #C8E6C9',
                      padding: '20px',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <img
                        src={voucher.rewardImage}
                        alt={voucher.rewardTitle}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '10px',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          textTransform: 'uppercase'
                        }}>
                          {voucher.category}
                        </span>
                        <h4 style={{ margin: '4px 0 2px 0', fontSize: '15px', fontWeight: '800', color: '#1B5E20' }}>
                          {voucher.rewardTitle}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#777' }}>
                          Claimed: {new Date(voucher.claimedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Voucher Code Box */}
                    <div style={{
                      backgroundColor: '#F1F8E9',
                      border: '1.5px dashed #4CAF50',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', marginBottom: '4px' }}>
                        CAMPUS REDEMPTION CODE
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        color: '#1B5E20',
                        fontFamily: 'monospace',
                        letterSpacing: '2px'
                      }}>
                        {voucher.voucherId}
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#444' }}>
                      <strong>📍 Pickup:</strong> {voucher.pickupLocation}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #EEE',
                      paddingTop: '12px',
                      fontSize: '12px'
                    }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: '#E8F5E9',
                        color: '#2E7D32',
                        fontWeight: '700'
                      }}>
                        ● READY FOR PICKUP
                      </span>
                      <span style={{ color: '#888' }}>
                        Cost: {voucher.pointsDeducted} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL: REDEMPTION CONFIRMATION */}
      {selectedReward && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div style={{ position: 'relative', height: '160px' }}>
              <img
                src={selectedReward.image}
                alt={selectedReward.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => setSelectedReward(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <span style={{
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '8px'
              }}>
                {selectedReward.categoryLabel}
              </span>
              <h3 style={{ margin: '8px 0 6px 0', fontSize: '18px', fontWeight: '800', color: '#1B5E20' }}>
                Confirm Reward Redemption
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                {selectedReward.title}
              </p>

              {/* Point Deduction Ledger */}
              <div style={{
                backgroundColor: '#F8FAF8',
                borderRadius: '12px',
                padding: '14px 16px',
                border: '1px solid #E0EAE0',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                  <span>Your Current Eco-Points:</span>
                  <strong>{userPoints} pts</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#D32F2F', marginBottom: '6px' }}>
                  <span>Reward Cost:</span>
                  <strong>- {selectedReward.points_required} pts</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: '800',
                  color: '#1B5E20',
                  borderTop: '1px solid #E0E0E0',
                  paddingTop: '8px'
                }}>
                  <span>Remaining Points After Claim:</span>
                  <span>{userPoints - selectedReward.points_required} pts</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px', lineHeight: '1.4' }}>
                📍 <strong>Pickup Info:</strong> {selectedReward.pickupLocation}. A digital voucher code will be issued instantly.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedReward(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #DDD',
                    backgroundColor: '#FFF',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: '#666',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClaim}
                  disabled={isProcessingClaim}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#1B5E20',
                    fontWeight: '800',
                    fontSize: '13px',
                    color: '#FFF',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(27, 94, 32, 0.3)'
                  }}
                >
                  {isProcessingClaim ? 'Generating Voucher...' : 'Confirm & Redeem Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLAIM SUCCESS & VOUCHER RECEIPT */}
      {claimedVoucher && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            border: '2px solid #C8E6C9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1B5E20', margin: '0 0 6px 0' }}>
              Redemption Successful!
            </h3>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px 0' }}>
              Show this digital pass to the campus coordinator for collection.
            </p>

            {/* Voucher Badge Box */}
            <div style={{
              backgroundColor: '#F1F8E9',
              border: '2px dashed #4CAF50',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', letterSpacing: '1px', fontWeight: '700' }}>
                DIGITAL REDEMPTION PASS
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '900',
                color: '#1B5E20',
                fontFamily: 'monospace',
                letterSpacing: '3px',
                margin: '8px 0'
              }}>
                {claimedVoucher.voucherId}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                {claimedVoucher.rewardTitle}
              </div>
            </div>

            <div style={{
              textAlign: 'left',
              fontSize: '12px',
              color: '#555',
              backgroundColor: '#FAFAFA',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '22px'
            }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>📍 Collection Location:</strong> {claimedVoucher.pickupLocation}
              </div>
              <div>
                <strong>⏱️ Valid Until:</strong> {new Date(claimedVoucher.expiresAt).toLocaleDateString()}
              </div>
            </div>

            <button
              onClick={() => {
                setClaimedVoucher(null);
                setActiveTab('my-claims');
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#1B5E20',
                color: 'white',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(27, 94, 32, 0.3)'
              }}
            >
              View in My Claimed Vouchers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
