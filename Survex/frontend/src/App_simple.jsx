import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌿Platform Test</h1>
      <p>If you can see this, React is working!</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#2E7D32', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Backend Connection Test</h2>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('http://localhost:5000/health');
              const data = await response.json();
              alert(`Backend Status: ${data.status} - ${data.message}`);
            } catch (error) {
              alert(`Backend Error: ${error.message}`);
            }
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#1976D2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Backend
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Login</h2>
        <p>Try these credentials:</p>
        <ul>
          <li><strong>Student:</strong> john.doe@student.college.edu / password123</li>
          <li><strong>Admin:</strong> admin@student.college.edu / admin123</li>
          <li><strong>Faculty:</strong> faculty@student.college.edu / faculty123</li>
        </ul>
        <button 
          onClick={() => {
            window.location.href = 'http://localhost:3000';
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2E7D32', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Full App
        </button>
      </div>
    </div>
  );
}

export default App;
