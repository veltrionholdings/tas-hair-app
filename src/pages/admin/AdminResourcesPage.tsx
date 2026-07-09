import { useState, useEffect } from 'react';
import { api, Resource, Service } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Schedule editing
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleEntries, setScheduleEntries] = useState<Array<{ day: number; start: string; end: string; enabled: boolean }>>([]);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [resResult, svcResult] = await Promise.all([
        api.getResources({ is_active: true }),
        api.getServices(),
      ]);
      setResources(resResult.data);
      setServices(svcResult.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true); setMessage('');
    try {
      // Get the resource type ID from an existing resource, or use a default
      const resourceTypeId = resources[0]?.resource_type_id || services[0]?.resource_type_id;
      if (!resourceTypeId) { setMessage('Error: No resource type found.'); setSaving(false); return; }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ resource_type_id: resourceTypeId, name, description: description || undefined }),
        }
      );
      if (response.ok) {
        setMessage(`"${name}" added.`);
        setShowAdd(false); setName(''); setDescription('');
        await loadData();
      } else {
        const err = await response.json();
        setMessage(`Error: ${err.error?.message || 'Failed'}`);
      }
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${deleteId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      if (response.ok || response.status === 204) await loadData();
    } catch { /* ignore */ }
    setDeleteId(null);
  }

  async function openSchedule(resourceId: string) {
    setScheduleId(resourceId);
    try {
      const result = await api.getResourceSchedule(resourceId);
      const entries = DAYS.map((_, i) => {
        const existing = result.data.find(s => s.day_of_week === i);
        return { day: i, start: existing?.start_time || '09:00', end: existing?.end_time || '18:00', enabled: !!existing };
      });
      setScheduleEntries(entries);
    } catch {
      setScheduleEntries(DAYS.map((_, i) => ({ day: i, start: '09:00', end: '18:00', enabled: i < 5 })));
    }
  }

  async function handleSaveSchedule() {
    if (!scheduleId) return;
    setScheduleSaving(true);
    try {
      const schedules = scheduleEntries.filter(e => e.enabled).map(e => ({ day_of_week: e.day, start_time: e.start, end_time: e.end }));
      await api.setResourceSchedule(scheduleId, schedules);
      setMessage('Schedule updated.');
      setScheduleId(null);
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    finally { setScheduleSaving(false); }
  }

  async function handleLinkServices(resourceId: string) {
    // Link all services to this resource
    try {
      const serviceIds = services.map(s => s.id);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${resourceId}/services`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ service_ids: serviceIds }),
        }
      );
      if (response.ok) setMessage('All services linked to this stylist.');
      else setMessage('Error: Failed to link services.');
    } catch { setMessage('Error: Failed to link services.'); }
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Stylists</h1>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add</button>
        </div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        {showAdd && (
          <div className="card invite-form">
            <h3>Add Stylist</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Senior Stylist, 5 years experience" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Stylist'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Editor Modal */}
        {scheduleId && (
          <div className="modal-backdrop" onClick={() => setScheduleId(null)}>
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
                <button className="btn btn-secondary modal-btn" onClick={() => setScheduleId(null)}>Cancel</button>
                <button className="btn btn-primary modal-btn" onClick={handleSaveSchedule} disabled={scheduleSaving}>{scheduleSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state"><div className="loading-shimmer" style={{ height: 70 }} /><div className="loading-shimmer" style={{ height: 70 }} /></div>
        ) : resources.length === 0 ? (
          <div className="empty-state"><p>No stylists added yet. Add one to get started.</p></div>
        ) : (
          <div className="staff-list">
            {resources.map(res => (
              <div key={res.id} className="staff-card card">
                <div className="staff-info">
                  <div className="staff-name">{res.name}</div>
                  <div className="staff-email">{res.description || 'No description'}</div>
                </div>
                <div className="staff-actions">
                  <button className="btn-small btn-complete" onClick={() => openSchedule(res.id)}>Schedule</button>
                  <button className="btn-small btn-activate" onClick={() => handleLinkServices(res.id)}>Link All Services</button>
                  <button className="btn-small btn-delete" onClick={() => setDeleteId(res.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Stylist"
        message="This will deactivate this stylist. They will no longer appear in availability."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default AdminResourcesPage;
