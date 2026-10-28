import { useState, useEffect } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications
} from '../services/notificationService';

export default function NotificationCenter({ user, isOpen, onClose, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadNotifications = () => {
    const list = getNotifications(user?._id || user?.id, user?.role);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('ecogenius:notification', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ecogenius:notification', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'approvals') return n.type === 'approval';
    if (filter === 'rejections') return n.type === 'rejection';
    if (filter === 'badges') return n.type === 'badge';
    if (filter === 'challenges') return n.type === 'challenge';
    if (filter === 'rewards') return n.type === 'reward';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'approval':
        return {
          bg: '#E8F5E9',
          border: '#81C784',
          icon: '✅',
          iconBg: '#C8E6C9',
          color: '#2E7D32',
          tag: 'Proof Approved'
        };
      case 'rejection':
        return {
          bg: '#FFEBEE',
          border: '#EF9A9A',
          icon: '❌',
          iconBg: '#FFCDD2',
          color: '#C62828',
          tag: 'Needs Revision'
        };
      case 'badge':
        return {
          bg: '#FFF8E1',
          border: '#FFE082',
          icon: '🏆',
          iconBg: '#FFECB3',
          color: '#F57F17',
          tag: 'Badge Earned'
        };
      case 'reward':
        return {
          bg: '#F3E5F5',
          border: '#CE93D8',
          icon: '🎁',
          iconBg: '#E1BEE7',
          color: '#6A1B9A',
          tag: 'Reward Store'
        };
      case 'challenge':
      default:
        return {
          bg: '#E0F2F1',
          border: '#80CBC4',
          icon: '🎯',
          iconBg: '#B2DFDB',
          color: '#00695C',
          tag: 'Challenge Update'
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998
        }}
      />

      {/* Slide-in Notification Center Modal */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '420px',
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          border: '2px solid #81C784',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>In-App Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#FF5722',
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Real-time challenge, proof & badge updates
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#F8F9FA',
            borderBottom: '1px solid #E0E0E0',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'approvals', label: '✅ Approvals', count: notifications.filter(n => n.type === 'approval').length },
            { id: 'rejections', label: '❌ Rejections', count: notifications.filter(n => n.type === 'rejection').length },
            { id: 'badges', label: '🏆 Badges', count: notifications.filter(n => n.type === 'badge').length },
            { id: 'challenges', label: '🎯 Challenges', count: notifications.filter(n => n.type === 'challenge').length },
            { id: 'rewards', label: '🎁 Rewards', count: notifications.filter(n => n.type === 'reward').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: filter === tab.id ? '1px solid #2E7D32' : '1px solid #E0E0E0',
                backgroundColor: filter === tab.id ? '#2E7D32' : 'white',
                color: filter === tab.id ? 'white' : '#555',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Quick Actions Bar */}
        {notifications.length > 0 && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#FAFAFA',
              borderBottom: '1px solid #EEEEEE',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}
          >
            <span style={{ color: '#777' }}>
              Showing {filteredNotifs.length} of {notifications.length} notifications
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead(user?._id || user?.id, user?.role)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2E7D32',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    padding: 0
                  }}
                >
                  ✓ Mark all as read
                </button>
              )}
              <button
                onClick={() => clearNotifications(user?._id || user?.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D32F2F',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Notifications Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {filteredNotifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
              <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>All caught up!</div>
              <p style={{ fontSize: '13px', margin: '6px 0 0', color: '#777' }}>
                No notifications in this category. Complete challenges and submit proofs to see real-time updates here.
              </p>
            </div>
          ) : (
            filteredNotifs.map(n => {
              const style = getBadgeStyle(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: n.read ? '#FAFAFA' : style.bg,
                    border: `1px solid ${n.read ? '#E0E0E0' : style.border}`,
                    boxShadow: n.read ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = n.read ? 'none' : '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Unread Indicator Dot */}
                  {!n.read && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '9px',
                        height: '9px',
                        backgroundColor: '#FF5722',
                        borderRadius: '50%',
                        boxShadow: '0 0 6px rgba(255, 87, 34, 0.6)'
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: style.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0
                      }}
                    >
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: style.iconBg,
                            color: style.color
                          }}
                        >
                          {style.tag}
                        </span>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          {formatTime(n.timestamp)}
                        </span>
                      </div>

                      <div style={{ fontWeight: 'bold', color: '#1B5E20', fontSize: '14px', marginBottom: '4px' }}>
                        {n.title}
                      </div>

                      <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.4', marginBottom: '8px' }}>
                        {n.message}
                      </div>

                      {/* Points badge if applicable */}
                      {n.points && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span
                            style={{
                              backgroundColor: '#2E7D32',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}
                          >
                            +{n.points} Eco-Points
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '12px' }}>
                        {n.type === 'challenge' && onNavigate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                              onClose();
                              onNavigate('all-challenges');
                            }}
                            style={{
                              backgroundColor: '#2E7D32',
                              color: 'white',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            View Challenges →
                          </button>
                        )}
                        {n.type === 'reward' && onNavigate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                              onClose();
                              onNavigate('rewards');
                            }}
                            style={{
                              backgroundColor: '#6A1B9A',
                              color: 'white',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Open Eco-Store →
                          </button>
                        )}
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#666',
                              fontSize: '11px',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F5F5F5',
            borderTop: '1px solid #E0E0E0',
            textAlign: 'center',
            fontSize: '12px',
            color: '#666'
          }}
        >
          Sri Eshwar Campus Sustainability • Live Updates Enabled
        </div>
      </div>
    </>
  );
}
