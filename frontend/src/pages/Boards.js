import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import './Home.css';
import { renderUsername } from '../utils/userUtils';
import UserProfileModal from '../components/UserProfileModal';

const API_BASE = 'http://127.0.0.1:8000/api';
const BOARD_COLORS = ['#ff0055', '#00d2ff', '#00ff66', '#2979ff', '#d500f9'];

function Boards({ currentUser }) {
  const { id } = useParams();
  const location = useLocation(); // Captures state sent from other pages

  // 1. State starts empty ([]) instead of hardcoded fake data
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  
  
  useEffect(() => {
    async function loadBoards() {
      try {
        const url = currentUser 
          ? `${API_BASE}/boards/?user_id=${currentUser.id}`
          : `${API_BASE}/boards/`;
        const response = await fetch(url);
        const data = await response.json();
        
        setBoards(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading boards from API:', error);
        setLoading(false);
      }
    }

    loadBoards();
  }, [currentUser]);

  const boardIdAtivo = id ? parseInt(id) : 1;
  const boardAtual = boards.find(b => b.id === boardIdAtivo) || { name: "LOADING..." };
  const boardById = boards.reduce((acc, board, index) => {
    acc[board.id] = {
      name: board.name,
      color: BOARD_COLORS[index % BOARD_COLORS.length]
    };
    return acc;
  }, {});

  const [selectedPost, setSelectedPost] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [showBoardCreator, setShowBoardCreator] = useState(false);
  const [boardCreating, setBoardCreating] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [newBoardPublic, setNewBoardPublic] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [showMemberAdder, setShowMemberAdder] = useState(false);
  const [memberAdding, setMemberAdding] = useState(false);
  const [boardMembers, setBoardMembers] = useState([]);
  const [boardMembersLoading, setBoardMembersLoading] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postCreating, setPostCreating] = useState(false);
  const [postError, setPostError] = useState('');
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userContent, setUserContent] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  useEffect(() => {
    async function loadPosts() {
      try {
        setPostsLoading(true);
        const response = await fetch(`${API_BASE}/boards/${boardIdAtivo}/posts/`);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error loading posts from API:', error);
      } finally {
        setPostsLoading(false);
      }
    }

    loadPosts();
    setSelectedPost(null);
  }, [boardIdAtivo]);

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
        const response = await fetch(`${API_BASE}/boards/${boardIdAtivo}/members/`);
        const data = await response.json();
        setBoardMembers(data);
      } catch (error) {
        console.error('Error loading board members:', error);
      } finally {
        setBoardMembersLoading(false);
      }
    }

    loadBoardMembers();
  }, [boardIdAtivo]);

  // Effect to automatically open modal when post is triggered from Home page
  useEffect(() => {
    if (location.state && location.state.openPostId) {
      const postToOpen = posts.find(p => p.id === location.state.openPostId);
      if (postToOpen) {
        setSelectedPost(postToOpen);
      }
    }
  }, [location, posts]);

  useEffect(() => {
    async function loadComments() {
      if (!selectedPost) {
        setComments([]);
        return;
      }

      try {
        setCommentsLoading(true);
        const response = await fetch(`${API_BASE}/posts/${selectedPost.id}/comments/`);
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    }

    loadComments();
  }, [selectedPost]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setBoardError('');
    if (!newBoardName.trim()) return; // No description in Django, validate only name

    if (!currentUser) {
      setBoardError('Login to create a board.');
      return;
    }

    try {
      setBoardCreating(true);
      const response = await fetch(`${API_BASE}/boards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBoardName, // Original text without forced Caps Lock
          creator: currentUser.id,
          public: newBoardPublic
        })
      });

      if (response.ok) {
        const newBoardFromDjango = await response.json();
        
        // Formats object to maintain compatibility with HTML
        setBoards([...boards, newBoardFromDjango]);
        setNewBoardName('');
        setNewBoardPublic(true);
        setShowBoardCreator(false);
      } else {
        console.error("The Django server rejected the creation. Status:", response.status);
      }
    } catch (error) {
      console.error("Fatal error communicating with API:", error.message);
    } finally {
      setBoardCreating(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setMemberError('');
    setMemberSuccess('');

    if (!currentUser) {
      setMemberError('Login to add members.');
      return;
    }

    if (!selectedMemberId) {
      setMemberError('Select a user.');
      return;
    }

    try {
      setMemberAdding(true);
      const response = await fetch(`${API_BASE}/boards/${boardIdAtivo}/members/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId: parseInt(selectedMemberId, 10)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setMemberError(data.error || 'Error adding member.');
        return;
      }

      setMemberSuccess('Member added.');
      setSelectedMemberId('');
      setShowMemberAdder(false);
      // Refresh board members list
      const membersResponse = await fetch(`${API_BASE}/boards/${boardIdAtivo}/members/`);
      const membersData = await membersResponse.json();
      setBoardMembers(membersData);
    } catch (error) {
      setMemberError('Network error adding member.');
    } finally {
      setMemberAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/boards/${boardIdAtivo}/members/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId: userId
        })
      });

      if (!response.ok) {
        return;
      }

      // Refresh board members list
      setBoardMembers((prev) => prev.filter((member) => member.id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleOpenUserProfile = async (userId, username) => {
    setSelectedUserProfile({ id: userId, username: username });
    setDirectMessage('');
    setMessageError('');
    setMessageSuccess('');
    // Load user content for the modal
    try {
      const resp = await fetch(`${API_BASE}/users/${userId}/content/`);
      if (resp.ok) {
        const data = await resp.json();
        setUserContent(data);
      } else {
        setUserContent(null);
      }
    } catch (err) {
      setUserContent(null);
    }
  };

  const handleBanUser = async (userId, userState) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/ban/?admin_id=${currentUser.id}&admin_profile=${currentUser.profile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: userState === 'banned' ? 'unban' : 'ban' })
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedUserProfile(data);
        setUsers(users.map(u => u.id === data.id ? data : u));
        setBoardMembers(boardMembers.map(m => m.id === data.id ? data : m));
      }
    } catch (err) {
      console.error('Error banning user:', err);
    }
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
      return;
    }

    if (!directMessage.trim()) {
      setMessageError('Write a message.');
      return;
    }

    try {
      setMessageSending(true);
      const response = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_sent_it: currentUser.id,
          user_receiver: selectedUserProfile.id,
          content: directMessage
        })
      });

      if (!response.ok) {
        setMessageError('Error sending message.');
        return;
      }

      setMessageSuccess('Message sent!');
      setDirectMessage('');
      setTimeout(() => setSelectedUserProfile(null), 1500);
    } catch (error) {
      setMessageError('Network error sending message.');
    } finally {
      setMessageSending(false);
    }
  };

  const handleDeleteBoard = async (event, boardId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/boards/${boardId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        return;
      }

      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleDeletePost = async (event, postId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        return;
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteComment = async (event, commentId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        return;
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const redditCommentStyle = {
    borderLeft: '2px solid #221834', paddingLeft: '16px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px'
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    setCommentError('');

    if (!currentUser) {
      setCommentError('Login to comment.');
      return;
    }

    if (!commentText.trim() || !selectedPost) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${selectedPost.id}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser.id,
          post: selectedPost.id,
          board: selectedPost.board,
          content: commentText,
          parent_comment: replyToCommentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCommentError('Error sending comment.');
        return;
      }

      setComments([...comments, data]);
      setCommentText('');
      setReplyToCommentId(null);
    } catch (error) {
      setCommentError('Network error sending comment.');
    }
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setPostError('');

    if (!currentUser) {
      setPostError('Login to create a post.');
      return;
    }

    const trimmed = postContent.trim();
    if (!trimmed) {
      setPostError('Post content is required.');
      return;
    }

    try {
      setPostCreating(true);
      const response = await fetch(`${API_BASE}/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: currentUser.id,
          board: boardIdAtivo,
          content: trimmed
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setPostError('Error creating post.');
        return;
      }

      setPosts([data, ...posts]);
      setPostContent('');
      setShowPostCreator(false);
    } catch (error) {
      setPostError('Network error creating post.');
    } finally {
      setPostCreating(false);
    }
  };

  return (
    <div className="home-layout-grid" style={{ position: 'relative' }}>
      
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
                onClick={() => setShowBoardCreator((prev) => !prev)}
                disabled={!currentUser}
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
                  onChange={(event) => setNewBoardName(event.target.value)}
                  className="home-search-input"
                  style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                  disabled={!currentUser || boardCreating}
                />
                <label className="poll-radio-option" style={{ marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={!newBoardPublic}
                    onChange={() => setNewBoardPublic((prev) => !prev)}
                    disabled={!currentUser || boardCreating}
                  />
                  <span className="option-text">Private board</span>
                </label>
                <button
                  type="submit"
                  className="poll-submit-button"
                  style={{ width: '100%' }}
                  disabled={!currentUser || boardCreating}
                >
                  {boardCreating ? 'Creating...' : 'Create board'}
                </button>
                {boardError && (
                  <p style={{ fontSize: '11px', color: '#ff6b6b', margin: 0 }}>{boardError}</p>
                )}
              </form>
            )}
          </div>
        )}

        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {boards.map(b => (
            <Link 
              to={`/boards/${b.id}`} 
              key={b.id} 
              className={b.id === boardIdAtivo ? "board-box active" : "board-box"} 
              style={{ textDecoration: 'none', width: '100%', flex: 'none', height: 'auto', minHeight: '75px', padding: '15px 18px', cursor: 'pointer' }}
            >
              <div className="board-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <h3 style={{ margin: 0 }}>{b.name}</h3>
                  {currentUser && (b.creator === currentUser.id || currentUser.profile === 'mod' || currentUser.profile === 'admin') && (
                    <button
                      type="button"
                      className="refresh-button"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                      onClick={(event) => handleDeleteBoard(event, b.id)}
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

      <div style={{ flex: '2', minWidth: '0' }}>
        <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>POSTS IN {boardAtual ? boardAtual.name : "FORUM"}</h2>
          <Link to="/" className="refresh-button" style={{ textDecoration: 'none', fontSize: '11px' }}>Back to Home</Link>
        </div>

        {currentUser && boardAtual && boardAtual.creator === currentUser.id && !boardAtual.public && (
          <div className="polls-box-placeholder" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p className="poll-question" style={{ margin: 0 }}>Add member</p>
              <button
                type="button"
                className="poll-submit-button"
                style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => setShowMemberAdder((prev) => !prev)}
                disabled={!currentUser || usersLoading}
              >
                {showMemberAdder ? 'Close' : 'Add member'}
              </button>
            </div>

            {showMemberAdder && (
              <form onSubmit={handleAddMember} className="poll-voting-form" style={{ width: '100%', marginTop: '15px' }}>
                <select
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  className="home-search-input"
                  style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                  disabled={usersLoading || memberAdding || !currentUser}
                >
                  <option value="">Select user</option>
                  {users.filter(user => !boardMembers.find(member => member.id === user.id)).map((user) => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="poll-submit-button"
                  style={{ width: '100%' }}
                  disabled={!currentUser || memberAdding || usersLoading}
                >
                  {memberAdding ? 'Adding...' : 'Add member'}
                </button>
                {memberError && (
                  <p style={{ fontSize: '11px', color: '#ff6b6b', margin: 0 }}>{memberError}</p>
                )}
                {memberSuccess && (
                  <p style={{ fontSize: '11px', color: '#00ff66', margin: 0 }}>{memberSuccess}</p>
                )}
              </form>
            )}

            {!showMemberAdder && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '11px', color: '#888896', margin: 0 }}>Members ({boardMembers.length})</p>
                {boardMembersLoading ? (
                  <p style={{ fontSize: '11px', color: '#888896', margin: 0 }}>Loading members...</p>
                ) : boardMembers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {boardMembers.map((member) => (
                      <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '6px 8px', background: '#1a122c', border: '1px solid #221834', borderRadius: '3px' }}>
                        {renderUsername(member.id, member.username, handleOpenUserProfile)}
                        <button
                          type="button"
                          className="refresh-button"
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(member.id);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: '#555566', margin: 0 }}>No members yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {currentUser && (
          <div className="polls-box-placeholder" style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p className="poll-question" style={{ margin: 0 }}>Create Post</p>
              <button
                type="button"
                className="poll-submit-button"
                style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => setShowPostCreator((prev) => !prev)}
                disabled={!currentUser}
              >
                {showPostCreator ? 'Close' : 'Add post'}
              </button>
            </div>

            {showPostCreator && (
              <form onSubmit={handleCreatePost} className="poll-voting-form" style={{ width: '100%', marginTop: '15px' }}>
                <textarea
                  placeholder="Write your post..."
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  className="home-search-input"
                  style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box', minHeight: '90px', resize: 'vertical' }}
                  disabled={!currentUser || postCreating}
                />
                <button
                  type="submit"
                  className="poll-submit-button"
                  style={{ width: '100%' }}
                  disabled={!currentUser || postCreating}
                >
                  {postCreating ? 'Creating...' : 'Create post'}
                </button>
                {postError && (
                  <p style={{ fontSize: '11px', color: '#ff6b6b', margin: 0 }}>{postError}</p>
                )}
              </form>
            )}
          </div>
        )}

        <div className="posts-list-container">
          {postsLoading ? (
            <p style={{ color: '#888896', fontSize: '13px', padding: '20px' }}>A carregar posts...</p>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <div key={post.id} className="post-list-item" onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="post-main-info">
                  <span className="post-board-tag" style={{ color: boardById[post.board]?.color || BOARD_COLORS[0], borderColor: boardById[post.board]?.color || BOARD_COLORS[0] }}>
                    {boardById[post.board]?.name || `Board ${post.board}`}
                  </span>
                  <h3 className="post-title">{post.content}</h3>
                  <p className="post-meta">
                    Posted by {renderUsername(post.creator, post.creator_username || `User ${post.creator}`, handleOpenUserProfile, 'post-author')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                  <div className="post-stats">
                    <span>💬 0</span>
                  </div>
                  {currentUser && (post.creator === currentUser.id || currentUser.profile === 'mod' || currentUser.profile === 'admin') && (
                    <button
                      type="button"
                      className="refresh-button"
                      style={{ padding: '2px 8px', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={(event) => handleDeletePost(event, post.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#888896', fontSize: '13px', padding: '20px', background: '#110c1c', border: '1px solid #221834', textAlign: 'center' }}>
              No posts found in this category yet. Click "Back to Home" to view other active threads!
            </p>
          )}
        </div>
      </div>


      {selectedPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(5, 3, 10, 0.9)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 9999, padding: '20px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#110c1c', border: '1px solid #221834', width: '100%', maxWidth: '680px',
            padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <span className="post-board-tag" style={{ color: boardById[selectedPost.board]?.color || BOARD_COLORS[0], borderColor: boardById[selectedPost.board]?.color || BOARD_COLORS[0], fontSize: '10px' }}>
                  {boardById[selectedPost.board]?.name || `Board ${selectedPost.board}`}
                </span>
                <h2 style={{ color: '#ffffff', fontSize: '17px', margin: '10px 0 5px 0', lineHeight: '1.4' }}>{selectedPost.content}</h2>
                <p className="post-meta">
                  Posted by {renderUsername(selectedPost.creator, selectedPost.creator_username || `User ${selectedPost.creator}`, handleOpenUserProfile, 'post-author')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                {currentUser && (selectedPost.creator === currentUser.id || currentUser.profile === 'mod' || currentUser.profile === 'admin') && (
                  <button
                    type="button"
                    className="refresh-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(e, selectedPost.id);
                    }}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                )}
                <button className="refresh-button" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPost(null);
                }} style={{ padding: '5px 10px', fontSize: '12px' }}>Close</button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #221834', margin: 0 }} />

            <div>
              <h3 style={{ color: '#00f0ff', fontSize: '12px', letterSpacing: '1px', margin: '0 0 15px 0' }}>
                DISCUSSION THREAD ({comments.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {commentsLoading ? (
                  <p style={{ color: '#555566', fontSize: '13px' }}>A carregar comentarios...</p>
                ) : comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', marginLeft: comment.parent_comment ? '18px' : 0 }}>
                      <div style={{ paddingLeft: '4px' }}>
                        <p style={{ fontSize: '12px', color: '#666677', margin: '0 0 4px 0' }}>
                          {renderUsername(comment.user, comment.user_username || `User ${comment.user}`, handleOpenUserProfile)}
                          {' • '}
                          {comment.creation_date}
                          {comment.parent_comment ? ` • reply to ${comment.parent_comment}` : ''}
                        </p>
                        <p style={{ fontSize: '13px', color: '#ffffff', margin: 0, lineHeight: '1.4' }}>{comment.content}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="refresh-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyToCommentId(comment.id);
                            }}
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                          >
                            Reply
                          </button>
                          {currentUser && (comment.user === currentUser.id || currentUser.profile === 'mod' || currentUser.profile === 'admin') && (
                            <button
                              type="button"
                              className="refresh-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComment(e, comment.id);
                              }}
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

            <hr style={{ border: 'none', borderTop: '1px solid #221834', margin: 0 }} />

            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              {replyToCommentId && (
                <div style={{ fontSize: '11px', color: '#888896' }}>
                  Replying to comment #{replyToCommentId}
                  <button
                    type="button"
                    className="refresh-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyToCommentId(null);
                    }}
                    style={{ padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder={currentUser ? "Write a comment..." : "Login para comentar"}
                className="home-search-input"
                style={{ background: '#110c1c', border: '1px solid #221834', padding: '10px 15px' }}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                disabled={!currentUser}
              />
              <button className="refresh-button" disabled={!currentUser}>Post</button>
              </div>
            </form>
            {commentError && <p style={{ color: '#ff6b6b', fontSize: '12px', margin: 0 }}>{commentError}</p>}
          </div>
        </div>
      )}

      {selectedUserProfile && (
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
        />
      )}

    </div>
  );
}

export default Boards;