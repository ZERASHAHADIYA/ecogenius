import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: ''
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
      background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '20px', 
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#2E7D32', fontSize: '42px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            🌿 Windsurf
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '18px' }}>
            Campus Sustainability Platform
          </p>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ textAlign: 'center', color: '#2E7D32', marginBottom: '20px', fontSize: '20px' }}>
            Choose Your Role
          </h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => handleRoleLogin('student')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '25px 20px',
                border: '3px solid #2E7D32',
                borderRadius: '15px',
                backgroundColor: 'white',
                color: '#2E7D32',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#2E7D32';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#2E7D32';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(46, 125, 50, 0.2)';
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
                padding: '25px 20px',
                border: '3px solid #1976D2',
                borderRadius: '15px',
                backgroundColor: 'white',
                color: '#1976D2',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.2)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#1976D2';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(25, 118, 210, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#1976D2';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(25, 118, 210, 0.2)';
                }
              }}
            >
              👨‍💼 Login as Admin
            </button>
          </div>
        </div>

        {/* Optional Email Input */}
        <div style={{ marginBottom: '25px' }}>
          <input
            type="email"
            placeholder="Optional: Enter your email (any email works)"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid #81C784',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2E7D32'}
            onBlur={(e) => e.target.style.borderColor = '#81C784'}
          />
          <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
            Leave blank to use default demo account
          </p>
        </div>

        {error && (
          <div style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '15px', 
            borderRadius: '10px', 
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            color: '#2E7D32', 
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            🌿 Creating your account...
          </div>
        )}

        {/* Info Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)', 
          padding: '20px', 
          borderRadius: '15px', 
          fontSize: '14px',
          textAlign: 'center',
          border: '2px solid #81C784'
        }}>
          <strong style={{ color: '#2E7D32', fontSize: '16px' }}>🌿 Welcome to Windsurf!</strong>
          <div style={{ marginTop: '10px', color: '#1B5E20', lineHeight: '1.5' }}>
            Click any button above to instantly access the platform.<br/>
            <strong>No registration required</strong> - just choose your role!
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '30px', 
          textAlign: 'center', 
          fontSize: '14px', 
          color: '#666' 
        }}>
          <p style={{ margin: '5px 0' }}>Sri Eshwar College of Engineering</p>
          <p style={{ color: '#2E7D32', fontWeight: 'bold', margin: '5px 0' }}>
            Building a sustainable future together 🌱
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
