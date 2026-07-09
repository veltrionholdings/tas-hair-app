import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { logout, getStoredEmail, getUserRole, isAuthenticated, getCustomerId, Customer } from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import './ProfilePage.css';

function ProfilePage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  const email = getStoredEmail();
  const role = getUserRole();
  const customerId = getCustomerId();

  useEffect(() => {
    if (customerId) loadCustomer();
    else setLoading(false);
  }, []);

  async function loadCustomer() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers/${customerId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setPhone(data.phone || '');
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !firstName || !lastName) return;

    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers/${customerId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setEditing(false);
        setMessage('Profile updated.');
      } else {
        setMessage('Failed to update profile.');
      }
    } catch {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page profile-page">
      <div className="container">
        <div className="page-header">
          <h1>My Profile</h1>
        </div>

        {message && (
          <div className="success-banner" style={{ marginBottom: '1rem' }}><span>✓</span> {message}</div>
        )}

        {loading ? (
          <div className="loading-shimmer" style={{ height: 120, borderRadius: 12 }} />
        ) : editing ? (
          <form onSubmit={handleSave} className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>First Name</label>
              <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={email || ''} disabled style={{ opacity: 0.6 }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-grey)' }}>Email cannot be changed</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        ) : (
          <div className="profile-card card">
            <div className="profile-avatar">
              {(customer?.first_name || email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              {customer ? (
                <>
                  <h3>{customer.first_name} {customer.last_name}</h3>
                  <p className="profile-detail">{email}</p>
                  {customer.phone && <p className="profile-detail">{customer.phone}</p>}
                </>
              ) : (
                <>
                  <h3>{email}</h3>
                </>
              )}
              <span className="profile-role">{role}</span>
            </div>
          </div>
        )}

        <div className="profile-actions">
          {!editing && customer && (
            <button className="btn btn-secondary btn-full" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
          <button className="btn btn-secondary btn-full" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={() => setShowLogout(true)}>
            Sign Out
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={() => logout()}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}

export default ProfilePage;
