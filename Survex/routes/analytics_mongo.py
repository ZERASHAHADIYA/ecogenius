"""
Analytics routes for Survex Platform
Covers both student-level and admin-level analytics
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
from bson import ObjectId

analytics_bp = Blueprint('analytics', __name__)

# --------------------------------------------------------------------------- #
# Environmental-impact multipliers (only applied when evidence is available)  #
# Source: standard lifecycle / EPA emission factors                            #
# --------------------------------------------------------------------------- #
IMPACT_MULTIPLIERS = {
    'Waste Management':        {'co2_kg': 2.1,  'unit': 'kg plastic diverted'},
    'Energy Conservation':     {'co2_kg': 0.82, 'unit': 'kWh saved'},
    'Water Conservation':      {'water_l': 150,  'unit': 'litres saved'},
    'Sustainable Mobility':    {'co2_kg': 0.21,  'unit': 'km car trip avoided'},
    'Green Campus Activities': {'trees': 1,      'unit': 'tree planted'},
    'Awareness & Innovation':  {},   # no direct measurable impact
    'Community Impact':        {},
}

CATEGORY_ICON = {
    'Waste Management':        '🗑️',
    'Energy Conservation':     '⚡',
    'Water Conservation':      '💧',
    'Sustainable Mobility':    '🚲',
    'Green Campus Activities': '🌳',
    'Awareness & Innovation':  '💡',
    'Community Impact':        '🤝',
}

BADGE_TIERS = [
    (0,   '🌱 Green Beginner'),
    (100, '🌿 Eco Learner'),
    (300, '🌾 Sustainability Hero'),
    (600, '🌳 Eco-Champion'),
    (1000,'🏅 Legend'),
]

def get_badge(points):
    tier = BADGE_TIERS[0][1]
    for threshold, name in BADGE_TIERS:
        if points >= threshold:
            tier = name
    return tier

def next_badge(points):
    for threshold, name in BADGE_TIERS:
        if points < threshold:
            return {'name': name, 'points_needed': threshold - points, 'threshold': threshold}
    return None


def init_analytics_routes(app, mongo):
    """Initialize analytics routes with app and mongo instances"""

    # ------------------------------------------------------------------ #
    # Shared helpers                                                       #
    # ------------------------------------------------------------------ #
    def serialize_doc(doc):
        if doc is None:
            return None
        if isinstance(doc, list):
            return [serialize_doc(item) for item in doc]
        if isinstance(doc, dict):
            result = {}
            for key, value in doc.items():
                if key == '_id':
                    result[key] = str(value)
                elif isinstance(value, ObjectId):
                    result[key] = str(value)
                elif isinstance(value, datetime):
                    result[key] = value.isoformat()
                elif isinstance(value, dict):
                    result[key] = serialize_doc(value)
                elif isinstance(value, list):
                    result[key] = serialize_doc(value)
                else:
                    result[key] = value
            return result
        return doc

    def verify_token():
        token = request.headers.get('Authorization')
        if not token:
            return None
        if token.startswith('Bearer '):
            token = token[7:]
        try:
            return jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except Exception:
            return None

    def date_range_days(days):
        end = datetime.utcnow()
        start = end - timedelta(days=days)
        return start, end

    # ================================================================== #
    # STUDENT ANALYTICS                                                    #
    # GET /api/analytics/student  (any authenticated user)                #
    # ================================================================== #
    @analytics_bp.route('/student', methods=['GET'])
    def get_student_analytics():
        """
        Complete personal analytics for the authenticated student.
        Returns: challenges, submissions, streaks, impact, leaderboard rank, trends.
        """
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401

            student_id = user.get('user_id')
            now = datetime.utcnow()
            week_ago  = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)

            # ---- User record ----------------------------------------- #
            user_doc = mongo.db.users.find_one({'_id': ObjectId(student_id)}, {'password': 0})
            if not user_doc:
                return jsonify({'error': 'User not found'}), 404

            eco_points = user_doc.get('eco_points', 0)

            # ---- Leaderboard rank ------------------------------------ #
            rank_result = mongo.db.users.count_documents({
                'role': 'student',
                'eco_points': {'$gt': eco_points}
            })
            leaderboard_rank = rank_result + 1
            total_students   = mongo.db.users.count_documents({'role': 'student'})

            # ---- Joined-challenge stats ------------------------------ #
            joined   = list(mongo.db.joined_challenges.find({'student_id': student_id}))
            total_joined     = len(joined)
            completed        = sum(1 for j in joined if j.get('status') == 'completed')
            in_progress      = sum(1 for j in joined if j.get('status') in ('In Progress', 'in_progress'))
            completion_rate  = round((completed / total_joined * 100) if total_joined else 0, 1)

            # ---- Submission history ---------------------------------- #
            submissions = list(mongo.db.submissions.find({'student_id': student_id}))
            sub_approved  = sum(1 for s in submissions if s.get('verification_status') == 'approved')
            sub_rejected  = sum(1 for s in submissions if s.get('verification_status') == 'rejected')
            sub_pending   = sum(1 for s in submissions if s.get('verification_status') == 'pending')

            # awaiting = pending or under_review
            awaiting_review = sum(1 for s in submissions
                                  if s.get('verification_status') in ('pending', 'under_review'))

            approval_rate = round((sub_approved / len(submissions) * 100)
                                  if submissions else 0, 1)

            # Latest 10 submissions with challenge title
            recent_subs = list(mongo.db.submissions.find(
                {'student_id': student_id}
            ).sort('submitted_at', -1).limit(10))
            for s in recent_subs:
                try:
                    ch = mongo.db.challenges.find_one({'_id': ObjectId(s.get('challenge_id'))},
                                                      {'title': 1, 'category': 1, 'points': 1})
                    s['challenge_title']    = ch.get('title', 'Unknown') if ch else 'Unknown'
                    s['challenge_category'] = ch.get('category', '') if ch else ''
                    s['challenge_points']   = ch.get('points', 0) if ch else 0
                except Exception:
                    s['challenge_title'] = 'Unknown'
                    s['challenge_category'] = ''
                    s['challenge_points'] = 0

            # ---- Category participation breakdown -------------------- #
            category_map = {}
            for j in joined:
                try:
                    ch = mongo.db.challenges.find_one(
                        {'_id': ObjectId(j['challenge_id'])},
                        {'category': 1, 'points': 1}
                    )
                    if ch:
                        cat = ch.get('category', 'Other')
                        if cat not in category_map:
                            category_map[cat] = {'joined': 0, 'completed': 0, 'points': 0}
                        category_map[cat]['joined'] += 1
                        if j.get('status') == 'completed':
                            category_map[cat]['completed'] += 1
                            category_map[cat]['points'] += ch.get('points', 0)
                except Exception:
                    pass

            category_participation = [
                {
                    'category': k,
                    'icon': CATEGORY_ICON.get(k, '🌿'),
                    'joined': v['joined'],
                    'completed': v['completed'],
                    'points': v['points'],
                    'completion_rate': round(v['completed'] / v['joined'] * 100, 1) if v['joined'] else 0
                }
                for k, v in category_map.items()
            ]
            category_participation.sort(key=lambda x: x['joined'], reverse=True)

            # ---- Weekly / Monthly activity trend (last 8 weeks) ------ #
            weekly_activity = []
            for w in range(7, -1, -1):
                w_start = now - timedelta(days=(w + 1) * 7)
                w_end   = now - timedelta(days=w * 7)
                label   = w_start.strftime('%b %d')
                joins_w = sum(1 for j in joined
                              if j.get('created_at') and w_start <= j['created_at'] < w_end)
                subs_w  = sum(1 for s in submissions
                              if s.get('submitted_at') and w_start <= s['submitted_at'] < w_end)
                approved_w = sum(1 for s in submissions
                                 if s.get('reviewed_at') and w_start <= s['reviewed_at'] < w_end
                                 and s.get('verification_status') == 'approved')
                weekly_activity.append({
                    'week': label,
                    'challenges_joined': joins_w,
                    'submissions': subs_w,
                    'approved': approved_w
                })

            # ---- Monthly activity (last 6 months) -------------------- #
            monthly_activity = []
            for m in range(5, -1, -1):
                m_start = (now.replace(day=1) - timedelta(days=m * 30)).replace(day=1)
                m_end   = (m_start + timedelta(days=32)).replace(day=1)
                label   = m_start.strftime('%b %Y')
                joins_m = sum(1 for j in joined
                              if j.get('created_at') and m_start <= j['created_at'] < m_end)
                subs_m  = sum(1 for s in submissions
                              if s.get('submitted_at') and m_start <= s['submitted_at'] < m_end)
                pts_m   = sum(s.get('challenge_points', 0) for s in submissions
                              if s.get('reviewed_at') and m_start <= s['reviewed_at'] < m_end
                              and s.get('verification_status') == 'approved')
                monthly_activity.append({
                    'month': label,
                    'challenges_joined': joins_m,
                    'submissions': subs_m,
                    'points_earned': pts_m
                })

            # ---- Streaks --------------------------------------------- #
            # A "streak day" = any day with at least one join or submission
            all_activity_dates = set()
            for j in joined:
                if j.get('created_at'):
                    all_activity_dates.add(j['created_at'].date())
            for s in submissions:
                if s.get('submitted_at'):
                    all_activity_dates.add(s['submitted_at'].date())

            current_streak = 0
            check = now.date()
            while check in all_activity_dates:
                current_streak += 1
                check -= timedelta(days=1)

            longest_streak = 0
            streak = 0
            for day_offset in range(365, -1, -1):
                d = (now - timedelta(days=day_offset)).date()
                if d in all_activity_dates:
                    streak += 1
                    longest_streak = max(longest_streak, streak)
                else:
                    streak = 0

            # ---- Badge & level --------------------------------------- #
            current_badge  = get_badge(eco_points)
            next_badge_info = next_badge(eco_points)

            # Points to next badge
            badges_earned = []
            for threshold, name in BADGE_TIERS:
                if eco_points >= threshold:
                    badges_earned.append(name)

            # ---- Environmental impact -------------------------------- #
            # Only calculated for categories with valid multipliers
            impact = {}
            for cat, v in category_map.items():
                if v['completed'] > 0 and cat in IMPACT_MULTIPLIERS and IMPACT_MULTIPLIERS[cat]:
                    mult = IMPACT_MULTIPLIERS[cat]
                    if 'co2_kg' in mult:
                        impact.setdefault('co2_saved_kg', 0)
                        impact['co2_saved_kg'] += round(mult['co2_kg'] * v['completed'], 2)
                    if 'water_l' in mult:
                        impact.setdefault('water_saved_litres', 0)
                        impact['water_saved_litres'] += round(mult['water_l'] * v['completed'], 0)
                    if 'trees' in mult:
                        impact.setdefault('trees_planted', 0)
                        impact['trees_planted'] += v['completed']

            impact['note'] = (
                'Estimates based on standard lifecycle emission factors. '
                'Only categories with measurable evidence are included.'
            ) if impact else 'No verified completions yet to estimate environmental impact.'
            impact['has_data'] = bool(impact.get('co2_saved_kg') or
                                      impact.get('water_saved_litres') or
                                      impact.get('trees_planted'))

            # ---- Assemble response ----------------------------------- #
            analytics = {
                'overview': {
                    'total_joined':     total_joined,
                    'completed':        completed,
                    'in_progress':      in_progress,
                    'awaiting_review':  awaiting_review,
                    'completion_rate':  completion_rate,
                    'eco_points':       eco_points,
                    'current_badge':    current_badge,
                    'badges_earned':    badges_earned,
                    'next_badge':       next_badge_info,
                    'leaderboard_rank': leaderboard_rank,
                    'total_students':   total_students,
                    'current_streak':   current_streak,
                    'longest_streak':   longest_streak,
                },
                'submissions': {
                    'total':          len(submissions),
                    'approved':       sub_approved,
                    'rejected':       sub_rejected,
                    'pending':        sub_pending,
                    'approval_rate':  approval_rate,
                    'recent':         serialize_doc(recent_subs),
                },
                'category_participation': category_participation,
                'weekly_activity':  weekly_activity,
                'monthly_activity': monthly_activity,
                'environmental_impact': impact,
            }

            return jsonify({'analytics': analytics}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – OVERVIEW                                                     #
    # GET /api/analytics/overview                                          #
    # ================================================================== #
    @analytics_bp.route('/overview', methods=['GET'])
    def get_analytics_overview():
        """Comprehensive analytics overview (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            now = datetime.utcnow()
            week_ago  = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            prev_month_start = now - timedelta(days=60)

            # --- User metrics ----------------------------------------- #
            total_users    = mongo.db.users.count_documents({})
            total_students = mongo.db.users.count_documents({'role': 'student'})
            active_students = mongo.db.users.count_documents({
                'role': 'student', 'eco_points': {'$gt': 0}
            })
            new_this_month = mongo.db.users.count_documents({
                'role': 'student', 'created_at': {'$gte': month_ago}
            })
            new_prev_month = mongo.db.users.count_documents({
                'role': 'student',
                'created_at': {'$gte': prev_month_start, '$lt': month_ago}
            })
            user_growth_pct = round(
                ((new_this_month - new_prev_month) / max(new_prev_month, 1)) * 100, 1
            )

            # --- Challenge metrics ------------------------------------- #
            total_challenges  = mongo.db.challenges.count_documents({})
            active_challenges = mongo.db.challenges.count_documents({'status': 'active'})
            total_joins       = mongo.db.joined_challenges.count_documents({})
            completed_joins   = mongo.db.joined_challenges.count_documents({'status': 'completed'})
            completion_rate   = round((completed_joins / max(total_joins, 1)) * 100, 1)

            # --- Submission metrics ------------------------------------ #
            total_subs    = mongo.db.submissions.count_documents({})
            pending_subs  = mongo.db.submissions.count_documents({'verification_status': 'pending'})
            approved_subs = mongo.db.submissions.count_documents({'verification_status': 'approved'})
            rejected_subs = mongo.db.submissions.count_documents({'verification_status': 'rejected'})
            approval_rate = round((approved_subs / max(total_subs, 1)) * 100, 1)

            # Average review time (submitted_at → reviewed_at)
            review_times = list(mongo.db.submissions.find(
                {'reviewed_at': {'$exists': True}, 'submitted_at': {'$exists': True}},
                {'submitted_at': 1, 'reviewed_at': 1}
            ))
            avg_review_hours = 0
            if review_times:
                diffs = []
                for rt in review_times:
                    try:
                        diff = (rt['reviewed_at'] - rt['submitted_at']).total_seconds() / 3600
                        if diff >= 0:
                            diffs.append(diff)
                    except Exception:
                        pass
                avg_review_hours = round(sum(diffs) / max(len(diffs), 1), 1)

            # --- Points & badges -------------------------------------- #
            pts_pipeline = [
                {'$match': {'role': 'student'}},
                {'$group': {'_id': None,
                            'total': {'$sum': '$eco_points'},
                            'avg':   {'$avg': '$eco_points'}}}
            ]
            pts_result = list(mongo.db.users.aggregate(pts_pipeline))
            total_points = pts_result[0]['total'] if pts_result else 0
            avg_points   = round(pts_result[0]['avg'] if pts_result else 0, 1)

            # Badges distribution
            badge_counts = {}
            for threshold, name in BADGE_TIERS:
                badge_counts[name] = mongo.db.users.count_documents({
                    'role': 'student',
                    'eco_points': {'$gte': threshold}
                })

            # --- Posts ------------------------------------------------ #
            total_posts     = mongo.db.posts.count_documents({})
            challenge_posts = mongo.db.posts.count_documents({'post_type': 'challenge_completion'})

            analytics = {
                'users': {
                    'total_users':       total_users,
                    'total_students':    total_students,
                    'active_students':   active_students,
                    'new_this_month':    new_this_month,
                    'user_growth_pct':   user_growth_pct,
                    'participation_rate': round((active_students / max(total_students, 1)) * 100, 1),
                },
                'challenges': {
                    'total_challenges':   total_challenges,
                    'active_challenges':  active_challenges,
                    'total_joins':        total_joins,
                    'completed_joins':    completed_joins,
                    'completion_rate':    completion_rate,
                },
                'submissions': {
                    'total':          total_subs,
                    'pending':        pending_subs,
                    'approved':       approved_subs,
                    'rejected':       rejected_subs,
                    'approval_rate':  approval_rate,
                    'avg_review_hours': avg_review_hours,
                },
                'posts': {
                    'total':           total_posts,
                    'challenge_posts': challenge_posts,
                    'general_posts':   total_posts - challenge_posts,
                },
                'points': {
                    'total_awarded': total_points,
                    'avg_per_student': avg_points,
                    'badge_distribution': badge_counts,
                },
            }

            return jsonify({'analytics': analytics}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – ENGAGEMENT                                                   #
    # GET /api/analytics/engagement                                        #
    # ================================================================== #
    @analytics_bp.route('/engagement', methods=['GET'])
    def get_engagement_analytics():
        """User engagement analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            now       = datetime.utcnow()
            week_ago  = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)

            recent_posts       = mongo.db.posts.count_documents({'timestamp': {'$gte': week_ago}})
            recent_submissions = mongo.db.submissions.count_documents({'submitted_at': {'$gte': week_ago}})
            recent_joins       = mongo.db.joined_challenges.count_documents({'created_at': {'$gte': week_ago}})

            monthly_posts       = mongo.db.posts.count_documents({'timestamp': {'$gte': month_ago}})
            monthly_submissions = mongo.db.submissions.count_documents({'submitted_at': {'$gte': month_ago}})
            monthly_joins       = mongo.db.joined_challenges.count_documents({'created_at': {'$gte': month_ago}})

            # Most active users
            active_users_pipeline = [
                {'$match': {'submitted_at': {'$gte': month_ago}}},
                {'$group': {'_id': '$student_id', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]
            most_active_raw = list(mongo.db.submissions.aggregate(active_users_pipeline))
            most_active_users = []
            for m in most_active_raw:
                try:
                    u = mongo.db.users.find_one({'_id': ObjectId(m['_id'])},
                                                {'name': 1, 'department': 1, 'eco_points': 1})
                    if u:
                        most_active_users.append({
                            'name':       u.get('name'),
                            'department': u.get('department'),
                            'eco_points': u.get('eco_points', 0),
                            'submissions': m['count']
                        })
                except Exception:
                    pass

            # Category participation (with completion rate)
            cat_pipeline = [
                {'$lookup': {
                    'from': 'challenges',
                    'localField': 'challenge_id',
                    'foreignField': '_id',
                    'as': 'challenge'
                }},
                {'$unwind': '$challenge'},
                {'$group': {
                    '_id': '$challenge.category',
                    'participation_count': {'$sum': 1},
                    'completion_count': {
                        '$sum': {'$cond': [{'$eq': ['$status', 'completed']}, 1, 0]}
                    }
                }},
                {'$sort': {'participation_count': -1}}
            ]
            cat_data = list(mongo.db.joined_challenges.aggregate(cat_pipeline))
            category_participation = [
                {
                    'category': c['_id'],
                    'icon': CATEGORY_ICON.get(c['_id'], '🌿'),
                    'participation_count': c['participation_count'],
                    'completion_count': c['completion_count'],
                    'completion_rate': round(
                        c['completion_count'] / max(c['participation_count'], 1) * 100, 1
                    )
                }
                for c in cat_data
            ]

            engagement = {
                'recent_activity': {
                    'weekly_posts':       recent_posts,
                    'weekly_submissions': recent_submissions,
                    'weekly_joins':       recent_joins,
                },
                'monthly_growth': {
                    'monthly_posts':       monthly_posts,
                    'monthly_submissions': monthly_submissions,
                    'monthly_joins':       monthly_joins,
                },
                'most_active_users':    most_active_users,
                'category_participation': serialize_doc(category_participation),
            }

            return jsonify({'engagement': engagement}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – CHALLENGE ANALYTICS                                          #
    # GET /api/analytics/challenges                                        #
    # ================================================================== #
    @analytics_bp.route('/challenges', methods=['GET'])
    def get_challenge_analytics():
        """Challenge-specific analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            # Top challenges by participation
            perf_pipeline = [
                {'$lookup': {
                    'from': 'joined_challenges',
                    'localField': '_id',
                    'foreignField': 'challenge_id',
                    'as': 'participations'
                }},
                {'$addFields': {
                    'participation_count': {'$size': '$participations'},
                    'completion_count': {
                        '$size': {
                            '$filter': {
                                'input': '$participations',
                                'cond': {'$eq': ['$$this.status', 'completed']}
                            }
                        }
                    }
                }},
                {'$addFields': {
                    'completion_rate': {
                        '$cond': [
                            {'$gt': ['$participation_count', 0]},
                            {'$multiply': [
                                {'$divide': ['$completion_count', '$participation_count']}, 100
                            ]},
                            0
                        ]
                    }
                }},
                {'$sort': {'participation_count': -1}},
                {'$limit': 10},
                {'$project': {'participations': 0}}
            ]
            top_challenges = list(mongo.db.challenges.aggregate(perf_pipeline))

            # Category breakdown
            cat_breakdown_pipeline = [
                {'$group': {
                    '_id': '$category',
                    'challenge_count': {'$sum': 1},
                    'total_points': {'$sum': '$points'},
                    'avg_points': {'$avg': '$points'}
                }},
                {'$sort': {'challenge_count': -1}}
            ]
            category_breakdown = list(mongo.db.challenges.aggregate(cat_breakdown_pipeline))
            for c in category_breakdown:
                c['icon'] = CATEGORY_ICON.get(c['_id'], '🌿')

            # Difficulty distribution
            diff_pipeline = [
                {'$group': {'_id': '$difficulty', 'count': {'$sum': 1}}}
            ]
            difficulty_distribution = list(mongo.db.challenges.aggregate(diff_pipeline))

            # Submission approval/rejection by category
            sub_cat_pipeline = [
                {'$lookup': {
                    'from': 'challenges',
                    'localField': 'challenge_id',
                    'foreignField': '_id',
                    'as': 'challenge'
                }},
                {'$unwind': {'path': '$challenge', 'preserveNullAndEmptyArrays': True}},
                {'$group': {
                    '_id': '$challenge.category',
                    'total': {'$sum': 1},
                    'approved': {'$sum': {'$cond': [
                        {'$eq': ['$verification_status', 'approved']}, 1, 0
                    ]}},
                    'rejected': {'$sum': {'$cond': [
                        {'$eq': ['$verification_status', 'rejected']}, 1, 0
                    ]}},
                    'pending': {'$sum': {'$cond': [
                        {'$eq': ['$verification_status', 'pending']}, 1, 0
                    ]}},
                }},
                {'$sort': {'total': -1}}
            ]
            submission_by_category = list(mongo.db.submissions.aggregate(sub_cat_pipeline))

            return jsonify({
                'challenge_analytics': {
                    'top_challenges':        serialize_doc(top_challenges),
                    'category_breakdown':    serialize_doc(category_breakdown),
                    'difficulty_distribution': serialize_doc(difficulty_distribution),
                    'submission_by_category': serialize_doc(submission_by_category),
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – LEADERBOARD STATS                                            #
    # GET /api/analytics/leaderboard-stats                                 #
    # ================================================================== #
    @analytics_bp.route('/leaderboard-stats', methods=['GET'])
    def get_leaderboard_stats():
        """Leaderboard and department statistics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            top_performers = list(mongo.db.users.find(
                {'role': 'student'}, {'password': 0}
            ).sort('eco_points', -1).limit(10))

            dept_pipeline = [
                {'$match': {'role': 'student'}},
                {'$group': {
                    '_id': '$department',
                    'student_count': {'$sum': 1},
                    'total_points':  {'$sum': '$eco_points'},
                    'avg_points':    {'$avg': '$eco_points'},
                    'total_completed': {'$sum': '$challenges_completed'}
                }},
                {'$sort': {'avg_points': -1}}
            ]
            department_performance = list(mongo.db.users.aggregate(dept_pipeline))

            pts_dist_pipeline = [
                {'$match': {'role': 'student'}},
                {'$bucket': {
                    'groupBy': '$eco_points',
                    'boundaries': [0, 50, 100, 200, 300, 500, 1000],
                    'default': '1000+',
                    'output': {'count': {'$sum': 1}}
                }}
            ]
            points_distribution = list(mongo.db.users.aggregate(pts_dist_pipeline))

            return jsonify({
                'leaderboard_stats': {
                    'top_performers':       serialize_doc(top_performers),
                    'department_performance': serialize_doc(department_performance),
                    'points_distribution':  serialize_doc(points_distribution),
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – TIMELINE                                                     #
    # GET /api/analytics/timeline?days=30                                  #
    # ================================================================== #
    @analytics_bp.route('/timeline', methods=['GET'])
    def get_timeline_analytics():
        """Timeline-based analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            days = int(request.args.get('days', 30))
            end_date   = datetime.utcnow()
            start_date = end_date - timedelta(days=days)

            daily_posts_pipeline = [
                {'$match': {'timestamp': {'$gte': start_date, '$lte': end_date}}},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$timestamp'}},
                    'posts': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            daily_subs_pipeline = [
                {'$match': {'submitted_at': {'$gte': start_date, '$lte': end_date}}},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$submitted_at'}},
                    'submissions': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            daily_joins_pipeline = [
                {'$match': {'created_at': {'$gte': start_date, '$lte': end_date}}},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                    'joins': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            # New registrations per day
            daily_users_pipeline = [
                {'$match': {
                    'role': 'student',
                    'created_at': {'$gte': start_date, '$lte': end_date}
                }},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                    'new_users': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]

            return jsonify({
                'timeline_analytics': {
                    'daily_posts':       serialize_doc(list(mongo.db.posts.aggregate(daily_posts_pipeline))),
                    'daily_submissions': serialize_doc(list(mongo.db.submissions.aggregate(daily_subs_pipeline))),
                    'daily_joins':       serialize_doc(list(mongo.db.joined_challenges.aggregate(daily_joins_pipeline))),
                    'daily_new_users':   serialize_doc(list(mongo.db.users.aggregate(daily_users_pipeline))),
                    'date_range': {
                        'start_date': start_date.isoformat(),
                        'end_date':   end_date.isoformat(),
                        'days': days
                    }
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – SUBMISSION WORKLOAD                                          #
    # GET /api/analytics/submission-workload                               #
    # ================================================================== #
    @analytics_bp.route('/submission-workload', methods=['GET'])
    def get_submission_workload():
        """
        Pending review workload, average review time,
        and reviewer performance. (Admin only)
        """
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            now = datetime.utcnow()

            pending_subs = list(mongo.db.submissions.find(
                {'verification_status': 'pending'},
                {'student_id': 1, 'challenge_id': 1, 'submitted_at': 1}
            ).sort('submitted_at', 1))

            # Enrich with student name and challenge title
            workload = []
            for s in pending_subs:
                age_hours = 0
                if s.get('submitted_at'):
                    age_hours = round((now - s['submitted_at']).total_seconds() / 3600, 1)

                student_name = 'Unknown'
                challenge_title = 'Unknown'
                try:
                    u = mongo.db.users.find_one({'_id': ObjectId(s['student_id'])}, {'name': 1})
                    if u:
                        student_name = u.get('name', 'Unknown')
                except Exception:
                    pass
                try:
                    ch = mongo.db.challenges.find_one({'_id': ObjectId(s['challenge_id'])}, {'title': 1})
                    if ch:
                        challenge_title = ch.get('title', 'Unknown')
                except Exception:
                    pass

                workload.append({
                    '_id': str(s['_id']),
                    'student_name': student_name,
                    'challenge_title': challenge_title,
                    'submitted_at': s['submitted_at'].isoformat() if s.get('submitted_at') else None,
                    'age_hours': age_hours,
                    'overdue': age_hours > 48
                })

            # Review time percentiles
            reviewed = list(mongo.db.submissions.find(
                {'reviewed_at': {'$exists': True}, 'submitted_at': {'$exists': True}},
                {'submitted_at': 1, 'reviewed_at': 1, 'verification_status': 1}
            ))
            review_hours_list = []
            for r in reviewed:
                try:
                    diff = (r['reviewed_at'] - r['submitted_at']).total_seconds() / 3600
                    if 0 <= diff < 10000:
                        review_hours_list.append(diff)
                except Exception:
                    pass

            review_hours_list.sort()
            n = len(review_hours_list)
            avg_h   = round(sum(review_hours_list) / n, 1) if n else 0
            median_h = round(review_hours_list[n // 2], 1) if n else 0
            p90_h   = round(review_hours_list[int(n * 0.9)], 1) if n else 0

            return jsonify({
                'workload': {
                    'pending_count':     len(pending_subs),
                    'overdue_count':     sum(1 for w in workload if w['overdue']),
                    'pending_items':     workload,
                    'review_time_stats': {
                        'avg_hours':    avg_h,
                        'median_hours': median_h,
                        'p90_hours':    p90_h,
                        'total_reviewed': n,
                    }
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – REWARD ANALYTICS                                             #
    # GET /api/analytics/rewards                                           #
    # ================================================================== #
    @analytics_bp.route('/rewards', methods=['GET'])
    def get_reward_analytics():
        """Reward redemption analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            # Points distribution among students
            pipeline = [
                {'$match': {'role': 'student'}},
                {'$group': {
                    '_id': None,
                    'total_points': {'$sum': '$eco_points'},
                    'max_points':   {'$max': '$eco_points'},
                    'min_points':   {'$min': '$eco_points'},
                    'avg_points':   {'$avg': '$eco_points'},
                }}
            ]
            pts = list(mongo.db.users.aggregate(pipeline))
            pts_summary = pts[0] if pts else {}

            # Badge distribution
            badge_dist = []
            for threshold, name in BADGE_TIERS:
                count = mongo.db.users.count_documents({
                    'role': 'student', 'eco_points': {'$gte': threshold}
                })
                badge_dist.append({'badge': name, 'threshold': threshold, 'count': count})

            # Reward redemptions (if rewards collection exists)
            try:
                redemptions = list(mongo.db.reward_claims.aggregate([
                    {'$group': {
                        '_id': '$reward_id',
                        'count': {'$sum': 1}
                    }},
                    {'$sort': {'count': -1}},
                    {'$limit': 10}
                ]))
                for r in redemptions:
                    try:
                        reward = mongo.db.rewards.find_one({'_id': ObjectId(r['_id'])},
                                                           {'title': 1, 'points_required': 1})
                        if reward:
                            r['title'] = reward.get('title', 'Unknown')
                            r['points_required'] = reward.get('points_required', 0)
                    except Exception:
                        r['title'] = 'Unknown'
                        r['points_required'] = 0
            except Exception:
                redemptions = []

            return jsonify({
                'reward_analytics': {
                    'points_summary':   serialize_doc(pts_summary),
                    'badge_distribution': badge_dist,
                    'top_redeemed_rewards': serialize_doc(redemptions),
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # ADMIN – AI VERIFICATION PLACEHOLDER                                  #
    # GET /api/analytics/ai-verification                                   #
    # ================================================================== #
    @analytics_bp.route('/ai-verification', methods=['GET'])
    def get_ai_verification_analytics():
        """
        AI verification performance metrics.
        Returns real data if ai_decisions collection exists,
        otherwise returns a structured placeholder.
        (Admin only)
        """
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            try:
                total_ai = mongo.db.ai_decisions.count_documents({})
            except Exception:
                total_ai = 0

            if total_ai == 0:
                return jsonify({
                    'ai_verification': {
                        'available': False,
                        'message': 'AI verification module not yet active. '
                                   'Metrics will populate once AI-assisted review is enabled.',
                        'metrics': {
                            'total_reviewed': 0,
                            'auto_approved':  0,
                            'auto_rejected':  0,
                            'escalated_to_human': 0,
                            'precision': None,
                            'recall':    None,
                            'false_approval_rate': None,
                        }
                    }
                }), 200

            # Real data path
            auto_approved  = mongo.db.ai_decisions.count_documents({'decision': 'approved', 'human_override': False})
            auto_rejected  = mongo.db.ai_decisions.count_documents({'decision': 'rejected', 'human_override': False})
            escalated      = mongo.db.ai_decisions.count_documents({'escalated': True})
            true_positives = mongo.db.ai_decisions.count_documents({'decision': 'approved', 'ground_truth': 'approved'})
            false_positives= mongo.db.ai_decisions.count_documents({'decision': 'approved', 'ground_truth': 'rejected'})
            true_negatives = mongo.db.ai_decisions.count_documents({'decision': 'rejected', 'ground_truth': 'rejected'})
            false_negatives= mongo.db.ai_decisions.count_documents({'decision': 'rejected', 'ground_truth': 'approved'})

            precision = round(true_positives / max(true_positives + false_positives, 1) * 100, 1)
            recall    = round(true_positives / max(true_positives + false_negatives, 1) * 100, 1)
            false_approval_rate = round(false_positives / max(auto_approved, 1) * 100, 1)

            return jsonify({
                'ai_verification': {
                    'available': True,
                    'metrics': {
                        'total_reviewed':     total_ai,
                        'auto_approved':      auto_approved,
                        'auto_rejected':      auto_rejected,
                        'escalated_to_human': escalated,
                        'precision':          precision,
                        'recall':             recall,
                        'false_approval_rate': false_approval_rate,
                    }
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ================================================================== #
    # EXPORT                                                               #
    # GET /api/analytics/export?type=overview|users|challenges|submissions #
    # ================================================================== #
    @analytics_bp.route('/export', methods=['GET'])
    def export_analytics():
        """Export analytics data (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            export_type = request.args.get('type', 'overview')

            if export_type == 'users':
                data = list(mongo.db.users.find({'role': 'student'}, {'password': 0}))
            elif export_type == 'challenges':
                data = list(mongo.db.challenges.find({}))
            elif export_type == 'submissions':
                data = list(mongo.db.submissions.find({}))
            elif export_type == 'posts':
                data = list(mongo.db.posts.find({}))
            else:
                data = {
                    'users':       list(mongo.db.users.find({'role': 'student'}, {'password': 0})),
                    'challenges':  list(mongo.db.challenges.find({})),
                    'submissions': list(mongo.db.submissions.find({})),
                }

            return jsonify({
                'export_data':  serialize_doc(data),
                'export_type':  export_type,
                'exported_at':  datetime.utcnow().isoformat()
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return analytics_bp
