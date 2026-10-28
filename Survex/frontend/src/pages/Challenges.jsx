import { useState, useEffect } from 'react';

const Challenges = ({ user, onNavigate }) => {
  const [challengeList, setChallengeList] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active',
    category: '',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    category: '',
    description: '',
    points: 50,
    deadline: ''
  });

  const categories = [
    'Waste Management',
    'Green Campus Activities', 
    'Energy Conservation',
    'Water Conservation',
    'Sustainable Mobility',
    'Awareness & Innovation',
    'Community Impact'
  ];

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    filterChallenges();
  }, [challengeList, filters]);

  const loadChallenges = async () => {
    try {
      const response = await challenges.getAll();
      setChallengeList(response.data.challenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterChallenges = () => {
    let filtered = challengeList;

    
    if (filters.status) {
      filtered = filtered.filter(challenge => challenge.status === filters.status);
    }

    
    if (filters.category) {
      filtered = filtered.filter(challenge => challenge.category === filters.category);
    }

    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(challenge => 
        challenge.title.toLowerCase().includes(searchLower) ||
        challenge.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredChallenges(filtered);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      await challenges.create({
        ...newChallenge,
        notify_students: true
      });
      setShowCreateModal(false);
      setNewChallenge({
        title: '',
        category: '',
        description: '',
        points: 50,
        deadline: ''
      });
      loadChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    }
  };

  const handleJoinChallenge = (challengeId) => {
    // Update local state to show joined status
    setChallengeList(prev => 
      prev.map(challenge => 
        challenge._id === challengeId 
          ? { ...challenge, participants: [...(challenge.participants || []), user._id] }
          : challenge
      )
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EcoQuest Challenges</h1>
            <p className="text-gray-600 mt-2">Join challenges and earn points for sustainable actions</p>
          </div>
          
          {(user.role === 'admin' || user.role === 'faculty') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Challenge</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search challenges..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Challenge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.length > 0 ? (
            filteredChallenges.map(challenge => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                onJoin={handleJoinChallenge}
                userRole={user.role}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later for new challenges.</p>
            </div>
          )}
        </div>

        {/* Create Challenge Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Challenge</h2>
                
                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Challenge Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                      className="input-field"
                      placeholder="Enter challenge title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      required
                      value={newChallenge.category}
                      onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      required
                      value={newChallenge.description}
                      onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                      className="input-field"
                      rows={4}
                      placeholder="Describe the challenge and requirements"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Reward
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="500"
                      value={newChallenge.points}
                      onChange={(e) => setNewChallenge({...newChallenge, points: parseInt(e.target.value)})}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={newChallenge.deadline}
                      onChange={(e) => setNewChallenge({...newChallenge, deadline: e.target.value})}
                      className="input-field"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      Create Challenge
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
