import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import { API_BASE } from '../utils/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error || 'Login failed.';
        setError(errorMsg === 'User is banned'
          ? 'Your account has been banned and cannot access the forum.'
          : errorMsg
        );
        return;
      }
      onLogin(data);
      navigate('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-layout-grid" style={{ width: '100%', justifyContent: 'center' }}>
      <div className="form-card">
        <h2 className="form-card-title">LOGIN</h2>
        <hr className="form-card-divider" />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-field">
            <label>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-field">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="poll-submit-button" disabled={loading} style={{ margin: 0, alignSelf: 'center', minWidth: '160px' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="form-card-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
