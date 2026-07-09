import { useState, useEffect } from 'react';
import { api, Service, Resource } from '../../api/client';
import { getMyResource } from '../../utils/getMyResource';
import '../admin/AdminPages.css';

function EmployeeWalkInPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [myResource, setMyResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [matched, svcResult, resResult] = await Promise.all([getMyResource(), api.getServices(), api.getResources({ is_active: true })]);
      setMyResource(matched);
      setServices(svcResult.data);
      setResources(resResult.data);
      if (matched) setSelectedResourceId(matched.id);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resourceToBook = myResource ? myResource.id : selectedResourceId;
    if (!customerName || !customerPhone || !serviceId || !resourceToBook) return;
    setSaving(true); setMessage('');
    try {
      const [firstName, ...lastParts] = customerName.trim().split(' ');
      const lastName = lastParts.join(' ') || firstName;
      const customer = await api.createCustomer({ first_name: firstName, last_name: lastName, phone: customerPhone });

      const now = new Date();
      const startTime = `${now.toISOString().split('T')[0]}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

      await api.createBooking({
        service_id: serviceId,
        resource_id: resourceToBook,
        customer_id: customer.id,
        start_time: startTime,
        party_size: 1,
        notes: 'Walk-in',
      });

      setMessage(`Walk-in booked for ${customerName}!`);
      setCustomerName(''); setCustomerPhone(''); setServiceId('');
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed'}`);
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>Walk-In</h1></div><div className="loading-shimmer" style={{ height: 200 }} /></div></div>;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>⚡ Walk-In</h1></div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey-dark)', marginBottom: '1.5rem' }}>Quick-book a walk-in client to your chair right now.</p>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="form-group">
              <label>Customer Name *</label>
              <input type="text" className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" required />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input type="tel" className="form-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+27..." required />
            </div>
            <div className="form-group">
              <label>Service *</label>
              <select className="form-input" value={serviceId} onChange={e => setServiceId(e.target.value)} required>
                <option value="">Select service...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {!myResource && (
              <div className="form-group">
                <label>Stylist *</label>
                <select className="form-input" value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} required>
                  <option value="">Select stylist...</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1rem' }} disabled={saving || !customerName || !customerPhone || !serviceId || (!myResource && !selectedResourceId)}>
            {saving ? 'Booking...' : 'Book Now'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EmployeeWalkInPage;
