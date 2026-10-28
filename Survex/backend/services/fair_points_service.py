"""
Fair Points & Leaderboard Calculation Service
Mathematical formulation for transparent, deterministic, and fair eco-points scoring.

Mathematical Formula:
Awarded Points = round( BasePoints * DifficultyMultiplier * AIQualityMultiplier + OnTimeBonus + StreakBonus + GreenHubBonus )

Variables:
1. BasePoints (B): Typically 40 - 100 points based on the challenge configuration.
2. Difficulty Multiplier (M_diff):
   - Easy: 1.00
   - Medium: 1.25
   - Hard: 1.50
3. AI Quality Multiplier (M_ai):
   M_ai = 0.70 + (0.30 * AI_Confidence)  where AI_Confidence in [0.65, 1.00]
4. On-Time Bonus (B_ontime): +10 points if completed within challenge duration.
5. Streak Bonus (B_streak): min(streak_days * 2, 20) points.
6. GreenHub Inspiration Bonus (B_greenhub): +15 points awarded upon posting verified proof to GreenHub.
"""

def calculate_fair_points(
    base_points=50,
    difficulty='Medium',
    ai_confidence=0.90,
    on_time=True,
    streak_days=0,
    shared_to_greenhub=True
):
    """
    Calculate fair eco-points using deterministic mathematical formula.
    """
    # 1. Base Points normalization
    b = float(base_points if base_points and base_points > 0 else 50)

    # 2. Difficulty Multiplier
    diff_lower = str(difficulty).lower()
    if 'hard' in diff_lower:
        m_diff = 1.50
    elif 'easy' in diff_lower:
        m_diff = 1.00
    else:  # Medium default
        m_diff = 1.25

    # 3. AI Quality Multiplier (bounded between 0.60 and 1.00)
    conf = float(ai_confidence) if ai_confidence is not None else 0.90
    conf_clamped = max(0.60, min(1.00, conf))
    m_ai = 0.70 + (0.30 * conf_clamped)

    # 4. Bonuses
    b_ontime = 10 if on_time else 0
    b_streak = min(max(0, int(streak_days)) * 2, 20)
    b_greenhub = 15 if shared_to_greenhub else 0

    # Core mathematical calculation
    weighted_base = b * m_diff * m_ai
    final_points = int(round(weighted_base + b_ontime + b_streak + b_greenhub))

    return {
        'total_points': final_points,
        'base_points': int(b),
        'difficulty': difficulty,
        'difficulty_multiplier': m_diff,
        'ai_confidence': round(conf_clamped, 3),
        'ai_quality_multiplier': round(m_ai, 3),
        'weighted_base': round(weighted_base, 2),
        'on_time_bonus': b_ontime,
        'streak_bonus': b_streak,
        'greenhub_bonus': b_greenhub,
        'formula_expression': (
            f"round({int(b)} * {m_diff:.2f} * {m_ai:.3f} + "
            f"{b_ontime} [on-time] + {b_streak} [streak] + {b_greenhub} [greenhub]) = {final_points} pts"
        )
    }


def compute_leaderboard_rankings(users, submissions=None):
    """
    Rank students mathematically and fairly:
    Primary: eco_points (descending)
    Secondary: verified_challenges_count (descending)
    Tertiary: avg_ai_confidence (descending)
    Quaternary: streak (descending)
    """
    if submissions is None:
        submissions = []

    # Map submission stats per student
    student_stats = {}
    for s in submissions:
        sid = s.get('student_id') or s.get('studentId')
        if not sid:
            continue
        if sid not in student_stats:
            student_stats[sid] = {'verified_count': 0, 'conf_sum': 0.0}
        
        status = s.get('status', '')
        if status in ['Approved', 'Completed', 'AI_PASSED']:
            student_stats[sid]['verified_count'] += 1
            conf = s.get('verification_result', {}).get('confidence_score', 0.92)
            student_stats[sid]['conf_sum'] += float(conf)

    ranked_list = []
    # Only students and faculty (exclude pure admin from student leaderboard)
    student_users = [u for u in users if u.get('role') != 'admin']

    for u in student_users:
        uid = u.get('_id') or u.get('id')
        stats = student_stats.get(uid, {'verified_count': u.get('challenges_completed', 0), 'conf_sum': 0.92 * u.get('challenges_completed', 0)})
        verified_count = max(stats['verified_count'], u.get('challenges_completed', 0))
        avg_conf = (stats['conf_sum'] / verified_count) if verified_count > 0 else 0.90
        streak = u.get('streak', u.get('streak_days', 3))
        eco_points = u.get('eco_points', 0)

        item = {
            '_id': uid,
            'id': uid,
            'name': u.get('name', 'Student'),
            'email': u.get('email', ''),
            'department': u.get('department', 'Engineering'),
            'eco_points': eco_points,
            'challenges_completed': verified_count,
            'ai_quality_index': round(avg_conf * 100, 1),
            'streak': streak,
            'badges': u.get('badges', ['🌱 Eco Starter']),
            'avatar_url': u.get('avatar_url')
        }
        ranked_list.append(item)

    # Sort strictly by mathematical fair criteria
    ranked_list.sort(
        key=lambda x: (
            x['eco_points'],
            x['challenges_completed'],
            x['ai_quality_index'],
            x['streak']
        ),
        reverse=True
    )

    # Assign 1-indexed ranks
    for idx, item in enumerate(ranked_list):
        item['rank'] = idx + 1

    return ranked_list
