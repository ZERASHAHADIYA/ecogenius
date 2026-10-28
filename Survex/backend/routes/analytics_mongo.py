"""
Analytics routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
from bson import ObjectId

analytics_bp = Blueprint('analytics', __name__)

def init_analytics_routes(app, mongo):
    """Initialize analytics routes with app and mongo instances"""
    
    def serialize_doc(doc):
        """Convert MongoDB document to JSON serializable format"""
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
        """Verify JWT token and return user info"""
        token = request.headers.get('Authorization')
        if not token:
            return None
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            return payload
        except:
            return None
    
    @analytics_bp.route('/overview', methods=['GET'])
    def get_analytics_overview():
        """Get comprehensive analytics overview (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # User statistics
            total_users = mongo.db.users.count_documents({})
            total_students = mongo.db.users.count_documents({'role': 'student'})
            active_students = mongo.db.users.count_documents({
                'role': 'student',
                'eco_points': {'$gt': 0}
            })
            
            # Challenge statistics
            total_challenges = mongo.db.challenges.count_documents({})
            active_challenges = mongo.db.challenges.count_documents({'status': 'active'})
            
            # Submission statistics
            total_submissions = mongo.db.submissions.count_documents({})
            pending_submissions = mongo.db.submissions.count_documents({'verification_status': 'pending'})
            approved_submissions = mongo.db.submissions.count_documents({'verification_status': 'approved'})
            rejected_submissions = mongo.db.submissions.count_documents({'verification_status': 'rejected'})
            
            # Post statistics
            total_posts = mongo.db.posts.count_documents({})
            challenge_posts = mongo.db.posts.count_documents({'post_type': 'challenge_completion'})
            
            # Participation statistics
            total_participations = mongo.db.joined_challenges.count_documents({})
            completed_participations = mongo.db.joined_challenges.count_documents({'status': 'completed'})
            
            # Calculate rates
            participation_rate = round((active_students / max(total_students, 1)) * 100, 2)
            completion_rate = round((completed_participations / max(total_participations, 1)) * 100, 2)
            approval_rate = round((approved_submissions / max(total_submissions, 1)) * 100, 2)
            
            # Total points awarded
            pipeline = [
                {'$match': {'role': 'student'}},
                {'$group': {'_id': None, 'total_points': {'$sum': '$eco_points'}}}
            ]
            points_result = list(mongo.db.users.aggregate(pipeline))
            total_points_awarded = points_result[0]['total_points'] if points_result else 0
            
            analytics = {
                'users': {
                    'total_users': total_users,
                    'total_students': total_students,
                    'active_students': active_students,
                    'participation_rate': participation_rate
                },
                'challenges': {
                    'total_challenges': total_challenges,
                    'active_challenges': active_challenges,
                    'total_participations': total_participations,
                    'completion_rate': completion_rate
                },
                'submissions': {
                    'total_submissions': total_submissions,
                    'pending_submissions': pending_submissions,
                    'approved_submissions': approved_submissions,
                    'rejected_submissions': rejected_submissions,
                    'approval_rate': approval_rate
                },
                'posts': {
                    'total_posts': total_posts,
                    'challenge_posts': challenge_posts,
                    'general_posts': total_posts - challenge_posts
                },
                'points': {
                    'total_points_awarded': total_points_awarded,
                    'average_points_per_student': round(total_points_awarded / max(total_students, 1), 2)
                }
            }
            
            return jsonify({'analytics': analytics}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @analytics_bp.route('/engagement', methods=['GET'])
    def get_engagement_analytics():
        """Get user engagement analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Time-based analytics
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Recent activity
            recent_posts = mongo.db.posts.count_documents({'timestamp': {'$gte': week_ago}})
            recent_submissions = mongo.db.submissions.count_documents({'submitted_at': {'$gte': week_ago}})
            recent_joins = mongo.db.joined_challenges.count_documents({'created_at': {'$gte': week_ago}})
            
            # Monthly growth
            monthly_posts = mongo.db.posts.count_documents({'timestamp': {'$gte': month_ago}})
            monthly_submissions = mongo.db.submissions.count_documents({'submitted_at': {'$gte': month_ago}})
            monthly_joins = mongo.db.joined_challenges.count_documents({'created_at': {'$gte': month_ago}})
            
            # Most active users (last 30 days)
            active_users_pipeline = [
                {'$match': {'timestamp': {'$gte': month_ago}}},
                {'$group': {
                    '_id': '$student_id',
                    'post_count': {'$sum': 1},
                    'author_name': {'$first': '$author.name'}
                }},
                {'$sort': {'post_count': -1}},
                {'$limit': 10}
            ]
            most_active_users = list(mongo.db.posts.aggregate(active_users_pipeline))
            
            # Challenge participation by category
            category_pipeline = [
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
            category_participation = list(mongo.db.joined_challenges.aggregate(category_pipeline))
            
            engagement = {
                'recent_activity': {
                    'weekly_posts': recent_posts,
                    'weekly_submissions': recent_submissions,
                    'weekly_joins': recent_joins
                },
                'monthly_growth': {
                    'monthly_posts': monthly_posts,
                    'monthly_submissions': monthly_submissions,
                    'monthly_joins': monthly_joins
                },
                'most_active_users': serialize_doc(most_active_users),
                'category_participation': serialize_doc(category_participation)
            }
            
            return jsonify({'engagement': engagement}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @analytics_bp.route('/challenges', methods=['GET'])
    def get_challenge_analytics():
        """Get challenge-specific analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Challenge performance
            challenge_performance_pipeline = [
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
                            {'$multiply': [{'$divide': ['$completion_count', '$participation_count']}, 100]},
                            0
                        ]
                    }
                }},
                {'$sort': {'participation_count': -1}},
                {'$limit': 10}
            ]
            
            top_challenges = list(mongo.db.challenges.aggregate(challenge_performance_pipeline))
            
            # Category breakdown
            category_breakdown_pipeline = [
                {'$group': {
                    '_id': '$category',
                    'challenge_count': {'$sum': 1},
                    'total_points': {'$sum': '$points'},
                    'avg_points': {'$avg': '$points'}
                }},
                {'$sort': {'challenge_count': -1}}
            ]
            
            category_breakdown = list(mongo.db.challenges.aggregate(category_breakdown_pipeline))
            
            # Difficulty distribution
            difficulty_distribution_pipeline = [
                {'$group': {
                    '_id': '$difficulty',
                    'count': {'$sum': 1}
                }}
            ]
            
            difficulty_distribution = list(mongo.db.challenges.aggregate(difficulty_distribution_pipeline))
            
            challenge_analytics = {
                'top_challenges': serialize_doc(top_challenges),
                'category_breakdown': serialize_doc(category_breakdown),
                'difficulty_distribution': serialize_doc(difficulty_distribution)
            }
            
            return jsonify({'challenge_analytics': challenge_analytics}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @analytics_bp.route('/leaderboard-stats', methods=['GET'])
    def get_leaderboard_stats():
        """Get leaderboard statistics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Top performers
            top_performers = list(mongo.db.users.find(
                {'role': 'student'},
                {'password': 0}
            ).sort('eco_points', -1).limit(10))
            
            # Department-wise performance
            department_performance_pipeline = [
                {'$match': {'role': 'student'}},
                {'$group': {
                    '_id': '$department',
                    'student_count': {'$sum': 1},
                    'total_points': {'$sum': '$eco_points'},
                    'avg_points': {'$avg': '$eco_points'},
                    'total_challenges': {'$sum': '$challenges_completed'}
                }},
                {'$sort': {'avg_points': -1}}
            ]
            
            department_performance = list(mongo.db.users.aggregate(department_performance_pipeline))
            
            # Points distribution
            points_distribution_pipeline = [
                {'$match': {'role': 'student'}},
                {'$bucket': {
                    'groupBy': '$eco_points',
                    'boundaries': [0, 50, 100, 200, 300, 500, 1000],
                    'default': '1000+',
                    'output': {'count': {'$sum': 1}}
                }}
            ]
            
            points_distribution = list(mongo.db.users.aggregate(points_distribution_pipeline))
            
            leaderboard_stats = {
                'top_performers': serialize_doc(top_performers),
                'department_performance': serialize_doc(department_performance),
                'points_distribution': serialize_doc(points_distribution)
            }
            
            return jsonify({'leaderboard_stats': leaderboard_stats}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @analytics_bp.route('/timeline', methods=['GET'])
    def get_timeline_analytics():
        """Get timeline-based analytics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get date range from query params
            days = int(request.args.get('days', 30))
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Daily activity timeline
            daily_activity_pipeline = [
                {'$match': {'timestamp': {'$gte': start_date, '$lte': end_date}}},
                {'$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$timestamp'
                        }
                    },
                    'posts': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            daily_posts = list(mongo.db.posts.aggregate(daily_activity_pipeline))
            
            # Daily submissions timeline
            daily_submissions_pipeline = [
                {'$match': {'submitted_at': {'$gte': start_date, '$lte': end_date}}},
                {'$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$submitted_at'
                        }
                    },
                    'submissions': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            daily_submissions = list(mongo.db.submissions.aggregate(daily_submissions_pipeline))
            
            # Daily challenge joins timeline
            daily_joins_pipeline = [
                {'$match': {'created_at': {'$gte': start_date, '$lte': end_date}}},
                {'$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$created_at'
                        }
                    },
                    'joins': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            daily_joins = list(mongo.db.joined_challenges.aggregate(daily_joins_pipeline))
            
            timeline_analytics = {
                'daily_posts': serialize_doc(daily_posts),
                'daily_submissions': serialize_doc(daily_submissions),
                'daily_joins': serialize_doc(daily_joins),
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                }
            }
            
            return jsonify({'timeline_analytics': timeline_analytics}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
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
                # Default overview export
                data = {
                    'users': list(mongo.db.users.find({'role': 'student'}, {'password': 0})),
                    'challenges': list(mongo.db.challenges.find({})),
                    'submissions': list(mongo.db.submissions.find({})),
                    'posts': list(mongo.db.posts.find({}))
                }
            
            return jsonify({
                'export_data': serialize_doc(data),
                'export_type': export_type,
                'exported_at': datetime.utcnow().isoformat()
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return analytics_bp
