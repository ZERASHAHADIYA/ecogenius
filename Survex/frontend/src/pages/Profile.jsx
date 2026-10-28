import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Edit, MapPin, Calendar, Award, Users, Target } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProgressRing from '../components/ProgressRing';
import { users, submissions, feed } from '../services/api';

const Profile = ({ user, setUser }) => {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    year: ''
  });

  const isOwnProfile = !userId || userId === user._id;

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    try {
      const targetUserId = userId || user._id;
      
      const [userRes, postsRes, submissionsRes] = await Promise.all([
        isOwnProfile ? Promise.resolve({ data: { user } }) : users.getById(targetUserId),
        feed.getPosts({ filter_by: { student_id: targetUserId } }),
        submissions.getByStudent(targetUserId)
      ]);

      setProfileUser(userRes.data.user);
      setUserPosts(postsRes.data.posts);
      setUserSubmissions(submissionsRes.data.submissions);
      
      if (isOwnProfile) {
        setEditForm({
          name: user.name,
          department: user.department || '',
          year: user.year || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key]) formData.append(key, editForm[key]);
      });

      const response = await users.updateProfile(formData);
      setUser(response.data.user);
      setProfileUser(response.data.user);
      setEditing(false);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await users.updateProfile(formData);
      setUser(response.data.user);
      setProfileUser(response.data.user);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update avatar');
    }
  };

  const getBadgeProgress = (points) => {
    const tiers = [
      { name: 'Green Beginner', emoji: '🌱', min_points: 0 },
      { name: 'Eco Learner', emoji: '🌿', min_points: 100 },
      { name: 'Sustainability Hero', emoji: '🌾', min_points: 500 },
      { name: 'Eco-Champion', emoji: '🌳', min_points: 1500 },
      { name: 'Legend', emoji: '🏅', min_points: 5000 }
    ];

    for (let i = 0; i < tiers.length; i++) {
      if (points < tiers[i].min_points) {
        const prevTier = i > 0 ? tiers[i - 1] : { min_points: 0 };
        const progress = ((points - prevTier.min_points) / (tiers[i].min_points - prevTier.min_points)) * 100;
        return {
          current: prevTier,
          next: tiers[i],
          progress: Math.max(0, Math.min(100, progress))
        };
      }
    }
    return { current: tiers[tiers.length - 1], next: null, progress: 100 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        </div>
      </div>
    );
  }

  const badgeProgress = getBadgeProgress(profileUser.eco_points || 0);
  const verifiedSubmissions = userSubmissions.filter(sub => sub.verification_status === 'verified');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profileUser.avatar_url || `https://ui-avatars.com/api/?name=${profileUser.name}&background=2E7D32&color=fff`}
                alt={profileUser.name}
                className="w-32 h-32 rounded-full border-4 border-primary"
              />
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="input-field text-2xl font-bold"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="input-field"
                    placeholder="Department"
                  />
                  <input
                    type="text"
                    value={editForm.year}
                    onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                    className="input-field"
                    placeholder="Year"
                  />
                  <div className="flex space-x-2">
                    <button type="submit" className="btn-primary">Save</button>
                    <button 
                      type="button" 
                      onClick={() => setEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{profileUser.name}</h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditing(true)}
                        className="p-2 text-gray-500 hover:text-primary transition-colors"
                      >
                        <Edit size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    {profileUser.department && (
                      <div className="flex items-center justify-center md:justify-start space-x-2">
                        <MapPin size={16} />
                        <span>{profileUser.department}</span>
                      </div>
                    )}
                    {profileUser.year && (
                      <div className="flex items-center justify-center md:justify-start space-x-2">
                        <Calendar size={16} />
                        <span>{profileUser.year}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-bold text-primary">
                      {profileUser.eco_points || 0} Eco Points
                    </div>
                    <div className="text-sm text-gray-500">
                      {profileUser.badges?.[profileUser.badges.length - 1] || '🌱 Green Beginner'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{userPosts.length}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{verifiedSubmissions.length}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{profileUser.followers?.length || 0}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Badge Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Badge Progress</h3>
              
              <div className="flex justify-center mb-4">
                <ProgressRing
                  progress={badgeProgress.progress}
                  size={120}
                  color="#2E7D32"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-1">
                      {badgeProgress.current?.emoji || '🌱'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {badgeProgress.next ? `${Math.round(badgeProgress.progress)}%` : 'Max Level'}
                    </div>
                  </div>
                </ProgressRing>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-gray-900 mb-2">
                  {badgeProgress.current?.name || 'Green Beginner'}
                </div>
                {badgeProgress.next && (
                  <div className="text-sm text-gray-500">
                    {badgeProgress.next.min_points - (profileUser.eco_points || 0)} points to {badgeProgress.next.emoji} {badgeProgress.next.name}
                  </div>
                )}
              </div>
            </div>

            {/* Badges Collection */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges Earned</h3>
              <div className="grid grid-cols-2 gap-3">
                {profileUser.badges?.map((badge, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">{badge.split(' ')[0]}</div>
                    <div className="text-xs text-gray-600">{badge.substring(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="text-primary" size={16} />
                    <span className="text-gray-600">Challenges Completed</span>
                  </div>
                  <span className="font-semibold">{verifiedSubmissions.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="text-primary" size={16} />
                    <span className="text-gray-600">Total Points</span>
                  </div>
                  <span className="font-semibold">{profileUser.eco_points || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="text-primary" size={16} />
                    <span className="text-gray-600">Social Posts</span>
                  </div>
                  <span className="font-semibold">{userPosts.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              
              <div className="space-y-6">
                {/* Recent Posts */}
                {userPosts.slice(0, 3).map(post => (
                  <div key={post._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <img
                        src={profileUser.avatar_url || `https://ui-avatars.com/api/?name=${profileUser.name}&background=2E7D32&color=fff`}
                        alt={profileUser.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{profileUser.name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                          {post.post_type === 'challenge_completion' && (
                            <span className="bg-primary text-white px-2 py-1 rounded-full text-xs">
                              Challenge Complete
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800">{post.content}</p>
                        {post.media_url && (
                          <img
                            src={post.media_url}
                            alt="Post media"
                            className="mt-2 rounded-lg max-w-full h-48 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Recent Submissions */}
                {verifiedSubmissions.slice(0, 3).map(submission => (
                  <div key={submission._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Award className="text-green-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Challenge Completed</div>
                        <div className="text-sm text-gray-500">
                          {new Date(submission.verified_at).toLocaleDateString()}
                        </div>
                        {submission.caption && (
                          <p className="text-gray-600 mt-1">{submission.caption}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {userPosts.length === 0 && verifiedSubmissions.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🌱</div>
                    <p className="text-gray-500">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
