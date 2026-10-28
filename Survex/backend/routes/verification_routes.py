"""
EcoGenius Verification & Appeals API Blueprint
Handles:
- Starting challenges with unique verification codes
- Submitting challenge evidence with automated AI verification
- Routing to Normal Approval Queue (AI_PASSED) and Appeals Queue (APPEALED)
- Student appeal submission & duplicate prevention
- Admin decision controls (approve, reject, request more evidence)
- Admin rerun AI verification controls with attempt history preservation
- Idempotent points awarding and role permissions
"""

from flask import Blueprint, request, jsonify
from simple_db import db
from config import Config
from services.verification_service import verify_submission
from services.fair_points_service import calculate_fair_points
import jwt
from datetime import datetime, timedelta
import random
import string

verification_bp = Blueprint('verification', __name__)


def get_authenticated_user():
    """Extract authenticated user from JWT token, with header fallback for client compatibility"""
    try:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            if token and token != 'mock_jwt_token':
                try:
                    payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
                    user_id = payload.get('user_id')
                    if user_id:
                        user = db.find_one('users', {'_id': user_id})
                        if user:
                            return user
                except Exception:
                    pass

        # Check X-User-Id header sent by frontend
        user_id_hdr = request.headers.get('X-User-Id')
        if user_id_hdr:
            user = db.find_one('users', {'_id': user_id_hdr})
            if user:
                return user

        # Check request JSON for student_id or user_id
        if request.is_json:
            data = request.get_json(silent=True) or {}
            sid = data.get('student_id') or data.get('studentId') or data.get('user_id')
            if sid:
                user = db.find_one('users', {'_id': sid})
                if user:
                    return user

        # Default student user for local development verification testing
        default_student = db.find_one('users', {'_id': 'user1'}) or db.find_one('users', {'role': 'student'})
        return default_student
    except Exception:
        pass
    return None


def get_all_evidence_hashes():
    """Compile list of evidence hashes from all existing submissions for duplicate screening"""
    submissions = db.find('submissions')
    hashes = []
    for s in submissions:
        res = s.get('verification_result') or {}
        h = res.get('evidence_hash') or s.get('evidence_hash')
        if h:
            hashes.append({
                'hash': h,
                'submission_id': s.get('_id'),
                'student_id': s.get('student_id')
            })
    return hashes


# =====================================================================
# 1. Challenge Verification Code Generation (Reuse Deterrent)
# =====================================================================

