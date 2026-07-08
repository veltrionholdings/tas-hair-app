import { useState, useEffect } from 'react';
import { api, User } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  // Schedule editing
  const [scheduleResourceId, setScheduleResourceId] = useState<string | null>(null);
  const [scheduleEntries, setScheduleEntries] = useState<Array<{ day: number; start: string; end: string; enabled: boolean }>>([]);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const result = await api.getUsers();
      setUsers(result.data);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) return;
    setInviteLoading(true); setMessage('');
    try {
      await api.inviteUser({ email: inviteEmail, first_name: inviteFirstName, last_name: inviteLastName, role: inviteRole });
      setMessage(`${inviteEmail} has been invited as ${inviteRole}.`);
      setShowInvite(false);
      setInviteEmail(''); setInviteFirstName(''); setInviteLastName('');
      await loadUsers();
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setInviteLoading(false); }
  }

  async function handleConfirmAction() {
    if (!actionUserId || !actionType) return;
    try {
      if (actionType === 'suspend') await api.suspendUser(actionUserId);
      else if (actionType === 'delete') await api.deleteUser(actionUserId);
      await loadUsers();
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setActionUserId(null); setActionType(null); }
  }

  async function handleActivate(userId: string) {
    try { await api.activateUser(userId); await loadUsers(); }
    catch (err: any) { setMessage(`Error: ${err.message}`); }
  }

  async function openSchedule(resourceId: string) {
    setScheduleResourceId(resourceId);
    try {
      const result = await api.getResourceSchedule(resourceId);
      // Build full week with existing schedule
      const entries = DAYS.map((_, i) => {
        const existing = result.data.find(s => s.day_of_week === i);
        return { day: i, start: existing?.start_time || '09:00', end: existing?.end_time || '17:00', enabled: !!existing };
      });
      setScheduleEntries(entries);
    } catch {
      // Default schedule
      setScheduleEntries(DAYS.map((_, i) => ({ day: i, start: '09:00', end: '18:00', enabled: i < 5 })));
    }
  }

  async function handleSaveSchedule() {
    if (!scheduleResourceId) return;
    setScheduleSaving(true);
    try {
      const schedules = scheduleEntries
        .filter(e => e.enabled)
        .map(e => ({ day_of_week: e.day, start_time: e.start, end_time: e.end }));
      await api.setResourceSchedule(scheduleResourceId, schedules);
      setMessage('Schedule updated.');
      setScheduleResourceId(null);
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setScheduleSaving(false); }
  }

  function getStatusColor(status: string): string {
    if (status === 'CONFIRMED' || status === 'ACTIVE') return 'badge-confirmed';
    if (status === 'SUSPENDED') return 'badge-cancelled';
    return 'badge-pending';
  }

  // For demo, we use Tas's resource ID. In production, each user would have a linked resource.
  const DEMO_RESOURCE_ID = '8873b698-d871-4db9-a78f-ea521bdc0bcc';

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Staff</h1>
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ Invite</button>
        </div>

        {message && (
          <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>
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
                  <label>First Name</label>
                  <input type="text" className="form-input" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="form-input" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-input" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'employee' | 'admin')}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviteLoading}>{inviteLoading ? 'Sending...' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Editor Modal */}
        {scheduleResourceId && (
          <div className="modal-backdrop" onClick={() => setScheduleResourceId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <h3 className="modal-title">Edit Schedule</h3>
              <div className="schedule-editor">
                {scheduleEntries.map((entry, i) => (
                  <div key={i} className="schedule-row">
                    <label className="schedule-day">
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={e => {
                          const updated = [...scheduleEntries];
                          updated[i].enabled = e.target.checked;
                          setScheduleEntries(updated);
                        }}
                      />
                      <span>{DAYS[i].substring(0, 3)}</span>
                    </label>
                    {entry.enabled && (
                      <div className="schedule-times">
                        <input
                          type="time"
                          value={entry.start}
                          onChange={e => {
                            const updated = [...scheduleEntries];
                            updated[i].start = e.target.value;
                            setScheduleEntries(updated);
                          }}
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={entry.end}
                          onChange={e => {
                            const updated = [...scheduleEntries];
                            updated[i].end = e.target.value;
                            setScheduleEntries(updated);
                          }}
                        />
                      </div>
                    )}
                    {!entry.enabled && <span className="schedule-off">Off</span>}
                  </div>
                ))}
              </div>
              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary modal-btn" onClick={() => setScheduleResourceId(null)}>Cancel</button>
                <button className="btn btn-primary modal-btn" onClick={handleSaveSchedule} disabled={scheduleSaving}>
                  {scheduleSaving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="loading-state"><div className="loading-shimmer" style={{ height: 60 }} /><div className="loading-shimmer" style={{ height: 60 }} /></div>
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
                  {(user.role === 'employee' || user.role === 'admin') && (
                    <button className="btn-small btn-complete" onClick={() => openSchedule(DEMO_RESOURCE_ID)}>Schedule</button>
                  )}
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
          ? 'This will permanently remove this user. This cannot be undone.'
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
