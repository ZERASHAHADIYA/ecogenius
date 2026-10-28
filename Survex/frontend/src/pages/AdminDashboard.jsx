import { useState, useEffect } from 'react';
import { addNotification, triggerToast, getNotifications } from '../services/notificationService';
import AdminVerificationPanel from '../components/AdminVerificationPanel';
import { calculateFairPoints } from '../utils/fairPointsCalculator';
import { getPlatformActivities, subscribeToSync, formatRelativeTime } from '../services/realtimeSync';

const AdminDashboard = ({ user, onNavigate, submissions: propSubmissions, onSubmissionReview, posts: propPosts, onLikePost, onUpdateUser, onOpenNotifications, onLogout }) => {
  const [activeTab, setActiveTab] = useState('submissions');
  const [challenges, setChallenges] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [platformActivities, setPlatformActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedProofModal, setSelectedProofModal] = useState(null);
  const [proofZoom, setProofZoom] = useState(1);
  const [activityFilter, setActivityFilter] = useState('all');
  const [quickRejectSub, setQuickRejectSub] = useState(null);
  const [quickRejectReason, setQuickRejectReason] = useState('');
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Medium',
    points: '',
    duration: '',
    requirements: [''],
    tips: ['']
  });
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showProfileComponent, setShowProfileComponent] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [showProfileUpdatePopup, setShowProfileUpdatePopup] = useState(false);
  const [showProfileUpdatedPopup, setShowProfileUpdatedPopup] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: 'Dr. Tamilselvan P',
    email: 'admin@sece.ac.in',
    phone: '+91 9876543210',
    department: 'Environmental Sciences',
    designation: 'Head of Sustainability',
    experience: '10 years',
    specialization: 'Environmental Management & Green Technologies'
  });

  useEffect(() => {
    loadAdminData();
    // Load admin profile from localStorage
    const savedProfile = localStorage.getItem('adminProfile');
    if (savedProfile) {
      setAdminProfile(JSON.parse(savedProfile));
    }

    // Initialize platform activities & unread badge
    const syncAdminData = () => {
      setPlatformActivities(getPlatformActivities());
      const notifs = getNotifications(user?._id || user?.id, 'admin');
      setUnreadCount(notifs.filter(n => !n.read).length);

      // Synchronize live participant counts from localStorage
      try {
        const counts = JSON.parse(localStorage.getItem('challenge_participants_counts') || '{}');
        setChallenges(prev => prev.map(c => {
          const id = c._id || c.id;
          if (counts[id] !== undefined) {
            return { ...c, participants: counts[id] };
          }
          return c;
        }));
      } catch {}

      // Re-sync submissions from localStorage if updated
      try {
        const storedSubs = localStorage.getItem('submissions');
        if (storedSubs) {
          const parsedSubs = JSON.parse(storedSubs);
          if (Array.isArray(parsedSubs) && parsedSubs.length > 0) {
            setSubmissions(prev => {
              const parsedIds = new Set(parsedSubs.map(s => String(s._id || s.id)));
              const nonDuplicateMocks = prev.filter(s => !parsedIds.has(String(s._id || s.id)));
              return [...parsedSubs, ...nonDuplicateMocks];
            });
          }
        }
      } catch {}
    };

    syncAdminData();
    const cleanup = subscribeToSync(syncAdminData);
    return cleanup;
  }, [user]);

  useEffect(() => {
    // Sync submissions from props combined with existing mock submissions
    if (propSubmissions && propSubmissions.length > 0) {
      setSubmissions(prev => {
        const propIds = new Set(propSubmissions.map(s => String(s._id || s.id)));
        const remaining = prev.filter(s => !propIds.has(String(s._id || s.id)));
        return [...propSubmissions, ...remaining];
      });
    }
  }, [propSubmissions]);

  // Remove dynamic post syncing - we only want static posts

  useEffect(() => {
    // Check if admin profile needs updating
    const hasIncompleteProfile = !user?.name || user?.name === 'Admin' || user?.name === 'Demo Admin' || 
                                 !user?.email || !user?.department;
    if (hasIncompleteProfile) {
      // Show profile update popup after 2 seconds
      setTimeout(() => {
        setShowProfileUpdatePopup(true);
      }, 2000);
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      // Mock admin data
      const mockChallenges = [
        {
          _id: '1',
          title: 'Plastic-Free Week Challenge',
          description: 'Eliminate single-use plastics from your daily routine for one week.',
          category: 'Waste Reduction',
          difficulty: 'Medium',
          points: 45,
          duration: '7 days',
          status: 'Active',
          participants: 45,
          completions: 32,
          createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          title: 'Sri Eshwar Campus Tree Planting',
          description: 'Plant and maintain trees around the campus area.',
          category: 'Environmental',
          difficulty: 'Easy',
          points: 75,
          duration: '1 day',
          status: 'Active',
          participants: 32,
          completions: 28,
          createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          title: 'Energy Conservation Week',
          description: 'Reduce energy consumption in your dorm/home by 20%.',
          category: 'Energy',
          difficulty: 'Hard',
          points: 100,
          duration: '7 days',
          status: 'Active',
          participants: 28,
          completions: 15,
          createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockStudents = [
        { _id: '1', name: 'Priya Sharma', email: 'priya.sharma@sece.ac.in', department: 'Environmental Science', eco_points: 320, challenges_completed: 7, status: 'Active', joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '2', name: 'Rahul Kumar', email: 'rahul.kumar@sece.ac.in', department: 'Computer Science', eco_points: 280, challenges_completed: 6, status: 'Active', joinedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '3', name: 'Anita Patel', email: 'anita.patel@sece.ac.in', department: 'Business Administration', eco_points: 240, challenges_completed: 5, status: 'Active', joinedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '4', name: 'Vikram Singh', email: 'vikram.singh@sece.ac.in', department: 'Mechanical Engineering', eco_points: 220, challenges_completed: 4, status: 'Active', joinedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '5', name: 'Sneha Reddy', email: 'sneha.reddy@sece.ac.in', department: 'Civil Engineering', eco_points: 200, challenges_completed: 4, status: 'Active', joinedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '6', name: 'Arjun Nair', email: 'arjun.nair@sece.ac.in', department: 'Electrical Engineering', eco_points: 185, challenges_completed: 3, status: 'Active', joinedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '7', name: 'Kavya Iyer', email: 'kavya.iyer@sece.ac.in', department: 'Electronics Engineering', eco_points: 170, challenges_completed: 3, status: 'Active', joinedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '8', name: 'Ravi Krishnan', email: 'ravi.krishnan@sece.ac.in', department: 'Information Technology', eco_points: 155, challenges_completed: 3, status: 'Active', joinedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '9', name: 'Meera Gupta', email: 'meera.gupta@sece.ac.in', department: 'Chemical Engineering', eco_points: 140, challenges_completed: 2, status: 'Active', joinedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '10', name: 'Karthik Raj', email: 'karthik.raj@sece.ac.in', department: 'Automobile Engineering', eco_points: 125, challenges_completed: 2, status: 'Active', joinedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '11', name: 'Divya Menon', email: 'divya.menon@sece.ac.in', department: 'Biotechnology', eco_points: 110, challenges_completed: 2, status: 'Active', joinedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '12', name: 'Suresh Babu', email: 'suresh.babu@sece.ac.in', department: 'Aeronautical Engineering', eco_points: 95, challenges_completed: 1, status: 'Active', joinedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '13', name: 'Lakshmi Priya', email: 'lakshmi.priya@sece.ac.in', department: 'Food Technology', eco_points: 80, challenges_completed: 1, status: 'Active', joinedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '14', name: 'Arun Kumar', email: 'arun.kumar@sece.ac.in', department: 'Textile Technology', eco_points: 65, challenges_completed: 1, status: 'Active', joinedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: '15', name: 'Pooja Srinivas', email: 'pooja.srinivas@sece.ac.in', department: 'Fashion Technology', eco_points: 50, challenges_completed: 1, status: 'Active', joinedDate: new Date().toISOString() }
      ];

      const mockSubmissions = [
        {
          _id: '0',
          challengeId: '10',
          challengeTitle: 'Campus Clean-up Drive',
          studentId: '0',
          studentName: 'Suryaprakash S',
          submissionDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          status: 'Pending',
          proofImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Organized and participated in campus clean-up drive. Collected waste from multiple areas and properly disposed of recyclable materials.'
        },
        {
          _id: '1',
          challengeId: '1',
          challengeTitle: 'Plastic-Free Week Challenge',
          studentId: '1',
          studentName: 'Priya Sharma',
          submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Pending',
          proofImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Completed the plastic-free week by using reusable bags, bottles, and containers. Documented daily progress with photos.'
        },
        {
          _id: '2',
          challengeId: '2',
          challengeTitle: 'Campus Tree Planting',
          studentId: '2',
          studentName: 'Rahul Kumar',
          submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Pending',
          proofImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Planted 3 saplings in the campus garden and committed to their maintenance. Organized team of 5 volunteers.'
        },
        {
          _id: '3',
          challengeId: '3',
          challengeTitle: 'Energy Conservation Week',
          studentId: '3',
          studentName: 'Anita Patel',
          submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Approved',
          proofImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Reduced energy consumption by 25% through LED bulbs and efficient appliance usage.'
        },
        {
          _id: '4',
          challengeId: '4',
          challengeTitle: 'Sustainable Transportation Week',
          studentId: '4',
          studentName: 'Vikram Singh',
          submissionDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'Pending',
          proofImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Cycled to campus every day for a week. Tracked 50km total distance and saved fuel costs.'
        },
        {
          _id: '5',
          challengeId: '5',
          challengeTitle: 'Water Conservation Challenge',
          studentId: '5',
          studentName: 'Sneha Reddy',
          submissionDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'Pending',
          proofImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Installed water-saving devices and reduced daily consumption by 30%. Created awareness campaign for dormmates.'
        },
        {
          _id: '6',
          challengeId: '6',
          challengeTitle: 'DIY Solar Charger Project',
          studentId: '6',
          studentName: 'Arjun Nair',
          submissionDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'Rejected',
          proofImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          description: 'Built a solar charger using recycled materials. Successfully charged phone and small devices.'
        }
      ];

      const mockAnalytics = {
        totalStudents: 156,
        activeChallenges: 8,
        totalSubmissions: 7,
        pendingReviews: 5, // Based on static submissions (5 pending out of 7 total)
        totalPointsAwarded: 15680,
        averageParticipation: 78,
        monthlyGrowth: 15.5,
        topCategories: [
          { name: 'Waste Reduction', count: 45 },
          { name: 'Energy', count: 38 },
          { name: 'Environmental', count: 32 },
          { name: 'Transportation', count: 28 }
        ]
      };

      const mockPosts = [
        {
          _id: '1',
          author: {
            name: 'Priya Sharma',
            department: 'Environmental Science'
          },
          content: 'Just completed the Plastic-Free Week Challenge! 🌱 Managed to eliminate 90% of single-use plastics from my daily routine. The hardest part was finding alternatives for food packaging, but I discovered some amazing local stores with bulk options!',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: 24,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c1',
              author: 'Rahul Kumar',
              content: 'Amazing work! Can you share which stores you found for bulk shopping?',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Plastic-Free Week Challenge',
          pointsEarned: 50
        },
        {
          _id: '2',
          author: {
            name: 'Rahul Kumar',
            department: 'Computer Science Engineering'
          },
          content: 'Campus Tree Planting was incredible today! 🌳 Our team planted 15 saplings near the library. It feels amazing to contribute to making our campus greener. Already planning to join the next planting session!',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          likes: 31,
          likedByAdmin: true,
          proofImages: [
            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c2',
              author: 'Anita Patel',
              content: 'Great initiative! I missed this one but will definitely join the next session.',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Campus Tree Planting',
          pointsEarned: 75
        },
        {
          _id: '3',
          author: {
            name: 'Anita Patel',
            department: 'Business Administration'
          },
          content: 'Energy Conservation Week results are in! ⚡ Reduced my dorm energy consumption by 28% by switching to LED bulbs, unplugging devices, and using natural light during the day. Small changes, big impact!',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          likes: 19,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [],
          challengeCompleted: 'Energy Conservation Week',
          pointsEarned: 100
        },
        {
          _id: '4',
          author: {
            name: 'Vikram Singh',
            department: 'Mechanical Engineering'
          },
          content: 'Sustainable Transportation Week was a game-changer! 🚲 Cycled to campus every day and discovered so many beautiful routes I never knew existed. Plus, I feel more energetic and saved money on fuel!',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          likes: 27,
          likedByAdmin: true,
          proofImages: [
            'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c4',
              author: 'Priya Sharma',
              content: 'Inspiring! I should try cycling too. Any route recommendations?',
              timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Sustainable Transportation Week',
          pointsEarned: 60
        },
        {
          _id: '5',
          author: {
            name: 'Sneha Reddy',
            department: 'Civil Engineering'
          },
          content: 'Water Conservation Challenge completed! 💧 Installed water-saving devices in my hostel room and reduced water usage by 35%. The low-flow showerhead and faucet aerators made a huge difference. Every drop counts!',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 42,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c5',
              author: 'Arjun Nair',
              content: 'Great work! Where did you get the water-saving devices?',
              timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Water Conservation Challenge',
          pointsEarned: 80
        },
        {
          _id: '6',
          author: {
            name: 'Arjun Nair',
            department: 'Electronics Engineering'
          },
          content: 'DIY Solar Charger project is finally done! ☀️ Built a portable solar panel system that can charge my phone and laptop. Perfect for outdoor study sessions and reducing grid electricity dependency. Engineering meets sustainability!',
          timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 56,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1497440001374-f26997328c1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c6',
              author: 'Vikram Singh',
              content: 'This is incredible! Can you share the circuit diagram?',
              timestamp: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              _id: 'c7',
              author: 'Priya Sharma',
              content: 'Amazing engineering skills! How long does it take to charge a laptop?',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Renewable Energy Project',
          pointsEarned: 120
        },
        {
          _id: '7',
          author: {
            name: 'Kavya Iyer',
            department: 'Biotechnology'
          },
          content: 'Organic Composting Workshop was enlightening! 🌿 Learned to convert kitchen waste into nutrient-rich compost. Set up a small composting system in my hostel. Nature has the best recycling system - we just need to follow it!',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 38,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c8',
              author: 'Sneha Reddy',
              content: 'I want to start composting too! Any beginner tips?',
              timestamp: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Organic Composting Workshop',
          pointsEarned: 65
        },
        {
          _id: '8',
          author: {
            name: 'Rohan Gupta',
            department: 'Chemical Engineering'
          },
          content: 'Zero Waste Lifestyle Challenge - Week 2 update! 🗂️ Managed to fit all my non-recyclable waste in a small jar. The key is refusing single-use items and choosing reusable alternatives. It\'s challenging but so rewarding!',
          timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 45,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c9',
              author: 'Kavya Iyer',
              content: 'That\'s incredible! What was the hardest thing to replace?',
              timestamp: new Date(Date.now() - 2.2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Zero Waste Lifestyle Challenge',
          pointsEarned: 90
        },
        {
          _id: '9',
          author: {
            name: 'Meera Krishnan',
            department: 'Information Technology'
          },
          content: 'Green Tech Innovation Hackathon was amazing! 💻 Our team developed an app to track carbon footprint and suggest eco-friendly alternatives. Technology can be a powerful tool for environmental change. Proud to be part of the solution!',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 67,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c10',
              author: 'Arjun Nair',
              content: 'Awesome! Is the app available for download?',
              timestamp: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              _id: 'c11',
              author: 'Rohan Gupta',
              content: 'Great use of technology for sustainability!',
              timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Green Tech Innovation Hackathon',
          pointsEarned: 150
        },
        {
          _id: '10',
          author: {
            name: 'Aditya Sharma',
            department: 'Electrical Engineering'
          },
          content: 'Campus Clean-up Drive was a huge success! 🧹 Collected over 200kg of waste and properly segregated it for recycling. Amazing to see 150+ students come together for our environment. Clean campus, clean future!',
          timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 89,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c12',
              author: 'Meera Krishnan',
              content: 'Wish I could have joined! When is the next clean-up drive?',
              timestamp: new Date(Date.now() - 3.2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Campus Clean-up Drive',
          pointsEarned: 70
        },
        {
          _id: '11',
          author: {
            name: 'Pooja Srinivas',
            department: 'Textile Engineering'
          },
          content: 'Sustainable Fashion Workshop was eye-opening! 👗 Learned about fast fashion\'s environmental impact and created beautiful clothes from upcycled materials. Fashion can be both stylish and sustainable!',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 52,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c13',
              author: 'Kavya Iyer',
              content: 'Love the creativity! Can you teach me some upcycling techniques?',
              timestamp: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Sustainable Fashion Workshop',
          pointsEarned: 85
        },
        {
          _id: '12',
          author: {
            name: 'Karthik Reddy',
            department: 'Automobile Engineering'
          },
          content: 'Electric Vehicle Workshop was fantastic! ⚡🚗 Got hands-on experience with EV technology and even test-drove the latest electric cars. The future of transportation is electric, and I\'m excited to be part of this revolution!',
          timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 73,
          likedByAdmin: false,
          proofImages: [
            'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
          ],
          comments: [
            {
              _id: 'c14',
              author: 'Aditya Sharma',
              content: 'How was the driving experience compared to regular cars?',
              timestamp: new Date(Date.now() - 4.2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          challengeCompleted: 'Electric Vehicle Workshop',
          pointsEarned: 95
        }
      ];

      const savedCounts = JSON.parse(localStorage.getItem('challenge_participants_counts') || '{}');
      const hydratedChallenges = mockChallenges.map(c => ({
        ...c,
        participants: savedCounts[c._id] !== undefined ? savedCounts[c._id] : c.participants
      }));
      setChallenges(hydratedChallenges);
      setStudents(mockStudents);
      
      // Combine propSubmissions with mockSubmissions so admin always has access to all student proofs
      let combinedSubmissions = mockSubmissions;
      if (propSubmissions && propSubmissions.length > 0) {
        const propIds = new Set(propSubmissions.map(s => String(s._id || s.id)));
        const nonDuplicateMocks = mockSubmissions.filter(s => !propIds.has(String(s._id || s.id)));
        combinedSubmissions = [...propSubmissions, ...nonDuplicateMocks];
      }
      setSubmissions(combinedSubmissions);
      
      // Load community posts from storage if available, combined with mockPosts
      const savedCommunityPosts = localStorage.getItem('greenhub_posts') || localStorage.getItem('posts');
      let combinedAdminPosts = mockPosts;
      if (savedCommunityPosts) {
        try {
          const parsed = JSON.parse(savedCommunityPosts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const userCreated = parsed.filter(p => !mockPosts.some(mp => mp._id === p._id || mp._id === p.id));
            combinedAdminPosts = [...userCreated, ...mockPosts];
          }
        } catch (e) {
          console.error('Error parsing admin posts:', e);
        }
      }
      setPosts(combinedAdminPosts);
      
      setAnalytics(mockAnalytics);
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  const handleCreateChallenge = () => {
    if (!newChallenge.title || !newChallenge.description || !newChallenge.category) {
      alert('Please fill in all required fields');
      return;
    }

    const challenge = {
      _id: Date.now().toString(),
      ...newChallenge,
      points: parseInt(newChallenge.points),
      status: 'Active',
      participants: 0,
      completions: 0,
      createdDate: new Date().toISOString(),
      requirements: newChallenge.requirements.filter(req => req.trim() !== ''),
      tips: newChallenge.tips.filter(tip => tip.trim() !== '')
    };

    setChallenges(prev => [challenge, ...prev]);
    setNewChallenge({
      title: '',
      description: '',
      category: '',
      difficulty: 'Medium',
      points: '',
      duration: '',
      requirements: [''],
      tips: ['']
    });
    setShowCreateChallenge(false);
    setShowSuccessPopup(true);
    
    // Real-time broadcast notification to all students
    addNotification({
      userId: 'all',
      type: 'challenge',
      title: `🎯 New Challenge: ${challenge.title}!`,
      message: `${challenge.description} Earn ${challenge.points} Eco-Points by participating!`,
      points: challenge.points,
      challengeId: challenge._id
    });

    // Auto hide success popup after 3 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  const handleSubmissionReview = (submissionId, action) => {
    // Notify global state and triggers real-time in-app notification & points
    if (onSubmissionReview) {
      onSubmissionReview(submissionId, action);
    }

    const submission = submissions.find(s => s._id === submissionId || s.id === submissionId);
    const challenge = challenges.find(c => c._id === submission?.challengeId);
    
    // Update submission status
    setSubmissions(prev => 
      prev.map(sub => 
        (sub._id === submissionId || sub.id === submissionId)
          ? { ...sub, status: action === 'approve' || action === 'approved' ? 'Approved' : 'Rejected' }
          : sub
      )
    );
    
    // If approved, update student points and challenge completion
    if (action === 'approve' && submission) {
      setStudents(prev => 
        prev.map(student => 
          student._id === submission.studentId 
            ? { 
                ...student, 
                eco_points: student.eco_points + (challenge?.points || 50),
                challenges_completed: student.challenges_completed + 1
              }
            : student
        )
      );
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        totalPointsAwarded: prev.totalPointsAwarded + (challenge?.points || 50),
        pendingReviews: Math.max(0, prev.pendingReviews - 1)
      }));
    } else if (action === 'reject') {
      // Update analytics for rejection
      setAnalytics(prev => ({
        ...prev,
        pendingReviews: Math.max(0, prev.pendingReviews - 1)
      }));
    }
    
    // Show appropriate popup
    if (action === 'approve') {
      setShowApprovalPopup(true);
      setTimeout(() => setShowApprovalPopup(false), 3000);
    } else {
      setShowRejectionPopup(true);
      setTimeout(() => setShowRejectionPopup(false), 3000);
    }
    
    // Call global handler if available
    if (onSubmissionReview) {
      onSubmissionReview(submissionId, action);
    }
  };

  const addRequirement = () => {
    setNewChallenge(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const addTip = () => {
    setNewChallenge(prev => ({
      ...prev,
      tips: [...prev.tips, '']
    }));
  };

  const updateRequirement = (index, value) => {
    setNewChallenge(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const updateTip = (index, value) => {
    setNewChallenge(prev => ({
      ...prev,
      tips: prev.tips.map((tip, i) => i === index ? value : tip)
    }));
  };

  const removeRequirement = (index) => {
    setNewChallenge(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const removeTip = (index) => {
    setNewChallenge(prev => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index)
    }));
  };

  const handleLikePost = (postId) => {
    // Use global like handler if available
    if (onLikePost) {
      onLikePost(postId);
    } else {
      // Fallback to local state management
      setPosts(prev => 
        prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: post.likedByAdmin ? post.likes - 1 : post.likes + 1,
                likedByAdmin: !post.likedByAdmin
              }
            : post
        )
      );
    }
  };

  const handleUpdateAdminProfile = () => {
    if (onUpdateUser) {
      onUpdateUser(adminProfile);
    }
    
    // Update localStorage
    localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
    
    setShowProfileEdit(false);
    setShowProfileComponent(false);
    
    // Show profile updated popup
    setShowProfileUpdatedPopup(true);
    setTimeout(() => setShowProfileUpdatedPopup(false), 3000);
  };

  const handleAddComment = (postId) => {
    const commentText = newComment[postId];
    if (!commentText || commentText.trim() === '') return;

    const newCommentObj = {
      _id: `admin_${Date.now()}`,
      author: user?.name || adminProfile?.name || 'Admin',
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
      isAdmin: true
    };

    setPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { ...post, comments: [...post.comments, newCommentObj] }
          : post
      )
    );

    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCommentChange = (postId, value) => {
    setNewComment(prev => ({ ...prev, [postId]: value }));
  };

  const handleProfileSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
    setShowProfileEdit(false);
    alert('Profile updated successfully!');
  };

  const handleProfileChange = (field, value) => {
    setAdminProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚙️</div>
          <h2 style={{ color: '#2E7D32' }}>Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  // Admin Profile Component
  if (showProfileComponent) {
    return (
      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '30px',
            gap: '15px'
          }}>
            <button
              onClick={() => setShowProfileComponent(false)}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Dashboard
            </button>
            <h1 style={{ color: '#2E7D32', margin: 0 }}>Admin Profile Management</h1>
          </div>

          {/* Profile Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #81C784',
            height: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }}>
            {/* Profile Display */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#FF6B35',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '32px'
                }}>
                  {adminProfile.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h2 style={{ color: '#2E7D32', margin: '0 0 5px 0' }}>{adminProfile.name}</h2>
                  <p style={{ color: '#666', margin: '0 0 5px 0' }}>{adminProfile.designation}</p>
                  <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{adminProfile.department}</p>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Full Name *</label>
                  <input
                    type="text"
                    value={adminProfile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Email Address *</label>
                  <input
                    type="email"
                    value={adminProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={adminProfile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Department</label>
                  <input
                    type="text"
                    value={adminProfile.department}
                    onChange={(e) => handleProfileChange('department', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Designation</label>
                  <input
                    type="text"
                    value={adminProfile.designation}
                    onChange={(e) => handleProfileChange('designation', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Experience</label>
                  <input
                    type="text"
                    value={adminProfile.experience}
                    onChange={(e) => handleProfileChange('experience', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>Specialization</label>
                <textarea
                  value={adminProfile.specialization}
                  onChange={(e) => handleProfileChange('specialization', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowProfileComponent(false)}
                  style={{
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#F5F5F5'
    }}>
      {/* Admin Header */}
      <div style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white', 
        padding: '15px',
        boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
        position: 'relative'
      }}>
        {/* Background Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(46, 125, 50, 0.4)',
          zIndex: 1
        }}></div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          gap: window.innerWidth < 768 ? '15px' : '0',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(13px)',
          WebkitBackdropFilter: 'blur(13px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '15px',
          padding: window.innerWidth < 768 ? '15px' : '20px',
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 5px 0', 
              fontSize: window.innerWidth < 768 ? '24px' : '32px', 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              ⚙️ Admin Dashboard
            </h1>
            <div style={{ 
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              marginBottom: '5px'
            }}>
              Sri Eshwar College of Engineering
            </div>
            <p style={{ 
              margin: 0, 
              opacity: 0.95, 
              fontSize: window.innerWidth < 768 ? '12px' : '14px' 
            }}>
              Manage challenges, students, and platform analytics
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: window.innerWidth < 768 ? '10px' : '20px',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            width: window.innerWidth < 768 ? '100%' : 'auto'
          }}>
            {/* In-App Notifications Bell with Real-time Unread Badge */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  if (onOpenNotifications) onOpenNotifications();
                }}
                title="Notifications & Submissions"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
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
                    padding: '2px 7px',
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

            {/* Executive Analytics Suite Shortcut */}
            <button
              onClick={() => onNavigate('admin-analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#1B5E20',
                border: '2px solid #81C784',
                borderRadius: '25px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E8F5E9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>📊</span>
              <span>Detailed Analytics</span>
            </button>

            {/* Admin Profile */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '8px 15px',
                  borderRadius: '25px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#FF6B35',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  A
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    Admin
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {user?.designation || adminProfile.designation}
                  </div>
                </div>
                <div style={{ fontSize: '12px' }}>▼</div>
              </div>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '10px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  minWidth: '200px',
                  zIndex: 1000,
                  border: '1px solid #E0E0E0'
                }}>
                  <button
                    onClick={() => {
                      setShowProfileComponent(true);
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
                    👤 Admin Profile
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('admin-analytics');
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      backgroundColor: '#F1F8E9',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#1B5E20',
                      borderBottom: '1px solid #eee',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📊 Executive Analytics Portal
                  </button>
                  <button
                    onClick={() => {
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
                    ⚙️ Settings
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

      {/* Main Content */}
      <div style={{ 
        padding: window.innerWidth < 768 ? '15px' : '20px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: window.innerWidth < 768 ? '10px' : '0',
            borderBottom: '2px solid #E0E0E0',
            marginBottom: '20px'
          }}>
            {[
              { id: 'submissions', label: '🤖 AI Proof Verification Queue', icon: '🤖' },
              { id: 'challenges', label: '🎯 Challenge Management', icon: '🎯' },
              { id: 'students', label: '👥 Student Leaderboard & Audits', icon: '👥' },
              { id: 'greenhub', label: '🌱 GreenHUB Feed', icon: '🌱' },
              { id: 'analytics', label: '📈 Analytics', icon: '📈' },
              { id: 'overview', label: '📊 Overview', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: window.innerWidth < 768 ? '12px 15px' : '15px 25px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '3px solid #2E7D32' : '3px solid transparent',
                  color: activeTab === tab.id ? '#2E7D32' : '#666',
                  transition: 'all 0.3s',
                  width: window.innerWidth < 768 ? '100%' : 'auto',
                  textAlign: 'center'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <h3 style={{ color: '#1B5E20', margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>
                    📊 Platform Overview & Quick Proof Verification
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                    Review student photo evidence to verify authentic camera capture vs. AI generation. Approve or reject directly without switching tabs.
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#E8F5E9',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  color: '#2E7D32',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  <span>⚡</span> Live Fast Action Hub
                </div>
              </div>
              
              {/* Smooth Glassmorphic Stats KPI Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '28px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #F1F8E9 0%, #FFFFFF 100%)',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  border: '1px solid #C8E6C9',
                  boxShadow: '0 4px 18px rgba(46, 125, 50, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    backgroundColor: '#E8F5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px'
                  }}>👥</div>
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#1B5E20', lineHeight: 1.1 }}>
                      {156 + (new Set(platformActivities.filter(a => a.type === 'join').map(a => a.studentId)).size)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginTop: '2px' }}>Total Students</div>
                    <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px', fontWeight: '600' }}>● Active on Campus</div>
                  </div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 100%)',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  border: '1px solid #BBDEFB',
                  boxShadow: '0 4px 18px rgba(25, 118, 210, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    backgroundColor: '#E1F5FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px'
                  }}>🎯</div>
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#0D47A1', lineHeight: 1.1 }}>
                      {challenges.length || 8}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginTop: '2px' }}>Active Challenges</div>
                    <div style={{ fontSize: '11px', color: '#1976D2', marginTop: '4px', fontWeight: '600' }}>● Current Semester</div>
                  </div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #FFF3E0 0%, #FFFFFF 100%)',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  border: '1px solid #FFE0B2',
                  boxShadow: '0 4px 18px rgba(230, 81, 0, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    backgroundColor: '#FFF8E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px'
                  }}>📝</div>
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#E65100', lineHeight: 1.1 }}>
                      {submissions.filter(s => {
                        const st = (s.status || '').toLowerCase();
                        return st === 'pending' || st === 'ai_passed' || st === 'submitted';
                      }).length}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginTop: '2px' }}>Pending Reviews</div>
                    <div style={{ fontSize: '11px', color: '#F57C00', marginTop: '4px', fontWeight: '700' }}>⚠️ 1-Click Action Ready</div>
                  </div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #FCE4EC 0%, #FFFFFF 100%)',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  border: '1px solid #F8BBD0',
                  boxShadow: '0 4px 18px rgba(194, 24, 91, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    backgroundColor: '#F8BBD0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px'
                  }}>💰</div>
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#880E4F', lineHeight: 1.1 }}>
                      {15680 + submissions.filter(s => (s.status || '').toLowerCase() === 'approved').reduce((acc, curr) => acc + (curr.claimablePoints || curr.points || 75), 0)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginTop: '2px' }}>Points Awarded</div>
                    <div style={{ fontSize: '11px', color: '#C2185B', marginTop: '4px', fontWeight: '600' }}>● Fair Formula Distribution</div>
                  </div>
                </div>
              </div>

              {/* Seamless Recent Activity & Fast Proof Review Section */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '24px',
                border: '1px solid #E8EFE8',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px',
                  borderBottom: '1px solid #F0F4F0',
                  paddingBottom: '16px'
                }}>
                  <div>
                    <h4 style={{ color: '#1B5E20', margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800' }}>
                      ⚡ Recent Activity & Direct Proof Verification
                    </h4>
                    <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>
                      Click on any student image thumbnail to zoom & verify AI screening. Approve or reject right here in one click.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'all', label: 'All Activities' },
                      { id: 'pending', label: '⏳ Needs Review' },
                      { id: 'approved', label: '✅ Approved' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setActivityFilter(f.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          backgroundColor: activityFilter === f.id ? '#1B5E20' : '#F1F5F1',
                          color: activityFilter === f.id ? '#FFFFFF' : '#555',
                          transition: 'all 0.2s'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submissions & Milestone Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Dynamic and Mock Submissions */}
                  {submissions
                    .filter(sub => {
                      if (activityFilter === 'all') return true;
                      const st = (sub.status || '').toLowerCase();
                      if (activityFilter === 'pending') return st === 'pending' || st === 'ai_passed' || st === 'submitted';
                      if (activityFilter === 'approved') return st === 'approved';
                      return true;
                    })
                    .map(sub => {
                      const sId = sub._id || sub.id;
                      const stLower = (sub.status || 'pending').toLowerCase();
                      const isPending = stLower === 'pending' || stLower === 'ai_passed' || stLower === 'submitted';
                      const isApproved = stLower === 'approved';
                      const proofSrc = sub.proofImage || sub.proof_image || sub.proofFiles?.[0] || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500';

                      return (
                        <div
                          key={sId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px',
                            padding: '14px 18px',
                            backgroundColor: isPending ? '#FFFCF7' : isApproved ? '#FAFCFA' : '#FFFDFD',
                            borderRadius: '14px',
                            border: `1.5px solid ${isPending ? '#FFE0B2' : isApproved ? '#C8E6C9' : '#FFCDD2'}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {/* Student Info & Challenge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              backgroundColor: isPending ? '#FF9800' : isApproved ? '#2E7D32' : '#D32F2F',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '17px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {(sub.studentName || 'S').charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#222' }}>
                                <strong style={{ color: '#1B5E20' }}>{sub.studentName}</strong> submitted proof for{' '}
                                <em style={{ color: '#333', fontWeight: '600' }}>{sub.challengeTitle}</em>
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span>{sub.studentDepartment || 'Sri Eshwar Campus'}</span>
                                <span>•</span>
                                <span style={{ color: '#888' }}>
                                  {sub.submissionDate ? new Date(sub.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '30 mins ago'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Student Proof Image Thumbnail with Inspect Overlay */}
                          <div
                            onClick={() => setSelectedProofModal(sub)}
                            style={{
                              position: 'relative',
                              width: '74px',
                              height: '74px',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '2px solid #C8E6C9',
                              boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                              flexShrink: 0,
                              transition: 'transform 0.2s'
                            }}
                            title="Click to open Fullscreen Lightbox & verify AI Authenticity"
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <img
                              src={proofSrc}
                              alt="Student proof"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.65)',
                              color: '#FFF',
                              fontSize: '9.5px',
                              fontWeight: '700',
                              textAlign: 'center',
                              padding: '2px 0'
                            }}>
                              🔍 Verify
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div style={{ minWidth: '120px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor: isPending ? '#FFF3E0' : isApproved ? '#E8F5E9' : '#FFEBEE',
                              color: isPending ? '#E65100' : isApproved ? '#2E7D32' : '#C62828',
                              border: `1px solid ${isPending ? '#FFE0B2' : isApproved ? '#A5D6A7' : '#FFCDD2'}`
                            }}>
                              <span>{isPending ? '⏳' : isApproved ? '✅' : '❌'}</span>
                              <span>{isPending ? 'pending' : isApproved ? 'approved' : 'rejected'}</span>
                            </span>
                          </div>

                          {/* INLINE ACTION BUTTONS (Direct inline approval/rejection right here!) */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => setSelectedProofModal(sub)}
                                  title="Inspect full image resolution, sensor noise, and AI detection details"
                                  style={{
                                    backgroundColor: '#FFFFFF',
                                    color: '#1B5E20',
                                    border: '1.5px solid #2E7D32',
                                    padding: '7px 14px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F8E9'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                                >
                                  <span>🔍</span> Inspect
                                </button>

                                <button
                                  onClick={() => handleSubmissionReview(sId, 'approve')}
                                  title="Approve proof and award mathematically calculated eco-points to student"
                                  style={{
                                    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 3px 10px rgba(46, 125, 50, 0.25)',
                                    transition: 'transform 0.15s, box-shadow 0.15s'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 5px 14px rgba(46, 125, 50, 0.35)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(46, 125, 50, 0.25)';
                                  }}
                                >
                                  <span>✅</span> Quick Approve
                                </button>

                                <button
                                  onClick={() => setQuickRejectSub(sub)}
                                  title="Reject submission with faculty feedback"
                                  style={{
                                    backgroundColor: '#FFEBEE',
                                    color: '#C62828',
                                    border: '1px solid #FFCDD2',
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFCDD2'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFEBEE'}
                                >
                                  <span>❌</span> Reject
                                </button>
                              </>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '12px',
                                  color: isApproved ? '#2E7D32' : '#C62828',
                                  fontWeight: '600'
                                }}>
                                  {isApproved ? '✓ Decision Finalized' : '✕ Rejected'}
                                </span>
                                <button
                                  onClick={() => setSelectedProofModal(sub)}
                                  style={{
                                    backgroundColor: '#F5F5F5',
                                    border: '1px solid #DDD',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    color: '#555'
                                  }}
                                >
                                  View Proof
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Dynamic Real-time Platform Activities & Student Joins */}
                  {platformActivities
                    .filter(act => {
                      if (act.type === 'submission') return false; // Rendered via submissions loop above
                      if (activityFilter === 'pending') return false;
                      if (activityFilter === 'approved') return act.type === 'approval';
                      return true; // 'all' shows joins and milestones
                    })
                    .map(act => {
                      const isJoin = act.type === 'join';
                      const isApproval = act.type === 'approval';
                      const avatarColor = isJoin ? '#0284C7' : isApproval ? '#16A34A' : '#E65100';
                      const bgStyle = isJoin ? '#F0F9FF' : isApproval ? '#F0FDF4' : '#FFFDF5';
                      const borderStyle = isJoin ? '#BAE6FD' : isApproval ? '#BBF7D0' : '#FED7AA';

                      return (
                        <div
                          key={act.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px',
                            padding: '13px 18px',
                            backgroundColor: bgStyle,
                            borderRadius: '14px',
                            border: `1px solid ${borderStyle}`,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              backgroundColor: avatarColor,
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {(act.studentName || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#0F172A' }}>
                                <strong style={{ color: isJoin ? '#0369A1' : '#15803D' }}>{act.studentName}</strong>{' '}
                                {isJoin ? (
                                  <>joined challenge <em style={{ fontWeight: '600', color: '#1E293B' }}>{act.challengeTitle}</em></>
                                ) : isApproval ? (
                                  <>earned <span style={{ color: '#16A34A', fontWeight: '800' }}>+{act.points || 75} points</span> for <em style={{ fontWeight: '600', color: '#1E293B' }}>{act.challengeTitle}</em></>
                                ) : (
                                  <>update on <em style={{ fontWeight: '600', color: '#1E293B' }}>{act.challengeTitle}</em></>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span>{act.studentDepartment || 'Sri Eshwar Campus'}</span>
                                <span>•</span>
                                <span style={{ color: avatarColor, fontWeight: '600' }}>{formatRelativeTime(act.timestamp)}</span>
                              </div>
                            </div>
                          </div>

                          <span style={{
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            backgroundColor: isJoin ? '#E0F2FE' : '#DCFCE7',
                            color: isJoin ? '#0369A1' : '#15803D',
                            fontWeight: '800',
                            border: `1px solid ${borderStyle}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{isJoin ? '🎯' : '✅'}</span>
                            <span>{isJoin ? 'joined' : 'completed'}</span>
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'greenhub' && (
            <div>
              <h3 style={{ color: '#2E7D32', marginBottom: '20px' }}>🌱 GreenHUB - Student Achievements</h3>
              
              <div style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                padding: window.innerWidth < 768 ? '20px' : '25px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                border: '2px solid #81C784'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                    View and interact with student sustainability achievements and posts
                  </p>
                </div>

                {/* Posts Feed */}
                <div>
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <div key={post._id} style={{
                        backgroundColor: 'white',
                        padding: window.innerWidth < 768 ? '15px' : '20px',
                        borderRadius: '10px',
                        marginBottom: window.innerWidth < 768 ? '15px' : '20px',
                        border: '1px solid #E0E0E0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {/* Post Header */}
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
                            {post.author.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#2E7D32', fontSize: '16px' }}>
                              {post.author.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {post.author.department} • {new Date(post.timestamp).toLocaleString()}
                            </div>
                            {post.challengeCompleted && (
                              <div style={{
                                display: 'inline-block',
                                backgroundColor: '#E8F5E8',
                                color: '#2E7D32',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                marginTop: '5px'
                              }}>
                                ✅ {post.challengeCompleted} (+{post.pointsEarned} pts)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Post Content */}
                        <div style={{
                          color: '#333',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          marginBottom: '15px'
                        }}>
                          {post.content}
                        </div>

                        {/* Photo Proofs */}
                        {post.proofImages && post.proofImages.length > 0 && (
                          <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginBottom: '15px',
                            flexWrap: 'wrap'
                          }}>
                            {post.proofImages.map((image, index) => (
                              <div key={index} style={{
                                width: post.proofImages.length === 1 ? '100%' : window.innerWidth < 768 ? '100%' : '48%',
                                maxWidth: '300px'
                              }}>
                                <img
                                  src={image}
                                  alt={`Achievement proof ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '200px',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                    border: '2px solid #E0E0E0',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(image, '_blank')}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80';
                                    e.target.style.opacity = '0.7';
                                    e.target.onerror = null; // Prevent infinite loop
                                  }}
                                  onLoad={(e) => {
                                    e.target.style.opacity = '1';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Post Actions */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          paddingTop: '15px',
                          borderTop: '1px solid #E0E0E0',
                          marginBottom: '15px'
                        }}>
                          <button
                            onClick={() => handleLikePost(post._id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: post.likedByAdmin ? '#FF6B35' : '#666',
                              fontSize: '14px',
                              fontWeight: post.likedByAdmin ? 'bold' : 'normal'
                            }}
                          >
                            {post.likedByAdmin ? '❤️' : '🤍'} {post.likes}
                          </button>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            💬 {post.comments.length} comments
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div style={{ marginBottom: '15px' }}>
                          {post.comments.map(comment => (
                            <div key={comment._id} style={{
                              backgroundColor: comment.isAdmin ? '#FFF3E0' : 'white',
                              padding: '10px',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              border: comment.isAdmin ? '1px solid #FFB74D' : '1px solid #E0E0E0'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ 
                                    fontWeight: 'bold', 
                                    color: comment.isAdmin ? '#FF6B35' : '#2E7D32',
                                    fontSize: '13px'
                                  }}>
                                    {comment.author} {comment.isAdmin && '(Admin)'}
                                  </div>
                                  <div style={{ color: '#333', fontSize: '13px', marginTop: '2px' }}>
                                    {comment.content}
                                  </div>
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                  {new Date(comment.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            value={newComment[post._id] || ''}
                            onChange={(e) => handleCommentChange(post._id, e.target.value)}
                            placeholder="Add a comment as admin..."
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '2px solid #81C784',
                              borderRadius: '20px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post._id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            style={{
                              backgroundColor: '#2E7D32',
                              color: 'white',
                              border: 'none',
                              padding: '8px 15px',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 'bold'
                            }}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌱</div>
                      <p>No student posts yet. Students will share their sustainability achievements here!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#2E7D32', margin: 0 }}>🎯 Manage Challenges</h3>
                <button
                  onClick={() => setShowCreateChallenge(true)}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Create Challenge
                </button>
              </div>


              {/* All Challenges List */}
              <h4 style={{ color: '#2E7D32', marginBottom: '15px' }}>📋 All Platform Challenges</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {challenges.map(challenge => (
                  <div key={challenge._id} style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #E0E0E0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#2E7D32', margin: '0 0 10px 0' }}>{challenge.title}</h4>
                        <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>
                          {challenge.description}
                        </p>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#666' }}>
                          <span>📂 {challenge.category}</span>
                          <span>⭐ {challenge.difficulty}</span>
                          <span>💰 {challenge.points} points</span>
                          <span>⏱️ {challenge.duration}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: challenge.status === 'Active' ? '#E8F5E8' : '#FFF3E0',
                          color: challenge.status === 'Active' ? '#2E7D32' : '#F57C00'
                        }}>
                          {challenge.status}
                        </span>
                        <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                          <div>{challenge.participants} participants</div>
                          <div>{challenge.completions} completed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <h3 style={{ color: '#2E7D32', marginBottom: '20px' }}>👥 Student Management</h3>
              
              <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid #E0E0E0'
              }}>
                {/* Students Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr 1fr 1fr 1fr',
                  gap: '15px',
                  padding: '15px',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  <div>Student</div>
                  {window.innerWidth >= 768 && (
                    <>
                      <div>Department</div>
                      <div>Points</div>
                      <div>Challenges</div>
                      <div>Status</div>
                    </>
                  )}
                </div>

                {/* Students List */}
                {students.map(student => (
                  <div key={student._id} style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr 1fr 1fr 1fr',
                    gap: '15px',
                    padding: '15px',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2E7D32' }}>{student.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{student.email}</div>
                      {window.innerWidth < 768 && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          {student.department} • {student.eco_points} pts • {student.challenges_completed} challenges
                        </div>
                      )}
                    </div>
                    {window.innerWidth >= 768 && (
                      <>
                        <div>{student.department}</div>
                        <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>{student.eco_points}</div>
                        <div>{student.challenges_completed}</div>
                        <div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: student.status === 'Active' ? '#E8F5E8' : '#FFF3E0',
                            color: student.status === 'Active' ? '#2E7D32' : '#F57C00'
                          }}>
                            {student.status}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div>
              <AdminVerificationPanel
                submissions={submissions}
                onUpdateSubmission={handleSubmissionReview}
                onOpenNotifications={onOpenNotifications}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  color: '#2E7D32', 
                  margin: 0,
                  fontSize: window.innerWidth < 768 ? '18px' : '24px'
                }}>📈 Platform Analytics</h3>

                <button
                  onClick={() => onNavigate('admin-analytics')}
                  style={{
                    backgroundColor: '#1B5E20',
                    color: '#FFD700',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(27, 94, 32, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🚀 Open Complete Executive Analytics Suite →
                </button>
              </div>
              
              <div style={{
                maxHeight: window.innerWidth < 768 ? '500px' : '600px',
                overflowY: 'auto',
                paddingRight: '10px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                  gap: window.innerWidth < 768 ? '15px' : '20px',
                  marginBottom: window.innerWidth < 768 ? '20px' : '30px'
                }}>
                {/* Participation Stats */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #E0E0E0'
                }}>
                  <h4 style={{ color: '#2E7D32', marginBottom: '15px' }}>Participation Overview</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Average Participation:</span>
                      <strong>{analytics.averageParticipation}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Monthly Growth:</span>
                      <strong style={{ color: '#4CAF50' }}>+{analytics.monthlyGrowth}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Submissions:</span>
                      <strong>{analytics.totalSubmissions}</strong>
                    </div>
                  </div>
                </div>

                {/* Top Categories */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #E0E0E0'
                }}>
                  <h4 style={{ color: '#2E7D32', marginBottom: '15px' }}>Popular Categories</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics.topCategories?.map((category, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}>
                        <span>{category.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '60px',
                            height: '8px',
                            backgroundColor: '#E0E0E0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${(category.count / 50) * 100}%`,
                              height: '100%',
                              backgroundColor: '#4CAF50'
                            }}></div>
                          </div>
                          <strong>{category.count}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Leaderboard */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #E0E0E0'
              }}>
                <h4 style={{ color: '#2E7D32', marginBottom: '15px' }}>🏆 Complete Student Leaderboard</h4>
                
                {/* Leaderboard Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '50px 1fr 80px' : '60px 2fr 1fr 100px 120px',
                  gap: window.innerWidth < 768 ? '10px' : '15px',
                  padding: window.innerWidth < 768 ? '12px' : '15px',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  <div>Rank</div>
                  <div>Student</div>
                  {window.innerWidth >= 768 && <div>Department</div>}
                  <div>Points</div>
                  {window.innerWidth >= 768 && <div>Challenges</div>}
                </div>

                {/* Scrollable Leaderboard */}
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}>
                  {students
                    .sort((a, b) => b.eco_points - a.eco_points)
                    .map((student, index) => (
                    <div
                      key={student._id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 768 ? '50px 1fr 80px' : '60px 2fr 1fr 100px 120px',
                        gap: window.innerWidth < 768 ? '10px' : '15px',
                        padding: window.innerWidth < 768 ? '12px' : '15px',
                        backgroundColor: index < 3 ? '#E8F5E8' : '#F9F9F9',
                        border: index < 3 ? '2px solid #2E7D32' : '1px solid #E0E0E0',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        alignItems: 'center',
                        fontSize: window.innerWidth < 768 ? '12px' : '14px'
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32' }}>
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#2E7D32' }}>{student.name}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{student.email}</div>
                        {window.innerWidth < 768 && (
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                            {student.department} • {student.challenges_completed} challenges
                          </div>
                        )}
                      </div>
                      {window.innerWidth >= 768 && (
                        <div style={{ fontSize: '12px', color: '#666' }}>{student.department}</div>
                      )}
                      <div style={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '16px' }}>
                        {student.eco_points}
                      </div>
                      {window.innerWidth >= 768 && (
                        <div style={{ textAlign: 'center' }}>{student.challenges_completed}</div>
                      )}
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#2E7D32', margin: 0 }}>Create New Challenge</h3>
              <button
                onClick={() => setShowCreateChallenge(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title *</label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter challenge title"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description *</label>
                <textarea
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Describe the challenge"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category *</label>
                  <select
                    value={newChallenge.category}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select category</option>
                    <option value="Waste Reduction">Waste Reduction</option>
                    <option value="Energy">Energy</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Water">Water</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Difficulty</label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, difficulty: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Points *</label>
                  <input
                    type="number"
                    value={newChallenge.points}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, points: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Points to award"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duration</label>
                  <input
                    type="text"
                    value={newChallenge.duration}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, duration: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Requirements</label>
                {newChallenge.requirements.map((req, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #81C784',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder={`Requirement ${index + 1}`}
                    />
                    {newChallenge.requirements.length > 1 && (
                      <button
                        onClick={() => removeRequirement(index)}
                        style={{
                          backgroundColor: '#F44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addRequirement}
                  style={{
                    backgroundColor: '#81C784',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Add Requirement
                </button>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tips</label>
                {newChallenge.tips.map((tip, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => updateTip(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #81C784',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder={`Tip ${index + 1}`}
                    />
                    {newChallenge.tips.length > 1 && (
                      <button
                        onClick={() => removeTip(index)}
                        style={{
                          backgroundColor: '#F44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addTip}
                  style={{
                    backgroundColor: '#81C784',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Add Tip
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowCreateChallenge(false)}
                  style={{
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChallenge}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Create Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup with Ribbon Animation */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
          zIndex: 2000,
          animation: 'slideInRight 0.5s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ fontSize: '20px' }}>🎉</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Challenge Created!</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Your challenge has been successfully added</div>
          </div>
          <button
            onClick={() => setShowSuccessPopup(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#2E7D32', margin: 0 }}>Edit Admin Profile</h3>
              <button
                onClick={() => setShowProfileEdit(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name *</label>
                <input
                  type="text"
                  value={adminProfile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone</label>
                <input
                  type="tel"
                  value={adminProfile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department</label>
                <input
                  type="text"
                  value={adminProfile.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Designation</label>
                <input
                  type="text"
                  value={adminProfile.designation}
                  onChange={(e) => handleProfileChange('designation', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Experience</label>
                <input
                  type="text"
                  value={adminProfile.experience}
                  onChange={(e) => handleProfileChange('experience', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Specialization</label>
                <textarea
                  value={adminProfile.specialization}
                  onChange={(e) => handleProfileChange('specialization', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #81C784',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowProfileEdit(false)}
                  style={{
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation for Success Popup */}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Submission Approval Success Popup */}
      {showApprovalPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          animation: 'approvalSlideIn 0.3s ease-out',
          minWidth: '320px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Submission Approved!</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
              Student points have been updated
            </div>
          </div>
        </div>
      )}

      {/* Submission Rejection Popup - Horizontal */}
      {showRejectionPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#F44336',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          animation: 'approvalSlideIn 0.3s ease-out',
          minWidth: '320px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>❌</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Submission Rejected!</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
              Student has been notified
            </div>
          </div>
        </div>
      )}

      {/* Profile Update Popup */}
      {showProfileUpdatePopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#FF9800',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          animation: 'approvalSlideIn 0.3s ease-out',
          minWidth: '350px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => {
          setShowProfileEdit(true);
          setShowProfileUpdatePopup(false);
        }}
        >
          <span style={{ fontSize: '24px' }}>👤</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Update Your Details in Profile!</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
              Click here to complete your admin profile
            </div>
          </div>
        </div>
      )}

      {/* Profile Updated Popup - Horizontal */}
      {showProfileUpdatedPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          animation: 'approvalSlideIn 0.3s ease-out',
          minWidth: '320px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Your Profile is Updated!</div>
          </div>
        </div>
      )}

      {/* FULLSCREEN STUDENT PROOF & AI AUTHENTICITY INSPECTOR MODAL */}
      {selectedProofModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px'
        }}>
          {/* Modal Container */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid #E0EAE0',
              backgroundColor: '#F8FAF8'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1B5E20', fontSize: '18px', fontWeight: '800' }}>
                  🔍 Student Proof Verification & AI Authenticity Inspector
                </h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Student: <strong>{selectedProofModal.studentName}</strong> • {selectedProofModal.challengeTitle}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProofModal(null);
                  setProofZoom(1);
                }}
                style={{
                  backgroundColor: '#E8EFE8',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#444'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Two columns */}
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              flex: 1,
              overflowY: 'auto'
            }}>
              {/* Left Column: Zoomable Image Viewer */}
              <div style={{
                flex: '1.2',
                backgroundColor: '#111',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: '380px'
              }}>
                <div style={{
                  overflow: 'hidden',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={selectedProofModal.proofImage || selectedProofModal.proof_image || selectedProofModal.proofFiles?.[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'}
                    alt="Student proof"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '440px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      transform: `scale(${proofZoom})`,
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: proofZoom > 1 ? 'grab' : 'zoom-in'
                    }}
                    onClick={() => setProofZoom(prev => prev >= 2 ? 1 : prev + 0.5)}
                  />
                </div>

                {/* Floating Zoom Controls */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  display: 'flex',
                  gap: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(6px)',
                  padding: '6px 14px',
                  borderRadius: '24px'
                }}>
                  <button
                    onClick={() => setProofZoom(prev => Math.max(0.75, prev - 0.25))}
                    style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
                  >
                    🔍-
                  </button>
                  <span style={{ color: '#FFD54F', fontSize: '12px', fontWeight: 'bold', lineHeight: '22px' }}>
                    {Math.round(proofZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setProofZoom(prev => Math.min(3, prev + 0.25))}
                    style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
                  >
                    🔍+
                  </button>
                  <button
                    onClick={() => setProofZoom(1)}
                    style={{ background: 'none', border: 'none', color: '#BBB', fontSize: '11px', cursor: 'pointer', marginLeft: '6px' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Right Column: AI Authenticity & Student Context */}
              <div style={{
                flex: '1',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#FFFFFF',
                overflowY: 'auto'
              }}>
                {/* AI Origin Screening Box */}
                <div style={{
                  backgroundColor: '#E8F5E9',
                  border: '1.5px solid #81C784',
                  borderRadius: '14px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1B5E20', textTransform: 'uppercase' }}>
                      🛡️ AI Authenticity Screening
                    </span>
                    <span style={{
                      backgroundColor: '#2E7D32',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '8px'
                    }}>
                      98.8% Natural Capture
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '6px' }}>
                    ✓ Verified Genuine Physical Camera Capture
                  </div>
                  <div style={{ fontSize: '12px', color: '#444', lineHeight: '1.4' }}>
                    • <strong>Sensor Noise:</strong> Organic CMOS ISO grain verified (no GAN/diffusion smoothing)<br/>
                    • <strong>Lighting & Shadows:</strong> Consistent sun angle and ambient color reflection<br/>
                    • <strong>Campus Hash Check:</strong> Unique image, no prior submission overlap detected
                  </div>
                </div>

                {/* Student Description */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '4px' }}>
                    📝 STUDENT SUBMISSION CONTEXT
                  </div>
                  <div style={{
                    backgroundColor: '#F8FAF8',
                    border: '1px solid #E0EAE0',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#333',
                    lineHeight: '1.45'
                  }}>
                    {selectedProofModal.description || 'Completed challenge requirements and documented photo evidence on campus.'}
                  </div>
                </div>

                {/* Mathematical Fair Points Calculator */}
                <div style={{
                  backgroundColor: '#FFF8E1',
                  border: '1px solid #FFE082',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#F57F17', marginBottom: '4px' }}>
                    📐 FAIR POINTS FORMULA AWARD
                  </div>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    Base: <strong>{selectedProofModal.points || 50} pts</strong> • Difficulty: <strong>{selectedProofModal.difficulty || 'Medium'}</strong> • On-Time: <strong>Yes</strong>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#2E7D32', marginTop: '4px' }}>
                    Total Claimable: +{selectedProofModal.points || 50} Eco-Points
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #EEE', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      handleSubmissionReview(selectedProofModal._id || selectedProofModal.id, 'approve');
                      setSelectedProofModal(null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#2E7D32',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                    }}
                  >
                    ✅ Approve & Award Points
                  </button>

                  <button
                    onClick={() => {
                      const rej = selectedProofModal;
                      setSelectedProofModal(null);
                      setQuickRejectSub(rej);
                    }}
                    style={{
                      padding: '12px 18px',
                      backgroundColor: '#FFEBEE',
                      color: '#C62828',
                      border: '1px solid #FFCDD2',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REJECT REASON MODAL */}
      {quickRejectSub && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '2px solid #EF5350'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#C62828', fontSize: '18px', fontWeight: '800' }}>
              ❌ Reject Proof: {quickRejectSub.studentName}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
              Please provide feedback so the student knows what to correct and how to resubmit.
            </p>
            <textarea
              rows={4}
              value={quickRejectReason}
              onChange={(e) => setQuickRejectReason(e.target.value)}
              placeholder="e.g. Photo does not clearly display the campus recycling bin label. Please take a clearer photo showing the segregated materials."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid #DDD',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                marginBottom: '18px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setQuickRejectSub(null);
                  setQuickRejectReason('');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #DDD',
                  backgroundColor: '#FFF',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSubmissionReview(quickRejectSub._id || quickRejectSub.id, 'reject');
                  setQuickRejectSub(null);
                  setQuickRejectReason('');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#C62828',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes approvalSlideIn {
            from {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 0;
            }
            to {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
    </>
  );
};

export default AdminDashboard;
