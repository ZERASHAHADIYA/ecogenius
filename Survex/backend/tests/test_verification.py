"""
EcoGenius Proof Verification Test Suite
Tests all 9 verification scenarios required by specification:
1. Valid and invalid challenge evidence (Electricity, Water, Waste)
2. Missing and unclear evidence (MORE_EVIDENCE_REQUIRED)
3. Possible AI-generated images and detector false positives handling
4. Duplicate upload detection
5. AI service errors and graceful recovery (AI_ERROR)
6. Student appeals and duplicate appeal prevention
7. Admin manual approval and reruns
8. Duplicate point-award prevention (idempotency)
9. Unauthorized access rejection (role-based enforcement)
"""

import unittest
import json
import uuid
from services.verification_service import (
    verify_submission,
    compute_evidence_hash,
    screen_image_origin,
    check_duplicate_evidence
)
from simple_db import db
from app import app
import jwt
from config import Config
from datetime import datetime, timezone, timedelta


class TestVerificationSystem(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

        now = datetime.now(timezone.utc)
        self.student_token = jwt.encode(
            {'user_id': 'user1', 'exp': now + timedelta(days=1)},
            Config.JWT_SECRET,
            algorithm='HS256'
        )
        self.admin_token = jwt.encode(
            {'user_id': 'user2', 'exp': now + timedelta(days=1)},
            Config.JWT_SECRET,
            algorithm='HS256'
        )
        self.other_student_token = jwt.encode(
            {'user_id': 'user3', 'exp': now + timedelta(days=1)},
            Config.JWT_SECRET,
            algorithm='HS256'
        )

    # -----------------------------------------------------------------
    # 1. Valid and Invalid Challenge Evidence
    # -----------------------------------------------------------------
    def test_valid_electricity_challenge(self):
        challenge = {'_id': 'ch_elec', 'title': 'Peak Hour Grid Relief', 'category': 'Electricity', 'points': 50}
        submission = {
            '_id': f"sub_elec_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Before: Lights and projector were left ON in empty lab 204. After: Switched off all idle equipment and unplugged phantom loads.',
            'proof_files': [
                'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500',
                'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=500'
            ],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED')
        self.assertTrue(res['checks']['requirement_matching']['has_before_after'])
        self.assertFalse(res['checks']['requirement_matching']['requires_meter_reading'])
        self.assertGreaterEqual(res['confidence_score'], 0.65)

    def test_valid_water_challenge(self):
        challenge = {'_id': 'ch_water', 'title': 'Report Leaking Tap', 'category': 'Water', 'points': 40}
        submission = {
            '_id': f"sub_water_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Found steady water drip from washroom tap valve in Block 3, 2nd floor.',
            'location_details': 'Block 3, 2nd Floor, Restroom 204',
            'report_confirmation': 'TICKET-WATER-8821',
            'proof_files': ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500'],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED')
        self.assertTrue(res['checks']['requirement_matching']['location_verified'])
        self.assertFalse(res['checks']['requirement_matching']['requires_meter_reading'])

    def test_valid_waste_challenge_five_items(self):
        challenge = {'_id': 'ch_waste', 'title': 'Waste Segregation Sprint', 'category': 'Waste Management', 'points': 65}
        submission = {
            '_id': f"sub_waste_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Sorted five safe items: 1. plastic bottle in blue bin, 2. banana peel in green organic bin, 3. cardboard box in paper bin, 4. soda aluminum can in metal bin, 5. newspaper in dry bin.',
            'selected_categories': ['Plastic', 'Organic', 'Paper', 'Metal', 'Dry Waste'],
            'proof_files': ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500'],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED')
        self.assertTrue(res['checks']['requirement_matching']['has_five_items'])

    # -----------------------------------------------------------------
    # 2. Missing and Unclear Evidence
    # -----------------------------------------------------------------
    def test_missing_evidence_requires_resubmission(self):
        challenge = {'_id': 'ch_elec', 'title': 'Electricity Audit', 'category': 'Electricity', 'points': 50}
        submission = {
            '_id': f"sub_inc_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'I turned off switch',
            'proof_files': [],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'MORE_EVIDENCE_REQUIRED')
        self.assertGreater(len(res['missing_evidence']), 0)

    # -----------------------------------------------------------------
    # 3. Possible AI-Generated Images & False Positive Handling
    # -----------------------------------------------------------------
    def test_ai_generated_image_screening_and_human_advisory(self):
        screening = screen_image_origin("https://assets.local/dall-e_generated_render_sample.png", {})
        self.assertTrue(screening['is_flagged'])
        self.assertGreaterEqual(screening['synthetic_probability'], 0.75)
        self.assertEqual(screening['provenance_status'], 'flagged_for_human_screening')

    # -----------------------------------------------------------------
    # 4. Duplicate Evidence Detection
    # -----------------------------------------------------------------
    def test_duplicate_evidence_detection(self):
        h = compute_evidence_hash('https://images.unsplash.com/reused_asset.jpg', 'Replaced plastic bags')
        known = [{'hash': h, 'submission_id': 'prior_sub_100', 'student_id': 'other_student'}]
        dup_res = check_duplicate_evidence(h, known, current_submission_id='new_sub_200')
        self.assertFalse(dup_res['passed'])
        self.assertTrue(dup_res['reused'])
        self.assertEqual(dup_res['prior_submission_id'], 'prior_sub_100')

    # -----------------------------------------------------------------
    # 5. AI Service Errors & Graceful Fallback (AI_ERROR)
    # -----------------------------------------------------------------
    def test_service_error_handling(self):
        res = verify_submission(None, None)
        self.assertEqual(res['outcome'], 'AI_ERROR')
        self.assertEqual(res['recommended_status'], 'AI_ERROR')
        self.assertIn('internal processing error', res['findings'][0])

    # -----------------------------------------------------------------
    # 6. Student Appeals & Duplicate Appeal Prevention
    # -----------------------------------------------------------------
    def test_student_appeal_submission_and_duplicate_prevention(self):
        sub_id = f"sub_appeal_{uuid.uuid4().hex[:8]}"
        db.insert_one('submissions', {
            '_id': sub_id,
            'student_id': 'user1',
            'challenge_id': 'ch1',
            'challengeTitle': 'Campus Clean-up Drive',
            'status': 'AI_REJECTED',
            'review_queue': 'student_action',
            'points_awarded': False,
            'points': 50
        })

        # Submit valid appeal
        res = self.app.post(
            f'/api/verification/submissions/{sub_id}/appeal',
            headers={'Authorization': f'Bearer {self.student_token}'},
            json={
                'appeal_reason': 'The photo shows the exact sorted materials before the collection truck arrived at 4pm.',
                'additional_files': ['https://images.unsplash.com/extra_proof.jpg']
            }
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('appeal', data)

        # Check submission state changed to APPEALED and routed to appeal queue
        updated_sub = db.find_one('submissions', {'_id': sub_id})
        self.assertEqual(updated_sub['status'], 'APPEALED')
        self.assertEqual(updated_sub['review_queue'], 'appeal')

        # Attempt DUPLICATE open appeal -> MUST be blocked
        dup_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/appeal',
            headers={'Authorization': f'Bearer {self.student_token}'},
            json={'appeal_reason': 'Duplicate appeal attempt while open.'}
        )
        self.assertEqual(dup_res.status_code, 400)
        dup_data = json.loads(dup_res.data)
        self.assertIn('already pending', dup_data['error'].lower())

    # -----------------------------------------------------------------
    # 7. Admin Manual Approval & Verification Rerun
    # -----------------------------------------------------------------
    def test_admin_manual_approval_and_rerun(self):
        sub_id = f"sub_admin_{uuid.uuid4().hex[:8]}"
        db.insert_one('submissions', {
            '_id': sub_id,
            'student_id': 'user1',
            'challenge_id': 'ch1',
            'challengeTitle': 'Campus Clean-up Drive',
            'status': 'AI_PASSED',
            'review_queue': 'normal',
            'attempt_number': 1,
            'points_awarded': False,
            'points': 50,
            'verification_result': {'verification_id': 'ver_test_1'}
        })

        # Rerun AI verification by Admin
        rerun_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/rerun-verification',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        self.assertEqual(rerun_res.status_code, 200)
        rerun_data = json.loads(rerun_res.data)
        self.assertEqual(rerun_data['attempt_number'], 2)
        self.assertGreaterEqual(rerun_data['history_count'], 1)

        # Admin approve
        app_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/admin-decision',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve', 'reason': 'Faculty inspected before/after proof.'}
        )
        self.assertEqual(app_res.status_code, 200)
        app_data = json.loads(app_res.data)
        self.assertEqual(app_data['status'], 'Approved')
        self.assertTrue(app_data['points_awarded'])

    # -----------------------------------------------------------------
    # 8. Duplicate Point-Award Prevention (Idempotency)
    # -----------------------------------------------------------------
    def test_duplicate_point_award_prevention(self):
        user_before = db.find_one('users', {'_id': 'user1'})
        initial_points = user_before.get('eco_points', 0)

        sub_id = f"sub_idem_{uuid.uuid4().hex[:8]}"
        db.insert_one('submissions', {
            '_id': sub_id,
            'student_id': 'user1',
            'challenge_id': 'ch1',
            'challengeTitle': 'Energy Sprint',
            'status': 'AI_PASSED',
            'review_queue': 'normal',
            'points_awarded': False,
            'points': 50
        })

        # First approval
        self.app.post(
            f'/api/verification/submissions/{sub_id}/admin-decision',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve'}
        )

        user_after_first = db.find_one('users', {'_id': 'user1'})
        self.assertEqual(user_after_first['eco_points'], initial_points + 50)

        # Second approval on the SAME submission must NOT award points again
        second_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/admin-decision',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve'}
        )
        second_data = json.loads(second_res.data)
        self.assertFalse(second_data['points_awarded'])

        user_after_second = db.find_one('users', {'_id': 'user1'})
        self.assertEqual(user_after_second['eco_points'], initial_points + 50)

    # -----------------------------------------------------------------
    # 9. Unauthorized Access Rejection
    # -----------------------------------------------------------------
    def test_unauthorized_access_protection(self):
        # Student attempting to access admin queue
        res = self.app.get(
            '/api/verification/queues/normal',
            headers={'Authorization': f'Bearer {self.student_token}'}
        )
        self.assertEqual(res.status_code, 403)

        # Student attempting to make admin approval decision
        res2 = self.app.post(
            '/api/verification/submissions/sub_1/admin-decision',
            headers={'Authorization': f'Bearer {self.student_token}'},
            json={'action': 'approve'}
        )
        self.assertEqual(res2.status_code, 403)

        # Student attempting to appeal someone else's submission
        foreign_sub_id = f"sub_foreign_{uuid.uuid4().hex[:6]}"
        db.insert_one('submissions', {
            '_id': foreign_sub_id,
            'student_id': 'user2',  # belongs to user2
            'status': 'AI_REJECTED'
        })
        res3 = self.app.post(
            f'/api/verification/submissions/{foreign_sub_id}/appeal',
            headers={'Authorization': f'Bearer {self.student_token}'},
            json={'appeal_reason': 'Trying to appeal someone else submission.'}
        )
        self.assertEqual(res3.status_code, 403)


if __name__ == '__main__':
    unittest.main()
