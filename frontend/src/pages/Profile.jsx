import React, { useState, useEffect } from 'react';
import './Home.css';
import { API_BASE } from '../utils/api';

function Profile({ currentUser }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}/`);
        if (!response.ok) { setError('Unable to load profile.'); return; }
        setUser(await response.json());
      } catch {
        setError('Error fetching user data.');
      }
    }
    loadUser();
  }, [currentUser]);

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
      <div className="form-card" style={{ maxWidth: '100%' }}>
        <h2 className="form-card-title">USER PROFILE</h2>
        <hr className="form-card-divider" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px', color: '#aaaab8' }}>
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
