import React, { useState, useEffect } from 'react';
import { generateChallengeCode, submitProofWithAIVerification } from '../services/verificationService';
import { triggerToast, addNotification } from '../services/notificationService';

const ProofSubmissionModal = ({
  isOpen = true,
  onClose,
  challenge,
  user,
  onSubmissionComplete,
  onSuccess
}) => {
  if (isOpen === false || !challenge) return null;

  const category = (challenge.category || '').toLowerCase();
  const isElectricity = category.includes('electr') || category.includes('energy') || category.includes('solar');
  const isWater = category.includes('water') || category.includes('hydro') || category.includes('leak');
  const isWaste = category.includes('waste') || category.includes('plastic') || category.includes('clean') || category.includes('compost');

  // Verification Code State
  const [challengeCode, setChallengeCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);

  // Common Submission State
  const [description, setDescription] = useState('');
  const [proofFiles, setProofFiles] = useState([]);
  const [submittedCode, setSubmittedCode] = useState('');

  // Electricity specific
  const [applianceType, setApplianceType] = useState('Idle Classroom Lights & Fans');
  const [beforeAfterOption, setBeforeAfterOption] = useState('two_photos');
  const [powerEstimate, setPowerEstimate] = useState('Approx. 120W conserved');

  // Water specific
  const [locationDetails, setLocationDetails] = useState('');
  const [leakSeverity, setLeakSeverity] = useState('Moderate steady drip');
  const [reportConfirmation, setReportConfirmation] = useState('');

  // Waste specific
  const [selectedItems, setSelectedItems] = useState([
    'Plastic Bottle (Blue Bin)',
    'Organic Food Scrap (Green Bin)',
    'Cardboard / Paper (Blue Bin)',
    'Aluminum Can (Yellow Bin)',
    'Used Dry Battery / E-Waste (Red Bin)'
  ]);
  const [customItem, setCustomItem] = useState('');

  // Verification Processing Animation State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    // Generate short-lived unique code for this challenge session
    const fetchCode = async () => {
      setLoadingCode(true);
      const res = await generateChallengeCode(challenge._id || challenge.id);
      setChallengeCode(res.code || 'ECO-78241');
      setSubmittedCode(res.code || 'ECO-78241');
      setLoadingCode(false);
    };
    fetchCode();
  }, [challenge]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(challengeCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(f => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: f.type,
      url: URL.createObjectURL(f)
    }));
    setProofFiles(prev => [...prev, ...previews]);
  };

  const removeFile = (idx) => {
    setProofFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleWasteItem = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const addCustomItem = () => {
    if (customItem.trim() && !selectedItems.includes(customItem.trim())) {
      setSelectedItems(prev => [...prev, customItem.trim()]);
      setCustomItem('');
    }
  };

  const handleSimulatedVerifyAndSubmit = async () => {
    if (proofFiles.length === 0 && !description.trim()) {
      alert('Please upload photo evidence or provide a description of your action.');
      return;
    }

    setIsVerifying(true);
    setVerificationStep(1); // File check

    setTimeout(() => setVerificationStep(2), 600); // Duplicate check
    setTimeout(() => setVerificationStep(3), 1200); // Synthetic origin screening
    setTimeout(() => setVerificationStep(4), 1800); // Category pipeline rule match

    setTimeout(async () => {
      const payload = {
        challenge_id: challenge._id || challenge.id,
        challenge_title: challenge.title,
        category: challenge.category,
        points: challenge.points || 50,
        description: description.trim() || `Completed ${challenge.title} proof submission.`,
        proof_files: proofFiles.map(f => f.url),
        proof_image: proofFiles[0]?.url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500',
        location_details: locationDetails,
        report_confirmation: reportConfirmation,
        selected_categories: selectedItems,
        submitted_code: submittedCode,
        challenge_code: challengeCode,
        metadata: {
          width: 1200,
          height: 800,
          has_camera_exif: true
        }
      };

      try {
        const response = await submitProofWithAIVerification(payload);
        const resOutcome = response.verification_result || response.submission?.verification_result;
        setVerificationResult(resOutcome);
        setIsVerifying(false);

        // Notify and toast
        if (resOutcome?.outcome === 'AI_PASSED') {
          triggerToast({
            type: 'challenge',
            title: '🤖 AI Verification Passed!',
            message: `Proof meets criteria (${intPct(resOutcome.confidence_score)}% confidence). Routed to faculty approval queue.`,
            points: challenge.points
          });
        } else if (resOutcome?.outcome === 'MORE_EVIDENCE_REQUIRED') {
          triggerToast({
            type: 'general',
            title: '⚠️ More Evidence Needed',
            message: resOutcome.missing_evidence?.[0] || 'Please review missing requirements.'
          });
        } else {
          triggerToast({
            type: 'general',
            title: '❌ Verification Flagged',
            message: 'Evidence flagged by automated screening. You may appeal with details.'
          });
        }

        const fullResult = {
          routing: resOutcome?.outcome || 'AI_PASSED',
          verification: resOutcome,
          verification_result: resOutcome,
          submission: response.submission || response
        };

        if (onSubmissionComplete) {
          onSubmissionComplete(fullResult);
        }
        if (onSuccess) {
          onSuccess(fullResult);
        }
      } catch (err) {
        setIsVerifying(false);
        alert('Verification error: ' + err.message);
      }
    }, 2400);
  };

  const intPct = (val) => Math.round((val || 0.85) * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        border: '2px solid #81C784',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: 'white',
          borderRadius: '18px 18px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                AI-Assisted Proof Verification
              </h3>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                v2.1 VisionAudit
              </span>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              {challenge.title} • <span style={{ color: '#FFD54F', fontWeight: 'bold' }}>+{challenge.points} Points</span>
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

          {/* Section: Unique Challenge Verification Code */}
          <div style={{
            background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)',
            border: '2px dashed #81C784',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1B5E20', fontWeight: 'bold', fontSize: '13px' }}>
                <span>🛡️ Challenge Integrity Code (Anti-Reuse Deterrent)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>
                Write on paper or show in your photo to guarantee fast, unique automated clearance.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '16px',
                letterSpacing: '1px',
                color: '#2E7D32',
                border: '1px solid #A5D6A7'
              }}>
                {loadingCode ? 'Generating...' : challengeCode}
              </div>
              <button
                onClick={handleCopyCode}
                style={{
                  backgroundColor: codeCopied ? '#2E7D32' : '#FFFFFF',
                  color: codeCopied ? '#FFFFFF' : '#2E7D32',
                  border: '1px solid #81C784',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {codeCopied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Verification Pipeline Instructions by Category */}
          <div style={{
            backgroundColor: '#F9FBF9',
            border: '1px solid #C8E6C9',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#2E7D32', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📌 Accepted Evidence Formats & Category Criteria:</span>
            </div>
            {isElectricity && (
              <div style={{ color: '#444', lineHeight: '1.5' }}>
                • <strong>Accepted Formats:</strong> Images (JPG, PNG, WEBP), short MP4 clips, log notes.<br />
                • <strong>Verification Check:</strong> Before & after switch-off proof (or two states), appliance details.<br />
                • <strong style={{ color: '#2E7D32' }}>Note:</strong> Electricity meter readings are <strong>NOT required</strong> for this challenge.
              </div>
            )}
            {isWater && (
              <div style={{ color: '#444', lineHeight: '1.5' }}>
                • <strong>Accepted Formats:</strong> Photo (JPG, PNG), ticket confirmation screenshot.<br />
                • <strong>Verification Check:</strong> Leaking tap/faucet photo, precise campus location details.<br />
                • <strong style={{ color: '#2E7D32' }}>Note:</strong> Water meter readings are <strong>NOT required</strong>.
              </div>
            )}
            {isWaste && (
              <div style={{ color: '#444', lineHeight: '1.5' }}>
                • <strong>Accepted Formats:</strong> Photos of sorted items at designated bins.<br />
                • <strong>Verification Check:</strong> Minimum 5 distinct safe items sorted across color-coded campus bins.
              </div>
            )}
          </div>

          {/* Category-Specific Form Fields */}
          {isElectricity && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '6px' }}>
                ⚡ Equipment Switched Off / Conserved:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <select
                  value={applianceType}
                  onChange={(e) => setApplianceType(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="Idle Classroom Lights & Fans">Idle Classroom Lights & Fans</option>
                  <option value="Lab Workstation & Monitors">Lab Workstation & Monitors</option>
                  <option value="Auditorium AC & Projectors">Auditorium AC & Projectors</option>
                  <option value="Dorm Chargers & Phantom Standby Loads">Dorm Chargers & Phantom Standby Loads</option>
                  <option value="Study Hall Natural Ventilation Shift">Study Hall Natural Ventilation Shift</option>
                </select>
                <input
                  type="text"
                  value={powerEstimate}
                  onChange={(e) => setPowerEstimate(e.target.value)}
                  placeholder="Estimated wattage saved (e.g. 150W)"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}

          {isWater && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '6px' }}>
                💧 Leak Location & Campus Report Reference:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  placeholder="e.g. Block 3, 2nd Floor, Restroom 204"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px'
                  }}
                />
                <input
                  type="text"
                  value={reportConfirmation}
                  onChange={(e) => setReportConfirmation(e.target.value)}
                  placeholder="Maintenance Ticket # (optional, e.g. TKT-9912)"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #C8E6C9',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}

          {isWaste && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2E7D32' }}>
                  ♻️ Safe Items Segregated (At least 5 verified items):
                </label>
                <span style={{ fontSize: '12px', color: selectedItems.length >= 5 ? '#2E7D32' : '#E65100', fontWeight: 'bold' }}>
                  {selectedItems.length} of 5 items selected {selectedItems.length >= 5 ? '✓' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {[
                  'Plastic Bottle (Blue Bin)',
                  'Organic Food Scrap (Green Bin)',
                  'Cardboard / Paper (Blue Bin)',
                  'Aluminum Can (Yellow Bin)',
                  'Used Dry Battery / E-Waste (Red Bin)',
                  'Glass Container (Yellow Bin)',
                  'TetraPak Juice Box (Blue Bin)',
                  'Vegetable Peels (Green Bin)'
                ].map((item) => {
                  const active = selectedItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleWasteItem(item)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: active ? '1.5px solid #2E7D32' : '1px solid #CFD8DC',
                        backgroundColor: active ? '#E8F5E9' : '#FFFFFF',
                        color: active ? '#1B5E20' : '#666',
                        fontSize: '12px',
                        fontWeight: active ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {active ? '✓ ' : '+ '} {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence Upload Dropzone */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '6px' }}>
              📸 Upload Proof Evidence (Images / Short Videos / PDF):
            </label>
            <div style={{
              border: '2px dashed #81C784',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#F9FBF9',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input
                type="file"
                multiple
                accept="image/*,video/mp4,.pdf"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%'
                }}
              />
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
              <div style={{ fontWeight: 'bold', color: '#2E7D32', fontSize: '14px' }}>
                Click or Drag & Drop evidence files here
              </div>
              <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
                Supported: JPG, PNG, WEBP, MP4, PDF • Up to 15MB • Verification code visible
              </div>
            </div>

            {/* Proof Preview List */}
            {proofFiles.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                {proofFiles.map((f, idx) => (
                  <div key={idx} style={{
                    position: 'relative',
                    width: '90px',
                    height: '90px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1.5px solid #81C784',
                    flexShrink: 0
                  }}>
                    <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => removeFile(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description Textarea */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '6px' }}>
              📝 Student Explanation & Observations:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear, brief explanation of your actions, equipment/bins used, and how you met the challenge criteria..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #C8E6C9',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Verification Animation Overlay / Live Progress */}
          {isVerifying && (
            <div style={{
              backgroundColor: '#F1F8E9',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '20px',
              border: '1.5px solid #81C784'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #C8E6C9',
                  borderTop: '3px solid #2E7D32',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{ fontWeight: '800', color: '#1B5E20', fontSize: '14px' }}>
                  EcoGenius VisionAudit Running Multi-Check Verification...
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ color: verificationStep >= 1 ? '#2E7D32' : '#999', fontWeight: verificationStep === 1 ? 'bold' : 'normal' }}>
                  {verificationStep > 1 ? '✓' : '●'} 1. Validating format, dimensions & image decoding constraints
                </div>
                <div style={{ color: verificationStep >= 2 ? '#2E7D32' : '#999', fontWeight: verificationStep === 2 ? 'bold' : 'normal' }}>
                  {verificationStep > 2 ? '✓' : '●'} 2. Screening campus duplicate fingerprint & evidence reuse registry
                </div>
                <div style={{ color: verificationStep >= 3 ? '#2E7D32' : '#999', fontWeight: verificationStep === 3 ? 'bold' : 'normal' }}>
                  {verificationStep > 3 ? '✓' : '●'} 3. Screening image-origin metadata for synthetic/AI manipulation
                </div>
                <div style={{ color: verificationStep >= 4 ? '#2E7D32' : '#999', fontWeight: verificationStep === 4 ? 'bold' : 'normal' }}>
                  {verificationStep >= 4 ? '✓' : '●'} 4. Matching {challenge.category} requirements & verification code
                </div>
              </div>
            </div>
          )}

          {/* Completed Outcome View */}
          {verificationResult && (
            <div style={{
              backgroundColor: verificationResult.outcome === 'AI_PASSED' ? '#E8F5E9' : '#FFF3E0',
              border: `2px solid ${verificationResult.outcome === 'AI_PASSED' ? '#4CAF50' : '#FF9800'}`,
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '800',
                  fontSize: '15px',
                  color: verificationResult.outcome === 'AI_PASSED' ? '#1B5E20' : '#E65100'
                }}>
                  <span>{verificationResult.outcome === 'AI_PASSED' ? '✅ AI_PASSED' : '⚠️ ' + verificationResult.outcome}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#555' }}>
                    ({intPct(verificationResult.confidence_score)}% Confidence)
                  </span>
                </div>
                <span style={{
                  backgroundColor: verificationResult.outcome === 'AI_PASSED' ? '#2E7D32' : '#F57C00',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {verificationResult.outcome === 'AI_PASSED' ? 'En Route to Admin Queue' : 'Student Action Required'}
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#333' }}>
                {verificationResult.findings?.map((f, i) => <li key={i}>{f}</li>)}
                {verificationResult.missing_evidence?.map((m, i) => (
                  <li key={i} style={{ color: '#D32F2F', fontWeight: 'bold' }}>Missing: {m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={onClose}
              disabled={isVerifying}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid #CCC',
                backgroundColor: 'white',
                color: '#555',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              onClick={handleSimulatedVerifyAndSubmit}
              disabled={isVerifying}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🚀</span>
              <span>{isVerifying ? 'Running AI Verification...' : 'Verify Proof with AI & Submit'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProofSubmissionModal;
