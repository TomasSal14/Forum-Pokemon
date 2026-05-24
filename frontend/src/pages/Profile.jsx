import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

function Profile({ currentUser }) {
  // State to hold user data from the backend
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUser() {
      if (!currentUser) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}/`);
        if (!response.ok) {
          setError('Unable to load profile.');
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError('Error fetching user data.');
      }
    }

    loadUser();
  }, [currentUser]);

  // Se o Django ainda não tiver respondido, mostra um aviso para não dar erro de variáveis indefinidas
  if (error) {
    return (
      <div className="home-layout-grid" style={{ width: '100%', color: '#ffffff', padding: '30px' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-layout-grid" style={{ width: '100%', color: '#ffffff', padding: '30px' }}>
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="home-layout-grid" style={{ width: '100%' }}>
      <div style={{ 
        padding: '30px', 
        background: '#110c1c', 
        border: '1px solid #221834', 
        textAlign: 'left', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ color: '#00f0ff', fontSize: '18px', letterSpacing: '1px', margin: '0 0 20px 0' }}>USER PROFILE</h2>
        <hr style={{ border: 'none', borderTop: '1px solid #221834', marginBottom: '20px' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px', color: '#aaaab8' }}>
          {/* Mapeamento das variáveis reais do JSON do Tomás */}
          <p><strong style={{ color: '#ffffff' }}>Username:</strong> {user.username}</p>
          <p><strong style={{ color: '#ffffff' }}>Role:</strong> <span style={{ color: '#00f0ff' }}>{user.profile}</span></p>
          <p><strong style={{ color: '#ffffff' }}>Account State:</strong> <span style={{ color: '#00ff66' }}>{user.state}</span></p>
          <p><strong style={{ color: '#ffffff' }}>Member Since:</strong> {new Date(user.date_joined).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;