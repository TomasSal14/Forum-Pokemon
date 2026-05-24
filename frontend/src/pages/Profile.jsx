import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { API_BASE } from '../utils/api';

function Profile({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE}/users/${currentUser.id}/?user_id=${currentUser.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const data = await response.json();
        setDeleteError(data.error || 'Error deleting account.');
        return;
      }
      onLogout();
      navigate('/');
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

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

        <hr className="form-card-divider" />

        {!confirmDelete ? (
          <button
            type="button"
            className="poll-submit-button"
            style={{ background: '#cc2222', marginTop: '5px' }}
            onClick={() => setConfirmDelete(true)}
          >
            Delete Account
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#ff4444', fontSize: '13px', margin: 0 }}>
              Are you sure? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="poll-submit-button"
                style={{ background: '#cc2222', flex: 1 }}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                type="button"
                className="refresh-button"
                style={{ flex: 1 }}
                onClick={() => { setConfirmDelete(false); setDeleteError(''); }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
            {deleteError && <p className="form-error">{deleteError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
