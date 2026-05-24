import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import { API_BASE } from '../utils/api';

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Registration failed.'); return; }
      onLogin(data);
      navigate('/profile');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-layout-grid" style={{ width: '100%', justifyContent: 'center' }}>
      <div className="form-card">
        <h2 className="form-card-title">REGISTER</h2>
        <hr className="form-card-divider" />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-field">
            <label>USERNAME</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="form-input" required />
          </div>
          <div className="form-field">
            <label>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" required />
          </div>
          <div className="form-field">
            <label>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="poll-submit-button" disabled={loading} style={{ margin: 0, alignSelf: 'center', minWidth: '160px' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="form-card-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
