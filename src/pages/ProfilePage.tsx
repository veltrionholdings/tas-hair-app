import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { logout, getStoredEmail, getUserRole, isAuthenticated } from '../api/client';
import './ProfilePage.css';

function ProfilePage() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const email = getStoredEmail();
  const role = getUserRole();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout(); // This reloads the page
  }

  return (
    <div className="page profile-page">
      <div className="container">
        <div className="page-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-card card">
          <div className="profile-avatar">
            {(email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h3>{email}</h3>
            <span className="profile-role">{role}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="btn btn-secondary btn-full"
            onClick={() => setShowLogoutConfirm(true)}
          >
            Sign Out
          </button>
        </div>

        {showLogoutConfirm && (
          <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Sign Out</h3>
              <p className="modal-message">Are you sure you want to sign out?</p>
              <div className="modal-actions">
                <button className="btn btn-secondary modal-btn" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary modal-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
