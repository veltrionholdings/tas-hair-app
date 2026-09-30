import { Link, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../api/client';
import './Header.css';

function Header() {
  // useLocation forces re-render on route change, so auth state is re-evaluated
  useLocation();
  const loggedIn = isAuthenticated();

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <div className="header-logo">
          <img src="/logo-mark.png" alt="Tas Hair" className="header-logo-icon" />
        </div>
        <div className="header-text">
          <span className="header-name">Tas Hair</span>
          <span className="header-tagline">& Beauty Cafe</span>
        </div>
      </Link>

      <Link to={loggedIn ? '/profile' : '/login'} className="header-profile" aria-label="Profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="header-profile-icon">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </header>
  );
}

export default Header;
