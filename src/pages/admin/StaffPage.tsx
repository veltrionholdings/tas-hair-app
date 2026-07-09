import { useState, useEffect } from 'react';
import { api, User, Resource, Service } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'employee' | 'admin'>('employee');
  const [inviteBookable, setInviteBookable] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Actions
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'delete' | null>(null);

  // Schedule editing
  const [scheduleResourceId, setScheduleResourceId] = useState<string | null>(null);
  const [scheduleEntries, setScheduleEntries] = useState<Array<{ day: number; start: string; end: string; enabled: boolean }>>([]);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usersResult, resourcesResult, servicesResult] = await Promise.all([
        api.getUsers(),
        api.getResources({ is_active: true }),
        api.getServices(),
      ]);
      setUsers(usersResult.data);
      setResources(resourcesResult.data);
      setServices(servicesResult.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  // Check if a user has a linked resource (is bookable)
  function getLinkedResource(user: User): Resource | undefined {
    // Match by name (first_name + last_name or email prefix)
    const userName = `${user.first_name} ${user.last_name}`.trim();
    return resources.find(r =>
      r.name.toLowerCase() === userName.toLowerCase() ||
      r.name.toLowerCase() === user.email.split('@')[0].toLowerCase()
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) return;
    setInviteLoading(true); setMessage('');
    try {
      // Create Cognito user
      await api.inviteUser({ email: inviteEmail, first_name: inviteFirstName, last_name: inviteLastName, role: inviteRole });

      // If bookable, create a resource for them
      if (inviteBookable) {
        const resourceTypeId = resources[0]?.resource_type_id || services[0]?.resource_type_id;
        if (resourceTypeId) {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
              body: JSON.stringify({
                resource_type_id: resourceTypeId,
                name: `${inviteFirstName} ${inviteLastName}`,
                description: inviteRole === 'admin' ? 'Admin & Stylist' : 'Stylist',
              }),
            }
          );
          if (response.ok) {
            const newResource = await response.json();
            // Link all services to this new stylist
            const serviceIds = services.map(s => s.id);
            await fetch(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${newResource.id}/services`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify({ service_ids: serviceIds }),
              }
            );
            // Set default schedule (Mon-Sat 9-18)
            await api.setResourceSchedule(newResource.id, [
              { day_of_week: 0, start_time: '09:00', end_time: '18:00' },
              { day_of_week: 1, start_time: '09:00', end_time: '18:00' },
              { day_of_week: 2, start_time: '09:00', end_time: '18:00' },
              { day_of_week: 3, start_time: '09:00', end_time: '18:00' },
              { day_of_week: 4, start_time: '09:00', end_time: '18:00' },
              { day_of_week: 5, start_time: '09:00', end_time: '18:00' },
            ]);
          }
        }
      }

      setMessage(`${inviteFirstName} invited${inviteBookable ? ' as a bookable stylist' : ''}.`);
      setShowInvite(false);
      setInviteEmail(''); setInviteFirstName(''); setInviteLastName(''); setInviteBookable(true);
      await loadData();
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setInviteLoading(false); }
  }

  async function handleMakeBookable(user: User) {
    const resourceTypeId = resources[0]?.resource_type_id || services[0]?.resource_type_id;
    if (!resourceTypeId) { setMessage('Error: No resource type found.'); return; }

    try {
      const name = `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0];
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ resource_type_id: resourceTypeId, name, description: 'Stylist' }),
        }
      );
      if (response.ok) {
        const newResource = await response.json();
        // Link all services
        const serviceIds = services.map(s => s.id);
        await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${newResource.id}/services`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: JSON.stringify({ service_ids: serviceIds }),
          }
        );
        setMessage(`${name} is now bookable.`);
        await loadData();
      }
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
  }

  async function handleRemoveBookable(resourceId: string) {
    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${resourceId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      setMessage('Stylist removed from bookings.');
      await loadData();
    } catch { setMessage('Error: Failed to remove.'); }
  }

  async function handleConfirmAction() {
    if (!actionUserId || !actionType) return;
    try {
      if (actionType === 'suspend') await api.suspendUser(actionUserId);
      else if (actionType === 'delete') await api.deleteUser(actionUserId);
      await loadData();
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setActionUserId(null); setActionType(null); }
  }

  async function handleActivate(userId: string) {
    try { await api.activateUser(userId); await loadData(); }
    catch (err: any) { setMessage(`Error: ${err.message}`); }
  }

  async function openSchedule(resourceId: string) {
    setScheduleResourceId(resourceId);
    try {
      const result = await api.getResourceSchedule(resourceId);
      setScheduleEntries(DAYS.map((_, i) => {
        const existing = result.data.find(s => s.day_of_week === i);
        return { day: i, start: existing?.start_time || '09:00', end: existing?.end_time || '18:00', enabled: !!existing };
      }));
    } catch {
      setScheduleEntries(DAYS.map((_, i) => ({ day: i, start: '09:00', end: '18:00', enabled: i < 6 })));
    }
  }

  async function handleSaveSchedule() {
    if (!scheduleResourceId) return;
    setScheduleSaving(true);
    try {
      const schedules = scheduleEntries.filter(e => e.enabled).map(e => ({ day_of_week: e.day, start_time: e.start, end_time: e.end }));
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

  // Filter to show only employees and admins (not customers)
  const staffUsers = users.filter(u => u.role === 'employee' || u.role === 'admin');
  const customerUsers = users.filter(u => u.role === 'customer');

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Staff & Users</h1>
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ Invite</button>
        </div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        {/* Invite Form */}
        {showInvite && (
          <div className="card invite-form">
            <h3>Invite Team Member</h3>
            <form onSubmit={handleInvite}>
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input type="text" className="form-input" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} required /></div>
                <div className="form-group"><label>Last Name</label><input type="text" className="form-input" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} required /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required /></div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-input" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'employee' | 'admin')}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={inviteBookable} onChange={e => setInviteBookable(e.target.checked)} style={{ width: 18, height: 18 }} />
                  Bookable (customers can book appointments with them)
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviteLoading}>{inviteLoading ? 'Sending...' : 'Invite'}</button>
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
                      <input type="checkbox" checked={entry.enabled} onChange={e => { const u = [...scheduleEntries]; u[i].enabled = e.target.checked; setScheduleEntries(u); }} />
                      <span>{DAYS[i]}</span>
                    </label>
                    {entry.enabled ? (
                      <div className="schedule-times">
                        <input type="time" value={entry.start} onChange={e => { const u = [...scheduleEntries]; u[i].start = e.target.value; setScheduleEntries(u); }} />
                        <span>–</span>
                        <input type="time" value={entry.end} onChange={e => { const u = [...scheduleEntries]; u[i].end = e.target.value; setScheduleEntries(u); }} />
                      </div>
                    ) : <span className="schedule-off">Off</span>}
                  </div>
                ))}
              </div>
              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary modal-btn" onClick={() => setScheduleResourceId(null)}>Cancel</button>
                <button className="btn btn-primary modal-btn" onClick={handleSaveSchedule} disabled={scheduleSaving}>{scheduleSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Staff Section */}
        {loading ? (
          <div className="loading-state"><div className="loading-shimmer" style={{ height: 70 }} /><div className="loading-shimmer" style={{ height: 70 }} /></div>
        ) : (
          <>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-grey)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
              Team ({staffUsers.length})
            </h3>
            <div className="staff-list">
              {staffUsers.map(user => {
                const linkedResource = getLinkedResource(user);
                return (
                  <div key={user.id} className="staff-card card">
                    <div className="staff-info">
                      <div className="staff-name">{user.first_name || user.email.split('@')[0]} {user.last_name}</div>
                      <div className="staff-email">{user.email}</div>
                    </div>
                    <div className="staff-meta">
                      <span className={`badge ${getStatusColor(user.status)}`}>{user.status.toLowerCase()}</span>
                      <span className="staff-role">{user.role}</span>
                      {linkedResource && <span className="badge badge-confirmed">bookable</span>}
                    </div>
                    <div className="staff-actions">
                      {linkedResource ? (
                        <>
                          <button className="btn-small btn-complete" onClick={() => openSchedule(linkedResource.id)}>Schedule</button>
                          <button className="btn-small btn-noshow" onClick={() => handleRemoveBookable(linkedResource.id)}>Remove Bookable</button>
                        </>
                      ) : (
                        <button className="btn-small btn-activate" onClick={() => handleMakeBookable(user)}>Make Bookable</button>
                      )}
                      {user.status === 'SUSPENDED' ? (
                        <button className="btn-small btn-activate" onClick={() => handleActivate(user.id)}>Activate</button>
                      ) : (
                        <button className="btn-small btn-suspend" onClick={() => { setActionUserId(user.id); setActionType('suspend'); }}>Suspend</button>
                      )}
                      <button className="btn-small btn-delete" onClick={() => { setActionUserId(user.id); setActionType('delete'); }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customers Section */}
            {customerUsers.length > 0 && (
              <>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-grey)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '1.5rem 0 0.75rem' }}>
                  Customers ({customerUsers.length})
                </h3>
                <div className="staff-list">
                  {customerUsers.map(user => (
                    <div key={user.id} className="staff-card card">
                      <div className="staff-info">
                        <div className="staff-name">{user.first_name || user.email.split('@')[0]} {user.last_name}</div>
                        <div className="staff-email">{user.email}</div>
                      </div>
                      <div className="staff-meta">
                        <span className={`badge ${getStatusColor(user.status)}`}>{user.status.toLowerCase()}</span>
                        <span className="staff-role">customer</span>
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
              </>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={actionUserId !== null}
        title={actionType === 'delete' ? 'Delete User' : 'Suspend User'}
        message={actionType === 'delete' ? 'Permanently remove this user? This cannot be undone.' : 'This user will not be able to log in until reactivated.'}
        confirmLabel={actionType === 'delete' ? 'Delete' : 'Suspend'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() => { setActionUserId(null); setActionType(null); }}
      />
    </div>
  );
}

export default StaffPage;
