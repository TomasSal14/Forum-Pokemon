import React from 'react';

function PollsSection({ polls, currentUser, pollSelections, onVote, onClosePoll, onDeletePoll, onSelectOption, showPollCreator, pollName, pollOptions, pollError, pollCreating, onPollNameChange, onOptionChange, onAddOption, onCreatePoll, onTogglePollCreator }) {
  return (
    <>
      {currentUser && (
        <div className="polls-box-placeholder" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <p className="poll-question" style={{ margin: 0 }}>Create Poll</p>
            <button
              type="button"
              className="poll-submit-button"
              style={{ width: 'auto', padding: '6px 12px' }}
              onClick={onTogglePollCreator}
              disabled={!currentUser}
            >
              {showPollCreator ? 'Close' : 'Add poll'}
            </button>
          </div>

          {showPollCreator && (
            <form onSubmit={onCreatePoll} className="poll-voting-form" style={{ width: '100%', marginTop: '15px' }}>
              <input
                type="text"
                placeholder="Poll name"
                value={pollName}
                onChange={onPollNameChange}
                className="home-search-input"
                style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                disabled={!currentUser || pollCreating}
              />

              {pollOptions.map((option, index) => (
                <input
                  key={`poll-option-${index}`}
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                  className="home-search-input"
                  style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                  disabled={!currentUser || pollCreating}
                />
              ))}

              <button
                type="button"
                className="poll-submit-button"
                style={{ width: '100%' }}
                onClick={onAddOption}
                disabled={!currentUser || pollCreating}
              >
                Add option
              </button>

              <button
                type="submit"
                className="poll-submit-button"
                style={{ width: '100%' }}
                disabled={!currentUser || pollCreating}
              >
                {pollCreating ? 'Creating...' : 'Create poll'}
              </button>
              {pollError && (
                <p style={{ fontSize: '11px', color: '#ff6b6b', margin: 0 }}>{pollError}</p>
              )}
            </form>
          )}
        </div>
      )}

      {polls.length === 0 ? (
        <div className="polls-box-placeholder">
          <p className="poll-question">No active polls.</p>
        </div>
      ) : (
        polls.map((poll) => {
          const totalAnswers = poll.total_answers || poll.options.reduce((sum, option) => sum + (option.answers_count || 0), 0);
          const isOpen = poll.state === 'open';
          const isCreator = currentUser && poll.creator === currentUser.id;
          const hasVoted = poll.has_voted === true;
          return (
            <div key={poll.id} className="polls-box-placeholder" style={{ marginTop: '20px' }}>
              <p className="poll-question">{poll.name}{!isOpen && ' (Closed)'}</p>
              <div className="poll-voting-form">
                {poll.options.map((option) => {
                  const count = option.answers_count || 0;
                  const percent = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                  return (
                    <label key={option.id} className="poll-radio-option" style={{ width: '100%' }}>
                      {isOpen && !hasVoted && (
                        <input
                          type="radio"
                          name={`poll-${poll.id}`}
                          checked={pollSelections[poll.id] === option.id}
                          onChange={() => onSelectOption(poll.id, option.id)}
                        />
                      )}
                      <span className="option-text" style={{ flex: 1 }}>{option.label}</span>
                      <span style={{ fontSize: '11px', color: '#888896' }}>{percent}%</span>
                      <div className="poll-bar-bg" style={{ width: '100%', marginTop: '6px' }}>
                        <div className="poll-bar-fill" style={{ width: `${percent}%`, background: '#00d2ff' }}></div>
                      </div>
                    </label>
                  );
                })}
                {hasVoted && (
                  <p style={{ fontSize: '11px', color: '#888896', margin: '4px 0 0 0' }}>
                    Thank you for voting!
                  </p>
                )}
                {isOpen && !hasVoted && (
                  <button
                    type="button"
                    className="poll-submit-button"
                    onClick={() => onVote(poll.id, poll.state)}
                    disabled={!currentUser}
                  >
                    {currentUser ? 'Submit Vote' : 'Login to vote'}
                  </button>
                )}
                {isOpen && isCreator && (
                  <button
                    type="button"
                    className="poll-submit-button"
                    onClick={() => onClosePoll(poll.id)}
                  >
                    Close poll
                  </button>
                )}
                {currentUser && (isCreator || currentUser.profile === 'mod' || currentUser.profile === 'admin') && (
                  <button
                    type="button"
                    className="poll-submit-button"
                    onClick={(e) => onDeletePoll(e, poll.id)}
                    style={{ marginTop: '8px' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

export default PollsSection;
