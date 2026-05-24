import React from 'react';

export const renderUsername = (userId, username, onClickHandler, className = '') => (
  <span
    onClick={(e) => {
      e.stopPropagation();
      onClickHandler(userId, username);
    }}
    style={{ cursor: 'pointer', color: '#00f0ff', textDecoration: 'underline', fontWeight: 600 }}
    className={className}
  >
    {username}
  </span>
);
