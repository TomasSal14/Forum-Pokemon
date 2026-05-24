import React, { useEffect, useState } from 'react';
import './Home.css';
import { API_BASE } from '../utils/api';
import UserProfileModal from '../components/UserProfileModal';

function UserList({ currentUser }) {
  const [users, setUsers] = useState([]);

  // User profile modal state
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userContent, setUserContent] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.profile !== 'admin') return;
    fetch(`${API_BASE}/users/admin/list/?admin_profile=${currentUser.profile}`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error loading users:', err));
  }, [currentUser]);

  useEffect(() => {
    if (!selectedUserProfile || !currentUser || currentUser.profile !== 'admin') {
      setUserContent(null);
      return;
    }
    fetch(`${API_BASE}/users/${selectedUserProfile.id}/content/?admin_id=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setUserContent(data))
      .catch(err => console.error('Error loading user content:', err));
  }, [selectedUserProfile, currentUser]);

  const handleOpenUserProfile = async (userId, username) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUserProfile({ id: userId, username, ...userData });
      } else {
        setSelectedUserProfile({ id: userId, username });
      }
    } catch {
      setSelectedUserProfile({ id: userId, username });
    }
    setDirectMessage('');
    setMessageError('');
    setMessageSuccess('');
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!currentUser || currentUser.profile !== 'admin') return;
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/role/?admin_profile=${currentUser.profile}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (response.ok) {
        const updatedUser = await response.json();
        setSelectedUserProfile(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
    } catch (err) {
      console.error('Error changing role:', err);
    }
  };

  const handleBanUser = async (userId, userState) => {
    if (!currentUser || currentUser.profile !== 'admin') return;
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/ban/?admin_id=${currentUser.id}&admin_profile=${currentUser.profile}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: userState === 'banned' ? 'unban' : 'ban' }),
        }
      );
      if (response.ok) {
        const updatedUser = await response.json();
        setSelectedUserProfile(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  const handleSendDirectMessage = async (event) => {
    event.preventDefault();
    setMessageError('');
    setMessageSuccess('');
    if (!currentUser) { setMessageError('Login to send messages.'); return; }
    if (!directMessage.trim()) { setMessageError('Message cannot be empty.'); return; }
    setMessageSending(true);
    try {
      const response = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_sent_it: currentUser.id,
          user_receiver: selectedUserProfile.id,
          content: directMessage,
        }),
      });
      if (!response.ok) { setMessageError('Error sending message.'); return; }
      setMessageSuccess('Message sent!');
      setDirectMessage('');
      setTimeout(() => setSelectedUserProfile(null), 1500);
    } catch {
      setMessageError('Network error sending message.');
    } finally {
      setMessageSending(false);
    }
  };

  if (!currentUser || currentUser.profile !== 'admin') {
    return <div className="admin-required">Admin access required</div>;
  }

  return (
    <div className="user-list-layout">
      <div className="user-list-column">
        <h2 className="section-header-with-action" style={{ margin: 0 }}>USERS</h2>
        <div className="user-list-items">
          {users.length > 0 ? (
            users.map(user => (
              <div
                key={user.id}
                className="user-list-item"
                onClick={() => handleOpenUserProfile(user.id, user.username)}
              >
                <div>
                  <p className="user-list-name">{user.username}</p>
                  <p className="user-list-meta">{user.profile} • {user.state}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="content-empty-text">No users found</p>
          )}
        </div>
      </div>

      <UserProfileModal
        currentUser={currentUser}
        selectedUserProfile={selectedUserProfile}
        userContent={userContent}
        directMessage={directMessage}
        messageSending={messageSending}
        messageError={messageError}
        messageSuccess={messageSuccess}
        onClose={() => setSelectedUserProfile(null)}
        onSetDirectMessage={setDirectMessage}
        onSendMessage={handleSendDirectMessage}
        onBanUser={handleBanUser}
        onChangeRole={handleChangeRole}
      />
    </div>
  );
}

export default UserList;
