import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Calendar, Award, CheckCircle, Zap, Info } from 'lucide-react';
import StudentHeaderNav from '../components/StudentHeaderNav';
import { leaderboard } from '../services/api';
import { rankLeaderboardFairly, calculateFairPoints } from '../utils/fairPointsCalculator';

const Leaderboard = ({ user, onNavigate, onOpenNotifications, onLogout }) => {
  const [activeTab, setActiveTab] = useState('global');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [departmentLeaderboard, setDepartmentLeaderboard] = useState([]);
  const [departmentRankings, setDepartmentRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  // Baseline student data with verified challenge stats & AI confidence
  const mockStudents = [
    { _id: '1', name: 'Priya Sharma', department: 'Environmental Science', eco_points: 485, challenges_completed: 7, ai_quality_index: 96, streak: 8, badges: ['🌾 Sustainability Hero', '⚡ Energy Champion'] },
    { _id: '2', name: 'Rahul Kumar', department: 'Computer Science', eco_points: 420, challenges_completed: 6, ai_quality_index: 94, streak: 6, badges: ['🌿 Eco Learner', '🌾 Sustainability Hero'] },
    { _id: '3', name: 'Anita Patel', department: 'Business Administration', eco_points: 375, challenges_completed: 5, ai_quality_index: 93, streak: 5, badges: ['🌿 Eco Learner'] },
    { _id: '4', name: 'Vikram Singh', department: 'Mechanical Engineering', eco_points: 330, challenges_completed: 5, ai_quality_index: 91, streak: 4, badges: ['🌿 Eco Learner'] },
    { _id: '5', name: 'Sneha Reddy', department: 'Civil Engineering', eco_points: 310, challenges_completed: 4, ai_quality_index: 95, streak: 4, badges: ['🌿 Eco Learner'] },
    { _id: '6', name: 'Arjun Nair', department: 'Electrical Engineering', eco_points: 285, challenges_completed: 4, ai_quality_index: 92, streak: 3, badges: ['🌱 Eco Starter'] },
    { _id: '7', name: 'Kavya Iyer', department: 'Electronics Engineering', eco_points: 260, challenges_completed: 3, ai_quality_index: 90, streak: 3, badges: ['🌱 Eco Starter'] },
    { _id: '8', name: 'Ravi Krishnan', department: 'Information Technology', eco_points: 235, challenges_completed: 3, ai_quality_index: 89, streak: 2, badges: ['🌱 Eco Starter'] },
    { _id: '9', name: 'Meera Gupta', department: 'Chemical Engineering', eco_points: 210, challenges_completed: 3, ai_quality_index: 92, streak: 2, badges: ['🌱 Eco Starter'] },
    { _id: '10', name: 'Karthik Raj', department: 'Automobile Engineering', eco_points: 190, challenges_completed: 2, ai_quality_index: 88, streak: 2, badges: ['🌱 Eco Starter'] }
  ];

  useEffect(() => {
    loadLeaderboardData();
  }, [activeTab, timeFilter]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      let registered = [];
      try {
        const raw = localStorage.getItem('registered_users');
        if (raw) {
          registered = JSON.parse(raw).map(r => r.user || r);
        }
      } catch {}

      // Combine current user, registered users, and mock benchmark students
      const allCandidates = [...mockStudents];
      if (user && !allCandidates.some(c => (c._id === user._id || c._id === user.id))) {
        allCandidates.push({
          ...user,
          _id: user._id || user.id,
          challenges_completed: user.challenges_completed || 2,
          ai_quality_index: 94,
          streak: user.streak || 3
        });
      }

      registered.forEach(regUser => {
        const rid = regUser._id || regUser.id;
        if (!allCandidates.some(c => c._id === rid)) {
          allCandidates.push({
            ...regUser,
            _id: rid,
            challenges_completed: regUser.challenges_completed || 1,
            ai_quality_index: 92,
            streak: 2
          });
        }
      });

      // Filter out admin roles
      const studentOnly = allCandidates.filter(u => u.role !== 'admin');

      // Rank fairly using mathematical criteria
      const rankedGlobal = rankLeaderboardFairly(studentOnly, []);
      setGlobalLeaderboard(rankedGlobal);

      // Department rankings
      const deptFiltered = rankedGlobal.filter(s => 
        (s.department || '').toLowerCase().includes((user?.department || 'Engineering').toLowerCase())
      );
      setDepartmentLeaderboard(deptFiltered.length > 0 ? deptFiltered : rankedGlobal.slice(0, 5));

      // Group department aggregations
      const deptMap = {};
      rankedGlobal.forEach(s => {
        const d = s.department || 'Engineering';
        if (!deptMap[d]) deptMap[d] = { totalPoints: 0, studentCount: 0 };
        deptMap[d].totalPoints += (s.eco_points || 0);
        deptMap[d].studentCount += 1;
      });

      const aggregatedDepts = Object.entries(deptMap).map(([dept, data], idx) => ({
        _id: dept,
        total_points: data.totalPoints,
        student_count: data.studentCount,
        avg_points: Math.round(data.totalPoints / data.studentCount),
        rank: idx + 1
      })).sort((a, b) => b.total_points - a.total_points);

      setDepartmentRankings(aggregatedDepts);

      // Find user rank
      const myRankObj = rankedGlobal.find(s => s._id === (user?._id || user?.id));
      setUserRank(myRankObj ? myRankObj.rank : 4);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(255, 160, 0, 0.4)' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #B0BEC5 0%, #78909C 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(120, 144, 156, 0.4)' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #FFB74D 0%, #E65100 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(230, 81, 0, 0.4)' };
    return { backgroundColor: '#F1F8E9', color: '#1B5E20', border: '1px solid #C8E6C9' };
  };

  const LeaderboardTable = ({ data, showDepartment = true }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Table Column Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '50px 1fr 90px' : '60px 2fr 1.2fr 100px 90px 110px',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: '#1B5E20',
        color: 'white',
        borderRadius: '10px',
        fontWeight: 'bold',
        fontSize: '13px'
      }}>
        <div>Rank</div>
        <div>Student</div>
        {window.innerWidth >= 768 && <div>Department</div>}
        {window.innerWidth >= 768 && <div style={{ textAlign: 'center' }}>Verified</div>}
        {window.innerWidth >= 768 && <div style={{ textAlign: 'center' }}>AI Quality</div>}
        <div style={{ textAlign: 'right' }}>Fair Points</div>
      </div>

      {data.map((item, index) => {
        const isCurrent = item._id === (user?._id || user?.id);
        const rank = item.rank || (index + 1);

        return (
          <div
            key={item._id || index}
            onClick={() => setSelectedStudentDetail(item)}
            style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '50px 1fr 90px' : '60px 2fr 1.2fr 100px 90px 110px',
              gap: '12px',
              alignItems: 'center',
              padding: '14px 18px',
              backgroundColor: isCurrent ? '#E8F5E9' : rank <= 3 ? '#FAFAFA' : '#FFFFFF',
              borderRadius: '12px',
              border: isCurrent ? '2px solid #2E7D32' : rank === 1 ? '1.5px solid #FFD54F' : '1px solid #EEEEEE',
              boxShadow: isCurrent ? '0 4px 15px rgba(46, 125, 50, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Rank Badge */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: rank <= 3 ? '18px' : '13px',
              ...getRankBadgeStyle(rank)
            }}>
              {getRankIcon(rank)}
            </div>

            {/* Student Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#2E7D32',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                flexShrink: 0
              }}>
                {(item.name || 'S').charAt(0)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontWeight: 'bold',
                  color: isCurrent ? '#1B5E20' : '#222',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {item.name}
                  {isCurrent && (
                    <span style={{
                      backgroundColor: '#2E7D32',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      You
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {item.badges?.[item.badges.length - 1] || '🌱 Eco Explorer'}
                </div>
              </div>
            </div>

            {/* Department */}
            {window.innerWidth >= 768 && (
              <div style={{ fontSize: '12px', color: '#555' }}>
                {item.department || 'Engineering'}
              </div>
            )}

            {/* Verified Challenges Count */}
            {window.innerWidth >= 768 && (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  backgroundColor: '#E8F5E9',
                  color: '#1B5E20',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ✓ {item.challenges_completed || 0}
                </span>
              </div>
            )}

            {/* AI Quality Index */}
            {window.innerWidth >= 768 && (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  backgroundColor: '#E3F2FD',
                  color: '#1565C0',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  🤖 {item.ai_quality_index || 92}%
                </span>
              </div>
            )}

            {/* Total Points */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#1B5E20' }}>
                {item.eco_points || 0}
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>
                Eco-Pts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      <StudentHeaderNav
        user={user}
        currentPage="leaderboard"
        onNavigate={onNavigate}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Header Title with Fairness Highlight */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={32} color="#1B5E20" />
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#1B5E20' }}>
                Fair Campus Eco-Leaderboard
              </h1>
            </div>
            <p style={{ margin: '6px 0 0 0', color: '#666', fontSize: '14px' }}>
              Sri Eshwar College of Engineering • Transparent, Mathematically Deterministic Rankings
            </p>
          </div>

          <button
            onClick={() => setShowFormulaModal(true)}
            style={{
              backgroundColor: '#1B5E20',
              color: '#FFD700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(27, 94, 32, 0.25)'
            }}
          >
            <span>📐</span> View Mathematical Fairness Formula
          </button>
        </div>

        {/* User Quick Rank & Standing Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '20px 26px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 6px 20px rgba(46, 125, 50, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#FFD700',
              color: '#1B5E20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: '900',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {(user?.name || 'S').charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#C8E6C9', fontWeight: 'bold' }}>
                YOUR VERIFIED CAMPUS PROFILE
              </div>
              <h2 style={{ margin: '2px 0 4px 0', fontSize: '20px', fontWeight: '800' }}>
                {user?.name || 'Student'}
              </h2>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {user?.department || 'Department of Engineering'} • {user?.badges?.[user.badges.length - 1] || '🌱 Eco Explorer'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#C8E6C9' }}>CAMPUS RANK</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD700' }}>
                #{userRank || 4}
              </div>
            </div>
            <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#C8E6C9' }}>TOTAL ECO-POINTS</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFFFFF' }}>
                {user?.eco_points || 320}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Global vs Department vs Rankings) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid #E0E0E0',
          paddingBottom: '2px'
        }}>
          {[
            { id: 'global', label: '🌍 Global Campus Leaderboard', icon: TrendingUp },
            { id: 'department', label: '🏢 My Department Standings', icon: Users },
            { id: 'departments', label: '🏛️ Department Trophy Race', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                fontWeight: 'bold',
                fontSize: '14px',
                color: activeTab === tab.id ? '#1B5E20' : '#666',
                borderBottom: activeTab === tab.id ? '3px solid #1B5E20' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'global' && (
          <LeaderboardTable data={globalLeaderboard} showDepartment={true} />
        )}

        {activeTab === 'department' && (
          <LeaderboardTable data={departmentLeaderboard} showDepartment={false} />
        )}

        {activeTab === 'departments' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
            gap: '16px'
          }}>
            {departmentRankings.map((dept, idx) => (
              <div
                key={dept._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  border: idx === 0 ? '2px solid #FFD54F' : '1px solid #E0E0E0',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    ...getRankBadgeStyle(idx + 1)
                  }}>
                    {getRankIcon(idx + 1)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#1B5E20' }}>
                      {dept.total_points}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777' }}>Total Department Points</div>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#222' }}>
                  {dept._id}
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  backgroundColor: '#F9FBF9',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: '#666' }}>Active Students: </span>
                    <strong>{dept.student_count}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>Avg / Student: </span>
                    <strong style={{ color: '#2E7D32' }}>{dept.avg_points} pts</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mathematical Fairness Modal */}
      {showFormulaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '18px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            border: '2px solid #81C784'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
              color: 'white',
              padding: '18px 24px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📐</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Mathematical Fairness & Points Formula
                </h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: '#F1F8E9',
                borderRadius: '12px',
                padding: '16px',
                border: '1.5px solid #A5D6A7',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#1B5E20', fontWeight: 'bold', marginBottom: '6px' }}>
                  OFFICIAL ECOGENIUS MATHEMATICAL FORMULA
                </div>
                <div style={{
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: '#1B5E20',
                  lineHeight: 1.5
                }}>
                  Earned Points = round( BasePoints × M_diff × M_AI + B_ontime + B_streak + B_greenhub )
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#444' }}>
                <div>
                  <strong style={{ color: '#1B5E20' }}>1. Base Points (B):</strong>
                  <div style={{ marginLeft: '12px', color: '#666' }}>Standard base credit assigned per challenge (typically 40 - 100 pts).</div>
                </div>

                <div>
                  <strong style={{ color: '#1B5E20' }}>2. Difficulty Multiplier (M_diff):</strong>
                  <div style={{ marginLeft: '12px', color: '#666' }}>
                    • Easy: <strong>1.00×</strong> • Medium: <strong>1.25×</strong> • Hard: <strong>1.50×</strong>
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#1B5E20' }}>3. AI Verification Quality Multiplier (M_AI):</strong>
                  <div style={{ marginLeft: '12px', color: '#666' }}>
                    <code>M_AI = 0.70 + (0.30 × Confidence)</code>. Submissions with crystal clear, verified sensor characteristics earn higher multipliers up to 1.00×.
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#1B5E20' }}>4. On-Time Completion Bonus (B_ontime):</strong>
                  <div style={{ marginLeft: '12px', color: '#666' }}>
                    +<strong>10 points</strong> for completing within the designated challenge duration.
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#1B5E20' }}>5. Active Streak Bonus (B_streak):</strong>
                  <div style={{ marginLeft: '12px', color: '#666' }}>
                    +<strong>2 points</strong> per day of continuous eco action (capped at 20 pts).
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#1B5E20' }}>6. GreenHUB Campus Inspiration Bonus (B_greenhub):</strong>
                  <div style={{ marginLeft: '12px', color: '#666' }}>
                    +<strong>15 points</strong> awarded when publishing verified proof to the campus GreenHUB community.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '12px' }}>
                  <strong style={{ color: '#1B5E20' }}>🏆 Leaderboard Tie-Breaker Order:</strong>
                  <div style={{ marginLeft: '12px', color: '#666', marginTop: '4px' }}>
                    1st: Total Eco-Points • 2nd: Verified Challenges Completed • 3rd: Average AI Quality Index • 4th: Active Streak.
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  style={{
                    backgroundColor: '#1B5E20',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Breakdown Detail Modal */}
      {selectedStudentDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '2px solid #81C784'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {(selectedStudentDetail.name || 'S').charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#1B5E20' }}>
                    {selectedStudentDetail.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {selectedStudentDetail.department}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#F1F8E9', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>Campus Rank</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#1B5E20' }}>#{selectedStudentDetail.rank}</div>
              </div>
              <div style={{ backgroundColor: '#F1F8E9', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>Total Points</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#1B5E20' }}>{selectedStudentDetail.eco_points} pts</div>
              </div>
              <div style={{ backgroundColor: '#F9FBF9', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>Verified Challenges</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }}>✓ {selectedStudentDetail.challenges_completed} completed</div>
              </div>
              <div style={{ backgroundColor: '#F9FBF9', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>AI Quality Index</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565C0' }}>🤖 {selectedStudentDetail.ai_quality_index}%</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
