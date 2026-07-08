import { useState, useEffect } from 'react';
import { api, User } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'employee' | 'admin'>('employee');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'delete' | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const result = await api.getUsers();
      setUsers(result.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) return;

    setInviteLoading(true);
    setMessage('');
    try {
      await api.inviteUser({
        email: inviteEmail,
        first_name: inviteFirstName,
        last_name: inviteLastName,
        role: inviteRole,
      });
      setMessage(`${inviteEmail} has been invited as ${inviteRole}.`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      await loadUsers();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!actionUserId || !actionType) return;
    try {
      if (actionType === 'suspend') {
        await api.suspendUser(actionUserId);
      } else if (actionType === 'delete') {
        await api.deleteUser(actionUserId);
      }
      await loadUsers();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  }

  async function handleActivate(userId: string) {
    try {
      await api.activateUser(userId);
      await loadUsers();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  }

  function getStatusColor(status: string): string {
    if (status === 'CONFIRMED' || status === 'ACTIVE') return 'badge-confirmed';
    if (status === 'SUSPENDED') return 'badge-cancelled';
    return 'badge-pending';
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Staff Management</h1>
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            + Invite
          </button>
        </div>

        {message && (
          <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'}>
            {message}
          </div>
        )}

        {/* Invite Form */}
        {showInvite && (
          <div className="card invite-form">
            <h3>Invite Team Member</h3>
            <form onSubmit={handleInvite}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inv-first">First Name</label>
                  <input id="inv-first" type="text" className="form-input" value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="inv-last">Last Name</label>
                  <input id="inv-last" type="text" className="form-input" value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="inv-email">Email</label>
                <input id="inv-email" type="email" className="form-input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="inv-role">Role</label>
                <select id="inv-role" className="form-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'employee' | 'admin')}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-shimmer" style={{ height: 60 }} />
            <div className="loading-shimmer" style={{ height: 60 }} />
          </div>
        ) : (
          <div className="staff-list">
            {users.map(user => (
              <div key={user.id} className="staff-card card">
                <div className="staff-info">
                  <div className="staff-name">{user.first_name || user.email.split('@')[0]} {user.last_name}</div>
                  <div className="staff-email">{user.email}</div>
                </div>
                <div className="staff-meta">
                  <span className={`badge ${getStatusColor(user.status)}`}>{user.status.toLowerCase()}</span>
                  <span className="staff-role">{user.role}</span>
                </div>
                <div className="staff-actions">
                  {user.status === 'SUSPENDED' ? (
                    <button className="btn-small btn-activate" onClick={() => handleActivate(user.id)}>Activate</button>
                  ) : (
                    <button className="btn-small btn-suspend" onClick={() => { setActionUserId(user.id); setActionType('suspend'); }}>Suspend</button>
                  )}
                  <button className="btn-small btn-delete" onClick={() => { setActionUserId(user.id); setActionType('delete'); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={actionUserId !== null}
        title={actionType === 'delete' ? 'Delete User' : 'Suspend User'}
        message={actionType === 'delete'
          ? 'This will permanently remove this user. They will not be able to log in. This cannot be undone.'
          : 'This user will not be able to log in until reactivated.'}
        confirmLabel={actionType === 'delete' ? 'Delete' : 'Suspend'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() => { setActionUserId(null); setActionType(null); }}
      />
    </div>
  );
}

export default StaffPage;
