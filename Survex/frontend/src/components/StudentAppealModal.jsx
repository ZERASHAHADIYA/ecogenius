import React, { useState } from 'react';
import { submitStudentAppeal } from '../services/verificationService';
import { triggerToast } from '../services/notificationService';

const StudentAppealModal = ({
  isOpen,
  onClose,
  submission,
  onAppealSubmitted
}) => {
  if (!isOpen || !submission) return null;

  const [appealReason, setAppealReason] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isAlreadyAppealed = submission.status === 'APPEALED' || submission.review_queue === 'appeal';

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(f => URL.createObjectURL(f));
    setAdditionalFiles(prev => [...prev, ...urls]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (appealReason.trim().length < 10) {
      setErrorMessage('Please provide a substantive explanation (at least 10 characters) why your evidence is valid.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const subId = submission._id || submission.id;
      const res = await submitStudentAppeal(subId, appealReason, additionalFiles);

      triggerToast({
        type: 'general',
        title: '📬 Appeal Routed to Faculty',
        message: 'Your reconsideration request is now in the faculty appeal queue.'
      });

      if (onAppealSubmitted) {
        onAppealSubmitted({
          ...submission,
          status: 'APPEALED',
          review_queue: 'appeal',
          current_appeal: res.appeal
        });
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vResult = submission.verification_result || {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '2px solid #E57373',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)',
          color: 'white',
          borderRadius: '18px 18px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚖️</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                Appeal Verification Decision
              </h3>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '3px' }}>
              {submission.challengeTitle || 'Challenge'} • Reconsideration Request
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {isAlreadyAppealed ? (
            <div style={{
              backgroundColor: '#FFF8E1',
              border: '1.5px solid #FFE082',
              borderRadius: '12px',
              padding: '18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#E65100', fontSize: '16px' }}>
                Appeal Already Pending Review
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                Your reconsideration request is actively in the faculty appeal queue. Faculty will inspect your submitted explanation and additional assets shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Disclosed AI Rejection Findings */}
              <div style={{
                backgroundColor: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', color: '#C62828', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️ Automated Verification Screening Findings:</span>
                </div>
                <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.5' }}>
                  {vResult.findings?.length > 0 ? (
                    vResult.findings.map((f, i) => <div key={i}>• {f}</div>)
                  ) : (
                    <div>• Evidence lacked required category verification markers or details.</div>
                  )}
                  {vResult.warnings?.map((w, i) => (
                    <div key={'w' + i} style={{ color: '#D84315', fontWeight: 'bold' }}>• Advisory: {w}</div>
                  ))}
                  {vResult.missing_evidence?.map((m, i) => (
                    <div key={'m' + i} style={{ color: '#C62828', fontWeight: 'bold' }}>• Missing: {m}</div>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div style={{
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Appeal Reason Input */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                  💬 Explain Why Your Proof Evidence is Valid:
                </label>
                <textarea
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why your evidence demonstrates genuine completion (e.g. 'I turned off the main circuit at 6:15 PM and took photo from angle showing the switch in OFF state, before collection truck arrived...')"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #CFD8DC',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Additional Supplementary Files */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                  📎 Attach Additional Evidence / Context (Optional):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,.pdf"
                  onChange={handleFileUpload}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #CCC',
                    fontSize: '12px'
                  }}
                />
                {additionalFiles.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '6px', fontWeight: 'bold' }}>
                    ✓ {additionalFiles.length} supplementary file(s) attached
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CCC',
                    backgroundColor: 'white',
                    color: '#555',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#C62828',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(198, 40, 40, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Routing to Faculty...' : 'Submit Reconsideration Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAppealModal;
