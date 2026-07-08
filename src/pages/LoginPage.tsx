import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authenticate, signUp } from '../api/client';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || '/book';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await authenticate(email, password);
      navigate(returnTo);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await signUp(email, password);
      setSuccessMessage('Account created! Please check your email to verify, then log in.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page login-page">
      <div className="container">
        <div className="login-header">
          <h1>{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
          <p>
            {mode === 'login'
              ? 'Sign in to book your appointment'
              : 'Create an account to get started'}
          </p>
        </div>

        {errorMessage && (
          <div className="error-banner">
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            <span>✓</span> {successMessage}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="login-switch">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button className="link-btn" onClick={() => { setMode('signup'); setErrorMessage(''); }}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button className="link-btn" onClick={() => { setMode('login'); setErrorMessage(''); }}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
