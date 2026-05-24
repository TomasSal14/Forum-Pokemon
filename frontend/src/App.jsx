import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import logoPokebola from './pokebola.png';
import Home from './pages/Home';
import Boards from './pages/Boards';
import Chat from './pages/Chat';
import UserList from './pages/UserList';
import './App.css';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = () => setCurrentUser(null);

  return (
    <Router>
      <div className="App">
        <div className="fundo-pokemon" />

        <header className="topbar">
          <div className="logo-container">
            <img src={logoPokebola} alt="PokeForum Logo" className="pokebola-png" />
            <span className="logo-texto">PokeForum</span>
          </div>
        </header>

        <aside className="sidebar">
          <nav className="sidebar-menu">
            <NavLink to="/" className="menu-item">Home</NavLink>
            <NavLink to="/boards/1" className="menu-item">Boards</NavLink>
            {currentUser ? (
              <>
                <NavLink to="/chat" className="menu-item">Chat</NavLink>
                {currentUser.profile === 'admin' && (
                  <NavLink to="/users" className="menu-item">Users</NavLink>
                )}
                <NavLink to="/profile" className="menu-item">Profile</NavLink>
                <button
                  type="button"
                  className="menu-item"
                  onClick={handleLogout}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="menu-item">Login</NavLink>
                <NavLink to="/register" className="menu-item">Register</NavLink>
              </>
            )}
          </nav>
        </aside>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home currentUser={currentUser} />} />
            <Route path="/boards/:id" element={<Boards currentUser={currentUser} />} />
            <Route path="/login" element={<Login onLogin={setCurrentUser} />} />
            <Route path="/register" element={<Register onLogin={setCurrentUser} />} />
            <Route
              path="/chat"
              element={currentUser ? <Chat currentUser={currentUser} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile"
              element={currentUser ? <Profile currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/users"
              element={currentUser && currentUser.profile === 'admin'
                ? <UserList currentUser={currentUser} />
                : <Navigate to="/login" replace />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
