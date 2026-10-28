import { useState } from 'react';

const Profile = ({ user, onNavigate, onUpdateUser }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    year: user?.year || '',
    studentId: user?.studentId || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  const handleSave = () => {
    // Update user data
    const updatedUser = { ...user, ...formData };
    onUpdateUser(updatedUser);
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      year: user?.year || '',
      studentId: user?.studentId || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setEditing(false);
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#F5F5F5'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white', 
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(46, 125, 50, 0.4)',
          zIndex: 1
        }}></div>
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '15px',
          padding: '20px',
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 5px 0', 
              fontSize: '32px', 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              👤 My Profile
            </h1>
            <p style={{ 
              margin: 0, 
              opacity: 0.95, 
              fontSize: '16px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              Manage your student information
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div style={{ 
        padding: '40px 20px', 
        maxWidth: '800px', 
        margin: '0 auto' 
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '40px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #81C784'
        }}>
          {/* Profile Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
            paddingBottom: '30px',
            borderBottom: '2px solid #E8F5E8'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              backgroundColor: '#2E7D32',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 auto 20px auto',
              border: '4px solid #81C784'
            }}>
              {(formData.name || 'U').charAt(0).toUpperCase()}
            </div>
            <h2 style={{ 
              color: '#2E7D32', 
              fontSize: '28px', 
              margin: '0 0 10px 0' 
            }}>
              {formData.name || 'Student Name'}
            </h2>
            <p style={{ 
              color: '#666', 
              fontSize: '16px', 
              margin: 0 
            }}>
              {formData.department || 'Department'} • {formData.year || 'Year'}
            </p>
          </div>

          {/* Edit Toggle */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={handleSave}
                  style={{
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
            gap: '20px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#2E7D32' 
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: editing ? 'white' : '#F5F5F5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#2E7D32' 
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: editing ? 'white' : '#F5F5F5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#2E7D32' 
              }}>
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: editing ? 'white' : '#F5F5F5',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Business Administration">Business Administration</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#2E7D32' 
              }}>
                Year of Study
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: editing ? 'white' : '#F5F5F5',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#2E7D32' 
              }}>
                Student ID
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: editing ? 'white' : '#F5F5F5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#2E7D32' 
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: editing ? 'white' : '#F5F5F5',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold', 
              color: '#2E7D32' 
            }}>
              Bio / About Me
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              disabled={!editing}
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: editing ? '2px solid #81C784' : '2px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: editing ? 'white' : '#F5F5F5',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              placeholder="Tell us about yourself, your interests in sustainability..."
            />
          </div>

          {/* Stats Section */}
          <div style={{
            marginTop: '40px',
            paddingTop: '30px',
            borderTop: '2px solid #E8F5E8'
          }}>
            <h3 style={{ 
              color: '#2E7D32', 
              fontSize: '20px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              🏆 Your Achievements
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                backgroundColor: '#E8F5E8',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #81C784'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>
                  {user?.eco_points || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Eco Points</div>
              </div>
              
              <div style={{
                backgroundColor: '#E8F5E8',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #81C784'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>
                  {user?.challenges_completed || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Challenges</div>
              </div>
              
              <div style={{
                backgroundColor: '#E8F5E8',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #81C784'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌱</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>
                  {user?.posts_count || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Posts Shared</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
