import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Service, Resource } from '../../api/client';
import './AdminPages.css';

function AdminQuickActionsPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Block day
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  // Walk-in
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInService, setWalkInService] = useState('');
  const [walkInResource, setWalkInResource] = useState('');
  const [walkInSaving, setWalkInSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [resResult, svcResult] = await Promise.all([api.getResources({ is_active: true }), api.getServices()]);
      setResources(resResult.data);
      setServices(svcResult.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleBlockDay(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDate) return;
    setBlocking(true); setMessage('');
    try {
      // Block every resource for this date
      let blocked = 0;
      for (const resource of resources) {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${resource.id}/overrides`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: JSON.stringify({ override_date: blockDate, is_available: false, reason: blockReason || 'Salon closed' }),
          }
        );
        if (response.ok) blocked++;
      }
      setMessage(`Salon closed on ${blockDate} (${blocked} stylist(s) blocked).`);
      setBlockDate(''); setBlockReason('');
    } catch { setMessage('Error: Failed to block day.'); }
    finally { setBlocking(false); }
  }

  async function handleWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkInName || !walkInPhone || !walkInService) return;
    setWalkInSaving(true); setMessage('');
    try {
      // Create customer
      const [firstName, ...lastParts] = walkInName.trim().split(' ');
      const lastName = lastParts.join(' ') || firstName;
      const customer = await api.createCustomer({ first_name: firstName, last_name: lastName, phone: walkInPhone });

      // Create booking starting now
      const now = new Date();
      const startTime = `${now.toISOString().split('T')[0]}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

      await api.createBooking({
        service_id: walkInService,
        resource_id: walkInResource || null,
        customer_id: customer.id,
        start_time: startTime,
        party_size: 1,
        notes: 'Walk-in',
      });

      setMessage(`Walk-in booked for ${walkInName}.`);
      setWalkInName(''); setWalkInPhone(''); setWalkInService(''); setWalkInResource('');
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to create walk-in'}`);
    } finally { setWalkInSaving(false); }
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>Quick Actions</h1></div><div className="loading-shimmer" style={{ height: 200 }} /></div></div>;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>Quick Actions</h1></div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        {/* Walk-in */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>⚡ Walk-In</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey-dark)', marginBottom: '1rem' }}>Quick-book a walk-in customer starting now.</p>
          <form onSubmit={handleWalkIn}>
            <div className="form-row">
              <div className="form-group"><label>Name *</label><input type="text" className="form-input" value={walkInName} onChange={e => setWalkInName(e.target.value)} required /></div>
              <div className="form-group"><label>Phone *</label><input type="tel" className="form-input" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Service *</label>
                <select className="form-input" value={walkInService} onChange={e => setWalkInService(e.target.value)} required>
                  <option value="">Select...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Stylist</label>
                <select className="form-input" value={walkInResource} onChange={e => setWalkInResource(e.target.value)}>
                  <option value="">Any</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={walkInSaving}>{walkInSaving ? 'Booking...' : 'Book Walk-In Now'}</button>
          </form>
        </div>

        {/* Block Salon Day */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>🚫 Close Salon for a Day</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey-dark)', marginBottom: '1rem' }}>Block all stylists on a specific date. Customers won't be able to book.</p>
          <form onSubmit={handleBlockDay}>
            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" className="form-input" value={blockDate} min={new Date().toISOString().split('T')[0]} onChange={e => setBlockDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input type="text" className="form-input" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Public holiday" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={blocking}>{blocking ? 'Blocking...' : 'Close Salon'}</button>
          </form>
        </div>

        {/* Quick links */}
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/admin/new-booking')}>📝 Book for a Customer</button>
      </div>
    </div>
  );
}

export default AdminQuickActionsPage;
