import React, { useState, useEffect } from 'react';
import './Chat.css';

const API_BASE = 'http://127.0.0.1:8000/api';

function Chat({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    async function loadUsers() {
      if (!currentUser) {
        return;
      }

      try {
        setUsersLoading(true);
        const response = await fetch(`${API_BASE}/users/`);
        const data = await response.json();
        const filtered = data.filter((user) => user.id !== currentUser.id);
        setUsers(filtered);
        if (!activeUser && filtered.length > 0) {
          setActiveUser(filtered[0]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setUsersLoading(false);
      }
    }

    loadUsers();
  }, [currentUser]);

  const loadMessages = async () => {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/messages/?user_id=${currentUser.id}`);
      const messages = await response.json();

      const grouped = messages.reduce((acc, msg) => {
        const partnerId = msg.user_sent_it === currentUser.id
          ? msg.user_receiver
          : msg.user_sent_it;

        if (!acc[partnerId]) {
          acc[partnerId] = [];
        }

        acc[partnerId].push({
          id: msg.id,
          senderId: msg.user_sent_it,
          sender: `User ${msg.user_sent_it}`,
          text: msg.content,
          time: msg.creation_date
        });
        return acc;
      }, {});

      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
      }, {});

      const normalized = { ...grouped };
      Object.keys(normalized).forEach((partnerId) => {
        normalized[partnerId] = normalized[partnerId].map((msg) => ({
          ...msg,
          sender: msg.senderId === currentUser.id ? currentUser.username : userMap[msg.senderId]
        }));
      });

      setConversations(normalized);
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
    if (!inputMessage.trim()) return;
    if (!activeUser) return;

    try {
      const response = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_sent_it: currentUser.id,
          user_receiver: activeUser.id,
          content: inputMessage
        })
      });

      if (!response.ok) {
        return;
      }

      const newMessage = {
        id: Date.now(),
        senderId: currentUser.id,
        sender: currentUser.username,
        text: inputMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations({
        ...conversations,
        [activeUser.id]: [...(conversations[activeUser.id] || []), newMessage]
      });

      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-layout-container">
      
      {/* COLUNA ESQUERDA - LISTA DE CONVERSAS PRIVADAS */}
      <div className="chat-sidebar-members">
        <h3>USERS</h3>
        <div className="chat-users-list">
          {(() => {
            if (usersLoading) {
              return <p style={{ color: '#888896', fontSize: '12px', margin: 0 }}>Loading...</p>;
            }
            if (!users || users.length === 0) {
              return <p style={{ color: '#888896', fontSize: '12px', margin: 0 }}>No messages.</p>;
            }
            return users.map(user => (
              <div 
                key={user.id} 
                className={`chat-user-item ${activeUser && activeUser.id === user.id ? 'active' : ''}`}
                onClick={() => setActiveUser(user)}
                style={{ cursor: 'pointer' }}
              >
                <span className="status-dot online"></span>
                <span className="chat-user-name">{user.username}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* COLUNA DIREITA - CONVERSA ATIVA SELECIONADA */}
      <div className="chat-main-area">
        <div className="chat-header-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <h2>Chat with <span>{activeUser ? activeUser.username : '---'}</span></h2>
            <p>Direct messages via API</p>
          </div>
          <button type="button" className="chat-send-button" onClick={loadMessages} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="chat-messages-log">
          {(() => {
            if (!activeUser) {
              return <p style={{ color: '#888896', fontSize: '12px', margin: 0 }}>Select a user to view messages.</p>;
            }
            const conv = conversations[activeUser.id] || [];
            if (conv.length === 0) {
              return <p style={{ color: '#888896', fontSize: '12px', margin: 0 }}>No messages in this conversation.</p>;
            }
            return conv.map(msg => (
              <div key={msg.id} className={`chat-message-bubble ${msg.senderId === currentUser.id ? 'me' : ''}`}>
                <div className="chat-message-meta">
                  <span className="chat-message-author">{msg.sender}</span>
                  <span className="chat-message-time">{msg.time}</span>
                </div>
                <p className="chat-message-text">{msg.text}</p>
              </div>
            ));
          })()}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input 
            type="text" 
            placeholder={activeUser ? `Send a private message to ${activeUser.username}...` : 'Choose a user...'} 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
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