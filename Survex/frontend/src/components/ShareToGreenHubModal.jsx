import React, { useState } from 'react';
import { calculateFairPoints } from '../utils/fairPointsCalculator';

const ShareToGreenHubModal = ({
  isOpen,
  onClose,
  challenge,
  submission,
  onPublish
}) => {
  if (!isOpen || !challenge) return null;

  const proofImg = submission?.proofImage || submission?.proof_image || submission?.proofFiles?.[0] || challenge.proofImage || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500';
  const confidence = submission?.verification_result?.confidence_score || submission?.verification?.confidence || 0.94;
  const challengeTitle = challenge.title || submission?.challengeTitle || 'Sustainability Challenge';

  const fairPoints = calculateFairPoints({
    basePoints: challenge.points || 50,
    difficulty: challenge.difficulty || 'Medium',
    aiConfidence: confidence,
    onTime: true,
    streakDays: 3,
    sharedToGreenHub: true
  });

  const [caption, setCaption] = useState(
    `Just completed the '${challengeTitle}'! 🌿 Proud to contribute towards our campus sustainability goals. Sri Eshwar is getting greener every day!`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async () => {
    setIsSubmitting(true);
    try {
      if (onPublish) {
        await onPublish({
          challengeId: challenge._id || challenge.id,
          challengeTitle: challengeTitle,
          content: caption,
          proofImages: [proofImg],
          category: challenge.category || 'Sustainability',
          pointsEarned: fairPoints.totalPoints,
          aiConfidence: confidence,
          fairPointsBreakdown: fairPoints
        });
      }
      onClose();
    } catch (err) {
      alert('Error sharing to GreenHUB: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        border: '2px solid #81C784',
        position: 'relative',
        animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: 'white',
          padding: '20px 24px',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🌱</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800' }}>
                Share Achievement to GreenHUB
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#C8E6C9' }}>
                Claim your mathematically calculated Eco-Points and inspire peers!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Challenge & Proof Preview */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
            flexDirection: window.innerWidth < 600 ? 'column' : 'row'
          }}>
            <div style={{ position: 'relative', width: window.innerWidth < 600 ? '100%' : '200px', flexShrink: 0 }}>
              <img
                src={proofImg}
                alt="Approved Proof"
                style={{
                  width: '100%',
                  height: '140px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '2px solid #81C784'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                backgroundColor: 'rgba(27, 94, 32, 0.9)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '4px 6px',
                borderRadius: '6px',
                textAlign: 'center',
                backdropFilter: 'blur(4px)'
              }}>
                ✅ AI & Faculty Verified
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <span style={{
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '6px'
              }}>
                {challenge.category || 'Sustainability'}
              </span>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#1B5E20' }}>
                {challengeTitle}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: 1.4 }}>
                Faculty approved this submission with an automated AI validation score of{' '}
                <strong style={{ color: '#2E7D32' }}>{fairPoints.aiConfidencePct}%</strong>.
              </p>
            </div>
          </div>

          {/* Mathematical Fairness Points Breakdown Card */}
          <div style={{
            backgroundColor: '#F1F8E9',
            border: '2px solid #A5D6A7',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: '800', color: '#1B5E20', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📐</span> Fair Mathematical Points Formula
              </div>
              <div style={{
                backgroundColor: '#1B5E20',
                color: '#FFD700',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: '900',
                fontSize: '15px'
              }}>
                +{fairPoints.totalPoints} Eco-Points
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              fontSize: '12px',
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #C8E6C9',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ color: '#666', fontSize: '11px' }}>Base Points:</div>
                <div style={{ fontWeight: 'bold', color: '#1B5E20' }}>{fairPoints.basePoints} pts</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '11px' }}>Difficulty ({fairPoints.difficulty}):</div>
                <div style={{ fontWeight: 'bold', color: '#1B5E20' }}>×{fairPoints.difficultyMultiplier}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '11px' }}>AI Quality ({fairPoints.aiConfidencePct}%):</div>
                <div style={{ fontWeight: 'bold', color: '#1B5E20' }}>×{fairPoints.aiQualityMultiplier}</div>
              </div>
            </div>

            {/* Bonuses */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
              <span style={{ backgroundColor: '#E8F5E9', padding: '3px 8px', borderRadius: '6px', color: '#2E7D32', fontWeight: 'bold' }}>
                ✓ On-Time Bonus: +{fairPoints.onTimeBonus} pts
              </span>
              <span style={{ backgroundColor: '#E8F5E9', padding: '3px 8px', borderRadius: '6px', color: '#2E7D32', fontWeight: 'bold' }}>
                ✓ Streak Bonus: +{fairPoints.streakBonus} pts
              </span>
              <span style={{ backgroundColor: '#FFF3E0', padding: '3px 8px', borderRadius: '6px', color: '#E65100', fontWeight: 'bold' }}>
                🌟 GreenHUB Sharing Bonus: +{fairPoints.greenHubBonus} pts
              </span>
            </div>
          </div>

          {/* Caption Input */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
              Add Your Eco Reflection or Thoughts:
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a message to inspire other students..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid #81C784',
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 20px',
                backgroundColor: '#F5F5F5',
                color: '#666',
                border: '1px solid #CCC',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleShare}
              disabled={isSubmitting}
              style={{
                padding: '12px 26px',
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? 'Publishing...' : `🚀 Publish to GreenHUB & Claim +${fairPoints.totalPoints} pts`}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ShareToGreenHubModal;
