import { useState } from 'react';
import { Calendar, Users, Award, Clock } from 'lucide-react';
import { challenges } from '../services/api';
import { formatDistanceToNow, format } from 'date-fns';

const ChallengeCard = ({ challenge, onJoin, userRole }) => {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      await challenges.join(challenge._id);
      setJoined(true);
      onJoin && onJoin(challenge._id);
    } catch (error) {
      console.error('Error joining challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Waste Management': 'bg-orange-100 text-orange-800',
      'Green Campus Activities': 'bg-green-100 text-green-800',
      'Energy Conservation': 'bg-yellow-100 text-yellow-800',
      'Water Conservation': 'bg-blue-100 text-blue-800',
      'Sustainable Mobility': 'bg-purple-100 text-purple-800',
      'Awareness & Innovation': 'bg-pink-100 text-pink-800',
      'Community Impact': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const isExpired = new Date(challenge.deadline) < new Date();
  const timeLeft = formatDistanceToNow(new Date(challenge.deadline));

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {challenge.title}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(challenge.category)}`}>
            {challenge.category}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-primary">
          <Award size={20} />
          <span className="font-bold">{challenge.points} pts</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-3">
        {challenge.description}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users size={16} />
            <span>{challenge.participants?.length || 0} joined</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Award size={16} />
            <span>{challenge.completions || 0} completed</span>
          </div>
        </div>
        
        <div className={`flex items-center space-x-1 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
          <Clock size={16} />
          <span>
            {isExpired ? 'Expired' : `${timeLeft} left`}
          </span>
        </div>
      </div>

      {/* Deadline */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-gray-600">
            Deadline: {format(new Date(challenge.deadline), 'MMM dd, yyyy')}
          </span>
        </div>
      </div>

      {/* Action Button */}
      {userRole === 'student' && (
        <div className="flex space-x-2">
          {!joined && !isExpired && (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Challenge'}
            </button>
          )}
          
          {joined && (
            <button className="btn-secondary flex-1" disabled>
              ✓ Joined
            </button>
          )}
          
          {isExpired && (
            <button className="btn-secondary flex-1" disabled>
              Expired
            </button>
          )}
          
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View Details
          </button>
        </div>
      )}
      
      {(userRole === 'admin' || userRole === 'faculty') && (
        <div className="flex space-x-2">
          <button className="btn-secondary flex-1">
            Edit Challenge
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View Submissions
          </button>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
