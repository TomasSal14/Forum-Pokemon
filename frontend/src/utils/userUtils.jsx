import React from 'react';

function ClickableUsername({ userId, username, onClick, className = '' }) {
  if (!userId) {
    return <span className={`anonymous-username ${className}`}>{username}</span>;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(userId, username);
  };

  return (
    <span onClick={handleClick} className={`clickable-username ${className}`}>
      {username}
    </span>
  );
}

export default ClickableUsername;
