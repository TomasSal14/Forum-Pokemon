import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import './Home.css';
import { API_BASE } from '../utils/api';
import { canModerate } from '../utils/permissions';
import ClickableUsername from '../utils/userUtils';
import UserProfileModal from '../components/UserProfileModal';

const BOARD_COLORS = ['#ff0055', '#00d2ff', '#00ff66', '#2979ff', '#d500f9'];

function Boards({ currentUser }) {
  const { id } = useParams();
  const location = useLocation();

  const [boards, setBoards] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);

  // Board creation
  const [newBoardName, setNewBoardName] = useState('');
  const [showBoardCreator, setShowBoardCreator] = useState(false);
  const [boardCreating, setBoardCreating] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [newBoardPublic, setNewBoardPublic] = useState(true);

  // Member management
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [showMemberAdder, setShowMemberAdder] = useState(false);
  const [memberAdding, setMemberAdding] = useState(false);
  const [boardMembers, setBoardMembers] = useState([]);
  const [boardMembersLoading, setBoardMembersLoading] = useState(false);

  // Post creation
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postCreating, setPostCreating] = useState(false);
  const [postError, setPostError] = useState('');

  // User profile modal
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userContent, setUserContent] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  const activeBoardId = id ? parseInt(id) : 1;

  useEffect(() => {
    async function loadBoards() {
      try {
        const url = currentUser
          ? `${API_BASE}/boards/?user_id=${currentUser.id}`
          : `${API_BASE}/boards/`;
        const response = await fetch(url);
        setBoards(await response.json());
      } catch (error) {
        console.error('Error loading boards:', error);
      }
    }
    loadBoards();
  }, [currentUser]);

  useEffect(() => {
    async function loadPosts() {
      try {
        setPostsLoading(true);
        const response = await fetch(`${API_BASE}/boards/${activeBoardId}/posts/`);
        setPosts(await response.json());
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setPostsLoading(false);
      }
    }
    loadPosts();
    setSelectedPost(null);
  }, [activeBoardId]);

  useEffect(() => {
    if (!currentUser) return;
    async function loadUsers() {
      try {
        setUsersLoading(true);
        const response = await fetch(`${API_BASE}/users/`);
        const data = await response.json();
        setUsers(data.filter(user => user.id !== currentUser.id));
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setUsersLoading(false);
      }
    }
    loadUsers();
  }, [currentUser]);

  useEffect(() => {
    async function loadBoardMembers() {
      try {
        setBoardMembersLoading(true);
        const response = await fetch(`${API_BASE}/boards/${activeBoardId}/members/`);
        setBoardMembers(await response.json());
      } catch (error) {
        console.error('Error loading board members:', error);
      } finally {
        setBoardMembersLoading(false);
      }
    }
    loadBoardMembers();
  }, [activeBoardId]);

  // Open post from navigation state (e.g. clicking a post on the Home page)
  useEffect(() => {
    if (location.state && location.state.openPostId) {
      const postToOpen = posts.find(p => p.id === location.state.openPostId);
      if (postToOpen) setSelectedPost(postToOpen);
    }
  }, [location, posts]);

  useEffect(() => {
    async function loadComments() {
      if (!selectedPost) { setComments([]); return; }
      try {
        setCommentsLoading(true);
        const response = await fetch(`${API_BASE}/posts/${selectedPost.id}/comments/`);
        setComments(await response.json());
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    }
    loadComments();
  }, [selectedPost]);

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

  const currentBoard = boards.find(b => b.id === activeBoardId) || { name: 'LOADING...' };
  const boardColorMap = boards.reduce((acc, board, index) => {
    acc[board.id] = { name: board.name, color: BOARD_COLORS[index % BOARD_COLORS.length] };
    return acc;
  }, {});

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setBoardError('');
    if (!newBoardName.trim()) return;
    if (!currentUser) { setBoardError('Login to create a board.'); return; }
    try {
      setBoardCreating(true);
      const response = await fetch(`${API_BASE}/boards/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName, creator: currentUser.id, public: newBoardPublic }),
      });
      if (response.ok) {
        const createdBoard = await response.json();
        setBoards([...boards, createdBoard]);
        setNewBoardName('');
        setNewBoardPublic(true);
        setShowBoardCreator(false);
      }
    } catch (error) {
      console.error('Error creating board:', error);
    } finally {
      setBoardCreating(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setMemberError('');
    setMemberSuccess('');
    if (!currentUser) { setMemberError('Login to add members.'); return; }
    if (!selectedMemberId) { setMemberError('Select a user.'); return; }
    try {
      setMemberAdding(true);
      const response = await fetch(`${API_BASE}/boards/${activeBoardId}/members/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: parseInt(selectedMemberId, 10) }),
      });
      const data = await response.json();
      if (!response.ok) { setMemberError(data.error || 'Error adding member.'); return; }
      setMemberSuccess('Member added.');
      setSelectedMemberId('');
      setShowMemberAdder(false);
      const membersResponse = await fetch(`${API_BASE}/boards/${activeBoardId}/members/`);
      setBoardMembers(await membersResponse.json());
    } catch {
      setMemberError('Network error adding member.');
    } finally {
      setMemberAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/boards/${activeBoardId}/members/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: userId }),
      });
      if (!response.ok) return;
      setBoardMembers(prev => prev.filter(member => member.id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

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
        setBoardMembers(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
      }
    } catch (err) {
      console.error('Error changing role:', err);
    }
  };

  const handleBanUser = async (userId, userState) => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/ban/?admin_id=${currentUser.id}&admin_profile=${currentUser.profile}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: userState === 'banned' ? 'unban' : 'ban' }),
        }
      );
      const updatedUser = await response.json();
      if (response.ok) {
        setSelectedUserProfile(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setBoardMembers(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
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
    if (!selectedUserProfile) return;
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

  const handleDeleteBoard = async (event, boardId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${API_BASE}/boards/${boardId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`,
        { method: 'DELETE' }
      );
      if (!response.ok) return;
      setBoards(prev => prev.filter(board => board.id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleDeletePost = async (event, postId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${API_BASE}/posts/${postId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`,
        { method: 'DELETE' }
      );
      if (!response.ok) return;
      setPosts(prev => prev.filter(post => post.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteComment = async (event, commentId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${API_BASE}/comments/${commentId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`,
        { method: 'DELETE' }
      );
      if (!response.ok) return;
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    setCommentError('');
    if (!commentText.trim() || !selectedPost) return;
    try {
      const response = await fetch(`${API_BASE}/posts/${selectedPost.id}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser ? currentUser.id : null,
          post: selectedPost.id,
          board: selectedPost.board,
          content: commentText,
          parent_comment: replyToCommentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setCommentError('Error sending comment.'); return; }
      setComments([...comments, data]);
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id ? { ...p, comment_count: (p.comment_count ?? 0) + 1 } : p
      ));
      setCommentText('');
      setReplyToCommentId(null);
    } catch {
      setCommentError('Network error sending comment.');
    }
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setPostError('');
    if (!currentUser) { setPostError('Login to create a post.'); return; }
    const trimmedContent = postContent.trim();
    if (!trimmedContent) { setPostError('Post content is required.'); return; }
    try {
      setPostCreating(true);
      const response = await fetch(`${API_BASE}/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: currentUser.id, board: activeBoardId, content: trimmedContent }),
      });
      const data = await response.json();
      if (!response.ok) { setPostError('Error creating post.'); return; }
      setPosts([data, ...posts]);
      setPostContent('');
      setShowPostCreator(false);
    } catch {
      setPostError('Network error creating post.');
    } finally {
      setPostCreating(false);
    }
  };

  return (
    <div className="home-layout-grid" style={{ position: 'relative' }}>

      {/* Left sidebar: board list + board creator */}
      <div style={{ flex: '1', minWidth: '240px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
          <h2>EXPLORE BOARDS</h2>
        </div>

        {currentUser && (
          <div className="polls-box-placeholder" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p className="poll-question" style={{ margin: 0 }}>Create Board</p>
              <button
                type="button"
                className="poll-submit-button"
                style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => setShowBoardCreator(prev => !prev)}
              >
                {showBoardCreator ? 'Close' : 'Add board'}
              </button>
            </div>
            {showBoardCreator && (
              <form onSubmit={handleCreateBoard} className="poll-voting-form" style={{ width: '100%', marginTop: '15px' }}>
                <input
                  type="text"
                  placeholder="Board name"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  className="form-input"
                  disabled={boardCreating}
                />
                <label className="poll-radio-option" style={{ marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={!newBoardPublic}
                    onChange={() => setNewBoardPublic(prev => !prev)}
                    disabled={boardCreating}
                  />
                  <span className="option-text">Private board</span>
                </label>
                <button type="submit" className="poll-submit-button" style={{ width: '100%' }} disabled={boardCreating}>
                  {boardCreating ? 'Creating...' : 'Create board'}
                </button>
                {boardError && <p className="form-error">{boardError}</p>}
              </form>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {boards.map(board => (
            <Link
              to={`/boards/${board.id}`}
              key={board.id}
              className={board.id === activeBoardId ? 'board-box active' : 'board-box'}
              style={{ textDecoration: 'none', width: '100%', flex: 'none', height: 'auto', minHeight: '75px', padding: '15px 18px' }}
            >
              <div className="board-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <h3 style={{ margin: 0 }}>{board.name}</h3>
                  {canModerate(currentUser, board.creator) && (
                    <button
                      type="button"
                      className="refresh-button"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                      onClick={event => handleDeleteBoard(event, board.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Center: post list + post creator + member management */}
      <div style={{ flex: '2', minWidth: '0' }}>
        <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>POSTS IN {currentBoard ? currentBoard.name : 'FORUM'}</h2>
          <Link to="/" className="refresh-button" style={{ textDecoration: 'none', fontSize: '11px' }}>
            Back to Home
          </Link>
        </div>

        {/* Add member panel (private boards only, visible to owner) */}
        {currentUser && currentBoard && currentBoard.creator === currentUser.id && !currentBoard.public && (
          <div className="polls-box-placeholder" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p className="poll-question" style={{ margin: 0 }}>Add member</p>
              <button
                type="button"
                className="poll-submit-button"
                style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => setShowMemberAdder(prev => !prev)}
                disabled={usersLoading}
              >
                {showMemberAdder ? 'Close' : 'Add member'}
              </button>
            </div>

            {showMemberAdder && (
              <form onSubmit={handleAddMember} className="poll-voting-form" style={{ width: '100%', marginTop: '15px' }}>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  className="form-input"
                  disabled={usersLoading || memberAdding}
                >
                  <option value="">Select user</option>
                  {users
                    .filter(user => !boardMembers.find(member => member.id === user.id))
                    .map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                </select>
                <button type="submit" className="poll-submit-button" style={{ width: '100%' }} disabled={memberAdding || usersLoading}>
                  {memberAdding ? 'Adding...' : 'Add member'}
                </button>
                {memberError && <p className="form-error">{memberError}</p>}
                {memberSuccess && <p className="form-success">{memberSuccess}</p>}
              </form>
            )}

            {!showMemberAdder && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p className="chat-empty-text">Members ({boardMembers.length})</p>
                {boardMembersLoading ? (
                  <p className="chat-empty-text">Loading members...</p>
                ) : boardMembers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {boardMembers.map(member => (
                      <div
                        key={member.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '6px 8px', background: '#1a122c', border: '1px solid #221834' }}
                      >
                        <ClickableUsername userId={member.id} username={member.username} onClick={handleOpenUserProfile} />
                        <button
                          type="button"
                          className="refresh-button"
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                          onClick={e => { e.stopPropagation(); handleRemoveMember(member.id); }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="content-empty-text">No members yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create post panel */}
        {currentUser && (
          <div className="polls-box-placeholder" style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p className="poll-question" style={{ margin: 0 }}>Create Post</p>
              <button
                type="button"
                className="poll-submit-button"
                style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => setShowPostCreator(prev => !prev)}
              >
                {showPostCreator ? 'Close' : 'Add post'}
              </button>
            </div>
            {showPostCreator && (
              <form onSubmit={handleCreatePost} className="poll-voting-form" style={{ width: '100%', marginTop: '15px' }}>
                <textarea
                  placeholder="Write your post..."
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '90px', resize: 'vertical' }}
                  disabled={postCreating}
                />
                <button type="submit" className="poll-submit-button" style={{ width: '100%' }} disabled={postCreating}>
                  {postCreating ? 'Creating...' : 'Create post'}
                </button>
                {postError && <p className="form-error">{postError}</p>}
              </form>
            )}
          </div>
        )}

        {/* Post list */}
        <div className="posts-list-container">
          {postsLoading ? (
            <p style={{ color: '#888896', fontSize: '13px', padding: '20px' }}>Loading posts...</p>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <div
                key={post.id}
                className="post-list-item"
                onClick={() => setSelectedPost(post)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div className="post-main-info">
                  <span
                    className="post-board-tag"
                    style={{ color: boardColorMap[post.board]?.color || BOARD_COLORS[0], borderColor: boardColorMap[post.board]?.color || BOARD_COLORS[0] }}
                  >
                    {boardColorMap[post.board]?.name || `Board ${post.board}`}
                  </span>
                  <h3 className="post-title">{post.content}</h3>
                  <p className="post-meta">
                    Posted by{' '}
                    <ClickableUsername
                      userId={post.creator}
                      username={post.creator_username || `User ${post.creator}`}
                      onClick={handleOpenUserProfile}
                      className="post-author"
                    />
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                  <div className="post-stats"><span>💬 {post.comment_count ?? 0}</span></div>
                  {canModerate(currentUser, post.creator) && (
                    <button
                      type="button"
                      className="refresh-button"
                      style={{ padding: '2px 8px', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={event => handleDeletePost(event, post.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#888896', fontSize: '13px', padding: '20px', background: '#110c1c', border: '1px solid #221834', textAlign: 'center' }}>
              No posts found in this board yet.
            </p>
          )}
        </div>
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <span
                  className="post-board-tag"
                  style={{ color: boardColorMap[selectedPost.board]?.color || BOARD_COLORS[0], borderColor: boardColorMap[selectedPost.board]?.color || BOARD_COLORS[0], fontSize: '10px' }}
                >
                  {boardColorMap[selectedPost.board]?.name || `Board ${selectedPost.board}`}
                </span>
                <h2 style={{ color: '#ffffff', fontSize: '17px', margin: '10px 0 5px 0', lineHeight: '1.4' }}>
                  {selectedPost.content}
                </h2>
                <p className="post-meta">
                  Posted by{' '}
                  <ClickableUsername
                    userId={selectedPost.creator}
                    username={selectedPost.creator_username || `User ${selectedPost.creator}`}
                    onClick={handleOpenUserProfile}
                    className="post-author"
                  />
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                {canModerate(currentUser, selectedPost.creator) && (
                  <button
                    type="button"
                    className="refresh-button"
                    onClick={e => { e.stopPropagation(); handleDeletePost(e, selectedPost.id); }}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                )}
                <button
                  className="refresh-button"
                  onClick={e => { e.stopPropagation(); setSelectedPost(null); }}
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  Close
                </button>
              </div>
            </div>

            <hr className="modal-divider" />

            <div>
              <h3 style={{ color: '#00f0ff', fontSize: '12px', letterSpacing: '1px', margin: '0 0 15px 0' }}>
                DISCUSSION THREAD ({comments.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {commentsLoading ? (
                  <p style={{ color: '#555566', fontSize: '13px' }}>Loading comments...</p>
                ) : comments.length > 0 ? (
                  comments.map(comment => (
                    <div
                      key={comment.id}
                      style={{ display: 'flex', flexDirection: 'column', marginLeft: comment.parent_comment ? '18px' : 0 }}
                    >
                      <div style={{ paddingLeft: '4px' }}>
                        <p style={{ fontSize: '12px', color: '#666677', margin: '0 0 4px 0' }}>
                          <ClickableUsername
                            userId={comment.user}
                            username={comment.user_username || 'Anonymous'}
                            onClick={handleOpenUserProfile}
                          />
                          {' • '}
                          {comment.creation_date}
                          {comment.parent_comment ? ` • reply to #${comment.parent_comment}` : ''}
                        </p>
                        <p style={{ fontSize: '13px', color: '#ffffff', margin: 0, lineHeight: '1.4' }}>
                          {comment.content}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="refresh-button"
                            onClick={e => { e.stopPropagation(); setReplyToCommentId(comment.id); }}
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                          >
                            Reply
                          </button>
                          {canModerate(currentUser, comment.user) && (
                            <button
                              type="button"
                              className="refresh-button"
                              onClick={e => { e.stopPropagation(); handleDeleteComment(e, comment.id); }}
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#555566', fontSize: '13px' }}>No comments yet.</p>
                )}
              </div>
            </div>

            <hr className="modal-divider" />

            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              {replyToCommentId && (
                <div style={{ fontSize: '11px', color: '#888896' }}>
                  Replying to comment #{replyToCommentId}
                  <button
                    type="button"
                    className="refresh-button"
                    onClick={e => { e.stopPropagation(); setReplyToCommentId(null); }}
                    style={{ padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder={currentUser ? 'Write a comment...' : 'Write a comment as Anonymous...'}
                  className="home-search-input"
                  style={{ background: '#110c1c', border: '1px solid #221834', padding: '10px 15px' }}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <button className="refresh-button">Post</button>
              </div>
            </form>
            {commentError && <p className="form-error">{commentError}</p>}
          </div>
        </div>
      )}

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

export default Boards;
