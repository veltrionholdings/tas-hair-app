import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authenticate, signUp } from '../api/client';
import './LoginPage.css';

const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || 'm535i5660f5harvfu6fou0cu9';
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'eu-west-1';

type Mode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || '/book';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function cognitoRequest(action: string, body: Record<string, unknown>) {
    const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.__type || 'Request failed');
    }
    return data;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await authenticate(email, password);
      navigate(returnTo);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('not confirmed') || msg.includes('UserNotConfirmedException')) {
        setMode('verify');
        setErrorMessage('Please verify your email first. Check your inbox for the code.');
        // Resend code
        try {
          await cognitoRequest('ResendConfirmationCode', { ClientId: COGNITO_CLIENT_ID, Username: email });
        } catch { /* ignore resend failure */ }
      } else {
        setErrorMessage(msg || 'Login failed. Please check your credentials.');
      }
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
      setSuccessMessage('Account created! Enter the verification code sent to your email.');
      setMode('verify');
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
      await cognitoRequest('ConfirmSignUp', {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: verificationCode,
      });
      setSuccessMessage('Email verified! You can now sign in.');
      setMode('login');
      setVerificationCode('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setLoading(true);
    setErrorMessage('');
    try {
      await cognitoRequest('ResendConfirmationCode', { ClientId: COGNITO_CLIENT_ID, Username: email });
      setSuccessMessage('A new code has been sent to your email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await cognitoRequest('ForgotPassword', { ClientId: COGNITO_CLIENT_ID, Username: email });
      setSuccessMessage('A reset code has been sent to your email.');
      setMode('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetCode || !newPassword) return;

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await cognitoRequest('ConfirmForgotPassword', {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: resetCode,
        Password: newPassword,
      });
      setSuccessMessage('Password reset! You can now sign in with your new password.');
      setMode('login');
      setPassword('');
      setResetCode('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  }

  function getTitle(): string {
    switch (mode) {
      case 'login': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'verify': return 'Verify Email';
      case 'forgot': return 'Forgot Password';
      case 'reset': return 'Reset Password';
    }
  }

  function getSubtitle(): string {
    switch (mode) {
      case 'login': return 'Sign in to book your appointment';
      case 'signup': return 'Create an account to get started';
      case 'verify': return 'Enter the 6-digit code sent to your email';
      case 'forgot': return 'Enter your email to receive a reset code';
      case 'reset': return 'Enter the code and your new password';
    }
  }

  return (
    <div className="page login-page">
      <div className="container">
        <div className="login-header">
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
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

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button type="button" className="link-btn forgot-link" onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}>
              Forgot password?
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input" placeholder="Min 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input id="confirm-password" type="password" className="form-input" placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Verification Form */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="login-form">
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input id="code" type="text" className="form-input form-input-code" placeholder="123456"
                value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                required maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" className="link-btn resend-link" onClick={handleResendCode} disabled={loading}>
              Resend code
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="reset-code">Reset Code</label>
              <input id="reset-code" type="text" className="form-input form-input-code" placeholder="123456"
                value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                required maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" className="form-input" placeholder="Min 8 characters"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Mode switching */}
        <div className="login-switch">
          {mode === 'login' && (
            <p>Don't have an account? <button className="link-btn" onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}>Sign up</button></p>
          )}
          {(mode === 'signup' || mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
            <p>Back to <button className="link-btn" onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Sign in</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
