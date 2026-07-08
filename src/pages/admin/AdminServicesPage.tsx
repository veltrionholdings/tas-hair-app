import { useState, useEffect } from 'react';
import { api, Service } from '../../api/client';
import './AdminPages.css';

function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [buffer, setBuffer] = useState('10');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const result = await api.getServices();
      setServices(result.data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !duration) return;

    setSaving(true);
    setMessage('');
    try {
      // We need the resource_type_id — use the first one from an existing service
      const resourceTypeId = services[0]?.resource_type_id;
      if (!resourceTypeId) {
        setMessage('Error: No resource type found. Create a resource type first.');
        return;
      }

      const body = {
        name,
        description: description || undefined,
        duration_minutes: parseInt(duration),
        buffer_minutes: parseInt(buffer) || 0,
        resource_type_id: resourceTypeId,
        price_cents: price ? parseInt(price) * 100 : undefined,
        currency: 'ZAR',
      };

      // Direct API call since the typed client doesn't have createService
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        setMessage(`Service "${name}" added.`);
        setShowAdd(false);
        setName('');
        setDescription('');
        setDuration('');
        setBuffer('10');
        setPrice('');
        await loadServices();
      } else {
        const err = await response.json();
        setMessage(`Error: ${err.error?.message || 'Failed to create service'}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add
          </button>
        </div>

        {message && (
          <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        {showAdd && (
          <div className="card invite-form">
            <h3>Add Service</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label htmlFor="svc-name">Name *</label>
                <input id="svc-name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pixie Cut" required />
              </div>
              <div className="form-group">
                <label htmlFor="svc-desc">Description</label>
                <input id="svc-desc" type="text" className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="svc-dur">Duration (min) *</label>
                  <input id="svc-dur" type="number" className="form-input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" min="5" required />
                </div>
                <div className="form-group">
                  <label htmlFor="svc-buf">Buffer (min)</label>
                  <input id="svc-buf" type="number" className="form-input" value={buffer} onChange={(e) => setBuffer(e.target.value)} placeholder="10" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="svc-price">Price (ZAR)</label>
                <input id="svc-price" type="number" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" min="0" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-shimmer" style={{ height: 60 }} />
            <div className="loading-shimmer" style={{ height: 60 }} />
          </div>
        ) : (
          <div className="staff-list">
            {services.map(service => (
              <div key={service.id} className="staff-card card">
                <div className="staff-info">
                  <div className="staff-name">{service.name}</div>
                  <div className="staff-email">{service.description || 'No description'}</div>
                </div>
                <div className="staff-meta">
                  <span className="staff-role">{formatDuration(service.duration_minutes)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatPrice(service.price_cents)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminServicesPage;
