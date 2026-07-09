import { useState, useEffect } from 'react';
import { api, Service } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [buffer, setBuffer] = useState('10');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadServices(); }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const result = await api.getServices();
      setServices(result.data);
    } catch { setServices([]); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditingId(null);
    setName(''); setDescription(''); setDuration(''); setBuffer('10'); setPrice(''); setCategory('');
    setShowForm(true);
  }

  function openEdit(svc: Service) {
    setEditingId(svc.id);
    setName(svc.name);
    setDescription(svc.description || '');
    setDuration(String(svc.duration_minutes));
    setBuffer(String(svc.buffer_minutes));
    setPrice(svc.price_cents ? String(svc.price_cents / 100) : '');
    setCategory((svc.metadata as any)?.category || '');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !duration) return;
    setSaving(true); setMessage('');

    try {
      if (editingId) {
        await api.updateService(editingId, {
          name,
          description: description || null,
          duration_minutes: parseInt(duration),
          buffer_minutes: parseInt(buffer) || 0,
          price_cents: price ? parseInt(price) * 100 : null,
          currency: 'ZAR',
        } as any);
        setMessage(`"${name}" updated.`);
      } else {
        const resourceTypeId = services[0]?.resource_type_id;
        if (!resourceTypeId) { setMessage('Error: No resource type found.'); return; }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/services`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: JSON.stringify({
              name, description: description || undefined,
              duration_minutes: parseInt(duration), buffer_minutes: parseInt(buffer) || 0,
              resource_type_id: resourceTypeId,
              price_cents: price ? parseInt(price) * 100 : undefined, currency: 'ZAR',
            }),
          }
        );
        if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'Failed'); }
        setMessage(`"${name}" added.`);
      }
      setShowForm(false);
      await loadServices();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.deleteService(deleteId);
      await loadServices();
    } catch { /* ignore */ }
    setDeleteId(null);
  }

  function formatPrice(cents: number | null): string {
    if (!cents) return '—';
    return `R${cents / 100}`;
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Services</h1>
          <button className="btn btn-primary" onClick={openAdd}>+ Add</button>
        </div>

        {message && (
          <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="card invite-form">
            <h3>{editingId ? 'Edit Service' : 'Add Service'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (min) *</label>
                  <input type="number" className="form-input" value={duration} onChange={e => setDuration(e.target.value)} min="5" required />
                </div>
                <div className="form-group">
                  <label>Buffer (min)</label>
                  <input type="number" className="form-input" value={buffer} onChange={e => setBuffer(e.target.value)} min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Price (ZAR)</label>
                <input type="number" className="form-input" value={price} onChange={e => setPrice(e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" className="form-input" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Cuts, Colour, Treatments" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-state"><div className="loading-shimmer" style={{ height: 60 }} /><div className="loading-shimmer" style={{ height: 60 }} /></div>
        ) : (
          <div className="staff-list">
            {services.map(svc => (
              <div key={svc.id} className="staff-card card">
                <div className="staff-info">
                  <div className="staff-name">{svc.name}</div>
                  <div className="staff-email">{svc.description || 'No description'}</div>
                </div>
                <div className="staff-meta">
                  <span className="staff-role">{formatDuration(svc.duration_minutes)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatPrice(svc.price_cents)}</span>
                </div>
                <div className="staff-actions">
                  <button className="btn-small btn-activate" onClick={() => openEdit(svc)}>Edit</button>
                  <button className="btn-small btn-delete" onClick={() => setDeleteId(svc.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Service"
        message="This will deactivate the service. Existing bookings will not be affected."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default AdminServicesPage;
