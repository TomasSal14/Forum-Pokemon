import React from 'react';
import './UserProfileModal.css';

function UserProfileModal({
  currentUser,
  selectedUserProfile,
  userContent,
  directMessage,
  messageSending,
  messageError,
  messageSuccess,
  onClose,
  onSetDirectMessage,
  onSendMessage,
  onBanUser,
}) {
  if (!selectedUserProfile) return null;

  const isSelf = currentUser && currentUser.id === selectedUserProfile.id;
  const isAdmin = currentUser && currentUser.profile === 'admin';
  const isBanned = selectedUserProfile.state === 'banned';

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-username">{selectedUserProfile.username}</h2>
            <p className="modal-user-role">Role: {selectedUserProfile.profile}</p>
          </div>
          <button
            className="refresh-button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Close
          </button>
        </div>

        <hr className="modal-divider" />

        {/* Admin: ban/unban button */}
        {isAdmin && !isSelf && (
          <div className="admin-actions">
            <button
              type="button"
              className={`poll-submit-button ${isBanned ? 'ban-button-active' : 'ban-button-inactive'}`}
              onClick={() => onBanUser(selectedUserProfile.id, selectedUserProfile.state)}
            >
              {isBanned ? 'Unban User' : 'Ban User'}
            </button>
          </div>
        )}

        {/* Admin: user content (posts, comments, polls) */}
        {isAdmin && (
          <div className="user-content-section">
            <h3 className="user-content-title">USER CONTENT</h3>

            <ContentSubsection title="Posts" items={userContent?.posts} getLabel={item => item.content} />
            <ContentSubsection title="Comments" items={userContent?.comments} getLabel={item => item.content} />
            <ContentSubsection title="Polls" items={userContent?.polls} getLabel={item => item.name} />
          </div>
        )}

        <hr className="modal-divider" />

        {/* Direct message form */}
        {currentUser ? (
          isSelf ? (
            <p className="modal-note">You cannot message yourself</p>
          ) : (
            <form className="dm-form" onSubmit={onSendMessage}>
              <textarea
                className="dm-textarea"
                placeholder="Write your message..."
                value={directMessage}
                onChange={(e) => onSetDirectMessage(e.target.value)}
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
              {messageError && <p className="form-error">{messageError}</p>}
              {messageSuccess && <p className="form-success">{messageSuccess}</p>}
            </form>
          )
        ) : (
          <p className="modal-note">Register or login to send messages</p>
        )}

      </div>
    </div>
  );
}

function ContentSubsection({ title, items, getLabel }) {
  return (
    <div className="content-subsection">
      <h4 className="content-subsection-title">{title}</h4>
      <div className="content-section-list">
        {items && items.length > 0 ? (
          items.map(item => (
            <div key={item.id} className="content-item-card">
              <p>{getLabel(item)}</p>
              {item.state === 'deleted' && (
                <span className="content-item-deleted">[Deleted]</span>
              )}
            </div>
          ))
        ) : (
          <p className="content-empty-text">No {title.toLowerCase()}</p>
        )}
      </div>
    </div>
  );
}

export default UserProfileModal;
