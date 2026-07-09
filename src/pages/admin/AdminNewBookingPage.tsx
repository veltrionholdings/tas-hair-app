import { useState, useEffect } from 'react';
import { api, Service, Resource, AvailableSlot } from '../../api/client';
import './AdminPages.css';

function AdminNewBookingPage() {
  const [searchParams] = new URLSearchParams(window.location.search) ? [new URLSearchParams(window.location.search)] : [new URLSearchParams()];
  const [services, setServices] = useState<Service[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state — pre-fill from URL params if available
  const [customerName, setCustomerName] = useState(searchParams.get('customer')?.replace('+', ' ') || '');
  const [customerPhone, setCustomerPhone] = useState(searchParams.get('phone') || '');
  const [customerEmail, setCustomerEmail] = useState(searchParams.get('email') || '');
  const [serviceId, setServiceId] = useState(searchParams.get('service') || '');
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (serviceId && date) loadSlots(); }, [serviceId, date, resourceId]);

  async function loadData() {
    try {
      const [svcResult, resResult] = await Promise.all([api.getServices(), api.getResources({ is_active: true })]);
      setServices(svcResult.data);
      setResources(resResult.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadSlots() {
    setSlotsLoading(true);
    try {
      const result = await api.getAvailability(serviceId, date, resourceId || undefined);
      setSlots(result.slots);
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !customerPhone || !serviceId || !date || !selectedSlot) return;

    setSaving(true); setMessage('');
    try {
      // Create or find customer
      const [firstName, ...lastParts] = customerName.trim().split(' ');
      const lastName = lastParts.join(' ') || firstName;
      const customer = await api.createCustomer({ first_name: firstName, last_name: lastName, phone: customerPhone, email: customerEmail || undefined });

      // Create booking
      await api.createBooking({
        service_id: serviceId,
        resource_id: resourceId || null,
        customer_id: customer.id,
        start_time: `${date}T${selectedSlot}:00`,
        party_size: 1,
        notes: notes || undefined,
      });

      setMessage('Booking created successfully!');
      // Reset form
      setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
      setServiceId(''); setResourceId(''); setDate(''); setSelectedSlot(''); setNotes('');
      setSlots([]);
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to create booking'}`);
    } finally { setSaving(false); }
  }

  function getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>New Booking</h1></div><div className="loading-shimmer" style={{ height: 300 }} /></div></div>;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>New Booking</h1></div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Customer</h3>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone *</label>
                <input type="tel" className="form-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+27..." required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Appointment</h3>
            <div className="form-group">
              <label>Service *</label>
              <select className="form-input" value={serviceId} onChange={e => { setServiceId(e.target.value); setSelectedSlot(''); }} required>
                <option value="">Select service...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Stylist</label>
              <select className="form-input" value={resourceId} onChange={e => { setResourceId(e.target.value); setSelectedSlot(''); }}>
                <option value="">Any Available</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" className="form-input" value={date} min={getMinDate()} onChange={e => { setDate(e.target.value); setSelectedSlot(''); }} required />
            </div>

            {slotsLoading && <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey)' }}>Loading slots...</p>}

            {!slotsLoading && slots.length > 0 && (
              <div className="form-group">
                <label>Time *</label>
                <div className="chip-group">
                  {slots.map(slot => (
                    <button key={slot.start_time} type="button" className={`chip ${selectedSlot === slot.start_time ? 'chip-active' : ''}`} onClick={() => setSelectedSlot(slot.start_time)}>
                      {slot.start_time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!slotsLoading && serviceId && date && slots.length === 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}>No slots available on this date.</p>
            )}
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving || !customerName || !customerPhone || !serviceId || !date || !selectedSlot}>
            {saving ? 'Creating...' : 'Create Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminNewBookingPage;
