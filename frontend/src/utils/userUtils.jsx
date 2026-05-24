import React from 'react';

function ClickableUsername({ userId, username, onClick, className = '' }) {
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
