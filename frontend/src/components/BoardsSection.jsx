import React from "react";
import { Link } from "react-router-dom";

function BoardsSection({ boards, currentUser, searchQuery, onDeleteBoard }) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBoards = normalizedQuery
    ? boards.filter((board) =>
        board.name.toLowerCase().includes(normalizedQuery),
      )
    : boards;

  return (
    <>
      <div className="boards-carousel-wrapper">
        <div className="boards-row">
          {filteredBoards.map((board) => (
            <Link
              to={`/boards/${board.id}`}
              key={board.id}
              className="board-box"
              style={{ textDecoration: "none" }}
            >
              <div className="board-content">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{board.name}</h3>
                  {currentUser &&
                    (board.creator === currentUser.id ||
                      currentUser.profile === "mod" ||
                      currentUser.profile === "admin") && (
                      <button
                        type="button"
                        className="refresh-button"
                        style={{ padding: "2px 8px", fontSize: "10px" }}
                        onClick={(event) => onDeleteBoard(event, board.id)}
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
    </>
  );
}

export default BoardsSection;
