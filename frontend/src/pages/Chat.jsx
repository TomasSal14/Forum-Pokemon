import React, { useState, useEffect } from 'react';
import './Chat.css';
import { API_BASE } from '../utils/api';
import ClickableUsername from '../utils/userUtils';
import UserProfileModal from '../components/UserProfileModal';

function Chat({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');

  // User profile modal state
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userContent, setUserContent] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    async function loadUsers() {
      try {
        setUsersLoading(true);
        const response = await fetch(`${API_BASE}/users/`);
        const data = await response.json();
        const otherUsers = data.filter(user => user.id !== currentUser.id);
        setUsers(otherUsers);
        if (!activeUser && otherUsers.length > 0) {
          setActiveUser(otherUsers[0]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setUsersLoading(false);
      }
    }
    loadUsers();
  }, [currentUser, activeUser]);

  const loadMessages = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/messages/?user_id=${currentUser.id}`);
      const messages = await response.json();

      const usernameById = users.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
      }, {});

      const grouped = messages.reduce((acc, msg) => {
        const partnerId = msg.user_sent_it === currentUser.id ? msg.user_receiver : msg.user_sent_it;
        if (!acc[partnerId]) acc[partnerId] = [];
        acc[partnerId].push({
          id: msg.id,
          senderId: msg.user_sent_it,
          sender: msg.user_sent_it === currentUser.id
            ? currentUser.username
            : usernameById[msg.user_sent_it],
          text: msg.content,
          time: msg.creation_date,
        });
        return acc;
      }, {});

      setConversations(grouped);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [currentUser, users]);

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

  const handleSendDirectMessage = async (event) => {
    event.preventDefault();
    setMessageError('');
    setMessageSuccess('');
    if (!directMessage.trim()) { setMessageError('Write a message.'); return; }
    try {
      setMessageSending(true);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeUser) return;
    try {
      const response = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_sent_it: currentUser.id,
          user_receiver: activeUser.id,
          content: inputMessage,
        }),
      });
      if (!response.ok) return;

      const newMessage = {
        id: Date.now(),
        senderId: currentUser.id,
        sender: currentUser.username,
        text: inputMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations(prev => ({
        ...prev,
        [activeUser.id]: [...(prev[activeUser.id] || []), newMessage],
      }));
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sidebarContent = () => {
    if (usersLoading) return <p className="chat-empty-text">Loading...</p>;
    if (!users || users.length === 0) return <p className="chat-empty-text">No users found.</p>;
    return users.map(user => (
      <div
        key={user.id}
        className={`chat-user-item ${activeUser && activeUser.id === user.id ? 'active' : ''}`}
        onClick={() => setActiveUser(user)}
      >
        <span className="status-dot online" />
        <ClickableUsername
          userId={user.id}
          username={user.username}
          onClick={handleOpenUserProfile}
          className="chat-user-name"
        />
      </div>
    ));
  };

  const messagesContent = () => {
    if (!activeUser) return <p className="chat-empty-text">Select a user to view messages.</p>;
    const conversation = conversations[activeUser.id] || [];
    if (conversation.length === 0) return <p className="chat-empty-text">No messages in this conversation.</p>;
    return conversation.map(msg => (
      <div key={msg.id} className={`chat-message-bubble ${msg.senderId === currentUser.id ? 'me' : ''}`}>
        <div className="chat-message-meta">
          <ClickableUsername
            userId={msg.senderId}
            username={msg.sender}
            onClick={handleOpenUserProfile}
            className="chat-message-author"
          />
          <span className="chat-message-time">{msg.time}</span>
        </div>
        <p className="chat-message-text">{msg.text}</p>
      </div>
    ));
  };

  return (
    <div className="chat-layout-container">

      <div className="chat-sidebar-members">
        <h3>USERS</h3>
        <div className="chat-users-list">
          {sidebarContent()}
        </div>
      </div>

      <div className="chat-main-area">
        <div className="chat-header-title">
          <div>
            <h2>Chat with <span>{activeUser ? activeUser.username : '---'}</span></h2>
            <p>Direct messages</p>
          </div>
          <button type="button" className="chat-send-button" onClick={loadMessages} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="chat-messages-log">
          {messagesContent()}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            placeholder={activeUser ? `Send a message to ${activeUser.username}...` : 'Choose a user...'}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            className="chat-input-field"
            disabled={!activeUser}
          />
          <button type="submit" className="chat-send-button" disabled={!activeUser}>Send</button>
        </form>
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

export default Chat;
