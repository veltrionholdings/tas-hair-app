import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authenticate, signUp, confirmSignUp, completeNewPassword, getUserRole, ensureCustomerRecord, forgotPassword, confirmForgotPassword } from '../api/client';
import './LoginPage.css';

type LoginMode = 'login' | 'signup' | 'new-password' | 'verify' | 'forgot' | 'reset';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || null;

  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function navigateAfterLogin() {
    const role = getUserRole();
    if (returnTo) {
      navigate(returnTo);
    } else if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'employee') {
      navigate('/employee');
    } else {
      navigate('/');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const result = await authenticate(email, password);
      if (result === 'NEW_PASSWORD_REQUIRED') {
        setMode('new-password');
        setPassword('');
      } else {
        // Create customer record if first login after registration
        await ensureCustomerRecord();
        navigateAfterLogin();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setErrorMessage('Password must be at least 8 characters.'); return; }

    setLoading(true);
    setErrorMessage('');
    try {
      await completeNewPassword(email, newPassword);
      navigateAfterLogin();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to set new password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !firstName || !lastName || !phone) return;
    if (password !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (password.length < 8) { setErrorMessage('Password must be at least 8 characters.'); return; }

    setLoading(true);
    setErrorMessage('');
    try {
      await signUp(email, password, firstName, lastName, phone);
      setSuccessMessage('Account created! Check your email for a verification code.');
      setMode('verify');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!verificationCode) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await confirmSignUp(email, verificationCode);
      setSuccessMessage('Email verified! You can now sign in.');
      setMode('login');
      setVerificationCode('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setErrorMessage('');
    try {
      await forgotPassword(email);
      setSuccessMessage('Reset code sent to your email.');
      setMode('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset code.');
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setErrorMessage('Password must be at least 8 characters.'); return; }
    setLoading(true); setErrorMessage('');
    try {
      await confirmForgotPassword(email, resetCode, newPassword);
      setSuccessMessage('Password reset! You can now sign in.');
      setMode('login');
      setResetCode(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  }

  return (
    <div className="page login-page">
      <div className="container">
        <div className="login-header">
          <h1>
            {mode === 'login' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'new-password' && 'Set New Password'}
            {mode === 'verify' && 'Verify Email'}
            {mode === 'forgot' && 'Forgot Password'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p>
            {mode === 'login' && 'Sign in to book your appointment'}
            {mode === 'signup' && 'Create an account to get started'}
            {mode === 'new-password' && 'Please set a new password for your account'}
            {mode === 'verify' && 'Enter the verification code sent to your email'}
            {mode === 'forgot' && 'Enter your email and we\'ll send you a reset code'}
            {mode === 'reset' && 'Enter the code from your email and choose a new password'}
          </p>
        </div>

        {errorMessage && <div className="error-banner"><span>⚠️</span> {errorMessage}</div>}
        {successMessage && <div className="success-banner"><span>✓</span> {successMessage}</div>}

        {/* Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button type="button" className="link-btn" style={{ display: 'block', margin: '1rem auto 0', fontSize: '0.8125rem' }} onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}>
              Forgot Password?
            </button>
          </form>
        )}

        {/* Forgot Password */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <input id="forgot-email" type="email" className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <button type="button" className="link-btn" style={{ display: 'block', margin: '1rem auto 0', fontSize: '0.8125rem' }} onClick={() => setMode('login')}>
              Back to Sign In
            </button>
          </form>
        )}

        {/* Reset Password */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="reset-code">Reset Code</label>
              <input id="reset-code" type="text" className="form-input" placeholder="6-digit code" value={resetCode} onChange={e => setResetCode(e.target.value)} required autoComplete="one-time-code" inputMode="numeric" />
            </div>
            <div className="form-group">
              <label htmlFor="reset-pw">New Password</label>
              <input id="reset-pw" type="password" className="form-input" placeholder="At least 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label htmlFor="reset-confirm">Confirm Password</label>
              <input id="reset-confirm" type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* New Password */}
        {mode === 'new-password' && (
          <form onSubmit={handleNewPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" className="form-input" placeholder="Choose a strong password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-new">Confirm Password</label>
              <input id="confirm-new" type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Setting password...' : 'Set Password & Continue'}
            </button>
          </form>
        )}

        {/* Sign Up */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="login-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name">First Name *</label>
                <input id="first-name" type="text" className="form-input" placeholder="Thandi" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="last-name">Last Name *</label>
                <input id="last-name" type="text" className="form-input" placeholder="Mokoena" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-phone">Phone Number *</label>
              <input id="signup-phone" type="tel" className="form-input" placeholder="+27821234567" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email *</label>
              <input id="signup-email" type="email" className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password *</label>
              <input id="signup-password" type="password" className="form-input" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirm">Confirm Password *</label>
              <input id="signup-confirm" type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Verify */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="login-form">
            <div className="form-group">
              <label htmlFor="verify-code">Verification Code</label>
              <input id="verify-code" type="text" className="form-input" placeholder="Enter 6-digit code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} required autoComplete="one-time-code" inputMode="numeric" style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.25rem' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        {mode !== 'new-password' && mode !== 'verify' && mode !== 'forgot' && mode !== 'reset' && (
          <div className="login-switch">
            {mode === 'login' ? (
              <p>Don't have an account? <button className="link-btn" onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}>Sign up</button></p>
            ) : (
              <p>Already have an account? <button className="link-btn" onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Sign in</button></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
