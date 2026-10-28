import { useState, useEffect } from 'react';
import ProofSubmissionModal from '../components/ProofSubmissionModal';
import StudentAppealModal from '../components/StudentAppealModal';
import StudentHeaderNav from '../components/StudentHeaderNav';
import ShareToGreenHubModal from '../components/ShareToGreenHubModal';
import { addNotification, triggerToast } from '../services/notificationService';

const MyChallenges = ({
  user,
  onNavigate,
  joinedChallenges,
  onUpdateJoinedChallenge,
  onOpenNotifications,
  onLogout,
  onCreatePost,
  onUpdateUser
}) => {
  const [allChallenges, setAllChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedChallengeForProof, setSelectedChallengeForProof] = useState(null);
  const [appealSubmission, setAppealSubmission] = useState(null);
  const [shareModalChallenge, setShareModalChallenge] = useState(null);
  const [proofFiles, setProofFiles] = useState([]);
  const [proofDescription, setProofDescription] = useState('');
  const [showProofSubmitPopup, setShowProofSubmitPopup] = useState(false);

  useEffect(() => {
    loadMyChallenges();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setScrollPosition(currentScrollY);
      
      // Show scroll buttons if page is scrollable and user has scrolled
      setShowScrollButtons(documentHeight > windowHeight && currentScrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePublishToGreenHub = (data) => {
    // 1. Create GreenHub Post
    const newPost = {
      _id: 'gh_post_' + Date.now(),
      id: 'gh_post_' + Date.now(),
      author: {
        name: user?.name || 'Student',
        department: user?.department || 'Engineering'
      },
      content: data.content,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedByUser: false,
      challengeCompleted: data.challengeTitle,
      pointsEarned: data.pointsEarned,
      category: data.category,
      proofImages: data.proofImages,
      verifiedBadge: '✅ AI & Faculty Verified',
      aiConfidence: data.aiConfidence,
      comments: []
    };

    if (onCreatePost) {
      onCreatePost(newPost);
    } else {
      try {
        const existingPosts = JSON.parse(localStorage.getItem('greenhub_posts') || '[]');
        localStorage.setItem('greenhub_posts', JSON.stringify([newPost, ...existingPosts]));
      } catch {}
    }

    // 2. Award calculated points to student
    const awardedPts = data.pointsEarned;
    const newPoints = (user?.eco_points || 0) + awardedPts;
    const updatedUser = { ...user, eco_points: newPoints };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    // 3. Mark joined challenge as Completed & GreenHub shared
    if (onUpdateJoinedChallenge) {
      onUpdateJoinedChallenge(data.challengeId, {
        status: 'Completed',
        greenHubShared: true,
        pointsAwarded: awardedPts,
        progress: 100
      });
    }

    // 4. In-App Notification & Toast
    addNotification({
      userId: user?._id || user?.id,
      type: 'points',
      title: '🌟 Eco-Points Awarded!',
      message: `+${awardedPts} Eco-Points added to your profile for sharing your verified accomplishment on GreenHUB!`
    });

    triggerToast({
      type: 'approval',
      title: '🌱 Published to GreenHUB!',
      message: `+${awardedPts} Eco-Points officially awarded to your account.`
    });
  };

  if (user?.role === 'admin') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
        <StudentHeaderNav
          user={user}
          currentPage="admin-dashboard"
          onNavigate={onNavigate}
          onOpenNotifications={onOpenNotifications}
          onLogout={onLogout}
        />
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px 30px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            border: '2px solid #81C784'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛡️</div>
            <h2 style={{ color: '#1B5E20', marginBottom: '12px' }}>Faculty Administrator Account</h2>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 25px auto' }}>
              Admins oversee challenges, review student proof verifications, and approve or reject submissions.
              Challenges and proof submissions are designated for students.
            </p>
            <button
              onClick={() => onNavigate('admin-dashboard')}
              style={{
                backgroundColor: '#1B5E20',
                color: '#FFD700',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(27,94,32,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📋 Open Admin Verification Queue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const loadMyChallenges = async () => {
    try {
      // Load all available challenges (same as AllChallenges component)
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

      setAllChallenges(mockChallenges);
      setLoading(false);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setLoading(false);
    }
  };

  // Combine challenge data with joined challenge data
  const getMyChallenges = () => {
    return joinedChallenges.map(joinedChallenge => {
      const challengeData = allChallenges.find(c => c._id === joinedChallenge.challengeId);
      if (!challengeData) return null;

      // Calculate status based on dates, verification results, and progress
      let status = joinedChallenge.status || 'In Progress';
      let progress = joinedChallenge.progress || 0;
      
      if (joinedChallenge.proofStatus === 'approved' || joinedChallenge.status === 'Completed' || joinedChallenge.status === 'Approved') {
        status = 'Completed';
        progress = 100;
      } else if (joinedChallenge.proofStatus === 'APPEALED' || joinedChallenge.status === 'APPEALED') {
        status = 'APPEALED';
        progress = 75;
      } else if (joinedChallenge.proofStatus === 'AI_REJECTED' || joinedChallenge.status === 'AI_REJECTED' || joinedChallenge.status === 'Rejected') {
        status = 'AI_REJECTED';
      } else if (joinedChallenge.proofStatus === 'MORE_EVIDENCE_REQUIRED' || joinedChallenge.status === 'MORE_EVIDENCE_REQUIRED') {
        status = 'MORE_EVIDENCE_REQUIRED';
        progress = 40;
      } else if (joinedChallenge.proofStatus === 'under_review' || joinedChallenge.proofStatus === 'AI_PASSED') {
        status = 'Under Review';
        progress = 70;
      } else if (new Date(joinedChallenge.joinedDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && progress < 100) {
        status = 'Overdue';
      }

      return {
        ...challengeData,
        ...joinedChallenge,
        status,
        progress,
        dueDate: new Date(new Date(joinedChallenge.joinedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: (joinedChallenge.proofStatus === 'approved' || joinedChallenge.status === 'Completed') ? joinedChallenge.joinedDate : null
      };
    }).filter(Boolean);
  };

  const handleSubmitProof = (challengeId) => {
    const challenge = getMyChallenges().find(c => c._id === challengeId);
    if (challenge) {
      setSelectedChallengeForProof(challenge);
      setShowProofModal(true);
      setProofFiles([]);
      setProofDescription('');
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setProofFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitProofWithFiles = () => {
    if (proofFiles.length === 0 && !proofDescription.trim()) {
      alert('Please upload at least one file or add a description.');
      return;
    }

    onUpdateJoinedChallenge(selectedChallengeForProof._id, {
      submittedProof: true,
      proofStatus: 'under_review',
      proofFiles: proofFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      })),
      proofDescription: proofDescription
    });

    setShowProofModal(false);
    setShowProofSubmitPopup(true);
    setTimeout(() => setShowProofSubmitPopup(false), 3000);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved': return '#4CAF50';
      case 'In Progress': return '#2196F3';
      case 'Overdue': return '#F44336';
      case 'AI_PASSED':
      case 'Under Review': return '#3B82F6';
      case 'AI_REJECTED':
      case 'Rejected': return '#EF4444';
      case 'MORE_EVIDENCE_REQUIRED': return '#F59E0B';
      case 'APPEALED': return '#8B5CF6';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Waste Reduction': return '♻️';
      case 'Environmental': return '🌳';
      case 'Energy': return '⚡';
      case 'Transportation': return '🚲';
      case 'Water': return '💧';
      default: return '🌱';
    }
  };

  const getProofStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'Approved': return '✅';
      case 'under_review':
      case 'AI_PASSED': return '⏳';
      case 'rejected':
      case 'AI_REJECTED': return '❌';
      case 'MORE_EVIDENCE_REQUIRED': return '⚠️';
      case 'APPEALED': return '⚖️';
      default: return '📸';
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const isNearTop = scrollPosition < window.innerHeight / 2;
  const isNearBottom = scrollPosition > document.documentElement.scrollHeight - window.innerHeight - window.innerHeight / 2;

  const myChallenges = getMyChallenges();
  
  const filteredChallenges = myChallenges.filter(challenge => {
    if (filterStatus === 'all') return true;
    return challenge.status.toLowerCase().replace(' ', '_') === filterStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Challenges' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Your Challenges...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#F5F5F5'
    }}>
      {/* Universal Student Navigation Bar */}
      <StudentHeaderNav
        user={user}
        currentPage="my-challenges"
        onNavigate={onNavigate}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
      />

      {/* Content */}
      <div style={{ 
        padding: '30px 20px', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #4CAF50'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {myChallenges.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Total Joined</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #4CAF50'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {myChallenges.filter(c => c.status === 'Completed').length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Completed</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #2196F3'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔄</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {myChallenges.filter(c => c.status === 'In Progress').length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>In Progress</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #FF9800'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💰</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
              {myChallenges.reduce((total, c) => c.status === 'Completed' ? total + c.points : total, 0)}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Points Earned</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '20px', 
            alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
            marginBottom: '20px' 
          }}>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #81C784',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  minWidth: '200px'
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => onNavigate('all-challenges')}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🔍 Browse More Challenges
            </button>
          </div>

          <div style={{ 
            fontSize: '16px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Showing {filteredChallenges.length} of {myChallenges.length} challenges
          </div>
        </div>

        {/* Challenges List */}
        {filteredChallenges.length > 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #81C784'
          }}>
            {filteredChallenges.map((challenge, index) => (
              <div key={challenge._id}>
                <div 
                  style={{
                    padding: '25px',
                    borderBottom: index < filteredChallenges.length - 1 ? '1px solid #E0E0E0' : 'none',
                    backgroundColor: selectedChallenge?._id === challenge._id ? '#E8F5E8' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedChallenge(selectedChallenge?._id === challenge._id ? null : challenge)}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr 1fr 1fr',
                    gap: '20px',
                    alignItems: 'center'
                  }}>
                    {/* Challenge Info */}
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        marginBottom: '8px' 
                      }}>
                        <span style={{ fontSize: '20px' }}>{getCategoryIcon(challenge.category)}</span>
                        <h3 style={{ 
                          margin: 0, 
                          color: '#2E7D32', 
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          {challenge.title}
                        </h3>
                      </div>
                      <p style={{ 
                        margin: '0 0 10px 0', 
                        color: '#666', 
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {challenge.description}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>
                        <span>📅 Joined: {new Date(challenge.joinedDate).toLocaleDateString()}</span>
                        <span>⏰ Due: {new Date(challenge.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {window.innerWidth >= 768 && (
                      <>
                        {/* Status */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            color: getStatusColor(challenge.status),
                            fontWeight: 'bold',
                            fontSize: '14px',
                            marginBottom: '5px'
                          }}>
                            {challenge.status}
                          </div>
                          <div style={{
                            backgroundColor: '#F0F0F0',
                            borderRadius: '10px',
                            height: '8px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              backgroundColor: getStatusColor(challenge.status),
                              height: '100%',
                              width: `${challenge.progress}%`,
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {challenge.progress}%
                          </div>
                        </div>

                        {/* Points & Difficulty */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: '#2E7D32',
                            marginBottom: '5px'
                          }}>
                            {challenge.points} pts
                          </div>
                          <div style={{
                            color: getDifficultyColor(challenge.difficulty),
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}>
                            {challenge.difficulty}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ textAlign: 'center', minWidth: '150px' }}>
                          {challenge.greenHubShared ? (
                            <div style={{
                              color: '#2E7D32',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <span>✅ Verified & Shared</span>
                              <span style={{ fontSize: '11px', color: '#666' }}>+{challenge.pointsAwarded || challenge.points || 50} pts Claimed</span>
                            </div>
                          ) : (challenge.status === 'Approved' || challenge.proofStatus === 'approved') ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareModalChallenge(challenge);
                              }}
                              style={{
                                backgroundColor: '#1B5E20',
                                color: '#FFD700',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 10px rgba(27, 94, 32, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              🌱 Share to GreenHUB & Claim
                            </button>
                          ) : challenge.status === 'Completed' ? (
                            <div style={{
                              color: '#4CAF50',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px'
                            }}>
                              ✅ Verified & Completed
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                              {/* If rejected by AI or Admin, student can Appeal */}
                              {(challenge.status === 'AI_REJECTED' || challenge.proofStatus === 'AI_REJECTED' || challenge.status === 'Rejected') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAppealSubmission(challenge.latestSubmission || {
                                      id: challenge.submissionId || 'sub_' + challenge._id,
                                      _id: challenge.submissionId || 'sub_' + challenge._id,
                                      challengeId: challenge._id,
                                      challengeTitle: challenge.title,
                                      routing: 'AI_REJECTED',
                                      studentId: user?._id || user?.id,
                                      studentName: user?.name,
                                      verification: challenge.verification || {
                                        passed: false,
                                        confidence: 0.42,
                                        findings: ['Automated check: Submissions must satisfy all category requirements.'],
                                        missing_evidence: ['Valid verifiable evidence meeting challenge criteria.']
                                      },
                                      proofFiles: challenge.proofFiles || []
                                    });
                                  }}
                                  style={{
                                    backgroundColor: '#8B5CF6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  ⚖️ Appeal Decision
                                </button>
                              )}

                              {/* If more evidence required, student can Resubmit */}
                              {(challenge.status === 'MORE_EVIDENCE_REQUIRED' || challenge.proofStatus === 'MORE_EVIDENCE_REQUIRED') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmitProof(challenge._id);
                                  }}
                                  style={{
                                    backgroundColor: '#F59E0B',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)'
                                  }}
                                >
                                  📤 Resubmit Evidence
                                </button>
                              )}

                              {/* If already appealed */}
                              {challenge.status === 'APPEALED' && (
                                <span style={{
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  backgroundColor: '#EDE9FE',
                                  color: '#7C3AED',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  border: '1px solid #DDD6FE'
                                }}>
                                  ⚖️ In Appeal Review
                                </span>
                              )}

                              {/* Standard Submit Proof button if active */}
                              {challenge.status !== 'AI_REJECTED' && challenge.status !== 'MORE_EVIDENCE_REQUIRED' && challenge.status !== 'APPEALED' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmitProof(challenge._id);
                                  }}
                                  disabled={challenge.submittedProof && (challenge.status === 'Under Review' || challenge.status === 'Completed')}
                                  style={{
                                    backgroundColor: challenge.submittedProof ? '#3B82F6' : '#2E7D32',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: (challenge.submittedProof && (challenge.status === 'Under Review' || challenge.status === 'Completed')) ? 'default' : 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    opacity: challenge.submittedProof ? 0.9 : 1,
                                    boxShadow: challenge.submittedProof ? 'none' : '0 2px 8px rgba(46, 125, 50, 0.3)'
                                  }}
                                >
                                  {challenge.submittedProof ? '⏳ Under Review (Admin Approval)' : '📤 Post Work & Verify'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile view additional info */}
                  {window.innerWidth < 768 && (
                    <div style={{ 
                      marginTop: '15px', 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '10px',
                      fontSize: '12px'
                    }}>
                      <div>
                        <strong>Status:</strong> 
                        <span style={{ color: getStatusColor(challenge.status), marginLeft: '5px' }}>
                          {challenge.status}
                        </span>
                      </div>
                      <div>
                        <strong>Progress:</strong> {challenge.progress}%
                      </div>
                      <div>
                        <strong>Points:</strong> {challenge.points}
                      </div>
                      <div>
                        <strong>Difficulty:</strong> 
                        <span style={{ color: getDifficultyColor(challenge.difficulty), marginLeft: '5px' }}>
                          {challenge.difficulty}
                        </span>
                      </div>
                      <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                        {challenge.greenHubShared ? (
                          <div style={{ textAlign: 'center', color: '#2E7D32', fontWeight: 'bold', fontSize: '13px' }}>
                            ✅ Shared on GreenHUB (+{challenge.pointsAwarded || challenge.points} pts)
                          </div>
                        ) : (challenge.status === 'Approved' || challenge.proofStatus === 'approved') ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareModalChallenge(challenge);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#1B5E20',
                              color: '#FFD700',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}
                          >
                            🌱 Share to GreenHUB & Claim Points
                          </button>
                        ) : challenge.status !== 'Completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmitProof(challenge._id);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#2E7D32',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold'
                            }}
                          >
                            🚀 Open Verification Portal
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedChallenge?._id === challenge._id && (
                  <div style={{
                    padding: '25px',
                    backgroundColor: '#E8F5E8',
                    borderTop: '2px solid #81C784'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                      gap: '30px' 
                    }}>
                      <div>
                        <h4 style={{ color: '#2E7D32', marginBottom: '15px' }}>📋 Requirements</h4>
                        <ul style={{ paddingLeft: '20px', color: '#666' }}>
                          {challenge.requirements.map((req, idx) => (
                            <li key={idx} style={{ marginBottom: '8px' }}>{req}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 style={{ color: '#2E7D32', marginBottom: '15px' }}>💡 Tips</h4>
                        <ul style={{ paddingLeft: '20px', color: '#666' }}>
                          {challenge.tips.map((tip, idx) => (
                            <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {challenge.status === 'Completed' && challenge.completedDate && (
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#E8F5E8',
                        borderRadius: '8px',
                        border: '2px solid #4CAF50'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          color: '#2E7D32',
                          fontWeight: 'bold'
                        }}>
                          <span style={{ fontSize: '20px' }}>🎉</span>
                          Challenge Completed on {new Date(challenge.completedDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid #81C784'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
            <h3 style={{ color: '#2E7D32', marginBottom: '10px' }}>
              {filterStatus === 'all' ? 'No challenges joined yet' : `No ${filterStatus.replace('_', ' ')} challenges`}
            </h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {filterStatus === 'all' 
                ? 'Start your sustainability journey by joining some challenges!' 
                : 'Try changing the filter to see other challenges.'}
            </p>
            <button
              onClick={() => onNavigate('all-challenges')}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🚀 Browse Available Challenges
            </button>
          </div>
        )}
      </div>

      {/* Responsive Scroll Buttons */}
      {showScrollButtons && (
        <div style={{
          position: 'fixed',
          right: window.innerWidth < 768 ? '15px' : '30px',
          bottom: window.innerWidth < 768 ? '20px' : '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000
        }}>
          {/* Challenge Counter */}
          <div style={{
            backgroundColor: 'rgba(46, 125, 50, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: window.innerWidth < 768 ? '8px 12px' : '10px 15px',
            borderRadius: '25px',
            fontSize: window.innerWidth < 768 ? '12px' : '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
            minWidth: window.innerWidth < 768 ? '80px' : '100px'
          }}>
            <div style={{ fontSize: window.innerWidth < 768 ? '16px' : '18px' }}>🎯</div>
            <div style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px', opacity: 0.9 }}>
              {filteredChallenges.length} of {myChallenges.length}
            </div>
            <div style={{ fontSize: window.innerWidth < 768 ? '10px' : '11px', opacity: 0.8 }}>
              Challenges
            </div>
          </div>

          {/* Scroll to Top Button */}
          {!isNearTop && (
            <button
              onClick={scrollToTop}
              style={{
                backgroundColor: 'rgba(46, 125, 50, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: window.innerWidth < 768 ? '50px' : '60px',
                height: window.innerWidth < 768 ? '50px' : '60px',
                color: 'white',
                cursor: 'pointer',
                fontSize: window.innerWidth < 768 ? '20px' : '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.backgroundColor = 'rgba(27, 94, 32, 0.95)';
                e.target.style.boxShadow = '0 6px 20px rgba(46, 125, 50, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = 'rgba(46, 125, 50, 0.9)';
                e.target.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.3)';
              }}
              title={`Scroll to Top (${myChallenges.length} challenges)`}
            >
              ⬆️
            </button>
          )}

          {/* Scroll to Bottom Button */}
          {!isNearBottom && (
            <button
              onClick={scrollToBottom}
              style={{
                backgroundColor: 'rgba(46, 125, 50, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: window.innerWidth < 768 ? '50px' : '60px',
                height: window.innerWidth < 768 ? '50px' : '60px',
                color: 'white',
                cursor: 'pointer',
                fontSize: window.innerWidth < 768 ? '20px' : '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.backgroundColor = 'rgba(27, 94, 32, 0.95)';
                e.target.style.boxShadow = '0 6px 20px rgba(46, 125, 50, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = 'rgba(46, 125, 50, 0.9)';
                e.target.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.3)';
              }}
              title={`Scroll to Bottom (${myChallenges.length} challenges)`}
            >
              ⬇️
            </button>
          )}
        </div>
      )}

      {/* AI-Assisted Proof Submission Modal */}
      {showProofModal && selectedChallengeForProof && (
        <ProofSubmissionModal
          isOpen={showProofModal}
          challenge={selectedChallengeForProof}
          user={user}
          onClose={() => setShowProofModal(false)}
          onSubmissionComplete={(result) => {
            setShowProofModal(false);
            const sub = result?.submission || result;
            const resOutcome = result?.verification || result?.verification_result || sub?.verification_result;
            const routing = result?.routing || resOutcome?.outcome || (resOutcome?.passed ? 'AI_PASSED' : 'AI_REJECTED');

            onUpdateJoinedChallenge(selectedChallengeForProof._id, {
              submittedProof: true,
              submissionId: sub?.id || sub?._id || 'sub_' + Date.now(),
              proofStatus: routing === 'AI_PASSED' ? 'under_review' : routing,
              status: routing === 'AI_PASSED' ? 'Under Review' : (routing === 'AI_REJECTED' ? 'AI_REJECTED' : 'In Progress'),
              routing: routing,
              verification: resOutcome,
              latestSubmission: sub,
              proofFiles: sub?.proofFiles || sub?.proof_files || []
            });

            setShowProofSubmitPopup(true);
            setTimeout(() => setShowProofSubmitPopup(false), 3500);
          }}
          onSuccess={(result) => {
            setShowProofModal(false);
            const sub = result?.submission || result;
            const resOutcome = result?.verification || result?.verification_result || sub?.verification_result;
            const routing = result?.routing || resOutcome?.outcome || (resOutcome?.passed ? 'AI_PASSED' : 'AI_REJECTED');

            onUpdateJoinedChallenge(selectedChallengeForProof._id, {
              submittedProof: true,
              submissionId: sub?.id || sub?._id || 'sub_' + Date.now(),
              proofStatus: routing === 'AI_PASSED' ? 'under_review' : routing,
              status: routing === 'AI_PASSED' ? 'Under Review' : (routing === 'AI_REJECTED' ? 'AI_REJECTED' : 'In Progress'),
              routing: routing,
              verification: resOutcome,
              latestSubmission: sub,
              proofFiles: sub?.proofFiles || sub?.proof_files || []
            });

            setShowProofSubmitPopup(true);
            setTimeout(() => setShowProofSubmitPopup(false), 3500);
          }}
        />
      )}

      {/* Student Appeal Modal */}
      {appealSubmission && (
        <StudentAppealModal
          submission={appealSubmission}
          user={user}
          onClose={() => setAppealSubmission(null)}
          onSuccess={(updatedSub) => {
            setAppealSubmission(null);
            onUpdateJoinedChallenge(updatedSub.challengeId, {
              proofStatus: 'APPEALED',
              status: 'APPEALED',
              routing: 'APPEALED',
              latestSubmission: updatedSub
            });
            alert('Appeal successfully submitted! It has been routed to the administrative appeals queue.');
          }}
        />
      )}

      {/* Proof Submit Success Popup */}
      {showProofSubmitPopup && (
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
          animation: 'popupSlideIn 0.3s ease-out',
          minWidth: '300px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>📤</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Proof Submitted Successfully!</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
              Your submission is under review
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes popupSlideIn {
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
      {/* Share to GreenHUB Post-Approval Modal */}
      {shareModalChallenge && (
        <ShareToGreenHubModal
          isOpen={!!shareModalChallenge}
          onClose={() => setShareModalChallenge(null)}
          challenge={shareModalChallenge}
          submission={shareModalChallenge.latestSubmission || {
            proofImage: shareModalChallenge.proofImage,
            challengeTitle: shareModalChallenge.title
          }}
          onPublish={handlePublishToGreenHub}
        />
      )}
    </div>
  );
};

export default MyChallenges;
