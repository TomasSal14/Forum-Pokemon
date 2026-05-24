import React, { useState, useEffect } from 'react';
import './Chat.css';
import { API_BASE } from '../utils/api';

function Chat({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');

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

  // Resolved content for the left sidebar
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
        <span className="chat-user-name">{user.username}</span>
      </div>
    ));
  };

  // Resolved content for the messages area
  const messagesContent = () => {
    if (!activeUser) return <p className="chat-empty-text">Select a user to view messages.</p>;
    const conversation = conversations[activeUser.id] || [];
    if (conversation.length === 0) return <p className="chat-empty-text">No messages in this conversation.</p>;
    return conversation.map(msg => (
      <div key={msg.id} className={`chat-message-bubble ${msg.senderId === currentUser.id ? 'me' : ''}`}>
        <div className="chat-message-meta">
          <span className="chat-message-author">{msg.sender}</span>
          <span className="chat-message-time">{msg.time}</span>
        </div>
        <p className="chat-message-text">{msg.text}</p>
      </div>
    ));
  };

  return (
    <div className="chat-layout-container">

      {/* Left sidebar: user list */}
      <div className="chat-sidebar-members">
        <h3>USERS</h3>
        <div className="chat-users-list">
          {sidebarContent()}
        </div>
      </div>

      {/* Right area: active conversation */}
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

    </div>
  );
}

export default Chat;
