import { Link } from 'react-router-dom';
import { isAuthenticated } from '../api/client';
import './Header.css';

function Header() {
  const loggedIn = isAuthenticated();

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <div className="header-logo">
          <svg viewBox="0 0 40 40" className="header-logo-icon">
            <path
              d="M20 5 C15 8, 12 15, 14 22 C16 29, 19 35, 20 38 C21 35, 24 29, 26 22 C28 15, 25 8, 20 5Z"
              fill="var(--color-primary)"
              opacity="0.8"
            />
            <path
              d="M18 8 C14 12, 13 18, 15 24 C17 30, 19 34, 20 36"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
            />
            <path
              d="M22 8 C26 12, 27 18, 25 24"
              fill="none"
              stroke="var(--color-primary-dark)"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
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
