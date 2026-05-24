import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './Home.css';
import { API_BASE } from '../utils/api';
import BoardsSection from '../components/BoardsSection';
import PostsSection from '../components/PostsSection';
import PollsSection from '../components/PollsSection';
import UserProfileModal from '../components/UserProfileModal';

function Home({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data
  const [boards, setBoards] = useState([]);
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);

  // Poll creation
  const [pollName, setPollName] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollError, setPollError] = useState('');
  const [pollCreating, setPollCreating] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollSelections, setPollSelections] = useState({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // User profile modal
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userContent, setUserContent] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  const refreshPolls = async () => {
    try {
      const pollsUrl = currentUser
        ? `${API_BASE}/polls/?user_id=${currentUser.id}`
        : `${API_BASE}/polls/`;
      const pollsResponse = await fetch(pollsUrl);
      const pollsData = await pollsResponse.json();
      setPolls(pollsData);
      setPollSelections(prev => {
        const next = { ...prev };
        pollsData.forEach(poll => {
          if (!next[poll.id] && poll.options && poll.options.length > 0) {
            next[poll.id] = poll.options[0].id;
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Error loading polls:', error);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const boardsUrl = currentUser
          ? `${API_BASE}/boards/?user_id=${currentUser.id}`
          : `${API_BASE}/boards/`;
        const [boardsResponse, postsResponse] = await Promise.all([
          fetch(boardsUrl),
          fetch(`${API_BASE}/posts/`),
        ]);
        setBoards(await boardsResponse.json());
        setPosts(await postsResponse.json());
        await refreshPolls();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
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
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeletePoll = async (event, pollId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${API_BASE}/polls/${pollId}/?user_id=${currentUser.id}&user_profile=${currentUser.profile}`,
        { method: 'DELETE' }
      );
      if (!response.ok) return;
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
    } catch (error) {
      console.error('Error deleting poll:', error);
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/polls/${pollId}/close/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      if (!response.ok) return;
      await refreshPolls();
    } catch (error) {
      console.error('Error closing poll:', error);
    }
  };

  const handleVote = async (pollId, pollState) => {
    if (pollState !== 'open' || !currentUser) return;
    const selectedOption = pollSelections[pollId];
    if (!selectedOption) return;
    try {
      const response = await fetch(`${API_BASE}/polls/${pollId}/vote/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll: pollId, poll_option: selectedOption, user: currentUser.id }),
      });
      if (!response.ok) return;
      await refreshPolls();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleCreatePoll = async (event) => {
    event.preventDefault();
    setPollError('');
    if (!currentUser) { setPollError('Login to create a poll.'); return; }
    const trimmedName = pollName.trim();
    const validOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
    if (!trimmedName) { setPollError('Poll name is required.'); return; }
    if (validOptions.length < 2) { setPollError('Add at least 2 options.'); return; }
    try {
      setPollCreating(true);
      const response = await fetch(`${API_BASE}/polls/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          creator: currentUser.id,
          options: validOptions.map(label => ({ label })),
        }),
      });
      if (!response.ok) { setPollError('Error creating poll.'); return; }
      setPollName('');
      setPollOptions(['', '']);
      setShowPollCreator(false);
      await refreshPolls();
    } catch {
      setPollError('Network error creating poll.');
    } finally {
      setPollCreating(false);
    }
  };

  const handleAddOption = () => setPollOptions(prev => [...prev, '']);

  const handleOptionChange = (index, value) =>
    setPollOptions(prev => prev.map((opt, i) => (i === index ? value : opt)));

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
    if (!currentUser) { setMessageError('Login to send messages.'); return; }
    if (!selectedUserProfile || !directMessage.trim()) { setMessageError('Write a message.'); return; }
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
      }
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  return (
    <div className="home-layout-grid">
      <div className="left-content-column">
        <div className="home-search-container">
          <span className="home-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search"
            className="home-search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="section-header-with-action" style={{ marginTop: '20px' }}>
          <h2>BOARDS</h2>
        </div>

        <BoardsSection
          boards={boards}
          currentUser={currentUser}
          searchQuery={searchQuery}
          onDeleteBoard={handleDeleteBoard}
        />

        <div className="section-header-with-action" style={{ marginTop: '40px' }}>
          <h2>{id ? 'POSTS' : 'RECENT POSTS'}</h2>
          {id && (
            <Link to="/" className="refresh-button" style={{ textDecoration: 'none', textAlign: 'center' }}>
              View All
            </Link>
          )}
        </div>

        <PostsSection
          posts={posts}
          boards={boards}
          currentUser={currentUser}
          searchQuery={searchQuery}
          id={id}
          onSelectPost={post => navigate(`/boards/${post.board}`, { state: { openPostId: post.id } })}
          onDeletePost={handleDeletePost}
          onOpenUserProfile={handleOpenUserProfile}
        />
      </div>

      <div className="right-sidebar-column">
        <div className="section-header">
          <h2>ACTIVE POLLS</h2>
        </div>

        <PollsSection
          polls={polls}
          currentUser={currentUser}
          pollSelections={pollSelections}
          onVote={handleVote}
          onClosePoll={handleClosePoll}
          onDeletePoll={handleDeletePoll}
          onSelectOption={(pollId, optionId) =>
            setPollSelections(prev => ({ ...prev, [pollId]: optionId }))
          }
          showPollCreator={showPollCreator}
          pollName={pollName}
          pollOptions={pollOptions}
          pollError={pollError}
          pollCreating={pollCreating}
          onPollNameChange={e => setPollName(e.target.value)}
          onOptionChange={handleOptionChange}
          onAddOption={handleAddOption}
          onCreatePoll={handleCreatePoll}
          onTogglePollCreator={() => setShowPollCreator(prev => !prev)}
        />
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
      />
    </div>
  );
}

export default Home;
