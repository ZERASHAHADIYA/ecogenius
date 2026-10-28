"""
EcoGenius 12/12 Platform Challenge Verification & Validation Suite
Validates that every single challenge available on the platform is correctly
identified, screened, verified, and routed by the AI engine.
"""

import unittest
import uuid
from services.verification_service import verify_submission


class TestAll12ChallengesVerification(unittest.TestCase):

    # 1. Plastic-Free Week Challenge (Waste Reduction)
    def test_challenge_1_plastic_free_week(self):
        challenge = {
            '_id': '1',
            'title': 'Sri Eshwar Plastic-Free Week Challenge',
            'category': 'Waste Reduction',
            'points': 50
        }
        valid_sub = {
            '_id': f"sub_1_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Replaced all single-use plastics: 1. cloth tote bag, 2. stainless steel water bottle, 3. bamboo cutlery, 4. glass lunch container, 5. beeswax wrap.',
            'selected_categories': ['Plastic', 'Organic', 'Paper', 'Metal', 'Dry Waste'],
            'proof_files': ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 1 must pass with valid proof")
        self.assertGreaterEqual(res['confidence_score'], 0.65)

    # 2. Campus Tree Planting (Environmental)
    def test_challenge_2_campus_tree_planting(self):
        challenge = {
            '_id': '2',
            'title': 'Sri Eshwar Campus Tree Planting',
            'category': 'Environmental',
            'points': 75
        }
        valid_sub = {
            '_id': f"sub_2_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Planted 2 neem tree saplings near Sri Eshwar campus library garden. Added organic compost and watered thoroughly.',
            'proof_files': ['https://images.unsplash.com/photo-1542601906990-tree-plant.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 2 must pass environmental pipeline")
        self.assertIn('Environmental', res['category'])

    # 3. Energy Conservation Week (Energy)
    def test_challenge_3_energy_conservation_week(self):
        challenge = {
            '_id': '3',
            'title': 'Energy Conservation Week',
            'category': 'Energy',
            'points': 100
        }
        valid_sub = {
            '_id': f"sub_3_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Before: Unoccupied classroom 401 lights and projector running. After: Switched off all AC units, lights, and unplugged standby monitors.',
            'proof_files': [
                'https://images.unsplash.com/photo-elec-before.jpg',
                'https://images.unsplash.com/photo-elec-after.jpg'
            ]
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 3 must pass electricity pipeline")
        self.assertFalse(res['checks']['requirement_matching']['requires_meter_reading'])

    # 4. Sustainable Transportation (Transportation)
    def test_challenge_4_sustainable_transportation(self):
        challenge = {
            '_id': '4',
            'title': 'Sustainable Transportation',
            'category': 'Transportation',
            'points': 60
        }
        valid_sub = {
            '_id': f"sub_4_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Cycled 6.2 km campus commute using bicycle instead of scooter. Logged GPS tracker route and parked at campus cycle stand.',
            'proof_files': ['https://images.unsplash.com/photo-bike-commute.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 4 must pass transportation pipeline")
        self.assertIn('Transportation', res['category'])

    # 5. Zero Food Waste Challenge (Waste Reduction)
    def test_challenge_5_zero_food_waste(self):
        challenge = {
            '_id': '5',
            'title': 'Zero Food Waste Challenge',
            'category': 'Waste Reduction',
            'points': 80
        }
        valid_sub = {
            '_id': f"sub_5_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Zero food waste week: 1. vegetable peel compost, 2. portion meal planning, 3. pantry food sharing, 4. organic leftover reuse, 5. zero scrap plate audit.',
            'selected_categories': ['Organic', 'Dry Waste', 'Paper', 'Compost', 'Food Scrap'],
            'proof_files': ['https://images.unsplash.com/photo-zero-food-waste.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 5 must pass food waste verification")

    # 6. Water Conservation Drive (Water)
    def test_challenge_6_water_conservation_drive(self):
        challenge = {
            '_id': '6',
            'title': 'Water Conservation Drive',
            'category': 'Water',
            'points': 40
        }
        valid_sub = {
            '_id': f"sub_6_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Identified leaking tap valve in campus restroom and tightened joint. Water flow stopped.',
            'location_details': 'Mechanical Block, Ground Floor, Restroom 102',
            'report_confirmation': 'TICKET-WATER-7721',
            'proof_files': ['https://images.unsplash.com/photo-water-tap.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 6 must pass water pipeline")
        self.assertFalse(res['checks']['requirement_matching']['requires_meter_reading'])

    # 7. DIY Solar Charger Project (Electricity)
    def test_challenge_7_diy_solar_charger(self):
        challenge = {
            '_id': '7',
            'title': 'DIY Solar Charger Project',
            'category': 'Electricity',
            'points': 120
        }
        valid_sub = {
            '_id': f"sub_7_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Assembled portable 5V solar panel circuit. Before: testing in ambient sun. After: successfully charging mobile device without wall plug grid power.',
            'proof_files': [
                'https://images.unsplash.com/photo-solar-panel.jpg',
                'https://images.unsplash.com/photo-solar-charging.jpg'
            ]
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 7 must pass solar electricity check")

    # 8. Peak-Hour Grid Relief Sprint (Electricity)
    def test_challenge_8_peak_hour_grid_relief(self):
        challenge = {
            '_id': '8',
            'title': 'Peak-Hour Grid Relief Sprint',
            'category': 'Electricity',
            'points': 50
        }
        valid_sub = {
            '_id': f"sub_8_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Before: High power appliances and AC running at 6 PM. After: Turned off classroom AC, unplugged heavy workstation chargers, switched to natural airflow.',
            'proof_files': [
                'https://images.unsplash.com/photo-grid-relief-1.jpg',
                'https://images.unsplash.com/photo-grid-relief-2.jpg'
            ]
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 8 must pass peak-hour grid check")

    # 9. Campus Rainwater Harvesting Audit (Water)
    def test_challenge_9_rainwater_harvesting(self):
        challenge = {
            '_id': '9',
            'title': 'Campus Rainwater Harvesting Audit',
            'category': 'Water',
            'points': 70
        }
        valid_sub = {
            '_id': f"sub_9_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Inspected college rooftop rainwater catchment channels and filter mesh for debris clearance.',
            'location_details': 'Main Academic Block, Rooftop Catchment Basin A',
            'report_confirmation': 'HARVEST-AUDIT-2026',
            'proof_files': ['https://images.unsplash.com/photo-rainwater-catchment.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 9 must pass rainwater audit check")

    # 10. Greywater Recycling & Drip Reuse (Water)
    def test_challenge_10_greywater_recycling(self):
        challenge = {
            '_id': '10',
            'title': 'Greywater Recycling & Drip Reuse',
            'category': 'Water',
            'points': 90
        }
        valid_sub = {
            '_id': f"sub_10_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Collected AC condensation discharge pipe water and filtered for campus garden drip irrigation.',
            'location_details': 'Hostel Block 2, Ground Floor Garden Zone',
            'report_confirmation': 'GREYWATER-DRIP-110',
            'proof_files': ['https://images.unsplash.com/photo-greywater-drip.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 10 must pass greywater reuse check")

    # 11. Dorm Organic Composting Workshop (Waste Management)
    def test_challenge_11_dorm_organic_composting(self):
        challenge = {
            '_id': '11',
            'title': 'Dorm Organic Composting Workshop',
            'category': 'Waste Management',
            'points': 65
        }
        valid_sub = {
            '_id': f"sub_11_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Segregated five items for bokashi composting: 1. banana peels, 2. coffee grounds, 3. shredded cardboard, 4. fruit skins, 5. dry garden leaves into green compost bin.',
            'selected_categories': ['Organic', 'Dry Waste', 'Paper', 'Compost', 'Soil'],
            'proof_files': ['https://images.unsplash.com/photo-compost-bin.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 11 must pass composting check")

    # 12. Campus E-Waste Segregation Sprint (Waste Management)
    def test_challenge_12_ewaste_segregation(self):
        challenge = {
            '_id': '12',
            'title': 'Campus E-Waste Segregation Sprint',
            'category': 'Waste Management',
            'points': 85
        }
        valid_sub = {
            '_id': f"sub_12_{uuid.uuid4().hex[:6]}",
            'student_id': 'user1',
            'description': 'Collected and segregated five electronic waste items: 1. dry cell AA battery in Red bin, 2. discarded USB charging cable, 3. damaged PCB board, 4. burnt LED bulb, 5. old mouse peripheral at e-waste depot.',
            'selected_categories': ['E-Waste', 'Metal', 'Plastic', 'Battery', 'Dry Waste'],
            'proof_files': ['https://images.unsplash.com/photo-ewaste-bin.jpg']
        }
        res = verify_submission(valid_sub, challenge)
        self.assertEqual(res['outcome'], 'AI_PASSED', "Challenge 12 must pass e-waste segregation check")

    # Negative validation: Missing evidence on challenges correctly triggers MORE_EVIDENCE_REQUIRED
    def test_missing_evidence_on_tree_planting(self):
        challenge = {'_id': '2', 'title': 'Campus Tree Planting', 'category': 'Environmental', 'points': 75}
        empty_sub = {'_id': 'sub_empty_tree', 'student_id': 'user1', 'description': 'Planted tree', 'proof_files': []}
        res = verify_submission(empty_sub, challenge)
        self.assertEqual(res['outcome'], 'MORE_EVIDENCE_REQUIRED')

    def test_missing_evidence_on_transportation(self):
        challenge = {'_id': '4', 'title': 'Sustainable Transportation', 'category': 'Transportation', 'points': 60}
        empty_sub = {'_id': 'sub_empty_transport', 'student_id': 'user1', 'description': 'I walked', 'proof_files': []}
        res = verify_submission(empty_sub, challenge)
        self.assertEqual(res['outcome'], 'MORE_EVIDENCE_REQUIRED')


if __name__ == '__main__':
    unittest.main()
