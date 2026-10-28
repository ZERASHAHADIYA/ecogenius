import { useState, useEffect } from 'react';

import { Users, Target, CheckCircle, AlertCircle, TrendingUp, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import { analytics, submissions, challenges } from '../services/api';

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState({});
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        analytics.getOverview(),
        submissions.getPending()
      ]);

      setAnalyticsData(analyticsRes.data.analytics);
      setPendingSubmissions(pendingRes.data.submissions);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmission = async (submissionId, approved, comment = '') => {
    try {
      await submissions.verify(submissionId, { approved, comment });
      loadDashboardData(); 
    } catch (error) {
      console.error('Error verifying submission:', error);
    }
  };

  const COLORS = ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7'];

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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage platform activities and analytics</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.users?.total_students || 0}
                </div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.challenges?.active_challenges || 0}
                </div>
                <div className="text-sm text-gray-500">Active Challenges</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <CheckCircle className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.submissions?.verified || 0}
                </div>
                <div className="text-sm text-gray-500">Verified Submissions</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.submissions?.pending || 0}
                </div>
                <div className="text-sm text-gray-500">Pending Reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'submissions', label: 'Pending Submissions' },
            { key: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Department Performance */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Department Performance Chart (Coming Soon)</p>
              </div>
            </div>

            {/* Participation Rate */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participation Overview</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary">
                  {analyticsData.users?.participation_rate || 0}%
                </div>
                <div className="text-gray-500">Overall Participation Rate</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Active Students</span>
                  <span className="font-semibold">{analyticsData.users?.active_students || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Students</span>
                  <span className="font-semibold">{analyticsData.users?.total_students || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {pendingSubmissions.length > 0 ? (
              pendingSubmissions.map(submission => (
                <div key={submission._id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={submission.student?.avatar_url || `https://ui-avatars.com/api/?name=${submission.student?.name}&background=2E7D32&color=fff`}
                          alt={submission.student?.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{submission.student?.name}</div>
                          <div className="text-sm text-gray-500">{submission.student?.department}</div>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{submission.challenge?.title}</h4>
                      {submission.caption && (
                        <p className="text-gray-600 mb-3">{submission.caption}</p>
                      )}
                      
                      {submission.media_url && (
                        <img
                          src={submission.media_url}
                          alt="Submission"
                          className="w-full max-w-md rounded-lg mb-3"
                        />
                      )}
                      
                      <div className="text-sm text-gray-500">
                        Submitted: {new Date(submission.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleVerifySubmission(submission._id, false, 'Please review and resubmit')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleVerifySubmission(submission._id, true, 'Great work!')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-500">No pending submissions to review.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Status</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Submission Status Chart (Coming Soon)</p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Growth</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Total Challenges</div>
                    <div className="text-sm text-gray-500">All time</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {analyticsData.challenges?.total_challenges || 0}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Total Rewards</div>
                    <div className="text-sm text-gray-500">Available</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {analyticsData.rewards?.total_rewards || 0}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Claims Made</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {analyticsData.rewards?.total_claims || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
