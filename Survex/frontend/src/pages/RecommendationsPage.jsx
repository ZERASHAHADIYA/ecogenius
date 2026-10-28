import React, { useState, useEffect } from 'react';
import StudentHeaderNav from '../components/StudentHeaderNav';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';

const RecommendationsPage = ({
  user,
  onNavigate,
  onOpenNotifications,
  onLogout,
  joinedChallenges = [],
  onJoinChallenge,
  submissions = []
}) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/challenges');
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (e) {
      console.warn('Could not fetch challenges from backend:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'inherit', backgroundColor: '#F4F7F4', minHeight: '100vh' }}>
      {/* Universal Student Navigation */}
      <StudentHeaderNav
        user={user}
        currentPage="recommendations"
        onNavigate={onNavigate}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
      />

      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Dedicated Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '26px 30px',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '26px' }}>💡</span>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
                Personalized Challenge Recommendations
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.92, maxWidth: '640px' }}>
              Tailored sustainability challenges dynamically scored for you across electricity conservation, water management, and waste reduction.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.3)',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <div style={{ fontWeight: 'bold', color: '#FFD54F', marginBottom: '2px' }}>⚖️ Weighted Scoring Engine:</div>
            <div>• Student Interests: <strong>30%</strong></div>
            <div>• Past Sustainability History: <strong>25%</strong></div>
            <div>• Difficulty Match: <strong>25%</strong></div>
            <div>• Novelty & Category Variety: <strong>20%</strong></div>
          </div>
        </div>

        {/* Personalized Recommendations Component */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1.5px solid #C8E6C9'
        }}>
          <PersonalizedRecommendations
            challenges={challenges}
            user={user}
            joinedChallenges={joinedChallenges}
            submissions={submissions}
            onJoinChallenge={onJoinChallenge}
            onNavigate={onNavigate}
          />
        </div>
      </main>
    </div>
  );
};

export default RecommendationsPage;
