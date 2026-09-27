import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeOAuthLogin, ensureCustomerRecord, getUserRole } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Handles the redirect back from the Cognito Hosted UI after Google sign-in.
 * Exchanges the ?code for tokens, provisions the customer record, then routes
 * the user to the right landing page.
 */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke (an auth code is single-use).
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get('code');
    const oauthError = searchParams.get('error_description') || searchParams.get('error');

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      return;
    }
    if (!code) {
      setError('No authorization code was returned. Please try signing in again.');
      return;
    }

    (async () => {
      try {
        await completeOAuthLogin(code);
        await ensureCustomerRecord();
        const role = getUserRole();
        if (role === 'admin') navigate('/admin', { replace: true });
        else if (role === 'employee') navigate('/employee', { replace: true });
        else navigate('/', { replace: true });
      } catch (err: any) {
        setError(err?.message || 'Sign-in failed. Please try again.');
      }
    })();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="page">
        <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div className="error-banner" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span>⚠️</span> {error}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/login', { replace: true })}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <LoadingSpinner fullPage label="Signing you in..." />
      </div>
    </div>
  );
}

export default AuthCallbackPage;
