import { useState } from 'react';

export default function Login({ onLogin, onBackToLanding }) {
  const [isRegister, setIsRegister] = useState(false);
  const [roleMode, setRoleMode] = useState('student'); // 'student' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science Engineering',
    year: '3rd Year'
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  // Quick fill helper for convenience
  const handleQuickFill = (type) => {
    setError('');
    if (type === 'student') {
      setRoleMode('student');
      setIsRegister(false);
      setFormData((prev) => ({
        ...prev,
        email: 'john.doe@student.college.edu',
        password: 'password123'
      }));
    } else if (type === 'admin') {
      setRoleMode('admin');
      setIsRegister(false);
      setFormData((prev) => ({
        ...prev,
        email: 'admin@student.college.edu',
        password: 'admin123'
      }));
    } else if (type === 'faculty') {
      setRoleMode('admin');
      setIsRegister(false);
      setFormData((prev) => ({
        ...prev,
        email: 'faculty@student.college.edu',
        password: 'faculty123'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    if (isRegister && !formData.name) {
      setError('Please provide your full name to register.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Registration flow
        const registerPayload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: roleMode,
          department: formData.department,
          year: formData.year
        };

        let regRes;
        try {
          regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerPayload)
          });
        } catch {
          // Offline fallback
        }

        if (regRes && regRes.ok) {
          const regData = await regRes.json();
          // Auto login right after registration so the student is immediately authenticated
          if (regData.token && regData.user) {
            localStorage.setItem('token', regData.token);
            localStorage.setItem('user', JSON.stringify(regData.user));
            
            // Backup in registered_users
            const regUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
            regUsers.push({
              email: formData.email.trim().toLowerCase(),
              password: formData.password,
              user: regData.user
            });
            localStorage.setItem('registered_users', JSON.stringify(regUsers));

            onLogin(regData.user);
            return;
          }

          setSuccessMsg('Account created successfully! Please sign in.');
          setIsRegister(false);
          setLoading(false);
          return;
        } else if (regRes) {
          const errData = await regRes.json().catch(() => ({}));
          const errMsg = errData.error || 'Registration failed.';
          throw new Error(errMsg);
        } else {
          // Offline / Local storage account creation
          const offlineUser = {
            _id: 'user_' + Date.now(),
            name: formData.name,
            email: formData.email.trim().toLowerCase(),
            role: roleMode,
            department: formData.department,
            year: formData.year,
            eco_points: roleMode === 'admin' ? 1000 : 50,
            badges: ['🌱 Green Beginner']
          };
          localStorage.setItem('token', 'offline-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(offlineUser));
          
          const regUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
          regUsers.push({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            user: offlineUser
          });
          localStorage.setItem('registered_users', JSON.stringify(regUsers));

          onLogin(offlineUser);
          return;
        }
      }

      // Login Flow
      let loginRes;
      try {
        loginRes = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password
          })
        });
      } catch {
        // Backend not reachable, fall back to offline verification
      }

      if (loginRes && loginRes.ok) {
        const loginData = await loginRes.json();
        const user = loginData.user;

        // Role-Based Access Control verification!
        if (roleMode === 'admin' && user.role !== 'admin' && user.role !== 'faculty') {
          throw new Error('Access Denied: This account does not possess administrator clearance.');
        }

        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user);
        return;
      } else if (loginRes) {
        const errData = await loginRes.json().catch(() => ({}));
        const rawErr = errData.error || '';
        if (rawErr.toLowerCase().includes('password') || rawErr.toLowerCase().includes('credentials') || rawErr.toLowerCase().includes('failed')) {
          throw new Error('Incorrect email or password. Please verify your credentials.');
        }
        throw new Error(rawErr || 'Invalid email or password.');
      } else {
        // Check registered users from localStorage
        const localRegistered = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const localMatch = localRegistered.find(
          (u) => u.email === formData.email.trim().toLowerCase() && u.password === formData.password
        );
        if (localMatch) {
          if (roleMode === 'admin' && localMatch.user.role !== 'admin') {
            throw new Error('Access Denied: Student accounts cannot access the Administrator portal.');
          }
          localStorage.setItem('token', 'local-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(localMatch.user));
          onLogin(localMatch.user);
          return;
        }
        // Known fallback offline accounts if Flask server is temporarily unreachable
        const fallbackAccounts = [
          {
            email: 'john.doe@student.college.edu',
            password: 'password123',
            role: 'student',
            user: {
              _id: 'user1',
              name: 'John Doe',
              email: 'john.doe@student.college.edu',
              role: 'student',
              department: 'Computer Science Engineering',
              year: '3rd Year',
              eco_points: 250,
              badges: ['🌱 Green Beginner', '🌿 Eco Learner']
            }
          },
          {
            email: 'student@sece.ac.in',
            password: 'password123',
            role: 'student',
            user: {
              _id: 'user1',
              name: 'John Doe',
              email: 'student@sece.ac.in',
              role: 'student',
              department: 'Computer Science Engineering',
              year: '3rd Year',
              eco_points: 250,
              badges: ['🌱 Green Beginner', '🌿 Eco Learner']
            }
          },
          {
            email: 'student@sece.ac.in',
            password: 'student123',
            role: 'student',
            user: {
              _id: 'user1',
              name: 'John Doe',
              email: 'student@sece.ac.in',
              role: 'student',
              department: 'Computer Science Engineering',
              year: '3rd Year',
              eco_points: 250,
              badges: ['🌱 Green Beginner', '🌿 Eco Learner']
            }
          },
          {
            email: 'admin@sece.ac.in',
            password: 'admin123',
            role: 'admin',
            user: {
              _id: 'user2',
              name: 'Dr. Tamilselvan P',
              email: 'admin@sece.ac.in',
              role: 'admin',
              department: 'Administration',
              designation: 'Head of Sustainability',
              eco_points: 1000,
              badges: ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero']
            }
          },
          {
            email: 'admin@student.college.edu',
            password: 'admin123',
            role: 'admin',
            user: {
              _id: 'user2',
              name: 'Dr. Tamilselvan P',
              email: 'admin@student.college.edu',
              role: 'admin',
              department: 'Administration',
              designation: 'Head of Sustainability',
              eco_points: 1000,
              badges: ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero']
            }
          },
          {
            email: 'faculty@student.college.edu',
            password: 'faculty123',
            role: 'admin',
            user: {
              _id: 'user3',
              name: 'Prof. Anitha M',
              email: 'faculty@student.college.edu',
              role: 'admin',
              department: 'Environmental Science',
              designation: 'Faculty Advisor',
              eco_points: 650,
              badges: ['🌱 Green Beginner', '🌿 Eco Learner']
            }
          }
        ];

        const match = fallbackAccounts.find(
          (acc) => acc.email.toLowerCase() === formData.email.trim().toLowerCase()
        );

        if (!match || match.password !== formData.password) {
          throw new Error('Invalid email or password.');
        }

        if (roleMode === 'admin' && match.role !== 'admin') {
          throw new Error('Access Denied: Student accounts cannot access the Administrator portal.');
        }

        const token = 'local-jwt-' + Date.now();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(match.user));
        onLogin(match.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: '20px',
        position: 'relative'
      }}
    >
      {/* Dark Green Ambient Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12, 45, 18, 0.72)',
          backdropFilter: 'blur(4px)',
          zIndex: 1
        }}
      />

      {/* Main Glass Card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.94)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          padding: '36px 32px',
          width: '100%',
          maxWidth: '460px',
          position: 'relative',
          zIndex: 2,
          animation: 'fadeInUp 0.4s ease-out'
        }}
      >
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {onBackToLanding && (
          <div style={{ marginBottom: '14px' }}>
            <button
              type="button"
              onClick={onBackToLanding}
              style={{
                background: 'none',
                border: 'none',
                color: '#2E7D32',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#E8F5E9'
              }}
            >
              <span>←</span>
              <span>Back to EcoGenius Home</span>
            </button>
          </div>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 12px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 10px 20px rgba(46, 125, 50, 0.3)'
            }}
          >
            🌿
          </div>
          <h1
            style={{
              margin: '0 0 4px',
              color: '#1B5E20',
              fontSize: '26px',
              fontWeight: '800',
              letterSpacing: '-0.5px'
            }}
          >
            EcoGenius Platform
          </h1>
          <div style={{ color: '#2E7D32', fontWeight: '600', fontSize: '13px' }}>
            Sri Eshwar College of Engineering
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
            Campus Sustainability & Eco-Impact Network
          </div>
        </div>

        {/* Role Selector Segmented Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F0F4F0',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRoleMode('student');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '9px',
              backgroundColor: roleMode === 'student' ? '#2E7D32' : 'transparent',
              color: roleMode === 'student' ? '#FFFFFF' : '#555',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🎓</span>
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleMode('admin');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '9px',
              backgroundColor: roleMode === 'admin' ? '#1B5E20' : 'transparent',
              color: roleMode === 'admin' ? '#FFFFFF' : '#555',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🛡️</span>
            <span>Admin / Faculty</span>
          </button>
        </div>

        {/* Mode Toggle: Sign In vs Register */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #E0E0E0',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: !isRegister ? '2px solid #2E7D32' : '2px solid transparent',
              color: !isRegister ? '#2E7D32' : '#888',
              fontWeight: !isRegister ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '-2px'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: isRegister ? '2px solid #2E7D32' : '2px solid transparent',
              color: isRegister ? '#2E7D32' : '#888',
              fontWeight: isRegister ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '-2px'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div
            style={{
              backgroundColor: '#FFEBEE',
              border: '1px solid #FFCDD2',
              color: '#C62828',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              backgroundColor: '#E8F5E9',
              border: '1px solid #C8E6C9',
              color: '#2E7D32',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #CFD8DC',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
              College Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={roleMode === 'student' ? 'e.g. john.doe@student.college.edu' : 'e.g. admin@student.college.edu'}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1.5px solid #CFD8DC',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2E7D32',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1.5px solid #CFD8DC',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #CFD8DC',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="Computer Science Engineering">Computer Science Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Environmental Science">Environmental Science</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Administration">Administration / Faculty</option>
                </select>
              </div>

              {roleMode === 'student' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                    Academic Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #CFD8DC',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: roleMode === 'admin' ? '#1B5E20' : '#2E7D32',
              color: 'white',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isRegister ? (
              <span>Create {roleMode === 'admin' ? 'Admin' : 'Student'} Account</span>
            ) : (
              <span>Sign In as {roleMode === 'admin' ? 'Admin' : 'Student'}</span>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill Section */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #EAEAEA' }}>
          <div style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            ⚡ Fast Demo Sign-In Credentials
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #C8E6C9',
                backgroundColor: '#F1F8E9',
                color: '#2E7D32',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>🎓</span>
              <span>Demo Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #FFE082',
                backgroundColor: '#FFF8E1',
                color: '#E65100',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>🛡️</span>
              <span>Demo Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
