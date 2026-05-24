import React from "react";
import { canModerate } from "../utils/permissions";

function PollsSection({
  polls,
  currentUser,
  pollSelections,
  onVote,
  onClosePoll,
  onDeletePoll,
  onSelectOption,
  showPollCreator,
  pollName,
  pollOptions,
  pollError,
  pollCreating,
  onPollNameChange,
  onOptionChange,
  onAddOption,
  onCreatePoll,
  onTogglePollCreator,
}) {
  return (
    <>
      {currentUser && (
        <div className="polls-box-placeholder" style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <p className="poll-question" style={{ margin: 0 }}>
              Create Poll
            </p>
            <button
              type="button"
              className="poll-submit-button"
              style={{ width: "auto", padding: "6px 12px" }}
              onClick={onTogglePollCreator}
            >
              {showPollCreator ? "Close" : "Add poll"}
            </button>
          </div>

          {showPollCreator && (
            <form
              onSubmit={onCreatePoll}
              className="poll-voting-form"
              style={{ width: "100%", marginTop: "15px" }}
            >
              <input
                type="text"
                placeholder="Poll name"
                value={pollName}
                onChange={onPollNameChange}
                className="form-input"
                disabled={pollCreating}
              />
              {pollOptions.map((option, index) => (
                <input
                  key={`poll-option-${index}`}
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                  className="form-input"
                  disabled={pollCreating}
                />
              ))}
              <button
                type="button"
                className="poll-submit-button"
                style={{ width: "100%" }}
                onClick={onAddOption}
                disabled={pollCreating}
              >
                Add option
              </button>
              <button
                type="submit"
                className="poll-submit-button"
                style={{ width: "100%" }}
                disabled={pollCreating}
              >
                {pollCreating ? "Creating..." : "Create poll"}
              </button>
              {pollError && <p className="form-error">{pollError}</p>}
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
          const totalVotes =
            poll.total_answers ||
            poll.options.reduce(
              (sum, opt) => sum + (opt.answers_count || 0),
              0,
            );
          const isOpen = poll.state === "open";
          const hasVoted = poll.has_voted === true;

          return (
            <div
              key={poll.id}
              className="polls-box-placeholder"
              style={{ marginTop: "20px" }}
            >
              <p className="poll-question">
                {poll.name}
                {!isOpen && " (Closed)"}
              </p>
              <div className="poll-voting-form">
                {poll.options.map((option) => {
                  const count = option.answers_count || 0;
                  const percent =
                    totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <label
                      key={option.id}
                      className="poll-radio-option"
                      style={{ width: "100%" }}
                    >
                      {isOpen && !hasVoted && (
                        <input
                          type="radio"
                          name={`poll-${poll.id}`}
                          checked={pollSelections[poll.id] === option.id}
                          onChange={() => onSelectOption(poll.id, option.id)}
                        />
                      )}
                      <span className="option-text" style={{ flex: 1 }}>
                        {option.label}
                      </span>
                      <span style={{ fontSize: "11px", color: "#888896" }}>
                        {percent}%
                      </span>
                      <div
                        className="poll-bar-bg"
                        style={{ width: "100%", marginTop: "6px" }}
                      >
                        <div
                          className="poll-bar-fill"
                          style={{
                            width: `${percent}%`,
                            background: "#00d2ff",
                          }}
                        />
                      </div>
                    </label>
                  );
                })}

                {hasVoted && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#888896",
                      margin: "4px 0 0 0",
                    }}
                  >
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
                    {currentUser ? "Submit Vote" : "Login to vote"}
                  </button>
                )}
                {isOpen && currentUser && poll.creator === currentUser.id && (
                  <button
                    type="button"
                    className="poll-submit-button"
                    onClick={() => onClosePoll(poll.id)}
                  >
                    Close poll
                  </button>
                )}
                {canModerate(currentUser, poll.creator) && (
                  <button
                    type="button"
                    className="poll-submit-button"
                    onClick={(e) => onDeletePoll(e, poll.id)}
                    style={{ marginTop: "8px" }}
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
