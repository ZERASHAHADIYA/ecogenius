"""
EcoGenius Comprehensive AI Model & Proof Verification Test Suite
Validates that each challenge category (Electricity, Water, Waste, General)
is accurately identified, verified, and routed by the AI verification engine,
including image provenance screening, duplicate detection, and admin sign-off.
"""

import unittest
import json
import uuid
import hashlib
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


class TestAIChallengeModelValidation(unittest.TestCase):

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

    # =========================================================================
    # 1. Electricity Conservation Challenge Validation
    # =========================================================================
    def test_electricity_proper_images_and_switchoff(self):
        """Test valid electricity proof with before-and-after power down"""
        challenge = {
            '_id': 'ch_elec_valid',
            'title': 'Peak Hour Grid Relief Sprint',
            'category': 'Electricity',
            'points': 50
        }
        submission = {
            '_id': f"sub_elec_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Before: Left lab 302 projector and workstations running on idle standby. After: Turned off all computers, monitors, lab lights, and unplugged phantom charger loads.',
            'proof_files': [
                'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500',
                'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=500'
            ],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)

        self.assertEqual(res['outcome'], 'AI_PASSED', "Valid electricity proof must be AI_PASSED")
        self.assertGreaterEqual(res['confidence_score'], 0.65)
        self.assertTrue(res['checks']['requirement_matching']['has_before_after'])
        self.assertFalse(res['checks']['requirement_matching']['requires_meter_reading'],
                         "Meter reading must never be required for electricity challenges")
        self.assertIn('Electricity Conservation', res['category'])

    def test_electricity_missing_photo_evidence(self):
        """Test that electricity submission with no photos is held for more evidence"""
        challenge = {'_id': 'ch_elec_inc', 'title': 'Energy Conservation', 'category': 'Electricity', 'points': 50}
        submission = {
            '_id': f"sub_elec_no_pic_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'I switched off lights and computers in the classroom.',
            'proof_files': [],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'MORE_EVIDENCE_REQUIRED')
        self.assertTrue(any('photo' in m.lower() for m in res['missing_evidence']))

    # =========================================================================
    # 2. Water Conservation Challenge Validation
    # =========================================================================
    def test_water_proper_leak_and_location(self):
        """Test valid water leakage report with photo, location, and maintenance confirmation"""
        challenge = {
            '_id': 'ch_water_valid',
            'title': 'Report Campus Leaking Tap',
            'category': 'Water',
            'points': 40
        }
        submission = {
            '_id': f"sub_water_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Detected high-frequency drip from bathroom pipe valve. Reported to campus hostel facility helpdesk.',
            'location_details': 'Hostel Block 4, 3rd Floor, Washroom 305',
            'report_confirmation': 'TICKET-WAT-9042',
            'proof_files': ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500'],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)

        self.assertEqual(res['outcome'], 'AI_PASSED', "Valid water leak proof must be AI_PASSED")
        self.assertTrue(res['checks']['requirement_matching']['location_verified'])
        self.assertFalse(res['checks']['requirement_matching']['requires_meter_reading'],
                         "Water meter reading must not be required")
        self.assertIn('Water Conservation', res['category'])

    def test_water_missing_location(self):
        """Test that water submission without location is held for more evidence"""
        challenge = {'_id': 'ch_water_noloc', 'title': 'Water Leakage', 'category': 'Water', 'points': 40}
        submission = {
            '_id': f"sub_water_noloc_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Found leaking tap somewhere in college.',
            'location_details': '',
            'proof_files': ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500'],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'MORE_EVIDENCE_REQUIRED')
        self.assertTrue(any('location' in m.lower() for m in res['missing_evidence']))

    # =========================================================================
    # 3. Waste Management Challenge Validation
    # =========================================================================
    def test_waste_five_items_segregated(self):
        """Test valid waste segregation proof with 5 safe items across bins"""
        challenge = {
            '_id': 'ch_waste_valid',
            'title': 'Campus Waste Segregation Sprint',
            'category': 'Waste Management',
            'points': 65
        }
        submission = {
            '_id': f"sub_waste_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Segregated five campus waste items into proper color-coded bins: 1. Plastic mineral water bottle in Blue bin, 2. Banana peels and apple core in Green organic bin, 3. Cardboard carton in Blue paper bin, 4. Crushed soda aluminum can in Yellow metal bin, 5. Discharged AAA battery into Red designated e-waste container.',
            'selected_categories': ['Plastic', 'Organic', 'Paper', 'Metal', 'Dry Waste'],
            'proof_files': ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500'],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)

        self.assertEqual(res['outcome'], 'AI_PASSED', "Valid waste segregation must be AI_PASSED")
        self.assertTrue(res['checks']['requirement_matching']['has_five_items'])
        self.assertGreaterEqual(res['checks']['requirement_matching']['items_count'], 5)

    def test_waste_fewer_than_five_items(self):
        """Test waste submission with fewer than 5 items held for more evidence"""
        challenge = {'_id': 'ch_waste_partial', 'title': 'Waste Sprint', 'category': 'Waste Management', 'points': 50}
        submission = {
            '_id': f"sub_waste_partial_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'I threw away one plastic bottle.',
            'selected_categories': ['Plastic'],
            'proof_files': ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500'],
            'attempt_number': 1
        }
        res = verify_submission(submission, challenge)
        self.assertEqual(res['outcome'], 'MORE_EVIDENCE_REQUIRED')
        self.assertTrue(any('five' in m.lower() for m in res['missing_evidence']))

    # =========================================================================
    # 4. Image Provenance & Synthetic Origin Screening
    # =========================================================================
    def test_genuine_camera_photo_screening(self):
        """Test that genuine camera capture passes provenance screening cleanly"""
        genuine_metadata = {'width': 1920, 'height': 1080, 'has_camera_exif': True}
        screening = screen_image_origin('https://campus.edu/uploads/genuine_lab_lights_off.jpg', genuine_metadata)
        self.assertTrue(screening['passed'])
        self.assertFalse(screening['is_flagged'])
        self.assertLessEqual(screening['synthetic_probability'], 0.10)
        self.assertEqual(screening['provenance_status'], 'verified_genuine')

    def test_synthetic_ai_image_detected_and_advisory_flagged(self):
        """Test that synthetic AI traces (e.g. Midjourney or DALL-E) raise advisory flag"""
        synthetic_metadata = {'width': 1024, 'height': 1024, 'has_camera_exif': False}
        screening = screen_image_origin('https://images.unsplash.com/dall-e-3_switched_off_lights_mock.png', synthetic_metadata)
        self.assertTrue(screening['is_flagged'])
        self.assertGreaterEqual(screening['synthetic_probability'], 0.75)
        self.assertEqual(screening['provenance_status'], 'flagged_for_human_screening')

    # =========================================================================
    # 5. Duplicate Evidence Across Campus Screening
    # =========================================================================
    def test_duplicate_evidence_screening(self):
        """Test that reusing an image previously submitted by another student is caught"""
        url = 'https://images.unsplash.com/photo-shared-evidence.jpg'
        h = compute_evidence_hash(url, 'Switched off laboratory lighting')
        known = [{'hash': h, 'submission_id': 'prior_student_sub_441', 'student_id': 'user3'}]

        dup_check = check_duplicate_evidence(h, known, current_submission_id='new_student_sub_999')
        self.assertFalse(dup_check['passed'])
        self.assertTrue(dup_check['reused'])
        self.assertEqual(dup_check['prior_submission_id'], 'prior_student_sub_441')

    # =========================================================================
    # 6. Complete End-to-End API Pipeline (Submit -> AI Verify -> Admin Approve)
    # =========================================================================
    def test_end_to_end_verification_and_admin_approval(self):
        """Test full pipeline: Student submits -> AI Passes -> Admin approves -> Points awarded"""
        user_before = db.find_one('users', {'_id': 'user1'})
        initial_points = user_before.get('eco_points', 0)

        # 1. Student submits via API
        unique_token = uuid.uuid4().hex[:8]
        post_res = self.app.post(
            '/api/verification/submit-with-verification',
            headers={'Authorization': f'Bearer {self.student_token}'},
            json={
                'challenge_id': f'ch_e2e_{unique_token}',
                'challenge_title': 'Campus Tree Plantation Care',
                'category': 'Waste Management',
                'points': 60,
                'description': f'Planted and segregated waste at tree site {unique_token}: 1. plastic bag, 2. cardboard mulch box, 3. dry leaves, 4. plastic tie, 5. metal stake tags into respective bins.',
                'selected_categories': ['Plastic', 'Organic', 'Paper', 'Metal', 'Dry Waste'],
                'proof_files': [f'https://images.unsplash.com/photo-tree-{unique_token}.jpg'],
                'metadata': {'width': 1200, 'height': 800, 'has_camera_exif': True}
            }
        )
        self.assertEqual(post_res.status_code, 201)
        res_data = json.loads(post_res.data)
        sub_id = res_data['submission']['_id']
        outcome = res_data['verification_result']['outcome']
        self.assertEqual(outcome, 'AI_PASSED')

        # 2. Check submission is in Admin Normal Queue
        queue_res = self.app.get(
            '/api/verification/queues/normal',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        self.assertEqual(queue_res.status_code, 200)
        queue_data = json.loads(queue_res.data)
        found_in_queue = any(s['_id'] == sub_id for s in queue_data['queue'])
        self.assertTrue(found_in_queue, "AI_PASSED submission must appear in admin normal approval queue")

        # 3. Admin Approves submission
        decision_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/admin-decision',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve', 'reason': 'Faculty confirmed proper tree care evidence.'}
        )
        self.assertEqual(decision_res.status_code, 200)
        decision_data = json.loads(decision_res.data)
        self.assertEqual(decision_data['status'], 'Approved')
        self.assertTrue(decision_data['points_awarded'])

        # 4. Check points incremented idempotently
        user_after = db.find_one('users', {'_id': 'user1'})
        self.assertEqual(user_after['eco_points'], initial_points + 60)


if __name__ == '__main__':
    unittest.main()
