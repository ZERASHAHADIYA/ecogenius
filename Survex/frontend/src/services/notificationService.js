/**
 * Real-time In-App Notification Service
 * Manages notification storage, badge tracking, approval/rejection updates,
 * challenge announcements, reward redemptions, and real-time event broadcasting.
 */

const STORAGE_KEY = 'ecogenius_notifications';
const TOAST_EVENT = 'ecogenius:toast';
const NOTIF_EVENT = 'ecogenius:notification';

// Initial default seed notifications if empty
const getInitialNotifications = (userId = 'default') => [
  {
    id: 'seed-notif-1',
    userId,
    type: 'challenge',
    title: '🎯 New Campus Challenge!',
    message: 'Plastic-Free Week 2.0 has just begun! Join now and divert single-use plastics for 50 Eco-Points.',
    points: 50,
    read: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'seed-notif-2',
    userId,
    type: 'badge',
    title: '🏆 Welcome Badge Unlocked!',
    message: "You've earned the '🌱 Green Beginner' badge for joining the Sri Eshwar Sustainability Platform.",
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'seed-notif-3',
    userId,
    type: 'reward',
    title: '🎁 Eco-Store Restocked!',
    message: 'New Bamboo Cutlery Kits and Solar Power Banks are now redeemable with your Eco-Points.',
    read: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getNotifications = (userId, role = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = getInitialNotifications(userId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const all = JSON.parse(raw);
    const isAdmin = role === 'admin' || userId === 'admin';
    if (userId) {
      // Return user specific notifications + general platform broadcasts + admin notifications if admin
      return all.filter(n => {
        if (!n.userId || n.userId === 'all') return true;
        if (n.userId === userId) return true;
        if (isAdmin && n.userId === 'admin') return true;
        return false;
      });
    }
    return all;
  } catch (e) {
    console.error('Error reading notifications:', e);
    return [];
  }
};

export const addNotification = ({
  userId = 'all',
  type = 'general', // 'approval' | 'rejection' | 'badge' | 'challenge' | 'reward' | 'general'
  title,
  message,
  points = null,
  challengeId = null,
  meta = {},
  showToast = true
}) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userId,
      type,
      title,
      message,
      points,
      challengeId,
      meta,
      read: false,
      timestamp: new Date().toISOString()
    };

    const updated = [newNotif, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom window events for immediate same-tab reactive update
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT, { detail: newNotif }));

    if (showToast) {
      window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
        detail: {
          id: newNotif.id,
          type: newNotif.type,
          title: newNotif.title,
          message: newNotif.message,
          points: newNotif.points
        }
      }));
    }

    // Attempt to sync with backend API if online
    try {
      fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif)
      }).catch(() => {});
    } catch {}

    return newNotif;
  } catch (e) {
    console.error('Failed to add notification:', e);
    return null;
  }
};

export const markAsRead = (id) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT, { detail: { action: 'mark_read', id } }));
    
    fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
  } catch (e) {
    console.error('Error marking read:', e);
  }
};

export const markAllAsRead = (userId, role = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const isAdmin = role === 'admin' || userId === 'admin';
    const updated = list.map(n => {
      if (!userId || !n.userId || n.userId === 'all' || n.userId === userId || (isAdmin && n.userId === 'admin')) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT, { detail: { action: 'mark_all_read' } }));

    if (userId) {
      fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Error marking all read:', e);
  }
};

export const clearNotifications = (userId) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const filtered = userId ? list.filter(n => n.userId && n.userId !== userId && n.userId !== 'all') : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT, { detail: { action: 'clear' } }));
  } catch (e) {
    console.error('Error clearing notifications:', e);
  }
};

// Cache to prevent duplicate toasts from spamming the user
const recentToasts = new Map();

export const triggerToast = ({ type = 'general', title, message, points = null, duration = 4000 }) => {
  const toastKey = `${type}:${title || ''}:${message || ''}`;
  const now = Date.now();
  const lastTime = recentToasts.get(toastKey);
  
  // Deduplicate: ignore if identical toast fired within last 5 seconds
  if (lastTime && (now - lastTime) < 5000) {
    return;
  }
  recentToasts.set(toastKey, now);

  // Clean old entries from recentToasts
  if (recentToasts.size > 50) {
    for (const [k, t] of recentToasts.entries()) {
      if (now - t > 10000) recentToasts.delete(k);
    }
  }

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: {
      id: 'toast_' + now + '_' + Math.random().toString(36).substr(2, 4),
      type,
      title,
      message,
      points,
      duration
    }
  }));
};

// Background real-time poller to sync notifications across tabs and backend
if (typeof window !== 'undefined') {
  setInterval(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const serverNotifs = data.notifications || [];
      if (!serverNotifs.length) return;

      const raw = localStorage.getItem(STORAGE_KEY);
      const localList = raw ? JSON.parse(raw) : [];
      const localIds = new Set(localList.map(n => n.id || n._id));

      let hasNew = false;
      const newItems = [];

      for (const sn of serverNotifs) {
        const id = sn._id || sn.id;
        if (!localIds.has(id)) {
          hasNew = true;
          const formatted = {
            id,
            userId: sn.user_id || 'all',
            type: sn.type || 'general',
            title: sn.title || 'Update',
            message: sn.message || '',
            points: sn.points || null,
            challengeId: sn.challenge_id || null,
            read: sn.read || false,
            timestamp: sn.created_at || new Date().toISOString()
          };
          newItems.push(formatted);
        }
      }

      if (hasNew) {
        const merged = [...newItems, ...localList];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent(NOTIF_EVENT, { detail: { action: 'sync', count: newItems.length } }));
      }
    } catch {}
  }, 4000);
}

