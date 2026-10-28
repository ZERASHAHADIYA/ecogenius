from flask import Blueprint, request, jsonify
from models.submission import (
    create_submission, get_submission_by_id, get_submissions_by_challenge,
    get_submissions_by_student, get_pending_submissions, verify_submission,
    get_submission_stats
)
from models.challenge import get_challenge_by_id, complete_challenge
from models.user import update_user_points, get_user_by_id
from models.post import create_post
from utils.jwt_helper import token_required, role_required
from utils.file_upload import upload_file, allowed_file
from utils.email_helper import send_verification_result
from bson import json_util
import json

submissions_bp = Blueprint('submissions', __name__)

@submissions_bp.route('/', methods=['POST'])
@token_required
def submit_challenge():
    """Submit a challenge with proof"""
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Get form data
    challenge_id = request.form.get('challenge_id')
    caption = request.form.get('caption')
    location = request.form.get('location')
    
    if not challenge_id:
        return jsonify({'error': 'Challenge ID required'}), 400
    
    # Verify challenge exists
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    # Upload file
    try:
        media_url = upload_file(file, folder='submissions')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    # Create submission
    submission = create_submission(
        challenge_id=challenge_id,
        student_id=request.user_id,
        media_url=media_url,
        caption=caption,
        location=location
    )
    
    return jsonify({
        'message': 'Submission created successfully',
        'submission': json.loads(json_util.dumps(submission))
    }), 201

@submissions_bp.route('/pending', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_pending():
    """Get pending submissions for verification"""
    submissions = get_pending_submissions()
    
    # Enrich with challenge and user data
    enriched = []
    for sub in submissions:
        challenge = get_challenge_by_id(sub['challenge_id'])
        user = get_user_by_id(sub['student_id'])
        
        sub_data = json.loads(json_util.dumps(sub))
        sub_data['challenge'] = json.loads(json_util.dumps(challenge)) if challenge else None
        sub_data['student'] = {
            'name': user['name'],
            'email': user['email'],
            'department': user.get('department')
        } if user else None
        
        enriched.append(sub_data)
    
    return jsonify({'submissions': enriched}), 200

@submissions_bp.route('/<submission_id>/verify', methods=['POST'])
@token_required
@role_required(['admin', 'faculty'])
def verify_submission_route(submission_id):
    """Verify or reject a submission"""
    data = request.get_json()
    
    if 'approved' not in data:
        return jsonify({'error': 'Approval status required'}), 400
    
    approved = data['approved']
    comment = data.get('comment')
    
    # Get submission
    submission = get_submission_by_id(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    
    # Verify submission
    updated_submission = verify_submission(
        submission_id,
        request.user_id,
        approved,
        comment
    )
    
    # If approved, update points and create post
    if approved:
        challenge = get_challenge_by_id(submission['challenge_id'])
        user = get_user_by_id(submission['student_id'])
        
        if challenge and user:
            # Update points
            new_points = update_user_points(submission['student_id'], challenge['points'])
            
            # Mark challenge as completed
            complete_challenge(challenge['_id'])
            
            # Auto-create post
            post_content = f"🎉 Completed challenge: {challenge['title']}! Earned {challenge['points']} points."
            if submission.get('caption'):
                post_content += f"\n\n{submission['caption']}"
            
            create_post(
                student_id=submission['student_id'],
                content=post_content,
                media_url=submission['media_url'],
                post_type='challenge_completion',
                challenge_id=challenge['_id']
            )
            
            # Send email notification
            send_verification_result(
                user['email'],
                user['name'],
                challenge['title'],
                approved,
                comment
            )
    
    return jsonify({
        'message': 'Submission verified successfully',
        'submission': json.loads(json_util.dumps(updated_submission))
    }), 200

@submissions_bp.route('/student/<student_id>', methods=['GET'])
@token_required
def get_student_submissions(student_id):
    """Get submissions by a student"""
    # Students can only view their own submissions
    if request.user_role == 'student' and request.user_id != student_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    status = request.args.get('status')
    submissions = get_submissions_by_student(student_id, status)
    
    return jsonify({'submissions': json.loads(json_util.dumps(submissions))}), 200

@submissions_bp.route('/challenge/<challenge_id>', methods=['GET'])
@token_required
def get_challenge_submissions(challenge_id):
    """Get submissions for a challenge"""
    status = request.args.get('status')
    submissions = get_submissions_by_challenge(challenge_id, status)
    
    return jsonify({'submissions': json.loads(json_util.dumps(submissions))}), 200

@submissions_bp.route('/stats', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_stats():
    """Get submission statistics"""
    stats = get_submission_stats()
    return jsonify({'stats': stats}), 200
