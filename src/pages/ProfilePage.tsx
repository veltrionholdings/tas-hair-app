import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api, logout, getStoredEmail, getUserRole, isAuthenticated, getCustomerId, Customer } from '../api/client';
import PhoneInput from '../components/PhoneInput';
import '../components/PhoneInput.css';
import ConfirmModal from '../components/ConfirmModal';
import './ProfilePage.css';

/**
 * Get email directly from the JWT token (most reliable source).
 */
function getEmailFromToken(): string | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    return JSON.parse(atob(base64)).email || null;
  } catch { return null; }
}

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

  const email = getEmailFromToken() || getStoredEmail() || '';
  const role = getUserRole();

  useEffect(() => { loadCustomer(); }, []);

  async function loadCustomer() {
    try {
      setLoading(true);

      // Try stored customer_id first
      let id = getCustomerId();

      // If not stored, look up by email
      if (!id && email) {
        const searchResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers?search=${encodeURIComponent(email)}`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
        );
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const match = searchData.data?.find((c: any) => c.email === email);
          if (match) {
            id = match.id;
            localStorage.setItem('customer_id', match.id);
          }
        }
      }

      // If still no customer, create one
      if (!id && email) {
        try {
          const newCustomer = await api.createCustomer({
            first_name: email.split('@')[0],
            last_name: email.split('@')[0],
            email,
          });
          id = newCustomer.id;
          localStorage.setItem('customer_id', newCustomer.id);
        } catch { /* ignore */ }
      }

      // Load the customer record
      if (id) {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers/${id}`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setPhone(data.phone || '');
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const id = getCustomerId() || customer?.id;
    if (!id || !firstName) return;

    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ first_name: firstName, last_name: lastName, phone: phone || undefined }),
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

  const displayName = customer
    ? `${customer.first_name} ${customer.last_name}`.trim()
    : email.split('@')[0];

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
              <label>First Name *</label>
              <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={email} disabled style={{ opacity: 0.6 }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-grey)' }}>Email cannot be changed here</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditing(false); setMessage(''); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving || !firstName}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        ) : (
          <div className="profile-card card">
            <div className="profile-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>{displayName}</h3>
              <p className="profile-detail">✉️ {email}</p>
              {customer?.phone && <p className="profile-detail">📞 {customer.phone}</p>}
              <span className="profile-role">{role}</span>
            </div>
          </div>
        )}

        <div className="profile-actions">
          {!editing && (
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
