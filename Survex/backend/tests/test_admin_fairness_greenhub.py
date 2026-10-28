import unittest
import json
import uuid
import jwt
from datetime import datetime, timezone, timedelta
from app import app
from simple_db import db
from config import Config
from services.fair_points_service import calculate_fair_points, compute_leaderboard_rankings


class TestAdminFairnessAndGreenHub(unittest.TestCase):
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

        # Create challenge
        self.challenge = {
            '_id': 'ch_fair_1',
            'title': 'Plastic-Free Campus Challenge',
            'category': 'Waste Reduction',
            'difficulty': 'Medium',
            'points': 60
        }
        if not db.find_one('challenges', {'_id': 'ch_fair_1'}):
            db.insert_one('challenges', self.challenge)

    def test_admin_cannot_submit_challenge_proof(self):
        """Verify that admins are strictly blocked from submitting challenge proofs."""
        res = self.app.post(
            '/api/verification/submit-with-verification',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={
                'challenge_id': 'ch_fair_1',
                'proof_image': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500',
                'description': 'Admin attempting to submit proof'
            }
        )
        self.assertEqual(res.status_code, 403)
        data = json.loads(res.data)
        self.assertIn('Admins cannot submit challenge proofs', data['error'])

    def test_fair_points_mathematical_formula(self):
        """Verify the mathematical points formula for Easy, Medium, and Hard."""
        # 1. Medium: Base 60, diff 1.25, confidence 0.90 -> M_AI = 0.70 + 0.27 = 0.97
        # weighted_base = 60 * 1.25 * 0.97 = 72.75
        # bonuses: ontime 10, streak 6 (3 days * 2), greenhub 15 -> 31
        # final = round(72.75 + 31) = 104
        calc = calculate_fair_points(
            base_points=60,
            difficulty='Medium',
            ai_confidence=0.90,
            on_time=True,
            streak_days=3,
            shared_to_greenhub=True
        )
        self.assertEqual(calc['difficulty_multiplier'], 1.25)
        self.assertEqual(calc['on_time_bonus'], 10)
        self.assertEqual(calc['greenhub_bonus'], 15)
        self.assertEqual(calc['total_points'], 104)

        # 2. Easy: Base 50, diff 1.00, confidence 1.00 -> M_AI = 1.00
        # weighted_base = 50 * 1.00 * 1.00 = 50
        # bonuses: 10 + 0 + 15 = 25 -> 75
        calc_easy = calculate_fair_points(
            base_points=50,
            difficulty='Easy',
            ai_confidence=1.00,
            on_time=True,
            streak_days=0,
            shared_to_greenhub=True
        )
        self.assertEqual(calc_easy['total_points'], 75)

    def test_post_approval_greenhub_publishing_and_points_claim(self):
        """
        Verify the workflow:
        1. Student submits proof -> AI verification passes
        2. Admin approves -> Student notified, points ready
        3. Student posts to GreenHUB -> Points awarded, GreenHub post created
        """
        sub_id = f"sub_flow_{uuid.uuid4().hex[:8]}"
        submission = {
            '_id': sub_id,
            'student_id': 'user1',
            'challenge_id': 'ch_fair_1',
            'challengeTitle': 'Plastic-Free Campus Challenge',
            'status': 'AI_PASSED',
            'review_queue': 'normal',
            'points_awarded': False,
            'points': 60,
            'calculated_points': 95,
            'proof_image': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500'
        }
        db.insert_one('submissions', submission)

        # 1. Admin Approves
        app_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/admin-decision',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve', 'reason': 'Verified by faculty.'}
        )
        self.assertEqual(app_res.status_code, 200)

        # 2. Student publishes to GreenHUB
        gh_res = self.app.post(
            f'/api/verification/submissions/{sub_id}/publish-to-greenhub',
            headers={'Authorization': f'Bearer {self.student_token}'},
            json={'content': 'Just completed the challenge and sorted plastics on campus!'}
        )
        self.assertEqual(gh_res.status_code, 200)
        gh_data = json.loads(gh_res.data)
        self.assertEqual(gh_data['message'], 'Successfully published to GreenHUB!')

        # Verify GreenHub post exists in db
        post = db.find_one('posts', {'_id': gh_data['post']['_id']})
        self.assertIsNotNone(post)
        self.assertEqual(post['challengeCompleted'], 'Plastic-Free Campus Challenge')

    def test_fair_leaderboard_rankings_excludes_admin(self):
        """Verify leaderboard ranks students by points & AI quality, and excludes admins."""
        users = [
            {'_id': 'u1', 'name': 'Alice', 'role': 'student', 'eco_points': 500, 'challenges_completed': 5, 'streak': 4},
            {'_id': 'u2', 'name': 'Bob', 'role': 'student', 'eco_points': 500, 'challenges_completed': 6, 'streak': 3},  # More challenges -> higher rank
            {'_id': 'u3', 'name': 'Admin User', 'role': 'admin', 'eco_points': 9999, 'challenges_completed': 0}
        ]
        ranked = compute_leaderboard_rankings(users)

        # Admin must be excluded from student competition
        admin_names = [r['name'] for r in ranked if r['name'] == 'Admin User']
        self.assertEqual(len(admin_names), 0)

        # Bob has 6 challenges vs Alice's 5 (tie-breaker) -> Bob rank 1, Alice rank 2
        self.assertEqual(ranked[0]['name'], 'Bob')
        self.assertEqual(ranked[0]['rank'], 1)
        self.assertEqual(ranked[1]['name'], 'Alice')
        self.assertEqual(ranked[1]['rank'], 2)


if __name__ == '__main__':
    unittest.main()
