import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science Engineering',
    year: '3rd Year'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleLogin = async (role) => {
    setLoading(true);
    setError('');

    try {
      // Create a user with any email for demo purposes
      const demoUser = {
        name: role === 'student' ? 'Demo Student' : 'Demo Admin',
        email: formData.email || `demo.${role}@college.edu`,
        password: 'demo123',
        role: role,
        department: role === 'student' ? 'Computer Science Engineering' : 'Administration',
        year: role === 'student' ? '3rd Year' : 'Faculty'
      };

      // Try to register first, then login
      const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoUser)
      });

      let loginData;
      if (registerResponse.ok) {
        loginData = await registerResponse.json();
      } else {
        // If registration fails (user exists), try login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: demoUser.email, 
            password: demoUser.password 
          })
        });
        
        if (loginResponse.ok) {
          loginData = await loginResponse.json();
        } else {
          // If both fail, create a mock user for demo
          loginData = {
            token: 'demo-token-' + Date.now(),
            user: {
              _id: 'demo-' + role + '-' + Date.now(),
              ...demoUser,
              eco_points: role === 'student' ? 250 : 1000,
              badges: role === 'student' ? ['🌱 Green Beginner', '🌿 Eco Learner'] : ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero']
            }
          };
        }
      }
      
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        onLogin(loginData.user);
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError('Connection failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2E7D32', fontSize: '32px', margin: '0 0 10px 0' }}>🌿 Windsurf</h1>
          <p style={{ color: '#666', margin: 0 }}>Campus Sustainability Platform</p>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '15px' }}>Choose Your Role</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => handleRoleLogin('student')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '20px',
                border: '2px solid #2E7D32',
                borderRadius: '10px',
                backgroundColor: 'white',
                color: '#2E7D32',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#2E7D32';
                  e.target.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#2E7D32';
                }
              }}
            >
              🎓 Login as Student
            </button>
            <button 
              onClick={() => handleRoleLogin('admin')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '20px',
                border: '2px solid #1976D2',
                borderRadius: '10px',
                backgroundColor: 'white',
                color: '#1976D2',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#1976D2';
                  e.target.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#1976D2';
                }
              }}
            >
              👨‍💼 Login as Admin
            </button>
          </div>
        </div>

        {/* Optional Email Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Optional: Enter your email (any email works)"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
            Leave blank to use default demo account
          </p>
        </div>

        {error && (
          <div style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginTop: '15px',
            fontSize: '14px'
          }}>
            🌿 Creating your account...
          </div>
        )}

        {/* Info Section */}
        <div style={{ 
          backgroundColor: '#f0f8ff', 
          padding: '15px', 
          borderRadius: '8px', 
          marginTop: '20px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <strong>🌿 Welcome to Windsurf!</strong>
          <div style={{ marginTop: '8px' }}>
            Click any button above to instantly access the platform.<br/>
            No registration required - just choose your role!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
