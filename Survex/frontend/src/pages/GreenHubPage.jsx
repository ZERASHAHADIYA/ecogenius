import React, { useState, useEffect } from 'react';
import StudentHeaderNav from '../components/StudentHeaderNav';

const GreenHubPage = ({
  user,
  onNavigate,
  onOpenNotifications,
  onLogout,
  onCreatePost,
  posts: propPosts = [],
  onLikePost
}) => {
  const [posts, setPosts] = useState(propPosts);
  const [filterCategory, setFilterCategory] = useState('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedChallengeTag, setSelectedChallengeTag] = useState('Plastic-Free Week Challenge');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const presetImages = [
    { label: '♻️ Waste Sorting', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80' },
    { label: '⚡ Energy Switch Off', url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=500&q=80' },
    { label: '💧 Water Conservation', url: 'https://images.unsplash.com/photo-1584774268784-3c1a83995966?auto=format&fit=crop&w=500&q=80' },
    { label: '🌳 Campus Tree Planting', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=500&q=80' },
    { label: '🚲 Green Commuting', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=500&q=80' }
  ];

  // Static baseline peer posts
  const defaultPosts = [
    {
      _id: 'gh_post_1',
      author: { name: 'Priya Sharma', department: 'Environmental Science' },
      content: 'Just completed the 5-item waste sorting challenge at the central dining hall! Diverted 2.3 kg of organic matter to campus compost and sorted clean paper/metal bins.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      likes: 28,
      likedByUser: false,
      challengeCompleted: 'Waste Segregation Sprint',
      pointsEarned: 50,
      category: 'Waste Management',
      proofImages: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80'],
      comments: [
        { _id: 'c1', author: 'Rahul Kumar', content: 'Great initiative! Are there enough bins on the 2nd floor?' }
      ]
    },
    {
      _id: 'gh_post_2',
      author: { name: 'Arjun Nair', department: 'Electrical Engineering' },
      content: 'Did a dorm power sweep before heading to the lab. Switched off 4 idle monitors, power strips, and corridor lamps. Before-and-after photo submitted for AI verification!',
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      likes: 42,
      likedByUser: false,
      challengeCompleted: 'Electricity Conservation Sweep',
      pointsEarned: 75,
      category: 'Electricity Conservation',
      proofImages: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=500&q=80'],
      comments: [
        { _id: 'c2', author: 'Anita Patel', content: 'Every watt saved adds up across hostel blocks!' }
      ]
    },
    {
      _id: 'gh_post_3',
      author: { name: 'Sneha Reddy', department: 'Civil Engineering' },
      content: 'Reported leaking valve fixture in Mech block 3rd floor washroom with location tag and maintenance photo. Maintenance team confirmed ticket #FAC-8120!',
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      likes: 35,
      likedByUser: false,
      challengeCompleted: 'Water Leak Detection & Report',
      pointsEarned: 60,
      category: 'Water Conservation',
      proofImages: ['https://images.unsplash.com/photo-1584774268784-3c1a83995966?auto=format&fit=crop&w=500&q=80'],
      comments: []
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('greenhub_posts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
          return;
        }
      } catch (e) {}
    }
    setPosts(propPosts.length > 0 ? propPosts : defaultPosts);
  }, [propPosts]);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      alert('Please describe your sustainability achievement.');
      return;
    }

    setIsPosting(true);
    const newPostObj = {
      _id: 'post_' + Date.now(),
      id: 'post_' + Date.now(),
      author: {
        name: user?.name || 'Student Green Warrior',
        department: user?.department || 'Engineering'
      },
      content: newPostContent.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      likedByUser: false,
      challengeCompleted: selectedChallengeTag,
      pointsEarned: 50,
      category: selectedChallengeTag.includes('Water') ? 'Water Conservation' : selectedChallengeTag.includes('Electricity') ? 'Electricity Conservation' : 'Waste Management',
      proofImages: newPostImageUrl ? [newPostImageUrl] : ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80'],
      comments: []
    };

    const updated = [newPostObj, ...posts];
    setPosts(updated);
    localStorage.setItem('greenhub_posts', JSON.stringify(updated));

    if (onCreatePost) onCreatePost(newPostObj);

    setNewPostContent('');
    setNewPostImageUrl('');
    setIsPosting(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleLike = (postId) => {
    const updated = posts.map(p => {
      if (p._id === postId || p.id === postId) {
        const liked = !p.likedByUser;
        return {
          ...p,
          likedByUser: liked,
          likes: liked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 1) - 1)
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem('greenhub_posts', JSON.stringify(updated));
    if (onLikePost) onLikePost(postId);
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const newComment = {
      _id: 'c_' + Date.now(),
      author: user?.name || 'Student',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    const updated = posts.map(p => {
      if (p._id === postId || p.id === postId) {
        return { ...p, comments: [...(p.comments || []), newComment] };
      }
      return p;
    });

    setPosts(updated);
    localStorage.setItem('greenhub_posts', JSON.stringify(updated));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = posts.filter(p => {
    if (filterCategory === 'all') return true;
    const cat = (p.category || p.challengeCompleted || '').toLowerCase();
    return cat.includes(filterCategory.toLowerCase());
  });

  return (
    <div style={{ fontFamily: 'inherit', backgroundColor: '#F4F7F4', minHeight: '100vh' }}>
      {/* Universal Student Navigation */}
      <StudentHeaderNav
        user={user}
        currentPage="greenhub"
        onNavigate={onNavigate}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
      />

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Page Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 6px 20px rgba(46, 125, 50, 0.25)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '26px' }}>🌱</span>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
                GreenHUB Community
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.92, maxWidth: '600px' }}>
              The dedicated student sustainability feed. Celebrate completed challenges, exchange tips, and inspire campus eco-action!
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={() => onNavigate('my-challenges')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.4)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📋 Submit Challenge Proof
            </button>
          </div>
        </div>

        {/* Post Creator Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1.5px solid #C8E6C9',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 14px 0', color: '#1B5E20', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✍️</span> Share Your Eco-Achievement
          </h3>

          <form onSubmit={handleCreatePost}>
            <textarea
              rows={3}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What sustainability milestone did you achieve today? e.g. Turned off lab equipment, sorted cafeteria waste, or planted native flora..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #81C784',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '14px'
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '4px' }}>
                  🎯 Linked Challenge Category
                </label>
                <select
                  value={selectedChallengeTag}
                  onChange={(e) => setSelectedChallengeTag(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #C8E6C9',
                    fontSize: '13px'
                  }}
                >
                  <option value="Plastic-Free Week Challenge">♻️ Plastic-Free Week Challenge</option>
                  <option value="Electricity Conservation Sweep">⚡ Electricity Conservation Sweep</option>
                  <option value="Water Leak Detection & Report">💧 Water Leak Detection & Report</option>
                  <option value="Campus Tree Planting Initiative">🌳 Campus Tree Planting Initiative</option>
                  <option value="E-Waste Segregation Sprint">📱 E-Waste Segregation Sprint</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '4px' }}>
                  🖼️ Select Photo Proof Asset
                </label>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {presetImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewPostImageUrl(img.url)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: newPostImageUrl === img.url ? '2px solid #2E7D32' : '1px solid #E0E0E0',
                        backgroundColor: newPostImageUrl === img.url ? '#E8F5E9' : '#FFFFFF',
                        color: newPostImageUrl === img.url ? '#1B5E20' : '#444',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
              {showSuccessToast && (
                <span style={{ color: '#2E7D32', fontSize: '13px', fontWeight: 'bold' }}>
                  ✓ Published to GreenHUB!
                </span>
              )}
              <button
                type="submit"
                disabled={isPosting}
                style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '25px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)'
                }}
              >
                🚀 Post to GreenHUB
              </button>
            </div>
          </form>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'All Updates' },
            { id: 'waste', label: '♻️ Waste' },
            { id: 'electricity', label: '⚡ Electricity' },
            { id: 'water', label: '💧 Water' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: filterCategory === f.id ? '2px solid #2E7D32' : '1px solid #CFD8DC',
                backgroundColor: filterCategory === f.id ? '#2E7D32' : '#FFFFFF',
                color: filterCategory === f.id ? '#FFFFFF' : '#37474F',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredPosts.map(post => (
            <div
              key={post._id || post.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E0E0E0'
              }}
            >
              {/* Post Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#E8F5E9',
                    color: '#1B5E20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {(post.author?.name || 'S').charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1B5E20', fontSize: '15px' }}>
                      {post.author?.name || 'Student'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#777' }}>
                      {post.author?.department || 'Engineering'} • {new Date(post.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {post.challengeCompleted && (
                  <span style={{
                    backgroundColor: '#E8F5E9',
                    color: '#2E7D32',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '1px solid #C8E6C9'
                  }}>
                    ✅ {post.challengeCompleted} (+{post.pointsEarned || 50} pts)
                  </span>
                )}
              </div>

              {/* Content */}
              <p style={{ margin: '0 0 14px 0', fontSize: '14px', lineHeight: '1.55', color: '#263238' }}>
                {post.content}
              </p>

              {/* Photo Evidence */}
              {post.proofImages && post.proofImages.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <img
                    src={post.proofImages[0]}
                    alt="Proof"
                    style={{
                      width: '100%',
                      maxHeight: '340px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid #ECEFF1'
                    }}
                  />
                </div>
              )}

              {/* Like & Comment Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '10px',
                borderTop: '1px solid #F0F0F0',
                marginBottom: '12px'
              }}>
                <button
                  onClick={() => handleLike(post._id || post.id)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: post.likedByUser ? '#E91E63' : '#546E7A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{post.likedByUser ? '❤️' : '🤍'}</span>
                  <span>{post.likes || 0} Likes</span>
                </button>

                <span style={{ fontSize: '14px', color: '#546E7A' }}>
                  💬 {post.comments?.length || 0} Comments
                </span>
              </div>

              {/* Comments Display */}
              {post.comments && post.comments.length > 0 && (
                <div style={{
                  backgroundColor: '#F9FBF9',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {post.comments.map((c, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#37474F' }}>
                      <strong style={{ color: '#1B5E20' }}>{c.author}:</strong> {c.content}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Cheer on your classmate..."
                  value={commentInputs[post._id || post.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id || post.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(post._id || post.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #CFD8DC',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleAddComment(post._id || post.id)}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GreenHubPage;
