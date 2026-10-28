import React, { useState, useMemo } from 'react';
import {
  getPersonalizedRecommendations,
  SUSTAINABILITY_PILLARS,
  DEFAULT_WEIGHTS
} from '../services/recommendationEngine';
import { triggerToast } from '../services/notificationService';

const PersonalizedRecommendations = ({
  challenges = [],
  user = {},
  joinedChallenges = [],
  submissions = [],
  onJoinChallenge,
  onNavigate
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // User customizable interest preferences (0.0 to 1.0)
  const [userInterests, setUserInterests] = useState({
    [SUSTAINABILITY_PILLARS.ELECTRICITY]: 0.85,
    [SUSTAINABILITY_PILLARS.WATER]: 0.80,
    [SUSTAINABILITY_PILLARS.WASTE]: 0.90
  });

  // Calculate live recommendations using weighted scoring formula
  const recommendations = useMemo(() => {
    return getPersonalizedRecommendations({
      challenges,
      user,
      joinedChallenges,
      submissions,
      userInterests,
      weights: DEFAULT_WEIGHTS,
      filterPillar: activeFilter,
      limit: 6
    });
  }, [challenges, user, joinedChallenges, submissions, userInterests, activeFilter]);

  const handleJoin = (challenge) => {
    if (onJoinChallenge) {
      const chId = challenge._id || challenge.id;
      const success = onJoinChallenge(chId, challenge);
      if (success !== false) {
        triggerToast({
          type: 'challenge',
          title: '🎯 Challenge Accepted!',
          message: `Joined recommended challenge: ${challenge.title} (${challenge.matchPercentage}% Match).`,
          points: challenge.points
        });
      }
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: window.innerWidth < 768 ? '18px' : '26px',
      marginBottom: '30px',
      border: '2px solid #81C784',
      boxShadow: '0 6px 20px rgba(46, 125, 50, 0.08)'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2E7D32, #43A047)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '22px',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)'
          }}>
            🎯
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ color: '#1B5E20', fontSize: '20px', fontWeight: '800', margin: 0 }}>
                Smart Eco-Recommendations
              </h2>
              <span style={{
                background: 'linear-gradient(90deg, #E8F5E9, #C8E6C9)',
                color: '#2E7D32',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                Weighted AI Scoring
              </span>
            </div>
            <p style={{ color: '#555', fontSize: '13px', margin: '2px 0 0 0' }}>
              Electricity, Water & Waste challenges ranked dynamically by your interests, past activity, difficulty fit & novelty
            </p>
          </div>
        </div>

        {/* Action Buttons: Formula & Preferences */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            title="View weighted formula details"
            style={{
              backgroundColor: '#F1F8E9',
              color: '#2E7D32',
              border: '1px solid #C8E6C9',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚖️ Formula Info</span>
          </button>

          <button
            onClick={() => setShowPreferences(!showPreferences)}
            style={{
              backgroundColor: showPreferences ? '#2E7D32' : '#F5F5F5',
              color: showPreferences ? 'white' : '#333',
              border: '1px solid #DDD',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚙️ Tune Interests</span>
          </button>
        </div>
      </div>

      {/* Formula Explanation Banner (Togglable) */}
      {showFormulaModal && (
        <div style={{
          backgroundColor: '#F9FBF9',
          border: '1.5px dashed #81C784',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#2E7D32'
        }}>
          <div style={{ fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📐 Active Recommendation Formula:</span>
          </div>
          <div style={{
            fontFamily: 'monospace',
            backgroundColor: 'white',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #C8E6C9',
            fontWeight: 'bold',
            color: '#1B5E20',
            marginBottom: '8px'
          }}>
            Score = (0.35 × Interest) + (0.25 × Past Activity) + (0.20 × Difficulty Fit) + (0.20 × Novelty Boost)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(4, 1fr)', gap: '10px', fontSize: '11px', color: '#444' }}>
            <div><strong>1. Interest (35%):</strong> Evaluates alignment with your prioritized sustainability goals and department focus.</div>
            <div><strong>2. Activity (25%):</strong> Analyzes past completion rates and approved evidence submissions.</div>
            <div><strong>3. Difficulty (20%):</strong> Compares challenge tier (Easy/Med/Hard) with your current Eco-Points rank.</div>
            <div><strong>4. Novelty (20%):</strong> Rewards cross-pillar diversity so you explore under-represented areas.</div>
          </div>
        </div>
      )}

      {/* Interest Preferences Tuning Box (Togglable) */}
      {showPreferences && (
        <div style={{
          backgroundColor: '#F8FCF8',
          border: '1px solid #C8E6C9',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ fontWeight: '800', color: '#1B5E20', fontSize: '13px', marginBottom: '12px' }}>
            Adjust Your Sustainability Focus (Live Re-ranks Challenges):
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {/* Electricity Interest Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                <span style={{ color: '#E65100' }}>⚡ Electricity / Energy:</span>
                <span>{Math.round(userInterests[SUSTAINABILITY_PILLARS.ELECTRICITY] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={userInterests[SUSTAINABILITY_PILLARS.ELECTRICITY]}
                onChange={(e) => setUserInterests({ ...userInterests, [SUSTAINABILITY_PILLARS.ELECTRICITY]: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#F57F17' }}
              />
            </div>

            {/* Water Interest Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                <span style={{ color: '#0288D1' }}>💧 Water Conservation:</span>
                <span>{Math.round(userInterests[SUSTAINABILITY_PILLARS.WATER] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={userInterests[SUSTAINABILITY_PILLARS.WATER]}
                onChange={(e) => setUserInterests({ ...userInterests, [SUSTAINABILITY_PILLARS.WATER]: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#0288D1' }}
              />
            </div>

            {/* Waste Interest Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                <span style={{ color: '#2E7D32' }}>♻️ Waste Management:</span>
                <span>{Math.round(userInterests[SUSTAINABILITY_PILLARS.WASTE] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={userInterests[SUSTAINABILITY_PILLARS.WASTE]}
                onChange={(e) => setUserInterests({ ...userInterests, [SUSTAINABILITY_PILLARS.WASTE]: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#2E7D32' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pillar Filter Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
        paddingBottom: '14px',
        borderBottom: '1px solid #EAEAEA'
      }}>
        {[
          { id: 'all', label: '🌟 All Recommended' },
          { id: SUSTAINABILITY_PILLARS.ELECTRICITY, label: '⚡ Electricity (Energy)' },
          { id: SUSTAINABILITY_PILLARS.WATER, label: '💧 Water Conservation' },
          { id: SUSTAINABILITY_PILLARS.WASTE, label: '♻️ Waste Management' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: activeFilter === tab.id ? '2px solid #2E7D32' : '1px solid #DDD',
              backgroundColor: activeFilter === tab.id ? '#E8F5E9' : 'white',
              color: activeFilter === tab.id ? '#1B5E20' : '#555',
              fontWeight: activeFilter === tab.id ? '800' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommended Challenge Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {recommendations.length > 0 ? (
          recommendations.map(challenge => (
            <div
              key={challenge._id || challenge.id}
              style={{
                backgroundColor: 'white',
                border: '1.5px solid #E0E0E0',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {/* Match Score Badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  backgroundColor: challenge.pillarMeta.bg,
                  color: challenge.pillarMeta.color,
                  border: `1px solid ${challenge.pillarMeta.color}33`,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{challenge.pillarMeta.icon}</span>
                  <span>{challenge.normalizedPillar}</span>
                </span>

                <span style={{
                  background: challenge.matchPercentage >= 90
                    ? 'linear-gradient(135deg, #1B5E20, #2E7D32)'
                    : 'linear-gradient(135deg, #F57F17, #FB8C00)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  {challenge.matchPercentage}% Match
                </span>
              </div>

              {/* Challenge Title */}
              <h3 style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#1F2937',
                margin: '0 0 8px 0',
                lineHeight: 1.3
              }}>
                {challenge.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '13px',
                color: '#555',
                lineHeight: 1.5,
                margin: '0 0 14px 0',
                flex: 1
              }}>
                {challenge.description}
              </p>

              {/* "Why Recommended" Explanation Box */}
              <div style={{
                backgroundColor: '#F9FAF9',
                borderLeft: `3px solid ${challenge.pillarMeta.color}`,
                padding: '8px 10px',
                borderRadius: '0 8px 8px 0',
                fontSize: '11px',
                color: '#374151',
                marginBottom: '14px'
              }}>
                <div style={{ fontWeight: '700', color: challenge.pillarMeta.color, marginBottom: '2px' }}>
                  💡 Why Recommended:
                </div>
                <div>{challenge.rationale}</div>
              </div>

              {/* Meta stats bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#666',
                paddingTop: '10px',
                borderTop: '1px solid #F0F0F0',
                marginBottom: '14px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#E65100' }}>
                  +{challenge.points} Pts
                </span>
                <span>⏱️ {challenge.duration || '7 days'}</span>
                <span style={{
                  fontWeight: '700',
                  color: challenge.difficulty === 'Easy' ? '#2E7D32' : challenge.difficulty === 'Medium' ? '#F57F17' : '#D32F2F'
                }}>
                  ● {challenge.difficulty || 'Medium'}
                </span>
              </div>

              {/* Join or Accepted Button */}
              {challenge.isJoined ? (
                <button
                  disabled
                  style={{
                    width: '100%',
                    backgroundColor: '#E8F5E9',
                    color: '#2E7D32',
                    border: '1px solid #A5D6A7',
                    padding: '9px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'default'
                  }}
                >
                  ✓ Currently In Progress
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(challenge)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(46, 125, 50, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  🚀 Accept Challenge (+{challenge.points} Pts)
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#666' }}>
            <p>No challenges match this category right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
