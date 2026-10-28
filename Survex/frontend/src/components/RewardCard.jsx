import { useState } from 'react';
import { Gift, Star, Clock, Package } from 'lucide-react';
import { rewards } from '../services/api';

const RewardCard = ({ reward, userPoints, onClaim }) => {
  const [claiming, setClaiming] = useState(false);
  const canClaim = userPoints >= reward.points_required;
  const stockAvailable = reward.stock === null || reward.stock > 0;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await rewards.claim(reward._id);
      onClaim && onClaim(reward._id);
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert(error.response?.data?.error || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'certificate': '🏆',
      'eco-merch': '👕',
      'meal-token': '🍽️',
      'voucher': '🎫',
      'badge': '🏅'
    };
    return icons[category] || '🎁';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'certificate': 'bg-yellow-100 text-yellow-800',
      'eco-merch': 'bg-green-100 text-green-800',
      'meal-token': 'bg-orange-100 text-orange-800',
      'voucher': 'bg-purple-100 text-purple-800',
      'badge': 'bg-blue-100 text-blue-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {getCategoryIcon(reward.category)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {reward.title}
            </h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(reward.category)}`}>
              {reward.category}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-primary">
          <Star size={20} />
          <span className="font-bold">{reward.points_required} pts</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4">
        {reward.description}
      </p>

      {/* Stock Info */}
      {reward.stock !== null && (
        <div className="flex items-center space-x-2 mb-4 text-sm">
          <Package size={16} className="text-gray-500" />
          <span className={`${stockAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {stockAvailable ? `${reward.stock} available` : 'Out of stock'}
          </span>
        </div>
      )}

      {/* Claims Count */}
      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
        <Gift size={16} />
        <span>{reward.claimed_by?.length || 0} people claimed this</span>
      </div>

      {/* Points Requirement */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Your Points:</span>
          <span className={`font-semibold ${canClaim ? 'text-green-600' : 'text-red-600'}`}>
            {userPoints} / {reward.points_required}
          </span>
        </div>
        
        {!canClaim && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((userPoints / reward.points_required) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Need {reward.points_required - userPoints} more points
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleClaim}
        disabled={!canClaim || !stockAvailable || claiming}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          canClaim && stockAvailable
            ? 'bg-primary hover:bg-primary-dark text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {claiming ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Claiming...</span>
          </div>
        ) : !stockAvailable ? (
          'Out of Stock'
        ) : !canClaim ? (
          'Insufficient Points'
        ) : (
          'Claim Reward'
        )}
      </button>
    </div>
  );
};

export default RewardCard;
