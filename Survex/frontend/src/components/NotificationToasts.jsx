import { useState, useEffect } from 'react';

export default function NotificationToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const detail = e.detail;
      if (!detail) return;

      const toastId = detail.id || 'toast_' + Date.now();
      const newToast = {
        id: toastId,
        type: detail.type || 'general',
        title: detail.title || 'Notification',
        message: detail.message || '',
        points: detail.points || null,
        duration: detail.duration || 4500
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep at most 5 toasts on screen

      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, newToast.duration);
    };

    window.addEventListener('ecogenius:toast', handleToastEvent);
    return () => {
      window.removeEventListener('ecogenius:toast', handleToastEvent);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const getToastColors = (type) => {
    switch (type) {
      case 'approval':
        return {
          bg: '#1B5E20',
          border: '#81C784',
          accent: '#4CAF50',
          icon: '🎉'
        };
      case 'rejection':
        return {
          bg: '#B71C1C',
          border: '#EF9A9A',
          accent: '#FF5252',
          icon: '⚠️'
        };
      case 'badge':
        return {
          bg: '#E65100',
          border: '#FFD54F',
          accent: '#FFC107',
          icon: '🏆'
        };
      case 'reward':
        return {
          bg: '#4A148C',
          border: '#CE93D8',
          accent: '#BA68C8',
          icon: '🎁'
        };
      case 'challenge':
      default:
        return {
          bg: '#004D40',
          border: '#80CBC4',
          accent: '#26A69A',
          icon: '🎯'
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: '380px',
        width: 'calc(100vw - 40px)'
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes toastShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {toasts.map((toast) => {
        const colors = getToastColors(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: colors.bg,
              color: 'white',
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              border: `2px solid ${colors.border}`,
              position: 'relative',
              overflow: 'hidden',
              animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {colors.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.95, lineHeight: '1.4' }}>
                {toast.message}
              </div>
              {toast.points && (
                <div style={{ marginTop: '6px' }}>
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}
                  >
                    +{toast.points} Eco-Points
                  </span>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              ✕
            </button>

            {/* Shrinking timer bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                backgroundColor: colors.accent,
                animation: `toastShrink ${toast.duration}ms linear forwards`
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
