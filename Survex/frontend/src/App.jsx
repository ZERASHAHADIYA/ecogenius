import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard_final';
import Challenges from './pages/Challenges_simple';
import Rewards from './pages/Rewards';
import Leaderboard from './pages/Leaderboard';
import { calculateFairPoints } from './utils/fairPointsCalculator';
import AdminPanel from './pages/AdminPanel_simple';
import Profile from './pages/Profile_simple';
import AllChallenges from './pages/AllChallenges';
import MyChallenges from './pages/MyChallenges';
import AdminDashboard from './pages/AdminDashboard';
import StudentAnalytics from './pages/StudentAnalytics';
import AdminAnalytics from './pages/AdminAnalytics';
import LandingPage from './pages/LandingPage';
import GreenHubPage from './pages/GreenHubPage';
import RecommendationsPage from './pages/RecommendationsPage';
import NotificationCenter from './components/NotificationCenter';
import NotificationToasts from './components/NotificationToasts';
import { addNotification, triggerToast } from './services/notificationService';
import { addPlatformActivity, broadcastSync, subscribeToSync } from './services/realtimeSync';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');
  const [highlightChallengeId, setHighlightChallengeId] = useState(null);
  const [joinedChallenges, setJoinedChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  useEffect(() => {
    // 1. Load saved data from localStorage
    const savedJoinedChallenges = localStorage.getItem('joinedChallenges');
    if (savedJoinedChallenges) {
      try {
        setJoinedChallenges(JSON.parse(savedJoinedChallenges));
      } catch (error) {
        console.error('Error parsing joined challenges:', error);
      }
    }

    const savedSubmissions = localStorage.getItem('submissions');
    if (savedSubmissions) {
      try {
        setSubmissions(JSON.parse(savedSubmissions));
      } catch (error) {
        console.error('Error parsing submissions:', error);
      }
    } else {
      // Default initial mock submissions for admin evaluation if empty
      const defaultSubmissions = [
        {
          id: 'sub-1',
          studentId: 'user1',
          studentName: 'John Doe',
          studentDepartment: 'Computer Science Engineering',
          challengeId: '1',
          challengeTitle: 'Plastic-Free Week Challenge',
          description: 'Replaced all single-use bottles and grocery plastic bags with reusable cloth alternatives for 7 days.',
          proofFiles: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=500&q=80'],
          proofImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=500&q=80',
          submittedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          submissionDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 'sub-2',
          studentId: 'user1',
          studentName: 'John Doe',
          studentDepartment: 'Computer Science Engineering',
          challengeId: '2',
          challengeTitle: 'Campus Tree Planting Drive',
          description: 'Planted 3 saplings near Block 3 campus garden and mulched the soil.',
          proofFiles: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80'],
          proofImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80',
          submittedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          submissionDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          status: 'Approved'
        }
      ];
      setSubmissions(defaultSubmissions);
      localStorage.setItem('submissions', JSON.stringify(defaultSubmissions));
    }

    const savedPosts = localStorage.getItem('posts');
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (error) {
        console.error('Error parsing posts:', error);
      }
    }

    // 2. Check for real existing session in localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.role === 'admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('dashboard');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setCurrentPage('login');
      }
    } else {
      // Unauthenticated visitor starts on the rich Landing Page!
      setUser(null);
      setCurrentPage('landing');
    }

    setLoading(false);

    // Subscribe to real-time events across windows and components
    const cleanupSync = subscribeToSync((detail) => {
      try {
        const savedSubmissions = localStorage.getItem('submissions');
        if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
        const savedJoined = localStorage.getItem('joinedChallenges');
        if (savedJoined) setJoinedChallenges(JSON.parse(savedJoined));
        const savedPosts = localStorage.getItem('posts');
        if (savedPosts) setPosts(JSON.parse(savedPosts));
      } catch (err) {
        console.error('Real-time sync error in App:', err);
      }
    });

    return () => {
      cleanupSync();
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    triggerToast({
      type: 'challenge',
      title: `Welcome, ${userData.name}!`,
      message: `Signed in as ${userData.role === 'admin' ? 'Administrator' : 'Student'}.`
    });

    if (userData.role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleNavigate = (page, challengeId = null) => {
    // Strict Role-Based Access Control
    if (['admin-dashboard', 'admin-analytics', 'admin'].includes(page) && user?.role !== 'admin') {
      triggerToast({
        type: 'rejection',
        title: 'Access Restricted 🛡️',
        message: 'Administrator authorization required. Student accounts cannot access this portal.'
      });
      return;
    }

    setCurrentPage(page);
    setHighlightChallengeId(challengeId);
  };

  const handleJoinChallenge = (challengeId, challengeData = null) => {
    if (!joinedChallenges.find(jc => jc.challengeId === challengeId)) {
      const challengeTitle = challengeData?.title || 'New Challenge';
      const studentName = user?.name || 'Student';
      const studentDept = user?.department || 'Engineering';
      const points = challengeData?.points || 50;

      const joinedChallenge = {
        challengeId,
        joinedDate: new Date().toISOString(),
        status: 'In Progress',
        progress: 0,
        submittedProof: false,
        proofStatus: 'pending',
        ...(challengeData && { challengeData })
      };

      const updatedJoinedChallenges = [...joinedChallenges, joinedChallenge];
      setJoinedChallenges(updatedJoinedChallenges);
      localStorage.setItem('joinedChallenges', JSON.stringify(updatedJoinedChallenges));

      // 1. Increment challenge participant count in persistent tracker
      try {
        const counts = JSON.parse(localStorage.getItem('challenge_participants_counts') || '{}');
        const prevCount = counts[challengeId] || challengeData?.participants || 25;
        counts[challengeId] = prevCount + 1;
        localStorage.setItem('challenge_participants_counts', JSON.stringify(counts));
      } catch (err) {
        console.error('Error updating participant count:', err);
      }

      // 2. Trigger real-time In-App Notification & Toast for the Student
      addNotification({
        userId: user?._id || user?.id,
        type: 'challenge',
        title: '🎯 Challenge Started!',
        message: `You've joined '${challengeTitle}'. Follow the instructions and submit your photo proof to earn +${points} Eco-Points!`,
        points,
        challengeId,
        showToast: true
      });

      // 3. Trigger real-time Notification for the Faculty / Administrator Queue
      addNotification({
        userId: 'admin',
        type: 'challenge',
        title: '👥 Student Joined Challenge',
        message: `${studentName} (${studentDept}) joined challenge '${challengeTitle}'.`,
        challengeId,
        points,
        showToast: user?.role === 'admin'
      });

      // 4. Log live platform activity so it immediately appears in Admin Dashboard Recent Activity
      addPlatformActivity({
        type: 'join',
        studentId: user?._id || user?.id,
        studentName,
        studentDepartment: studentDept,
        challengeId,
        challengeTitle,
        points,
        status: 'In Progress'
      });

      // 5. Broadcast real-time sync event across all open windows & tabs
      broadcastSync('challenge_joined', {
        challengeId,
        challengeTitle,
        studentName,
        studentDepartment: studentDept
      });

      return true;
    }
    return false;
  };

  const handleUpdateJoinedChallenge = (challengeId, updates) => {
    const updatedJoinedChallenges = joinedChallenges.map(jc =>
      jc.challengeId === challengeId ? { ...jc, ...updates } : jc
    );
    setJoinedChallenges(updatedJoinedChallenges);
    localStorage.setItem('joinedChallenges', JSON.stringify(updatedJoinedChallenges));

    // If latestSubmission from AI Verification Service is provided
    if (updates.latestSubmission) {
      const incomingSub = updates.latestSubmission;
      const subId = incomingSub.id || incomingSub._id || 'sub_' + Date.now();
      const formattedSubmission = {
        id: subId,
        _id: subId,
        studentId: incomingSub.studentId || user?._id || user?.id,
        studentName: incomingSub.studentName || user?.name || 'Student',
        studentDepartment: user?.department || 'Engineering',
        challengeId: challengeId,
        challengeTitle: incomingSub.challengeTitle || updates.challengeTitle || 'Sustainability Challenge',
        proofFiles: incomingSub.proofFiles || updates.proofFiles || [],
        proofImage: incomingSub.proofFiles?.[0]?.url || incomingSub.proofFiles?.[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80',
        description: incomingSub.description || updates.proofDescription || 'AI Verified sustainability evidence submission.',
        submittedAt: incomingSub.submittedAt || new Date().toISOString(),
        submissionDate: incomingSub.submittedAt || new Date().toISOString(),
        status: incomingSub.status || (updates.routing === 'AI_PASSED' ? 'AI_PASSED' : updates.routing || 'pending'),
        routing: updates.routing || incomingSub.routing,
        verification: incomingSub.verification || updates.verification,
        attempts: incomingSub.attempts || 1,
        challenge_code: incomingSub.challenge_code
      };

      const existingIndex = submissions.findIndex(s => s.id === subId || s._id === subId || s.challengeId === challengeId);
      let updatedSubmissions;
      if (existingIndex >= 0) {
        updatedSubmissions = [...submissions];
        updatedSubmissions[existingIndex] = { ...updatedSubmissions[existingIndex], ...formattedSubmission };
      } else {
        updatedSubmissions = [formattedSubmission, ...submissions];
      }
      setSubmissions(updatedSubmissions);
      localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));

      if (updates.routing === 'AI_PASSED') {
        addNotification({
          userId: 'admin',
          type: 'challenge',
          title: '🤖 Submission Passed AI Verification',
          message: `${user?.name || 'A student'} submitted evidence for '${formattedSubmission.challengeTitle}' which passed AI checks and is queued for your approval.`,
          challengeId,
          showToast: user?.role === 'admin'
        });
      }

      // Log live activity for real-time Admin Recent Activity feed
      addPlatformActivity({
        type: 'submission',
        studentId: formattedSubmission.studentId,
        studentName: formattedSubmission.studentName,
        studentDepartment: formattedSubmission.studentDepartment,
        challengeId,
        challengeTitle: formattedSubmission.challengeTitle,
        proofImage: formattedSubmission.proofImage,
        status: 'pending'
      });
      broadcastSync('proof_submitted', { submission: formattedSubmission });
    } else if (updates.submittedProof && (updates.proofStatus === 'under_review' || updates.proofStatus === 'pending')) {
      const subId = 'sub_' + Date.now();
      const submission = {
        id: subId,
        _id: subId,
        studentId: user._id || user.id,
        studentName: user.name,
        studentDepartment: user.department || 'Engineering',
        challengeId: challengeId,
        challengeTitle: updates.challengeTitle || 'Sustainability Challenge',
        proofFiles: updates.proofFiles || [],
        proofImage: updates.proofFiles?.[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80',
        description: updates.proofDescription || 'Challenge proof submission.',
        submittedAt: new Date().toISOString(),
        submissionDate: new Date().toISOString(),
        status: 'AI_PASSED',
        routing: 'AI_PASSED'
      };

      const updatedSubmissions = [submission, ...submissions];
      setSubmissions(updatedSubmissions);
      localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));

      // Real-time notification for student
      addNotification({
        userId: user._id || user.id,
        type: 'challenge',
        title: '📤 Proof Submitted for Verification',
        message: `Your proof for '${submission.challengeTitle}' was uploaded and queued for admin review.`,
        challengeId,
        showToast: true
      });

      // Real-time broadcast for admin queue
      addNotification({
        userId: 'admin',
        type: 'challenge',
        title: '📝 New Proof Pending Review',
        message: `${user.name} submitted proof for '${submission.challengeTitle}'.`,
        challengeId,
        showToast: user?.role === 'admin'
      });

      // Log live activity for real-time Admin Recent Activity feed
      addPlatformActivity({
        type: 'submission',
        studentId: submission.studentId,
        studentName: submission.studentName,
        studentDepartment: submission.studentDepartment,
        challengeId,
        challengeTitle: submission.challengeTitle,
        proofImage: submission.proofImage,
        status: 'pending'
      });
      broadcastSync('proof_submitted', { submission });
    }
  };

  const handleUpdateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleSubmissionReview = (submissionId, action, adminComment = '') => {
    const actionLower = (action || '').toLowerCase();
    const isApproved = actionLower === 'approved' || actionLower === 'approve';
    const updatedStatus = isApproved ? 'Approved' : 'Rejected';

    // Call backend API if available
    try {
      fetch(`http://localhost:5000/api/submissions/${submissionId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: isApproved, comment: adminComment })
      }).catch(() => {});
    } catch {}

    const updatedSubmissions = submissions.map(submission => {
      if (submission.id === submissionId || submission._id === submissionId) {
        const challengeTitle = submission.challengeTitle || 'Challenge';
        const vResult = submission.verification_result || {};
        
        // Calculate fair points using mathematical formula
        const calc = fairCalcData || calculateFairPoints({
          basePoints: submission.points || 50,
          difficulty: submission.difficulty || 'Medium',
          aiConfidence: vResult.confidence_score || 0.92,
          onTime: true,
          streakDays: 3,
          sharedToGreenHub: true
        });
        const pointsToAward = calc.totalPoints || 75;

        const updatedSubmission = {
          ...submission,
          status: updatedStatus,
          adminComment: adminComment || (isApproved ? 'Approved by faculty.' : 'Proof needs clearer verification.'),
          reviewedAt: new Date().toISOString(),
          claimablePoints: pointsToAward,
          fairPointsCalc: calc
        };

        const targetStudentId = submission.studentId;

        if (isApproved) {
          // 1. Update joined challenges for student: mark as approved and ready to share on GreenHub
          const updatedJoined = joinedChallenges.map(jc =>
            jc.challengeId === submission.challengeId
              ? {
                  ...jc,
                  proofStatus: 'approved',
                  status: 'Approved',
                  canShareToGreenHub: true,
                  claimablePoints: pointsToAward,
                  progress: 100,
                  latestSubmission: {
                    ...submission,
                    proofImage: submission.proofImage || submission.proof_image || jc.proofImage
                  }
                }
              : jc
          );
          setJoinedChallenges(updatedJoined);
          localStorage.setItem('joinedChallenges', JSON.stringify(updatedJoined));

          // 2. Real-time in-app notification & toast for student guiding them to share on GreenHub to claim points
          addNotification({
            userId: targetStudentId,
            type: 'approval',
            title: '🎉 Proof Approved by Faculty!',
            message: `Your proof for '${challengeTitle}' was verified & approved! Share your achievement to GreenHUB to claim your +${pointsToAward} Eco-Points!`,
            points: pointsToAward,
            challengeId: submission.challengeId,
            canShareToGreenHub: true
          });
        } else {
          // Rejection notification
          addNotification({
            userId: submission.studentId,
            type: 'rejection',
            title: '⚠️ Proof Revision Requested',
            message: `Your proof for '${challengeTitle}' was reviewed: ${adminComment || 'Photo evidence was insufficient. Please resubmit.'}`,
            challengeId: submission.challengeId
          });
        }

        return updatedSubmission;
      }
      return submission;
    });

    setSubmissions(updatedSubmissions);
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));

    // Log live activity and broadcast real-time sync across platform
    const targetSub = updatedSubmissions.find(s => s.id === submissionId || s._id === submissionId);
    if (targetSub) {
      addPlatformActivity({
        type: isApproved ? 'approval' : 'rejection',
        studentId: targetSub.studentId,
        studentName: targetSub.studentName || 'Student',
        studentDepartment: targetSub.studentDepartment || 'Sri Eshwar Campus',
        challengeId: targetSub.challengeId,
        challengeTitle: targetSub.challengeTitle || 'Challenge',
        proofImage: targetSub.proofImage,
        points: targetSub.claimablePoints || 75,
        status: isApproved ? 'approved' : 'rejected'
      });
      broadcastSync('submission_reviewed', {
        submissionId,
        status: updatedStatus,
        points: targetSub.claimablePoints
      });
    }
  };

  const handleCreatePost = (postData) => {
    const newPost = {
      _id: postData._id || 'post_' + Date.now(),
      id: postData.id || postData._id || 'post_' + Date.now(),
      studentId: user?._id || user?.id,
      author: {
        name: user?.name || 'Student',
        department: user?.department || 'Engineering'
      },
      content: postData.content,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedByUser: false,
      likedByAdmin: false,
      comments: [],
      ...postData
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    localStorage.setItem('greenhub_posts', JSON.stringify(updatedPosts));

    triggerToast({
      type: 'challenge',
      title: '🌱 Published to GreenHUB!',
      message: 'Your eco-achievement was shared with fellow students and faculty.'
    });
  };

  const handleLikePost = (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId || post._id === postId) {
        return {
          ...post,
          likes: post.likedByAdmin ? post.likes - 1 : post.likes + 1,
          likedByAdmin: !post.likedByAdmin
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    localStorage.setItem('greenhub_posts', JSON.stringify(updatedPosts));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('landing');
    triggerToast({
      type: 'general',
      title: 'Signed Out',
      message: 'You have been safely signed out.'
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#F5F5F5'
        }}
      >
        <div>
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #2E7D32',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}
          />
          <p style={{ color: '#2E7D32', fontSize: '18px' }}>Initializing EcoGenius Platform...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not logged in -> Show Landing Page or Login Modal
  if (!user) {
    if (currentPage === 'login') {
      return (
        <>
          <NotificationToasts />
          <Login onLogin={handleLogin} onBackToLanding={() => setCurrentPage('landing')} />
        </>
      );
    }
    return (
      <>
        <NotificationToasts />
        <LandingPage
          onGetStarted={() => setCurrentPage('login')}
          onAdminClick={() => setCurrentPage('login')}
          onNavigate={handleNavigate}
          user={null}
        />
      </>
    );
  }

  // If logged in and explicitly navigating to Landing Page
  if (currentPage === 'landing') {
    return (
      <>
        <NotificationToasts />
        <LandingPage
          onGetStarted={() => setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
          onAdminClick={() => setCurrentPage('admin-dashboard')}
          onNavigate={handleNavigate}
          user={user}
        />
      </>
    );
  }

  return (
    <>
      {/* Global Real-time Floating Toasts */}
      <NotificationToasts />

      {/* Global Interactive Notification Center Modal */}
      <NotificationCenter
        user={user}
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onNavigate={handleNavigate}
      />

      {currentPage === 'challenges' && (
        <Challenges user={user} onNavigate={handleNavigate} onOpenNotifications={() => setShowNotificationCenter(true)} />
      )}

      {currentPage === 'rewards' && (
        <Rewards
          user={user}
          onNavigate={handleNavigate}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'leaderboard' && (
        <Leaderboard
          user={user}
          onNavigate={handleNavigate}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPanel user={user} onNavigate={handleNavigate} onOpenNotifications={() => setShowNotificationCenter(true)} />
      )}

      {currentPage === 'profile' && (
        <Profile user={user} onNavigate={handleNavigate} onUpdateUser={setUser} onOpenNotifications={() => setShowNotificationCenter(true)} />
      )}

      {currentPage === 'all-challenges' && (
        <AllChallenges
          user={user}
          onNavigate={handleNavigate}
          highlightChallengeId={highlightChallengeId}
          joinedChallenges={joinedChallenges}
          onJoinChallenge={handleJoinChallenge}
          onUpdateJoinedChallenge={handleUpdateJoinedChallenge}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          submissions={submissions}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'my-challenges' && (
        <MyChallenges
          user={user}
          onNavigate={handleNavigate}
          joinedChallenges={joinedChallenges}
          onUpdateJoinedChallenge={handleUpdateJoinedChallenge}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onLogout={handleLogout}
          onCreatePost={handleCreatePost}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {currentPage === 'greenhub' && (
        <GreenHubPage
          user={user}
          onNavigate={handleNavigate}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onLogout={handleLogout}
          onCreatePost={handleCreatePost}
          posts={posts}
          onLikePost={handleLikePost}
        />
      )}

      {currentPage === 'recommendations' && (
        <RecommendationsPage
          user={user}
          onNavigate={handleNavigate}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onLogout={handleLogout}
          joinedChallenges={joinedChallenges}
          onJoinChallenge={handleJoinChallenge}
          submissions={submissions}
        />
      )}

      {currentPage === 'student-analytics' && (
        <StudentAnalytics
          user={user}
          onNavigate={handleNavigate}
          joinedChallenges={joinedChallenges}
          submissions={submissions}
          onOpenNotifications={() => setShowNotificationCenter(true)}
        />
      )}

      {currentPage === 'admin-analytics' && (
        <AdminAnalytics
          user={user}
          onNavigate={handleNavigate}
          submissions={submissions}
          onOpenNotifications={() => setShowNotificationCenter(true)}
        />
      )}

      {currentPage === 'admin-dashboard' && (
        <AdminDashboard
          user={user}
          onNavigate={handleNavigate}
          submissions={submissions}
          onSubmissionReview={handleSubmissionReview}
          posts={posts}
          onLikePost={handleLikePost}
          onUpdateUser={handleUpdateUser}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'dashboard' && (
        <Dashboard
          user={user}
          onNavigate={handleNavigate}
          joinedChallenges={joinedChallenges}
          onJoinChallenge={handleJoinChallenge}
          onUpdateJoinedChallenge={handleUpdateJoinedChallenge}
          onUpdateUser={handleUpdateUser}
          onCreatePost={handleCreatePost}
          posts={posts}
          onLikePost={handleLikePost}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          onLogout={handleLogout}
          submissions={submissions}
        />
      )}
    </>
  );
}

export default App;
