import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000/api';

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
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Login failed.';
        if (errorMsg === 'User is banned') {
          setError('Your account has been banned and cannot access the forum.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
        return;
      }

      onLogin(data);
      navigate('/');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-layout-grid" style={{ width: '100%', justifyContent: 'center' }}>
      <div style={{
        padding: '30px',
        background: '#110c1c',
        border: '1px solid #221834',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
        maxWidth: '480px'
      }}>
        <h2 style={{ color: '#00f0ff', fontSize: '18px', letterSpacing: '1px', margin: '0 0 20px 0' }}>LOGIN</h2>
        <hr style={{ border: 'none', borderTop: '1px solid #221834', marginBottom: '20px' }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#aaaab8', fontSize: '12px', fontWeight: 600 }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="home-search-input"
              style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#aaaab8', fontSize: '12px', fontWeight: 600 }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="home-search-input"
              style={{ background: '#1a122c', border: '1px solid #221834', padding: '10px 12px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
              required
            />
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: '12px', margin: 0 }}>{error}</p>}

          <button type="submit" className="poll-submit-button" disabled={loading} style={{ margin: 0, alignSelf: 'center', minWidth: '160px' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '15px', fontSize: '12px', color: '#888896' }}>
          Don't have an account? <Link to="/register" style={{ color: '#00f0ff' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
