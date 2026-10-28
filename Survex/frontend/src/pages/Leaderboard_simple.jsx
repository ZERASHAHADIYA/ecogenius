import { useState, useEffect } from 'react';

const Leaderboard = ({ user, onNavigate }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🏆 Leaderboard Page</h1>
      <p>Coming soon...</p>
      <button 
        onClick={() => onNavigate('dashboard')}
        style={{ 
          backgroundColor: '#2E7D32', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default Leaderboard;
