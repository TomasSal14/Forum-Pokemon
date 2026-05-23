import React, { useEffect, useState } from 'react';
import './Home.css';
import { renderUsername } from '../utils/userUtils';

const API_BASE = 'http://127.0.0.1:8000/api';

function UserList({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userContent, setUserContent] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.profile !== 'admin') {
      return;
    }

    fetch(`${API_BASE}/users/admin/list/?admin_profile=${currentUser.profile}`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error loading users:', err));
  }, [currentUser]);

  useEffect(() => {
    if (selectedUserProfile && currentUser && currentUser.profile === 'admin') {
      fetch(`${API_BASE}/users/${selectedUserProfile.id}/content/?admin_id=${currentUser.id}`)
        .then(res => res.json())
        .then(data => setUserContent(data))
        .catch(err => console.error('Error loading user content:', err));
    }
  }, [selectedUserProfile, currentUser]);

  const handleOpenUserProfile = async (userId, username) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUserProfile({ id: userId, username: username, ...userData });
      } else {
        setSelectedUserProfile({ id: userId, username: username });
      }
    } catch (err) {
      setSelectedUserProfile({ id: userId, username: username });
    }
    setDirectMessage('');
    setMessageError('');
    setMessageSuccess('');
  };

  const handleSendDirectMessage = async (event) => {
    event.preventDefault();
    setMessageError('');
    setMessageSuccess('');

    if (!currentUser) {
      setMessageError('Login to send messages.');
      return;
    }

    if (!selectedUserProfile) {
      setMessageError('Select a user.');
      return;
    }

    if (!directMessage.trim()) {
      setMessageError('Message cannot be empty.');
      return;
    }

    setMessageSending(true);

    try {
      const response = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_sent_it: currentUser.id,
          user_receiver: selectedUserProfile.id,
          content: directMessage
        })
      });

        if (response.ok) {
        setMessageSuccess('Message sent!');
        setDirectMessage('');
        setTimeout(() => setMessageSuccess(''), 3000);
      } else {
        setMessageError('Error sending message.');
      }
    } catch (error) {
      setMessageError('Error sending message.');
    } finally {
      setMessageSending(false);
    }
  };

  if (!currentUser || currentUser.profile !== 'admin') {
    return (
      <div style={{ padding: '20px', color: '#ff6b6b' }}>
        Admin access required
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: '100vh' }}>
      {/* Users List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ color: '#00f0ff', fontSize: '16px', margin: 0 }}>USERS</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.length > 0 ? (
            users.map(user => (
              <div
                key={user.id}
                onClick={() => handleOpenUserProfile(user.id, user.username)}
                style={{
                  padding: '12px',
                  background: '#110c1c',
                  border: '1px solid #221834',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
              >
                <div>
                  <p style={{ color: '#00f0ff', margin: 0, fontSize: '13px', fontWeight: 'bold' }}>
                    {user.username}
                  </p>
                  <p style={{ color: '#888896', margin: '2px 0 0 0', fontSize: '11px' }}>
                    {user.profile} • {user.state}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#555566', fontSize: '12px' }}>No users found</p>
          )}
        </div>
      </div>

      {/* Selected User Profile Modal */}
      {selectedUserProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(5, 3, 10, 0.9)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 10000, padding: '20px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#110c1c', border: '1px solid #221834', width: '100%', maxWidth: '600px',
            padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: '#ffffff', fontSize: '18px', margin: 0 }}>{selectedUserProfile.username}</h2>
                <p style={{ fontSize: '12px', color: '#888896', margin: '4px 0 0 0' }}>Profile: {selectedUserProfile.profile}</p>
              </div>
              <button className="refresh-button" onClick={(e) => {
                e.stopPropagation();
                setSelectedUserProfile(null);
              }} style={{ padding: '5px 10px', fontSize: '12px' }}>Close</button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #221834', margin: 0 }} />

            {/* Admin Actions */}
            {currentUser && currentUser.profile === 'admin' && currentUser.id !== selectedUserProfile.id && (
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button
                  type="button"
                  className="poll-submit-button"
                  onClick={() => {
                    fetch(`${API_BASE}/users/${selectedUserProfile.id}/ban/?admin_id=${currentUser.id}&admin_profile=${currentUser.profile}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: selectedUserProfile.state === 'banned' ? 'unban' : 'ban' })
                    })
                    .then(res => res.json())
                    .then(data => {
                      setSelectedUserProfile(data);
                      setUsers(users.map(u => u.id === data.id ? data : u));
                    })
                    .catch(err => console.error('Error banning user:', err));
                  }}
                  style={{ background: selectedUserProfile.state === 'banned' ? '#22cc22' : '#cc2222' }}
                >
                  {selectedUserProfile.state === 'banned' ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            )}

            {/* User Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ color: '#00f0ff', fontSize: '12px', letterSpacing: '1px', margin: 0 }}>USER CONTENT</h3>
              
              {/* User's Posts */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '11px', margin: '0 0 8px 0' }}>Posts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {userContent?.posts && userContent.posts.length > 0 ? (
                    userContent.posts.map(post => (
                      <div key={post.id} style={{ padding: '8px', background: '#1a122c', border: '1px solid #221834', fontSize: '11px' }}>
                        <p style={{ color: '#ffffff', margin: '0 0 4px 0' }}>{post.content}</p>
                        {post.state === 'deleted' && <span style={{ color: '#ff6b6b' }}>[Deleted]</span>}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#555566', fontSize: '11px', margin: 0 }}>No posts</p>
                  )}
                </div>
              </div>
              
              {/* User's Comments */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '11px', margin: '0 0 8px 0' }}>Comments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {userContent?.comments && userContent.comments.length > 0 ? (
                    userContent.comments.map(comment => (
                      <div key={comment.id} style={{ padding: '8px', background: '#1a122c', border: '1px solid #221834', fontSize: '11px' }}>
                        <p style={{ color: '#ffffff', margin: '0 0 4px 0' }}>{comment.content}</p>
                        {comment.state === 'deleted' && <span style={{ color: '#ff6b6b' }}>[Deleted]</span>}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#555566', fontSize: '11px', margin: 0 }}>No comments</p>
                  )}
                </div>
              </div>

              {/* User's Polls */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '11px', margin: '0 0 8px 0' }}>Polls</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {userContent?.polls && userContent.polls.length > 0 ? (
                    userContent.polls.map(poll => (
                      <div key={poll.id} style={{ padding: '8px', background: '#1a122c', border: '1px solid #221834', fontSize: '11px' }}>
                        <p style={{ color: '#ffffff', margin: '0 0 4px 0' }}>{poll.name}</p>
                        {poll.state === 'deleted' && <span style={{ color: '#ff6b6b' }}>[Deleted]</span>}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#555566', fontSize: '11px', margin: 0 }}>No polls</p>
                  )}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #221834', margin: 0 }} />

            {/* Direct Message */}
            {currentUser && currentUser.id !== selectedUserProfile.id ? (
              <form onSubmit={handleSendDirectMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  placeholder="Write your message..."
                  value={directMessage}
                  onChange={(event) => setDirectMessage(event.target.value)}
                  className="home-search-input"
                  style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                  disabled={messageSending}
                />
                <button
                  type="submit"
                  className="poll-submit-button"
                  style={{ width: '100%' }}
                  disabled={messageSending}
                >
                  {messageSending ? 'Sending...' : 'Send message'}
                </button>
                {messageError && (
                  <p style={{ fontSize: '11px', color: '#ff6b6b', margin: 0 }}>{messageError}</p>
                )}
                {messageSuccess && (
                  <p style={{ fontSize: '11px', color: '#00ff66', margin: 0 }}>{messageSuccess}</p>
                )}
              </form>
            ) : (
              <p style={{ fontSize: '12px', color: '#888896', margin: 0 }}>You cannot message yourself</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;
