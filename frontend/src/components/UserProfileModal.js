import React, { useState } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

function UserProfileModal({ currentUser, selectedUserProfile, userContent, directMessage, messageSending, messageError, messageSuccess, onClose, onSetDirectMessage, onSendMessage, onBanUser }) {
  if (!selectedUserProfile) return null;

  return (
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
            onClose();
          }} style={{ padding: '5px 10px', fontSize: '12px' }}>Close</button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #221834', margin: 0 }} />

        {/* Admin Actions */}
        {currentUser && currentUser.profile === 'admin' && currentUser.id !== selectedUserProfile.id && (
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <button
              type="button"
              className="poll-submit-button"
              onClick={() => onBanUser(selectedUserProfile.id, selectedUserProfile.state)}
              style={{ background: selectedUserProfile.state === 'banned' ? '#22cc22' : '#cc2222' }}
            >
              {selectedUserProfile.state === 'banned' ? 'Unban User' : 'Ban User'}
            </button>
          </div>
        )}

        {/* User Content */}
        {(currentUser && currentUser.profile === 'admin') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ color: '#00f0ff', fontSize: '12px', letterSpacing: '1px', margin: 0 }}>USER CONTENT</h3>
            
            {/* User's Posts */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '11px', margin: '0 0 8px 0' }}>Posts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
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
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #221834', margin: 0 }} />

        {/* Direct Message */}
        {currentUser ? (
          currentUser.id !== selectedUserProfile.id ? (
            <form onSubmit={onSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              placeholder="Write your message..."
              value={directMessage}
              onChange={(event) => onSetDirectMessage(event.target.value)}
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
          )
        ) : (
          <p style={{ fontSize: '12px', color: '#888896', margin: 0 }}>Register or login to send messages</p>
        )}
      </div>
    </div>
  );
}

export default UserProfileModal;
