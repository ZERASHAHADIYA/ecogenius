import { useState, useEffect } from 'react';
import { addNotification } from '../services/notificationService';
import StudentHeaderNav from '../components/StudentHeaderNav';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import { subscribeToSync } from '../services/realtimeSync';

const Dashboard = ({ user, onNavigate, joinedChallenges, onJoinChallenge, onUpdateJoinedChallenge, onUpdateUser, onCreatePost, posts: propPosts, onLikePost, onOpenNotifications, onLogout, submissions: propSubmissions = [] }) => {
  const [challenges, setChallenges] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('challenges');
  const [showRewardsPopup, setShowRewardsPopup] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showProfileUpdatePopup, setShowProfileUpdatePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [submissions, setSubmissions] = useState(propSubmissions || []);
  const [newComment, setNewComment] = useState({});
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    year: user?.year || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  // GreenHUB Post Creation State
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedChallengeTag, setSelectedChallengeTag] = useState('Plastic-Free Week Challenge');
  const [customChallengeName, setCustomChallengeName] = useState('');
  const [newPostPoints, setNewPostPoints] = useState(50);
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);

  useEffect(() => {
    loadData();

    // Sync submissions
    if (propSubmissions && propSubmissions.length > 0) {
      setSubmissions(propSubmissions);
    } else {
      const savedSubs = localStorage.getItem('submissions');
      if (savedSubs) {
        try {
          setSubmissions(JSON.parse(savedSubs));
        } catch (e) {
          console.error('Error parsing submissions:', e);
        }
      }
    }
    
    // Show profile update popup if user details are incomplete
    const hasIncompleteProfile = !user?.name || !user?.department || !user?.email;
    if (hasIncompleteProfile) {
      setTimeout(() => {
        setShowProfileUpdatePopup(true);
        setTimeout(() => setShowProfileUpdatePopup(false), 5000);
      }, 2000);
    }

    // Subscribe to live platform updates
    const cleanupSync = subscribeToSync(() => {
      try {
        const savedCounts = JSON.parse(localStorage.getItem('challenge_participants_counts') || '{}');
        setChallenges(prev => prev.map(c => {
          if (savedCounts[c._id] !== undefined) {
            return { ...c, participants: savedCounts[c._id] };
          }
          return c;
        }));
        const savedSubs = localStorage.getItem('submissions');
        if (savedSubs) setSubmissions(JSON.parse(savedSubs));
      } catch (err) {
        console.error('Error in Dashboard sync:', err);
      }
    });

    return () => {
      cleanupSync();
    };
  }, [propSubmissions]);

  // Remove dynamic post syncing - we only want static posts

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Always load static social media posts from other students only
      const staticPosts = [
          {
            _id: 'static_1',
            author: {
              name: 'Priya Sharma',
              department: 'Environmental Science'
            },
            content: 'Just completed the Plastic-Free Week Challenge! 🌱 Managed to eliminate 90% of single-use plastics from my daily routine. The hardest part was finding alternatives for food packaging, but I discovered some amazing local stores with bulk options!',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            likes: 24,
            likedByUser: false,
            challengeCompleted: 'Plastic-Free Week Challenge',
            pointsEarned: 50,
            proofImages: [
              'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
              'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_1',
                author: 'Rahul Kumar',
                content: 'Amazing work! Can you share which stores you found for bulk shopping?',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_2',
            author: {
              name: 'Rahul Kumar',
              department: 'Computer Science Engineering'
            },
            content: 'Campus Tree Planting was incredible today! 🌳 Our team planted 15 saplings near the library. It feels amazing to contribute to making our campus greener. Already planning to join the next planting session!',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            likes: 31,
            likedByUser: false,
            challengeCompleted: 'Campus Tree Planting',
            pointsEarned: 75,
            proofImages: [
              'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_2',
                author: 'Anita Patel',
                content: 'Great initiative! I missed this one but will definitely join the next session.',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_3',
            author: {
              name: 'Anita Patel',
              department: 'Business Administration'
            },
            content: 'Energy Conservation Week results are in! ⚡ Reduced my dorm energy consumption by 28% by switching to LED bulbs, unplugging devices, and using natural light during the day. Small changes, big impact!',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            likes: 19,
            likedByUser: false,
            challengeCompleted: 'Energy Conservation Week',
            pointsEarned: 100,
            proofImages: [
              'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: []
          },
          {
            _id: 'static_4',
            author: {
              name: 'Vikram Singh',
              department: 'Mechanical Engineering'
            },
            content: 'Sustainable Transportation Week was a game-changer! 🚲 Cycled to campus every day and discovered so many beautiful routes I never knew existed. Plus, I feel more energetic and saved money on fuel!',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            likes: 27,
            likedByUser: false,
            challengeCompleted: 'Sustainable Transportation Week',
            pointsEarned: 60,
            proofImages: [
              'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_4',
                author: 'Priya Sharma',
                content: 'Inspiring! I should try cycling too. Any route recommendations?',
                timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_5',
            author: {
              name: 'Sneha Reddy',
              department: 'Civil Engineering'
            },
            content: 'Water Conservation Challenge completed! 💧 Installed water-saving devices in my hostel room and reduced water usage by 35%. The low-flow showerhead and faucet aerators made a huge difference. Every drop counts!',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 42,
            likedByUser: false,
            challengeCompleted: 'Water Conservation Challenge',
            pointsEarned: 80,
            proofImages: [
              'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
              'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_5',
                author: 'Arjun Nair',
                content: 'Great work! Where did you get the water-saving devices?',
                timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_6',
            author: {
              name: 'Arjun Nair',
              department: 'Electronics Engineering'
            },
            content: 'DIY Solar Charger project is finally done! ☀️ Built a portable solar panel system that can charge my phone and laptop. Perfect for outdoor study sessions and reducing grid electricity dependency. Engineering meets sustainability!',
            timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 56,
            likedByUser: false,
            challengeCompleted: 'Renewable Energy Project',
            pointsEarned: 120,
            proofImages: [
              'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
              'https://images.unsplash.com/photo-1497440001374-f26997328c1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_6',
                author: 'Vikram Singh',
                content: 'This is incredible! Can you share the circuit diagram?',
                timestamp: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'comment_7',
                author: 'Priya Sharma',
                content: 'Amazing engineering skills! How long does it take to charge a laptop?',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_7',
            author: {
              name: 'Kavya Iyer',
              department: 'Biotechnology'
            },
            content: 'Organic Composting Workshop was enlightening! 🌿 Learned to convert kitchen waste into nutrient-rich compost. Set up a small composting system in my hostel. Nature has the best recycling system - we just need to follow it!',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 38,
            likedByUser: false,
            challengeCompleted: 'Organic Composting Workshop',
            pointsEarned: 65,
            proofImages: [
              'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_8',
                author: 'Sneha Reddy',
                content: 'I want to start composting too! Any beginner tips?',
                timestamp: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_8',
            author: {
              name: 'Rohan Gupta',
              department: 'Chemical Engineering'
            },
            content: 'Zero Waste Lifestyle Challenge - Week 2 update! 🗂️ Managed to fit all my non-recyclable waste in a small jar. The key is refusing single-use items and choosing reusable alternatives. It\'s challenging but so rewarding!',
            timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 45,
            likedByUser: false,
            challengeCompleted: 'Zero Waste Lifestyle Challenge',
            pointsEarned: 90,
            proofImages: [
              'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_9',
                author: 'Kavya Iyer',
                content: 'That\'s incredible! What was the hardest thing to replace?',
                timestamp: new Date(Date.now() - 2.2 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_9',
            author: {
              name: 'Meera Krishnan',
              department: 'Information Technology'
            },
            content: 'Green Tech Innovation Hackathon was amazing! 💻 Our team developed an app to track carbon footprint and suggest eco-friendly alternatives. Technology can be a powerful tool for environmental change. Proud to be part of the solution!',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 67,
            likedByUser: false,
            challengeCompleted: 'Green Tech Innovation Hackathon',
            pointsEarned: 150,
            proofImages: [
              'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_10',
                author: 'Arjun Nair',
                content: 'Awesome! Is the app available for download?',
                timestamp: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'comment_11',
                author: 'Rohan Gupta',
                content: 'Great use of technology for sustainability!',
                timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_10',
            author: {
              name: 'Aditya Sharma',
              department: 'Electrical Engineering'
            },
            content: 'Campus Clean-up Drive was a huge success! 🧹 Collected over 200kg of waste and properly segregated it for recycling. Amazing to see 150+ students come together for our environment. Clean campus, clean future!',
            timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 89,
            likedByUser: false,
            challengeCompleted: 'Campus Clean-up Drive',
            pointsEarned: 70,
            proofImages: [
              'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_12',
                author: 'Meera Krishnan',
                content: 'Wish I could have joined! When is the next clean-up drive?',
                timestamp: new Date(Date.now() - 3.2 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_11',
            author: {
              name: 'Pooja Srinivas',
              department: 'Textile Engineering'
            },
            content: 'Sustainable Fashion Workshop was eye-opening! 👗 Learned about fast fashion\'s environmental impact and created beautiful clothes from upcycled materials. Fashion can be both stylish and sustainable!',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 52,
            likedByUser: false,
            challengeCompleted: 'Sustainable Fashion Workshop',
            pointsEarned: 85,
            proofImages: [
              'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_13',
                author: 'Kavya Iyer',
                content: 'Love the creativity! Can you teach me some upcycling techniques?',
                timestamp: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            _id: 'static_12',
            author: {
              name: 'Karthik Reddy',
              department: 'Automobile Engineering'
            },
            content: 'Electric Vehicle Workshop was fantastic! ⚡🚗 Got hands-on experience with EV technology and even test-drove the latest electric cars. The future of transportation is electric, and I\'m excited to be part of this revolution!',
            timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 73,
            likedByUser: false,
            challengeCompleted: 'Electric Vehicle Workshop',
            pointsEarned: 95,
            proofImages: [
              'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
            ],
            comments: [
              {
                _id: 'comment_14',
                author: 'Aditya Sharma',
                content: 'How was the driving experience compared to regular cars?',
                timestamp: new Date(Date.now() - 4.2 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          }
        ];
        setPosts(staticPosts);

      // Load challenges (using same mock data as AllChallenges)
      const mockChallenges = [
        {
          _id: '1',
          title: 'Plastic-Free Week Challenge',
          description: 'Eliminate single-use plastics from your daily routine for one week.',
          category: 'Waste Reduction',
          difficulty: 'Medium',
          points: 50,
          duration: '7 days',
          participants: 45,
          status: 'Active',
          requirements: ['Document daily plastic usage', 'Find alternatives', 'Share progress'],
          tips: ['Use reusable bags', 'Carry water bottle', 'Choose bulk items']
        },
        {
          _id: '2',
          title: 'Campus Tree Planting',
          description: 'Plant and maintain trees around the campus area.',
          category: 'Environmental',
          difficulty: 'Easy',
          points: 75,
          duration: '1 day',
          participants: 32,
          status: 'Active',
          requirements: ['Attend planting session', 'Plant minimum 2 trees', 'Commit to maintenance'],
          tips: ['Wear comfortable clothes', 'Bring gloves', 'Stay hydrated']
        },
        {
          _id: '3',
          title: 'Energy Conservation Week',
          description: 'Reduce energy consumption in your dorm/home by 20%.',
          category: 'Energy',
          difficulty: 'Hard',
          points: 100,
          duration: '7 days',
          participants: 28,
          status: 'Active',
          requirements: ['Track energy usage', 'Implement conservation methods', 'Report savings'],
          tips: ['Use LED bulbs', 'Unplug devices', 'Optimize AC usage']
        },
        {
          _id: '4',
          title: 'Sustainable Transportation',
          description: 'Use eco-friendly transport for all campus commutes.',
          category: 'Transportation',
          difficulty: 'Medium',
          points: 60,
          duration: '5 days',
          participants: 38,
          status: 'Active',
          requirements: ['Use bike/walk/public transport', 'Log daily commutes', 'Calculate carbon savings'],
          tips: ['Plan routes ahead', 'Use campus bike sharing', 'Walk with friends']
        },
        {
          _id: '5',
          title: 'Zero Food Waste Challenge',
          description: 'Minimize food waste through smart planning and composting.',
          category: 'Waste Reduction',
          difficulty: 'Medium',
          points: 80,
          duration: '10 days',
          participants: 22,
          status: 'Active',
          requirements: ['Plan meals', 'Compost scraps', 'Track waste reduction'],
          tips: ['Buy only needed items', 'Store food properly', 'Share excess food']
        },
        {
          _id: '6',
          title: 'Water Conservation Drive',
          description: 'Implement water-saving techniques and track usage.',
          category: 'Water',
          difficulty: 'Easy',
          points: 40,
          duration: '7 days',
          participants: 55,
          status: 'Active',
          tips: ['Fix leaks immediately', 'Take shorter showers', 'Collect rainwater']
        },
        {
          _id: '7',
          title: 'DIY Solar Charger Project',
          description: 'Build and deploy a portable solar charger for dorm study sessions to cut grid dependency.',
          category: 'Electricity',
          difficulty: 'Hard',
          points: 120,
          duration: '3 days',
          participants: 29,
          status: 'Active',
          requirements: ['Assemble 5V/12V solar panel circuit', 'Test voltage output', 'Charge mobile device safely'],
          tips: ['Use multimeter to verify output', 'Angle panels toward 35° South', 'Avoid moisture']
        },
        {
          _id: '8',
          title: 'Peak-Hour Grid Relief Sprint',
          description: 'Unplug non-essential appliances, chargers, and AC units during campus peak grid hours (6 PM - 9 PM).',
          category: 'Electricity',
          difficulty: 'Easy',
          points: 50,
          duration: '5 days',
          participants: 41,
          status: 'Active',
          requirements: ['Power down phantom loads at 6 PM', 'Use study hall natural airflow', 'Log 5 days of verification'],
          tips: ['Use smart power strips', 'Schedule laptop charging off-peak']
        },
        {
          _id: '9',
          title: 'Campus Rainwater Harvesting Audit',
          description: 'Inspect college rooftop catchment channels and calculate rainwater storage potential during showers.',
          category: 'Water',
          difficulty: 'Medium',
          points: 70,
          duration: '4 days',
          participants: 26,
          status: 'Active',
          requirements: ['Inspect catchment mesh', 'Estimate tank capacity', 'Submit findings to sustainability cell'],
          tips: ['Measure roof area', 'Check filter screens for debris']
        },
        {
          _id: '10',
          title: 'Greywater Recycling & Drip Reuse',
          description: 'Filter AC condensation discharge and hostel rinse water to irrigate nearby campus gardens.',
          category: 'Water',
          difficulty: 'Hard',
          points: 90,
          duration: '5 days',
          participants: 19,
          status: 'Active',
          requirements: ['Set up collection container', 'Filter through sand/gravel', 'Irrigate campus flora'],
          tips: ['Use non-toxic biodegradable soap water', 'Keep collection vessel covered']
        },
        {
          _id: '11',
          title: 'Dorm Organic Composting Workshop',
          description: 'Segregate hostel pantry organic scraps and convert them into nutrient-rich compost with bokashi method.',
          category: 'Waste Management',
          difficulty: 'Medium',
          points: 65,
          duration: '7 days',
          participants: 34,
          status: 'Active',
          requirements: ['Segregate daily food peels', 'Layer carbon/nitrogen ratio', 'Record compost breakdown'],
          tips: ['Chop scraps into small pieces', 'Maintain moisture balance']
        },
        {
          _id: '12',
          title: 'Campus E-Waste Segregation Sprint',
          description: 'Collect spent batteries, tangled cables, broken PCB parts, and deposit at Sri Eshwar e-waste depot.',
          category: 'Waste Management',
          difficulty: 'Hard',
          points: 85,
          duration: '3 days',
          participants: 23,
          status: 'Active',
          requirements: ['Collect 5+ e-waste items', 'Categorize battery vs circuit', 'Hand over to authorized recycling center'],
          tips: ['Tape battery terminals for safety', 'Keep separate from organic waste']
        }
      ];
      
      const savedCounts = JSON.parse(localStorage.getItem('challenge_participants_counts') || '{}');
      const hydratedChallenges = mockChallenges.map(c => ({
        ...c,
        participants: savedCounts[c._id] !== undefined ? savedCounts[c._id] : c.participants
      }));

      setChallenges(hydratedChallenges);

      // Load posts (with mock data)
      const mockPosts = [
        {
          _id: '1',
          content: 'Just completed my first plastic-free week challenge! Reduced my plastic usage by 80%. Feeling great about contributing to our planet! 🌱',
          student: { name: 'Priya Sharma', department: 'Environmental Science' },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: 15,
          comments: [{ text: 'Amazing work!' }],
          shares: 3
        },
        {
          _id: '2', 
          content: 'Organized a campus cleanup drive today. Collected 50kg of waste and planted 20 saplings. Small steps, big impact! 🌳',
          student: { name: 'Rahul Kumar', department: 'Computer Science' },
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          likes: 23,
          comments: [{ text: 'Inspiring!' }, { text: 'Count me in next time!' }],
          shares: 7
        }
      ];
      
      // Load community posts from storage if any, else seed with staticPosts
      const savedCommunityPosts = localStorage.getItem('greenhub_posts') || localStorage.getItem('posts');
      let combinedPosts = staticPosts;
      if (savedCommunityPosts) {
        try {
          const parsed = JSON.parse(savedCommunityPosts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const userCreated = parsed.filter(p => !p._id?.toString().startsWith('static_') && !staticPosts.some(sp => sp._id === p._id));
            combinedPosts = [...userCreated, ...staticPosts];
          }
        } catch (e) {
          console.error('Error parsing stored posts:', e);
        }
      }
      setPosts(combinedPosts);

      // Load notifications (mock data for released challenges)
      const mockNotifications = [
        {
          id: '1',
          challengeName: 'Plastic-Free Week Challenge',
          releaseDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          challengeId: '1',
          type: 'new_challenge'
        },
        {
          id: '2',
          challengeName: 'Campus Tree Planting',
          releaseDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
          challengeId: '2',
          type: 'new_challenge'
        },
        {
          id: '3',
          challengeName: 'Energy Conservation Week',
          releaseDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          challengeId: '3',
          type: 'new_challenge'
        },
        {
          id: '4',
          challengeName: 'Sustainable Transportation',
          releaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          challengeId: '4',
          type: 'new_challenge'
        },
        {
          id: '5',
          challengeName: 'Zero Food Waste Challenge',
          releaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          challengeId: '5',
          type: 'new_challenge'
        }
      ];
      
      setNotifications(mockNotifications);

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


  const [showProfileUpdatedPopup, setShowProfileUpdatedPopup] = useState(false);

  const handleUpdateProfile = () => {
    if (onUpdateUser) {
      onUpdateUser(profileForm);
    }
    setShowProfileModal(false);
    
    // Show horizontal profile updated popup
    setShowProfileUpdatedPopup(true);
    setTimeout(() => setShowProfileUpdatedPopup(false), 3000);
  };


  const handleJoinChallenge = (challengeId) => {
    const challenge = challenges.find(c => c._id === challengeId);
    const isAlreadyJoined = joinedChallenges.some(jc => jc.challengeId === challengeId);
    
    if (!isAlreadyJoined && challenge) {
      const success = onJoinChallenge(challengeId, challenge);
      if (success) {
        setChallenges(prev => prev.map(c => c._id === challengeId ? { ...c, participants: (c.participants || 0) + 1 } : c));
      }
    } else if (isAlreadyJoined) {
      alert('You have already joined this challenge! Check "My Challenges" to track your progress.');
    }
  };

  const handleSubmitProof = (challengeId) => {
    const joinedChallenge = joinedChallenges.find(jc => jc.challengeId === challengeId);
    if (joinedChallenge) {
      onUpdateJoinedChallenge(challengeId, {
        submittedProof: true,
        proofStatus: 'under_review'
      });
      alert('Proof submitted successfully! It will be reviewed by admin.');
    } else {
      alert('Please join the challenge first before submitting proof.');
    }
  };

  const isJoined = (challengeId) => {
    return joinedChallenges.some(jc => jc.challengeId === challengeId);
  };

  const handleRedeemPoints = () => {
    const pointsToRedeem = parseInt(redeemPoints);
    const currentPoints = user?.eco_points || 0;
    
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      alert('Please enter a valid number of points to redeem.');
      return;
    }
    
    if (pointsToRedeem > currentPoints) {
      alert(`You don't have enough points. You have ${currentPoints} points available.`);
      return;
    }
    
    // Deduct points
    if (onUpdateUser) {
      onUpdateUser({ eco_points: currentPoints - pointsToRedeem });
    }
    
    // Process real-time redemption notification
    addNotification({
      userId: user?._id || user?.id,
      type: 'reward',
      title: '🎁 Eco-Reward Redeemed!',
      message: `You redeemed ${pointsToRedeem} points for campus sustainability items! Voucher code: ECO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      points: pointsToRedeem
    });
    
    setShowRewardsPopup(false);
    setRedeemPoints('');
  };

  const handleNotificationClick = (challengeId) => {
    setShowNotifications(false);
    // Navigate to all challenges page and highlight the selected challenge
    onNavigate('all-challenges', challengeId);
  };

  const handleCreateNewPost = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newPostContent.trim()) {
      alert('Please describe your eco-action or sustainability achievement!');
      return;
    }

    setIsPosting(true);

    const challengeTag = selectedChallengeTag === 'Other Daily Green Milestone'
      ? (customChallengeName.trim() || 'Daily Eco Milestone')
      : selectedChallengeTag;

    const finalImage = newPostImageUrl.trim() || selectedPresetImage;

    const newPostObj = {
      _id: 'post_' + Date.now(),
      id: 'post_' + Date.now(),
      author: {
        name: user?.name || 'Student Eco-Warrior',
        department: user?.department || 'Student'
      },
      content: newPostContent.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      likedByUser: false,
      likedByAdmin: false,
      challengeCompleted: challengeTag,
      pointsEarned: Number(newPostPoints) || 50,
      proofImages: finalImage ? [finalImage] : [],
      comments: []
    };

    const updated = [newPostObj, ...posts];
    setPosts(updated);

    try {
      localStorage.setItem('greenhub_posts', JSON.stringify(updated));
      localStorage.setItem('posts', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving posts:', err);
    }

    if (onCreatePost) {
      onCreatePost(newPostObj);
    }

    addNotification({
      userId: user?._id || user?.id,
      type: 'challenge',
      title: '🌱 Published to GreenHUB!',
      message: `Your post "${challengeTag}" (+${newPostObj.pointsEarned} pts) is live for the campus!`,
      points: newPostObj.pointsEarned
    });

    setNewPostContent('');
    setCustomChallengeName('');
    setNewPostImageUrl('');
    setSelectedPresetImage('');
    setIsPosting(false);
    setShowPostSuccess(true);
    setTimeout(() => setShowPostSuccess(false), 4000);
  };

  const handleLikePostLocal = (postId) => {
    setPosts(prevPosts => {
      const updated = prevPosts.map(post => {
        if (post._id === postId || post.id === postId) {
          const wasLiked = post.likedByUser;
          return {
            ...post,
            likedByUser: !wasLiked,
            likes: wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1
          };
        }
        return post;
      });
      localStorage.setItem('greenhub_posts', JSON.stringify(updated));
      localStorage.setItem('posts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCommentChange = (postId, value) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleAddComment = (postId) => {
    const commentText = newComment[postId];
    if (!commentText || !commentText.trim()) return;

    const newCommentObj = {
      _id: Date.now().toString(),
      author: user?.name || 'Student',
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
      isAdmin: false
    };

    setPosts(prevPosts => {
      const updated = prevPosts.map(post => 
        (post._id === postId || post.id === postId)
          ? { 
              ...post, 
              comments: [...post.comments, newCommentObj]
            }
          : post
      );
      localStorage.setItem('greenhub_posts', JSON.stringify(updated));
      localStorage.setItem('posts', JSON.stringify(updated));
      return updated;
    });

    setNewComment(prev => ({
      ...prev,
      [postId]: ''
    }));
  };

  const formatNotificationDate = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
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
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      width: '100%'
    }}>
      {/* Universal Student Navigation */}
      <StudentHeaderNav
        user={user}
        currentPage="dashboard"
        onNavigate={onNavigate}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
      />

      

      <div style={{ 
        padding: window.innerWidth < 768 ? '15px' : '20px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Banner Section */}
        <div style={{
          background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
          padding: window.innerWidth < 768 ? '20px' : '30px',
          borderRadius: '15px',
          marginBottom: window.innerWidth < 768 ? '20px' : '30px',
          border: '2px solid #81C784',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            color: '#2E7D32', 
            fontSize: window.innerWidth < 768 ? '20px' : '28px', 
            margin: '0 0 10px 0' 
          }}>
            🌱 Welcome to Your Sustainability Journey!
          </h2>
          <p style={{ 
            color: '#1B5E20', 
            fontSize: window.innerWidth < 768 ? '14px' : '16px', 
            margin: 0 
          }}>
            Track your eco-impact, participate in challenges, and connect with fellow green warriors!
          </p>
        </div>

        {/* Sustainability Portals Navigation Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Card 1: Overall Challenges */}
          <div
            onClick={() => onNavigate('all-challenges')}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #81C784',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>🎯</span>
                <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  12+ Active
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1B5E20', fontSize: '18px' }}>
                Overall Challenges
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                Browse all campus sustainability initiatives, filter by category, and join new eco-missions.
              </p>
            </div>
            <div style={{ marginTop: '18px', color: '#2E7D32', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Explore Challenges →
            </div>
          </div>

          {/* Card 2: My Challenges */}
          <div
            onClick={() => onNavigate('my-challenges')}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #66BB6A',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>📋</span>
                <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {joinedChallenges?.length || 0} Joined
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1B5E20', fontSize: '18px' }}>
                My Challenges
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                Track your active tasks, upload proof photos with notes, and monitor verification status.
              </p>
            </div>
            <div style={{ marginTop: '18px', color: '#2E7D32', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              View My Progress →
            </div>
          </div>

          {/* Card 3: AI Recommendations */}
          <div
            onClick={() => onNavigate('recommendations')}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #81C784',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>💡</span>
                <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  AI Engine
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1B5E20', fontSize: '18px' }}>
                AI Recommendations
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                Personalized Electricity, Water & Waste challenges scored using a 4-factor recommendation formula.
              </p>
            </div>
            <div style={{ marginTop: '18px', color: '#2E7D32', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              See Recommendations →
            </div>
          </div>

          {/* Card 4: GreenHUB Community */}
          <div
            onClick={() => onNavigate('greenhub')}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #81C784',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>🌱</span>
                <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  Social Feed
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1B5E20', fontSize: '18px' }}>
                GreenHUB Social
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                Post your sustainability wins with photos, like peer actions, and comment on classmate proofs.
              </p>
            </div>
            <div style={{ marginTop: '18px', color: '#2E7D32', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Open GreenHUB →
            </div>
          </div>

          {/* Card 5: Student Analytics */}
          <div
            onClick={() => onNavigate('student-analytics')}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #81C784',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>📊</span>
                <span style={{ backgroundColor: '#E1F5FE', color: '#0288D1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  Analytics
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1B5E20', fontSize: '18px' }}>
                My Analytics
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                Track your personal CO2 avoided, monthly completion rates, and department impact rankings.
              </p>
            </div>
            <div style={{ marginTop: '18px', color: '#2E7D32', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              View Impact Charts →
            </div>
          </div>

          {/* Card 6: Rewards & Eco-Store */}
          <div
            onClick={() => onNavigate('rewards')}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #81C784',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>🎁</span>
                <span style={{ backgroundColor: '#FFF8E1', color: '#F57F17', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {user?.eco_points || 0} Points
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1B5E20', fontSize: '18px' }}>
                Eco-Store & Rewards
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                Redeem your verified sustainability points for cafeteria vouchers, tree planting kits & badges.
              </p>
            </div>
            <div style={{ marginTop: '18px', color: '#2E7D32', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Visit Eco-Store →
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: window.innerWidth < 768 ? '20px' : '25px',
          marginBottom: window.innerWidth < 768 ? '20px' : '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          <h2 style={{ 
            color: '#2E7D32', 
            fontSize: window.innerWidth < 768 ? '20px' : '24px', 
            marginBottom: '20px' 
          }}>
            🌱 GreenHUB - Student Achievements
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              View and interact with student sustainability achievements and posts
            </p>
          </div>

          {/* Post Creation Composer Card */}
          <div style={{
            backgroundColor: '#F7FCF7',
            border: '2px solid #81C784',
            borderRadius: '14px',
            padding: window.innerWidth < 768 ? '16px' : '22px',
            marginBottom: '30px',
            boxShadow: '0 4px 15px rgba(46, 125, 50, 0.08)'
          }}>
            {/* Composer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                  color: 'white',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)'
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1B5E20', fontSize: '15px' }}>
                    {user?.name || 'Student Eco-Warrior'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {user?.department || 'Sri Eshwar Student'} • Create a GreenHUB Post
                  </div>
                </div>
              </div>
              <span style={{
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                🌱 Share Achievement
              </span>
            </div>

            {/* Success alert */}
            {showPostSuccess && (
              <div style={{
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                border: '1px solid #A5D6A7',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✓</span>
                <span><strong>Success!</strong> Your post is now published live on GreenHUB.</span>
              </div>
            )}

            {/* Post Content Textarea */}
            <div style={{ marginBottom: '14px' }}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your sustainable action today! (e.g., Eliminated plastic bottles for 7 days, planted saplings, biked to college, conserved hostel energy...)"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #A5D6A7',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Tag Challenge & Points Selector */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr',
              gap: '12px',
              marginBottom: '14px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '4px' }}>
                  🎯 Tag Challenge / Activity:
                </label>
                <select
                  value={selectedChallengeTag}
                  onChange={(e) => {
                    setSelectedChallengeTag(e.target.value);
                    if (e.target.value === 'Plastic-Free Week Challenge') setNewPostPoints(50);
                    else if (e.target.value === 'Campus Tree Planting') setNewPostPoints(75);
                    else if (e.target.value === 'Energy Conservation Week') setNewPostPoints(100);
                    else if (e.target.value === 'Sustainable Transportation Week') setNewPostPoints(60);
                    else if (e.target.value === 'Water Conservation Drive') setNewPostPoints(40);
                    else if (e.target.value === 'Zero Food Waste Challenge') setNewPostPoints(80);
                    else if (e.target.value === 'Renewable Energy Project') setNewPostPoints(120);
                    else if (e.target.value === 'Campus Clean-up Drive') setNewPostPoints(70);
                    else setNewPostPoints(50);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                >
                  <option value="Plastic-Free Week Challenge">Plastic-Free Week Challenge (+50 pts)</option>
                  <option value="Campus Tree Planting">Campus Tree Planting (+75 pts)</option>
                  <option value="Energy Conservation Week">Energy Conservation Week (+100 pts)</option>
                  <option value="Sustainable Transportation Week">Sustainable Transportation Week (+60 pts)</option>
                  <option value="Water Conservation Drive">Water Conservation Drive (+40 pts)</option>
                  <option value="Zero Food Waste Challenge">Zero Food Waste Challenge (+80 pts)</option>
                  <option value="Renewable Energy Project">Renewable Energy Project (+120 pts)</option>
                  <option value="Campus Clean-up Drive">Campus Clean-up Drive (+70 pts)</option>
                  <option value="Other Daily Green Milestone">Other Daily Green Milestone (Custom)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '4px' }}>
                  ⭐ Eco-Points Earned:
                </label>
                <input
                  type="number"
                  value={newPostPoints}
                  onChange={(e) => setNewPostPoints(e.target.value)}
                  min="10"
                  max="200"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Custom challenge name if "Other" selected */}
            {selectedChallengeTag === 'Other Daily Green Milestone' && (
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Enter your custom eco-activity title..."
                  value={customChallengeName}
                  onChange={(e) => setCustomChallengeName(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            )}

            {/* Image attachment / Proof input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '4px' }}>
                📸 Attach Photo Proof (URL or Preset):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Paste image URL (optional)"
                  value={newPostImageUrl}
                  onChange={(e) => {
                    setNewPostImageUrl(e.target.value);
                    if (e.target.value) setSelectedPresetImage('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                />
                {(newPostImageUrl || selectedPresetImage) && (
                  <button
                    type="button"
                    onClick={() => { setNewPostImageUrl(''); setSelectedPresetImage(''); }}
                    style={{
                      backgroundColor: '#FFEBEE',
                      color: '#D32F2F',
                      border: '1px solid #FFCDD2',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Clear Photo
                  </button>
                )}
              </div>
            </div>

            {/* Preset quick photos */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                Or select a quick campus proof photo:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { label: '🌱 Tree Planted', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80' },
                  { label: '🥤 Reusable Flask', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80' },
                  { label: '🚲 Campus Bike', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=600&q=80' },
                  { label: '☀️ Solar Power', url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80' },
                  { label: '💧 Water Saving', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
                  { label: '♻️ Clean-up', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPresetImage(preset.url);
                      setNewPostImageUrl('');
                    }}
                    style={{
                      backgroundColor: selectedPresetImage === preset.url ? '#2E7D32' : 'white',
                      color: selectedPresetImage === preset.url ? 'white' : '#2E7D32',
                      border: '1px solid #81C784',
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Preview */}
            {(newPostImageUrl || selectedPresetImage) && (
              <div style={{ marginBottom: '16px', position: 'relative', display: 'inline-block' }}>
                <img
                  src={newPostImageUrl || selectedPresetImage}
                  alt="Proof preview"
                  style={{
                    width: '180px',
                    height: '110px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #81C784'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
                onClick={() => { setNewPostImageUrl(''); setSelectedPresetImage(''); }}
                >
                  ✕
                </span>
              </div>
            )}

            {/* Submit Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleCreateNewPost}
                disabled={isPosting || !newPostContent.trim()}
                style={{
                  background: (!newPostContent.trim() || isPosting) ? '#A5D6A7' : 'linear-gradient(135deg, #2E7D32, #43A047)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: (!newPostContent.trim() || isPosting) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)'
                }}
              >
                <span>🌱</span>
                <span>{isPosting ? 'Publishing...' : 'Share with GreenHUB'}</span>
              </button>
            </div>
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
                      onClick={() => handleLikePostLocal(post._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: (post.likedByUser || post.likedByAdmin) ? '#E91E63' : '#666',
                        fontSize: '14px',
                        fontWeight: (post.likedByUser || post.likedByAdmin) ? 'bold' : 'normal'
                      }}
                    >
                      {(post.likedByUser || post.likedByAdmin) ? '❤️' : '🤍'} {post.likes}
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
                      placeholder="Add a comment..."
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

        {/* Tabbed Interface */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: window.innerWidth < 768 ? '20px' : '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 480 ? 'column' : 'row',
            borderBottom: '2px solid #E0E0E0',
            marginBottom: '25px',
            gap: window.innerWidth < 480 ? '10px' : '0'
          }}>
            <button
              onClick={() => setActiveTab('challenges')}
              style={{
                padding: window.innerWidth < 768 ? '10px 15px' : '15px 25px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: activeTab === 'challenges' ? '3px solid #2E7D32' : '3px solid transparent',
                color: activeTab === 'challenges' ? '#2E7D32' : '#666',
                transition: 'all 0.3s',
                width: window.innerWidth < 480 ? '100%' : 'auto',
                textAlign: 'center'
              }}
            >
              🎯 Available Challenges
            </button>
            <button
              onClick={() => onNavigate('my-challenges')}
              style={{
                padding: window.innerWidth < 768 ? '10px 15px' : '15px 25px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: '3px solid transparent',
                color: '#666',
                transition: 'all 0.3s',
                width: window.innerWidth < 480 ? '100%' : 'auto',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.color = '#2E7D32';
              }}
              onMouseOut={(e) => {
                e.target.style.color = '#666';
              }}
            >
              📋 My Challenges
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              style={{
                padding: window.innerWidth < 768 ? '10px 15px' : '15px 25px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: activeTab === 'leaderboard' ? '3px solid #2E7D32' : '3px solid transparent',
                color: activeTab === 'leaderboard' ? '#2E7D32' : '#666',
                transition: 'all 0.3s',
                width: window.innerWidth < 480 ? '100%' : 'auto',
                textAlign: 'center'
              }}
            >
              🏆 View Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: window.innerWidth < 768 ? '10px 15px' : '15px 25px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: activeTab === 'details' ? '3px solid #2E7D32' : '3px solid transparent',
                color: activeTab === 'details' ? '#2E7D32' : '#666',
                transition: 'all 0.3s',
                width: window.innerWidth < 480 ? '100%' : 'auto',
                textAlign: 'center'
              }}
            >
              👤 My Details
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'challenges' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px' 
              }}>
                <h3 style={{ 
                  color: '#2E7D32', 
                  fontSize: window.innerWidth < 768 ? '18px' : '22px', 
                  margin: 0 
                }}>
                  🎯 Available Challenges
                </h3>
                <button
                  onClick={() => onNavigate('all-challenges')}
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #2E7D32',
                    color: '#2E7D32',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#2E7D32';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#2E7D32';
                  }}
                >
                  View All Challenges →
                </button>
              </div>
              <div style={{ 
                display: 'flex',
                overflowX: 'auto',
                gap: '20px',
                paddingBottom: '10px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#81C784 #f1f1f1'
              }}>
                <style>
                  {`
                    div::-webkit-scrollbar {
                      height: 8px;
                    }
                    div::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 10px;
                    }
                    div::-webkit-scrollbar-thumb {
                      background: #81C784;
                      border-radius: 10px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                      background: #2E7D32;
                    }
                  `}
                </style>
                {challenges.length > 0 ? (
                  // Show up to 6 challenges, but only 3 visible at once
                  challenges.slice(0, 6).map(challenge => (
                    <div key={challenge._id} style={{
                      border: '2px solid #81C784',
                      padding: '20px',
                      borderRadius: '15px',
                      backgroundColor: '#F9F9F9',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      minWidth: '320px',
                      maxWidth: '320px',
                      flexShrink: 0
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
                          onClick={() => handleSubmitProof(challenge._id)}
                          style={{
                            backgroundColor: isJoined(challenge._id) ? '#2E7D32' : '#999',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: isJoined(challenge._id) ? 'pointer' : 'not-allowed',
                            fontSize: '12px'
                          }}
                        >
                          ✅ Submit Proof
                        </button>
                      </div>

                      <button
                        onClick={() => handleJoinChallenge(challenge._id)}
                        style={{
                          width: '100%',
                          backgroundColor: isJoined(challenge._id) ? '#4CAF50' : '#2E7D32',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isJoined(challenge._id) ? '✅ Joined' : '🚀 Join Challenge'}
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
              <h3 style={{ 
                color: '#2E7D32', 
                fontSize: window.innerWidth < 768 ? '18px' : '22px', 
                marginBottom: '20px' 
              }}>
                🏆 Leaderboard - Top Eco Warriors
              </h3>
              <div style={{
                backgroundColor: '#F9F9F9',
                borderRadius: '10px',
                padding: window.innerWidth < 768 ? '15px' : '20px'
              }}>
                {/* Leaderboard Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '50px 1fr 80px' : '60px 1fr 100px 120px',
                  gap: window.innerWidth < 768 ? '10px' : '15px',
                  padding: window.innerWidth < 768 ? '12px' : '15px',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontWeight: 'bold',
                  fontSize: window.innerWidth < 768 ? '12px' : '14px'
                }}>
                  <div>Rank</div>
                  <div>Student</div>
                  <div>Points</div>
                  {window.innerWidth >= 768 && <div>Challenges</div>}
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
                      gridTemplateColumns: window.innerWidth < 768 ? '50px 1fr 80px' : '60px 1fr 100px 120px',
                      gap: window.innerWidth < 768 ? '10px' : '15px',
                      padding: window.innerWidth < 768 ? '12px' : '15px',
                      backgroundColor: student.isUser ? '#E8F5E8' : 'white',
                      border: student.isUser ? '2px solid #2E7D32' : '1px solid #E0E0E0',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      alignItems: 'center',
                      fontSize: window.innerWidth < 768 ? '12px' : '14px'
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
                    {window.innerWidth >= 768 && (
                      <div style={{ color: '#666' }}>
                        {student.challenges} completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div>
              <h3 style={{ 
                color: '#2E7D32', 
                fontSize: window.innerWidth < 768 ? '18px' : '22px', 
                marginBottom: '20px' 
              }}>
                👤 My Details
              </h3>
              
              <div style={{
                backgroundColor: '#F9F9F9',
                borderRadius: '15px',
                padding: window.innerWidth < 768 ? '20px' : '30px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your full name"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your email"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                    Department
                  </label>
                  <select
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science Engineering">Computer Science Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Electronics Engineering">Electronics Engineering</option>
                    <option value="Environmental Science">Environmental Science</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                    Year
                  </label>
                  <select
                    value={profileForm.year}
                    onChange={(e) => setProfileForm({...profileForm, year: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #81C784',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleUpdateProfile}
                    style={{
                      backgroundColor: '#2E7D32',
                      border: '2px solid #2E7D32',
                      color: 'white',
                      padding: '15px 40px',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#1B5E20';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(46, 125, 50, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#2E7D32';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.3)';
                    }}
                  >
                    💾 Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Popup */}
      {showRewardsPopup && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '3px solid #81C784',
            position: 'relative'
          }}>
            {/* Close Icon */}
            <button
              onClick={() => {
                setShowRewardsPopup(false);
                setRedeemPoints('');
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.color = '#333';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#666';
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
              <h2 style={{ 
                color: '#2E7D32', 
                fontSize: '24px', 
                margin: '0 0 8px 0',
                fontWeight: 'bold'
              }}>
                My Reward Points
              </h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                Redeem your eco points for exciting rewards
              </p>
            </div>

            {/* Current Points Display */}
            <div style={{
              backgroundColor: '#E8F5E8',
              border: '2px solid #81C784',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                Available Points
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#2E7D32',
                textShadow: '2px 2px 4px rgba(46, 125, 50, 0.2)'
              }}>
                💰 {user?.eco_points || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Eco Points
              </div>
            </div>

            {/* Redeem Section */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: 'bold', 
                color: '#2E7D32',
                fontSize: '16px'
              }}>
                Redeem Points
              </label>
              <input
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder="Enter points to redeem"
                min="1"
                max={user?.eco_points || 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  textAlign: 'center'
                }}
              />
              <div style={{ 
                fontSize: '11px', 
                color: '#666', 
                marginTop: '6px',
                textAlign: 'center'
              }}>
                Maximum: {user?.eco_points || 0} points
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  setShowRewardsPopup(false);
                  setRedeemPoints('');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #666',
                  color: '#666',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#666';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#666';
                }}
              >
                Close
              </button>
              
              <button
                onClick={handleRedeemPoints}
                style={{
                  backgroundColor: '#2E7D32',
                  border: '2px solid #2E7D32',
                  color: 'white',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s',
                  minWidth: '120px',
                  boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#1B5E20';
                  e.target.style.borderColor = '#1B5E20';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(46, 125, 50, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#2E7D32';
                  e.target.style.borderColor = '#2E7D32';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.3)';
                }}
              >
                🎁 Redeem
              </button>
            </div>

            {/* Quick Redeem Options */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Quick Select:
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {[50, 100, 250, 500].filter(amount => amount <= (user?.eco_points || 0)).map(amount => (
                  <button
                    key={amount}
                    onClick={() => setRedeemPoints(amount.toString())}
                    style={{
                      backgroundColor: redeemPoints === amount.toString() ? '#81C784' : 'transparent',
                      border: '1px solid #81C784',
                      color: redeemPoints === amount.toString() ? 'white' : '#81C784',
                      padding: '6px 12px',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s'
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
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
          animation: 'profileSlideIn 0.3s ease-out',
          minWidth: '350px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => {
          setActiveTab('details');
          setShowProfileUpdatePopup(false);
        }}
        >
          <span style={{ fontSize: '24px' }}>👤</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Update Your Details in My Details!</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
              Click here to go to My Details section
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#2E7D32', marginBottom: '20px', textAlign: 'center' }}>
              📝 Update Your Profile
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2E7D32' }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2E7D32' }}>
                Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2E7D32' }}>
                Department
              </label>
              <select
                value={profileForm.department}
                onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Department</option>
                <option value="Computer Science Engineering">Computer Science Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Electronics Engineering">Electronics Engineering</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2E7D32' }}>
                Year
              </label>
              <select
                value={profileForm.year}
                onChange={(e) => setProfileForm({...profileForm, year: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2E7D32' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your phone number"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2E7D32' }}>
                Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #666',
                  color: '#666',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                style={{
                  backgroundColor: '#2E7D32',
                  border: '2px solid #2E7D32',
                  color: 'white',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                💾 Save Profile
              </button>
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
          animation: 'profileSlideIn 0.3s ease-out',
          minWidth: '320px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Your Profile is Updated!</div>
          </div>
        </div>
      )}

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
          
          @keyframes profileSlideIn {
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
  );
};

export default Dashboard;
