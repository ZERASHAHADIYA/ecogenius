import React, { useState, useEffect } from 'react';
import { getNotifications } from '../services/notificationService';
import { subscribeToSync } from '../services/realtimeSync';

const StudentHeaderNav = ({
  user,
  currentPage,
  onNavigate,
  onOpenNotifications,
  onLogout
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnread = () => {
      const notifs = getNotifications(user?._id || user?.id, user?.role);
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    };

    updateUnread();
    const cleanup = subscribeToSync(updateUnread);
    return cleanup;
  }, [user]);

  const isAdmin = user?.role === 'admin';

  const navTabs = isAdmin ? [
    { id: 'admin-dashboard', label: '🛡️ Admin Approval Queue', page: 'admin-dashboard' },
    { id: 'all-challenges', label: '🎯 Challenges Oversight', page: 'all-challenges' },
    { id: 'greenhub', label: '🌱 GreenHUB Feed', page: 'greenhub' },
    { id: 'leaderboard', label: '🏆 Fair Leaderboard', page: 'leaderboard' },
    { id: 'admin-analytics', label: '📈 Executive Analytics', page: 'admin-analytics' }
  ] : [
    { id: 'dashboard', label: '🏠 Dashboard', page: 'dashboard' },
    { id: 'greenhub', label: '🌱 GreenHUB', page: 'greenhub' },
    { id: 'all-challenges', label: '🎯 Overall Challenges', page: 'all-challenges' },
    { id: 'my-challenges', label: '📋 My Challenges', page: 'my-challenges' },
    { id: 'recommendations', label: '💡 AI Recommendations', page: 'recommendations' },
    { id: 'student-analytics', label: '📊 My Analytics', page: 'student-analytics' },
    { id: 'leaderboard', label: '🏆 Leaderboard', page: 'leaderboard' },
    { id: 'rewards', label: '🎁 Eco-Store', page: 'rewards' }
  ];

  return (
    <header style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2071&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      position: 'relative',
      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.35)',
      zIndex: 100
    }}>
      {/* Background Dimmer Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(27, 94, 32, 0.78)',
        zIndex: 1
      }}></div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 20px'
      }}>
        {/* Top Bar: Brand & Quick Metrics */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px'
        }}>
          {/* Logo & Platform Title */}
          <div 
            onClick={() => onNavigate('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🌿
            </div>
            <div>
              <div style={{
                fontSize: '22px',
                fontWeight: '900',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }}>
                EcoGenius
              </div>
              <div style={{
                fontSize: '11px',
                opacity: 0.9,
                fontWeight: '600',
                color: '#C8E6C9'
              }}>
                Sri Eshwar College of Engineering
              </div>
            </div>
          </div>

          {/* Points Pill, Notifications, Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Eco-Points Badge */}
            <div 
              onClick={() => onNavigate('rewards')}
              title="Click to visit Eco-Store"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                padding: '8px 16px',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <span>💰</span>
              <span>{user?.eco_points || 0} Eco-Points</span>
            </div>

            {/* Notification Bell with Real-time Unread Badge */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={onOpenNotifications}
                title="Notifications"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                🔔
              </button>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#E53935',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '800',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    pointerEvents: 'none',
                    minWidth: '16px',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: 'white'
                }}
              >
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>

              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                  minWidth: '220px',
                  zIndex: 1000,
                  overflow: 'hidden',
                  border: '1px solid #E0E0E0'
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEEEEE', backgroundColor: '#F9FBF9' }}>
                    <div style={{ fontWeight: 'bold', color: '#1B5E20', fontSize: '14px' }}>{user?.name || 'Student'}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{user?.email || 'student@sece.ac.in'}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{user?.department || 'Engineering'}</div>
                  </div>

                  {!isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('my-challenges');
                          setShowProfileDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#333',
                          borderBottom: '1px solid #F0F0F0'
                        }}
                      >
                        📋 My Challenges
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('student-analytics');
                          setShowProfileDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#333',
                          borderBottom: '1px solid #F0F0F0'
                        }}
                      >
                        📊 My Sustainability Analytics
                      </button>
                    </>
                  )}

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        onNavigate('admin-dashboard');
                        setShowProfileDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: '#E8F5E9',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#1B5E20',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #F0F0F0'
                      }}
                    >
                      🛡️ Switch to Admin Portal
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      if (onLogout) onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#C62828',
                      fontWeight: 'bold'
                    }}
                  >
                    👋 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Navigation Bar: Organized, Clean, Separated */}
        <nav style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none'
        }}>
          {navTabs.map(tab => {
            const isActive = currentPage === tab.page;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.page)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                  color: isActive ? '#1B5E20' : '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default StudentHeaderNav;
