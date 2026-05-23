import React from 'react';
import { renderUsername } from '../utils/userUtils';

const BOARD_COLORS = ['#ff0055', '#00d2ff', '#00ff66', '#2979ff', '#d500f9'];

function PostsSection({ posts, boards, currentUser, searchQuery, id, onSelectPost, onDeletePost, onOpenUserProfile }) {
  const boardById = boards.reduce((acc, board, index) => {
    acc[board.id] = {
      name: board.name,
      color: BOARD_COLORS[index % BOARD_COLORS.length]
    };
    return acc;
  }, {});

  const postsFiltrados = id
    ? posts.filter(post => post.board === parseInt(id))
    : posts;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPosts = normalizedQuery
    ? postsFiltrados.filter(post => post.content.toLowerCase().includes(normalizedQuery))
    : postsFiltrados;

  return (
    <div className="posts-list-container">
      {filteredPosts.length > 0 ? (
        filteredPosts.map(post => (
          <div key={post.id} className="post-list-item" onClick={() => onSelectPost(post)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="post-main-info">
              <span className="post-board-tag" style={{ color: boardById[post.board]?.color || BOARD_COLORS[0], borderColor: boardById[post.board]?.color || BOARD_COLORS[0] }}>
                {boardById[post.board]?.name || `Board ${post.board}`}
              </span>
              <h3 className="post-title">{post.content}</h3>
              <p className="post-meta">
                Posted by {renderUsername(post.creator, post.creator_username || `User ${post.creator}`, onOpenUserProfile, 'post-author')}
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
                  onClick={(event) => onDeletePost(event, post.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: '#888896', fontSize: '13px', padding: '20px', background: '#110c1c', border: '1px solid #221834', textAlign: 'center' }}>
          No posts found. Create one or search for something else!
        </p>
      )}
    </div>
  );
}

export default PostsSection;
