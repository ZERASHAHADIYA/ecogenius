import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { feed } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const FeedCard = ({ post, currentUser, onUpdate }) => {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = async () => {
    try {
      const response = await feed.like(post._id);
      setLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await feed.comment(post._id, newComment);
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async () => {
    try {
      await feed.share(post._id);
      // Show success message or update share count
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <div className="card mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.name}&background=2E7D32&color=fff`}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{formatDistanceToNow(new Date(post.timestamp))} ago</span>
              {post.post_type === 'challenge_completion' && (
                <span className="bg-primary text-white px-2 py-1 rounded-full text-xs">
                  Challenge Complete
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        
        {post.media_url && (
          <div className="mt-3">
            {post.media_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full rounded-lg max-h-96 object-cover"
              />
            ) : (
              <video
                src={post.media_url}
                controls
                className="w-full rounded-lg max-h-96"
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            <span className="text-sm">{likesCount}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm">{comments.length}</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors"
          >
            <Share2 size={20} />
            <span className="text-sm">{post.shares || 0}</span>
          </button>
        </div>
        
        {post.author?.eco_points && (
          <div className="flex items-center space-x-1 text-sm text-primary">
            <span>🌿</span>
            <span>{post.author.eco_points} points</span>
          </div>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 pt-4">
          {comments.map((comment, index) => (
            <div key={index} className="flex space-x-3 mb-3">
              <img
                src={`https://ui-avatars.com/api/?name=User&background=2E7D32&color=fff`}
                alt="Commenter"
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <p className="text-sm text-gray-800">{comment.text}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(comment.timestamp))} ago
                </p>
              </div>
            </div>
          ))}
          
          <form onSubmit={handleComment} className="flex space-x-3 mt-4">
            <img
              src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=2E7D32&color=fff`}
              alt="You"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!newComment.trim()}
              >
                Post
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedCard;