@verification_bp.route('/challenges/<challenge_id>/start-code', methods=['POST'])
def generate_challenge_code(challenge_id):
    """
    Generate a unique, short-lived verification code when a student starts a challenge.
    Acts as a deterrent against evidence reuse.
    """
    try:
        user = get_authenticated_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        challenge = db.find_one('challenges', {'_id': challenge_id})
        if not challenge:
            # Check if it's one of the standard mock challenges
            challenge = {'_id': challenge_id, 'title': f'Challenge {challenge_id}'}

        # Generate unique code like ECO-E8392
        category_prefix = 'E' if 'electr' in challenge.get('category', '').lower() else \
                          'W' if 'water' in challenge.get('category', '').lower() else 'M'
        random_digits = ''.join(random.choices(string.digits, k=4))
        random_char = random.choice(string.ascii_uppercase)
        code = f"ECO-{category_prefix}{random_char}{random_digits}"

        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()

        # Save active code record
        code_record = {
            '_id': f"code_{int(datetime.utcnow().timestamp())}_{user['_id']}_{challenge_id}",
            'code': code,
            'student_id': user['_id'],
            'challenge_id': challenge_id,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': expires_at,
            'used': False
        }
        db.insert_one('verification_codes', code_record)

        return jsonify({
            'code': code,
            'expires_at': expires_at,
            'instruction': f"Write '{code}' on a note or display it near your action before capturing evidence."
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================================
# 2. Automated Proof Submission & Routing
# =====================================================================

@verification_bp.route('/submit-with-verification', methods=['POST'])
def submit_with_verification():
    """
    Submit challenge evidence and run automated AI verification pipeline.
    Routes submission to:
    - AI_PASSED: Normal approval queue
    - MORE_EVIDENCE_REQUIRED: Notifies student to upload replacement evidence
    - AI_REJECTED: Notifies student with appeal option
    - AI_ERROR: Safe fallback for retry / manual review
    """
    try:
        user = get_authenticated_user()
        if not user:
            return jsonify({'error': 'Authentication required to submit proof'}), 401

        if user.get('role') == 'admin':
            return jsonify({'error': 'Admins cannot submit challenge proofs. An admin\'s role is to review and verify student submissions.'}), 403

        data = request.get_json() or {}
        challenge_id = data.get('challenge_id') or data.get('challengeId')
        if not challenge_id:
            return jsonify({'error': 'challenge_id is required'}), 400

        challenge = db.find_one('challenges', {'_id': challenge_id})
        if not challenge:
            challenge = {
                '_id': challenge_id,
                'title': data.get('challenge_title') or data.get('challengeTitle') or 'Sustainability Challenge',
                'category': data.get('category', 'Waste Management'),
                'points': data.get('points', 50)
            }

        # Build submission candidate
        sub_id = f"sub_{int(datetime.utcnow().timestamp())}_{random.randint(100, 999)}"
        submission_candidate = {
            '_id': sub_id,
            'id': sub_id,
            'student_id': user['_id'],
            'studentName': user.get('name', 'Student Eco-Warrior'),
            'studentDepartment': user.get('department', 'Engineering'),
            'challenge_id': challenge_id,
            'challengeTitle': challenge.get('title'),
            'category': challenge.get('category'),
            'description': data.get('description') or data.get('caption', ''),
            'proof_files': data.get('proof_files') or ([data.get('proof_image')] if data.get('proof_image') else []),
            'proof_image': data.get('proof_image') or (data.get('proof_files')[0] if data.get('proof_files') else None),
            'location_details': data.get('location_details') or data.get('location'),
            'report_confirmation': data.get('report_confirmation') or data.get('ticket_id'),
            'selected_categories': data.get('selected_categories') or data.get('waste_items', []),
            'submitted_code': data.get('submitted_code'),
            'challenge_code': data.get('challenge_code'),
            'submissionDate': datetime.utcnow().isoformat(),
            'attempt_number': 1,
            'points_awarded': False,
            'points': challenge.get('points', 50)
        }

        # Run automated AI verification
        known_hashes = get_all_evidence_hashes()
        verification_result = verify_submission(submission_candidate, challenge, known_hashes)

        outcome = verification_result.get('outcome', 'AI_ERROR')
        submission_candidate['verification_result'] = verification_result
        submission_candidate['verification_history'] = [verification_result]
        submission_candidate['status'] = outcome
        submission_candidate['evidence_hash'] = verification_result.get('evidence_hash')

        # Determine review queue routing
        if outcome == 'AI_PASSED':
            submission_candidate['review_queue'] = 'normal'  # Enters normal admin approval queue
        elif outcome in ['MORE_EVIDENCE_REQUIRED', 'AI_REJECTED']:
            submission_candidate['review_queue'] = 'student_action'
        else:
            submission_candidate['review_queue'] = 'error_recovery'

        # Persist submission in database
        db.insert_one('submissions', submission_candidate)

        # Dispatch in-app notifications
        if outcome == 'AI_PASSED':
            # Student notification: Passed automated checks
            db.insert_one('notifications', {
                'user_id': user['_id'],
                'type': 'challenge',
                'title': '🤖 AI Verification Passed!',
                'message': f"Your evidence for '{challenge['title']}' passed automated screening ({int(verification_result['confidence_score']*100)}% confidence) and has been routed to the faculty approval queue.",
                'challenge_id': challenge_id,
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })
            # Admin notification
            db.insert_one('notifications', {
                'user_id': 'admin',
                'type': 'challenge',
                'title': '📋 Submission Ready for Approval',
                'message': f"New AI-verified submission from {user['name']} for '{challenge['title']}' awaiting final sign-off.",
                'challenge_id': challenge_id,
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })
        elif outcome == 'MORE_EVIDENCE_REQUIRED':
            missing_text = '; '.join(verification_result.get('missing_evidence', ['Additional evidence']))
            db.insert_one('notifications', {
                'user_id': user['_id'],
                'type': 'rejection',
                'title': '⚠️ More Evidence Required',
                'message': f"For '{challenge['title']}': {missing_text}. You can upload replacement evidence directly in My Challenges.",
                'challenge_id': challenge_id,
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })
        elif outcome == 'AI_REJECTED':
            db.insert_one('notifications', {
                'user_id': user['_id'],
                'type': 'rejection',
                'title': '❌ Automated Verification Flagged',
                'message': f"Your evidence for '{challenge['title']}' did not meet the automated verification criteria. You may appeal this decision with additional details.",
                'challenge_id': challenge_id,
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })

        return jsonify({
            'message': f"Verification completed with outcome: {outcome}",
            'submission': submission_candidate,
            'verification_result': verification_result
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================================
# 3. Student Appeal Workflow
# =====================================================================

@verification_bp.route('/submissions/<submission_id>/appeal', methods=['POST'])
def submit_appeal(submission_id):
    """
    Student submits an appeal for a rejected or flagged submission.
    Moves submission to the separate admin Appeals Queue.
    Enforces student ownership and prevents duplicate open appeals.
    """
    try:
        user = get_authenticated_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        submission = db.find_one('submissions', {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404

        # Enforce student ownership: only the author can appeal
        if submission.get('student_id') != user['_id']:
            return jsonify({'error': 'Unauthorized: You can only appeal your own submissions'}), 403

        # Check if already appealed or approved
        if submission.get('status') == 'APPEALED' and submission.get('review_queue') == 'appeal':
            return jsonify({'error': 'An open appeal is already pending review for this submission.'}), 400
        
        if submission.get('status') == 'Approved':
            return jsonify({'error': 'Cannot appeal an already approved submission.'}), 400

        data = request.get_json() or {}
        appeal_reason = (data.get('appeal_reason') or data.get('reason') or '').strip()
        if len(appeal_reason) < 10:
            return jsonify({'error': 'Please provide a substantive explanation (at least 10 characters) why your evidence is valid.'}), 400

        additional_files = data.get('additional_files') or []

        appeal_record = {
            'appeal_id': f"appeal_{int(datetime.utcnow().timestamp())}",
            'student_id': user['_id'],
            'student_name': user.get('name'),
            'appeal_reason': appeal_reason,
            'additional_files': additional_files,
            'attempt_appealed': submission.get('attempt_number', 1),
            'submitted_at': datetime.utcnow().isoformat(),
            'status': 'Pending'
        }

        # Update submission status & routing
        appeal_history = submission.get('appeal_records', [])
        appeal_history.append(appeal_record)

        db.update_one('submissions', {'_id': submission_id}, {
            '$set': {
                'status': 'APPEALED',
                'review_queue': 'appeal',  # Explicitly placed in separate appeals queue
                'current_appeal': appeal_record,
                'appeal_records': appeal_history,
                'appealed_at': datetime.utcnow().isoformat()
            }
        })

        # Send notifications
        # Admin notification for appeal queue
        db.insert_one('notifications', {
            'user_id': 'admin',
            'type': 'challenge',
            'title': '⚖️ New Student Appeal Submitted',
            'message': f"{user.get('name')} appealed verification for '{submission.get('challengeTitle')}'.",
            'challenge_id': submission.get('challenge_id'),
            'read': False,
            'created_at': datetime.utcnow().isoformat()
        })
        # Student confirmation
        db.insert_one('notifications', {
            'user_id': user['_id'],
            'type': 'general',
            'title': '📬 Appeal Submitted Successfully',
            'message': f"Your reconsideration request for '{submission.get('challengeTitle')}' is now in the faculty appeal queue.",
            'challenge_id': submission.get('challenge_id'),
            'read': False,
            'created_at': datetime.utcnow().isoformat()
        })

        return jsonify({
            'message': 'Appeal submitted successfully and routed to faculty reconsideration queue.',
            'appeal': appeal_record
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================================
# 4. Admin Queue Controls (Role Enforced)
# =====================================================================

@verification_bp.route('/queues/normal', methods=['GET'])
def get_normal_approval_queue():
    """
    Admin Queue: Normal approval queue displays ONLY submissions that passed automated AI verification (AI_PASSED).
    Enforces admin/faculty role.
    """
    try:
        user = get_authenticated_user()
        if not user or user.get('role') not in ['admin', 'faculty']:
            return jsonify({'error': 'Unauthorized: Admin or faculty access required'}), 403

        # Filter strictly for AI_PASSED submissions routed to normal queue
        all_submissions = db.find('submissions')
        normal_queue = [
            s for s in all_submissions 
            if (s.get('review_queue') == 'normal' and s.get('status') == 'AI_PASSED')
        ]
        normal_queue.sort(key=lambda x: x.get('submissionDate', ''), reverse=True)

        return jsonify({'queue': normal_queue, 'count': len(normal_queue)}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/queues/appeals', methods=['GET'])
def get_appeals_queue():
    """
    Admin Queue: Separate reconsideration queue for APPEALED submissions.
    Displays original evidence, instructions, AI findings, and student appeal message.
    Enforces admin/faculty role.
    """
    try:
        user = get_authenticated_user()
        if not user or user.get('role') not in ['admin', 'faculty']:
            return jsonify({'error': 'Unauthorized: Admin or faculty access required'}), 403

        all_submissions = db.find('submissions')
        appeals_queue = [
            s for s in all_submissions 
            if (s.get('review_queue') == 'appeal' or s.get('status') == 'APPEALED')
        ]
        appeals_queue.sort(key=lambda x: x.get('appealed_at', x.get('submissionDate', '')), reverse=True)

        return jsonify({'queue': appeals_queue, 'count': len(appeals_queue)}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/submissions/<submission_id>/admin-decision', methods=['POST'])
def handle_admin_decision(submission_id):
    """
    Admin human review decision:
    - Approve: Awards points idempotently, records audit trail.
    - Reject: Requires explanation reason, updates status.
    - Request More Evidence: Notifies student to upload replacement.
    Enforces admin/faculty role.
    """
    try:
        admin_user = get_authenticated_user()
        if not admin_user or admin_user.get('role') not in ['admin', 'faculty']:
            return jsonify({'error': 'Unauthorized: Admin or faculty role required to make approval decisions'}), 403

        submission = db.find_one('submissions', {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404

        data = request.get_json() or {}
        action = data.get('action', '').lower()  # 'approve', 'reject', 'request_more_evidence'
        reason = data.get('reason', '').strip()

        if action == 'reject' and not reason:
            return jsonify({'error': 'A rejection reason is required to assist the student.'}), 400

        student_id = submission.get('student_id')
        student = db.find_one('users', {'_id': student_id}) if student_id else None
        challenge_title = submission.get('challengeTitle', 'Sustainability Challenge')
        current_attempt = submission.get('verification_result', {}).get('verification_id', 'initial')

        # Calculate mathematically fair points
        v_result = submission.get('verification_result', {})
        conf = v_result.get('confidence_score', 0.92)
        challenge_id = submission.get('challenge_id')
        challenge_obj = db.find_one('challenges', {'_id': challenge_id}) if challenge_id else None
        diff = challenge_obj.get('difficulty', 'Medium') if challenge_obj else 'Medium'
        base_pts = challenge_obj.get('points', submission.get('points', 50)) if challenge_obj else submission.get('points', 50)
        
        fair_calc = calculate_fair_points(
            base_points=base_pts,
            difficulty=diff,
            ai_confidence=conf,
            on_time=True,
            streak_days=student.get('streak', 3) if student else 3,
            shared_to_greenhub=True
        )
        if data.get('points'):
            points_to_award = int(data.get('points'))
        elif data.get('use_fair_formula'):
            points_to_award = fair_calc['total_points']
        else:
            points_to_award = submission.get('points', 50)

        audit_decision = {
            'decision': action,
            'decided_by': admin_user['_id'],
            'decided_by_name': admin_user.get('name', 'Faculty Admin'),
            'reason': reason or ('Approved by faculty review.' if action == 'approve' else ''),
            'timestamp': datetime.utcnow().isoformat(),
            'verification_attempt_id': current_attempt,
            'fair_points_calc': fair_calc
        }

        if action == 'approve':
            # -------------------------------------------------------------
            # Idempotent Points Awarding: Only award if points_awarded == False
            # -------------------------------------------------------------
            points_newly_awarded = False
            if not submission.get('points_awarded', False):
                if student:
                    new_eco_points = student.get('eco_points', 0) + points_to_award
                    db.update_one('users', {'_id': student['_id']}, {'$set': {'eco_points': new_eco_points}})
                    points_newly_awarded = True

            db.update_one('submissions', {'_id': submission_id}, {
                '$set': {
                    'status': 'Approved',
                    'review_queue': 'completed',
                    'points_awarded': True,
                    'calculated_points': points_to_award,
                    'points_breakdown': fair_calc,
                    'can_post_to_greenhub': True,
                    'approved_by': admin_user['_id'],
                    'approved_by_name': admin_user.get('name'),
                    'approved_at': datetime.utcnow().isoformat(),
                    'audit_decision': audit_decision
                }
            })

            # Send in-app notification to student guiding them to GreenHUB
            db.insert_one('notifications', {
                'user_id': student_id,
                'type': 'approval',
                'title': '🎉 Proof Approved by Faculty!',
                'message': f"Your proof for '{challenge_title}' was officially approved by {admin_user.get('name')}! Post your achievement to GreenHUB to celebrate your +{points_to_award} Eco-Points!",
                'points': points_to_award,
                'challenge_id': submission.get('challenge_id'),
                'can_post_to_greenhub': True,
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })

            return jsonify({
                'message': 'Submission successfully approved and points awarded idempotently.',
                'status': 'Approved',
                'points_awarded': points_newly_awarded,
                'points': points_to_award,
                'points_breakdown': fair_calc
            }), 200

        elif action == 'reject':
            db.update_one('submissions', {'_id': submission_id}, {
                '$set': {
                    'status': 'Rejected',
                    'review_queue': 'completed',
                    'rejected_by': admin_user['_id'],
                    'rejected_by_name': admin_user.get('name'),
                    'rejected_at': datetime.utcnow().isoformat(),
                    'decision_reason': reason,
                    'audit_decision': audit_decision
                }
            })

            db.insert_one('notifications', {
                'user_id': student_id,
                'type': 'rejection',
                'title': '❌ Submission Not Approved',
                'message': f"Your submission for '{challenge_title}' was reviewed: {reason}. You can submit an appeal or try again.",
                'challenge_id': submission.get('challenge_id'),
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })

            return jsonify({'message': 'Submission rejected with recorded reason.', 'status': 'Rejected'}), 200

        elif action == 'request_more_evidence':
            db.update_one('submissions', {'_id': submission_id}, {
                '$set': {
                    'status': 'MORE_EVIDENCE_REQUIRED',
                    'review_queue': 'student_action',
                    'requested_by': admin_user['_id'],
                    'request_notes': reason or 'Please provide clearer photo or additional context.',
                    'audit_decision': audit_decision
                }
            })

            db.insert_one('notifications', {
                'user_id': student_id,
                'type': 'rejection',
                'title': '📋 Additional Evidence Requested',
                'message': f"Faculty requested more evidence for '{challenge_title}': {reason or 'Please submit updated evidence.'}",
                'challenge_id': submission.get('challenge_id'),
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            })

            return jsonify({'message': 'Requested more evidence from student.', 'status': 'MORE_EVIDENCE_REQUIRED'}), 200

        else:
            return jsonify({'error': f"Unknown action: {action}. Expected 'approve', 'reject', or 'request_more_evidence'."}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/submissions/<submission_id>/publish-to-greenhub', methods=['POST'])
def publish_submission_to_greenhub(submission_id):
    """
    Post-approval GreenHUB publishing:
    Allows student to post their approved proof and achievement to the GreenHUB community feed.
    Awards any pending fair eco-points idempotently.
    """
    try:
        user = get_authenticated_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        submission = db.find_one('submissions', {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404

        data = request.get_json() or {}
        content = data.get('content') or f"Just completed {submission.get('challengeTitle')}! Together for a greener Sri Eshwar campus. 🌿"
        student_id = submission.get('student_id')
        student = db.find_one('users', {'_id': student_id}) if student_id else None
        points = submission.get('calculated_points') or submission.get('points', 50)

        # Idempotently ensure points are awarded
        points_newly_awarded = False
        if not submission.get('points_awarded', False):
            if student:
                new_eco = student.get('eco_points', 0) + points
                db.update_one('users', {'_id': student['_id']}, {'$set': {'eco_points': new_eco}})
                points_newly_awarded = True

        proof_images = submission.get('proof_files') or ([submission.get('proof_image')] if submission.get('proof_image') else [])
        post_record = {
            '_id': f"gh_post_{int(datetime.utcnow().timestamp())}_{random.randint(100, 999)}",
            'student_id': student_id,
            'author': {
                'name': student.get('name', 'Student Eco-Warrior') if student else user.get('name', 'Student'),
                'department': student.get('department', 'Engineering') if student else 'Engineering'
            },
            'content': content,
            'challengeCompleted': submission.get('challengeTitle'),
            'pointsEarned': points,
            'proofImages': proof_images,
            'verifiedBadge': '✅ AI & Faculty Verified',
            'likes': 0,
            'comments': [],
            'timestamp': datetime.utcnow().isoformat()
        }
        db.insert_one('posts', post_record)

        # Update submission status to fully completed
        db.update_one('submissions', {'_id': submission_id}, {
            '$set': {
                'greenhub_shared': True,
                'points_awarded': True,
                'status': 'Completed',
                'published_at': datetime.utcnow().isoformat()
            }
        })

        return jsonify({
            'message': 'Successfully published to GreenHUB!',
            'post': post_record,
            'points_awarded': points_newly_awarded,
            'points': points
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/submissions/<submission_id>/rerun-verification', methods=['POST'])
def rerun_verification(submission_id):
    """
    Admin control to rerun AI verification:
    - Preserves previous result into verification_history
    - Creates a new attempt record
    - Updates current status and routing
    - Does NOT create duplicate points or notifications
    """
    try:
        admin_user = get_authenticated_user()
        if not admin_user or admin_user.get('role') not in ['admin', 'faculty']:
            return jsonify({'error': 'Unauthorized: Admin or faculty access required'}), 403

        submission = db.find_one('submissions', {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404

        challenge_id = submission.get('challenge_id')
        challenge = db.find_one('challenges', {'_id': challenge_id}) if challenge_id else None
        if not challenge:
            challenge = {
                '_id': challenge_id,
                'title': submission.get('challengeTitle', 'Challenge'),
                'category': submission.get('category', 'Waste Management'),
                'points': submission.get('points', 50)
            }

        # Increment attempt number
        current_attempt_num = submission.get('attempt_number', 1)
        next_attempt_num = current_attempt_num + 1

        submission_copy = dict(submission)
        submission_copy['attempt_number'] = next_attempt_num

        known_hashes = get_all_evidence_hashes()
        new_result = verify_submission(submission_copy, challenge, known_hashes)
        new_result['rerun_by'] = admin_user['_id']
        new_result['rerun_at'] = datetime.utcnow().isoformat()

        # Preserve history
        history = submission.get('verification_history', [])
        history.append(new_result)

        outcome = new_result.get('outcome', 'AI_ERROR')
        new_queue = 'normal' if outcome == 'AI_PASSED' else \
                    'appeal' if submission.get('status') == 'APPEALED' else 'student_action'

        db.update_one('submissions', {'_id': submission_id}, {
            '$set': {
                'verification_result': new_result,
                'verification_history': history,
                'attempt_number': next_attempt_num,
                'status': outcome if submission.get('status') != 'APPEALED' else 'APPEALED',
                'review_queue': new_queue,
                'last_rerun_at': datetime.utcnow().isoformat()
            }
        })

        return jsonify({
            'message': f"AI Verification rerun completed (Attempt #{next_attempt_num}).",
            'attempt_number': next_attempt_num,
            'outcome': outcome,
            'verification_result': new_result,
            'history_count': len(history)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
