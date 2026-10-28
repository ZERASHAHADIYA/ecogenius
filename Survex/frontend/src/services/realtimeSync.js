/**
 * Real-time Platform Synchronization Service
 * Manages live activity streams, cross-tab synchronization,
 * challenge participant tracking, and unified real-time event broadcasting.
 */

const ACTIVITIES_STORAGE_KEY = 'ecogenius_platform_activities';
const SYNC_EVENT = 'ecogenius:sync';
const ACTIVITY_EVENT = 'ecogenius:activity';

// Default initial activities if none are stored
const getInitialActivities = () => [
  {
    id: 'act-init-1',
    type: 'submission',
    studentId: 'user1',
    studentName: 'John Doe',
    studentDepartment: 'Computer Science Engineering',
    challengeId: '1',
    challengeTitle: 'Plastic-Free Week Challenge',
    status: 'pending',
    proofImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=500&q=80',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    points: 50,
    badge: 'pending'
  },
  {
    id: 'act-init-2',
    type: 'join',
    studentId: 'user-priya',
    studentName: 'Priya Sharma',
    studentDepartment: 'Environmental Science',
    challengeId: '2',
    challengeTitle: 'Campus Tree Planting Drive',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    badge: 'joined'
  },
  {
    id: 'act-init-3',
    type: 'approval',
    studentId: 'user-anita',
    studentName: 'Anita Patel',
    studentDepartment: 'Business Administration',
    challengeId: '3',
    challengeTitle: 'Energy Conservation Week',
    points: 100,
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    badge: 'approved'
  }
];

export const getPlatformActivities = () => {
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialActivities();
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading platform activities:', e);
    return getInitialActivities();
  }
};

export const addPlatformActivity = ({
  type = 'join', // 'join' | 'submission' | 'approval' | 'rejection' | 'post'
  studentId,
  studentName = 'Student',
  studentDepartment = 'Engineering',
  challengeId,
  challengeTitle,
  proofImage = null,
  status = 'completed',
  points = null,
  timestamp = null,
  meta = {}
}) => {
  try {
    const activities = getPlatformActivities();
    const newActivity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type,
      studentId: studentId || 'user_' + Date.now(),
      studentName,
      studentDepartment,
      challengeId,
      challengeTitle: challengeTitle || 'Campus Sustainability Initiative',
      proofImage,
      status,
      points,
      timestamp: timestamp || new Date().toISOString(),
      badge: type === 'join' ? 'joined' : type === 'submission' ? 'pending' : type === 'approval' ? 'approved' : 'update',
      meta
    };

    const updated = [newActivity, ...activities.slice(0, 99)]; // Keep latest 100 activities
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom events for immediate in-tab and cross-component reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ACTIVITY_EVENT, { detail: newActivity }));
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { action: 'activity', activity: newActivity } }));
    }

    return newActivity;
  } catch (e) {
    console.error('Error adding platform activity:', e);
    return null;
  }
};

/**
 * Broadcast an arbitrary platform sync event across the application
 */
export const broadcastSync = (type, payload = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { type, payload } }));
  }
};

/**
 * Hook or helper to subscribe to any platform updates (notifications, activities, storage)
 */
export const subscribeToSync = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e) => {
    callback(e.detail);
  };

  window.addEventListener(SYNC_EVENT, handleUpdate);
  window.addEventListener(ACTIVITY_EVENT, handleUpdate);
  window.addEventListener('storage', handleUpdate);
  window.addEventListener('ecogenius:notification', handleUpdate);

  return () => {
    window.removeEventListener(SYNC_EVENT, handleUpdate);
    window.removeEventListener(ACTIVITY_EVENT, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('ecogenius:notification', handleUpdate);
  };
};

/**
 * Format relative time for real-time activity feeds
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 45) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Just now';
  }
};
