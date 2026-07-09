import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Booking } from '../../api/client';
import './AdminPages.css';

function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { if (id) loadCustomer(); }, [id]);

  async function loadCustomer() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers/${id}/export`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setBookings(data.bookings);
        setNotes(data.customer.notes || '');
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSaveNotes() {
    if (!id) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ notes }),
        }
      );
      if (response.ok) {
        setEditingNotes(false);
        setMessage('Notes saved.');
        const updated = await response.json();
        setCustomer(updated);
      }
    } catch { setMessage('Error saving notes.'); }
    finally { setSaving(false); }
  }

  function formatDate(isoString: string): string {
    try { return new Date(isoString).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return isoString; }
  }

  function getStatusColor(status: string): string {
    if (status === 'confirmed') return 'badge-confirmed';
    if (status === 'completed') return 'badge-completed';
    if (status === 'cancelled' || status === 'no_show') return 'badge-cancelled';
    return 'badge-pending';
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="loading-shimmer" style={{ height: 200 }} /></div></div>;
  }

  if (!customer) {
    return <div className="page admin-page"><div className="container"><p>Customer not found.</p></div></div>;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>{customer.first_name} {customer.last_name}</h1></div>

        {message && <div className="success-banner" style={{ marginBottom: '1rem' }}>{message}</div>}

        {/* Customer info */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
            {customer.email && <span>✉️ {customer.email}</span>}
            {customer.phone && <span>📞 {customer.phone}</span>}
            <span style={{ color: 'var(--color-grey)', fontSize: '0.75rem' }}>Customer since {formatDate(customer.created_at)}</span>
          </div>
        </div>

        {/* Staff notes */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600 }}>Staff Notes</h3>
            {!editingNotes && <button className="btn-small btn-activate" onClick={() => setEditingNotes(true)}>Edit</button>}
          </div>
          {editingNotes ? (
            <>
              <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Preferences, allergies, notes for staff..." />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn-small btn-suspend" onClick={() => { setEditingNotes(false); setNotes(customer.notes || ''); }}>Cancel</button>
                <button className="btn-small btn-complete" onClick={handleSaveNotes} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: notes ? 'var(--color-black)' : 'var(--color-grey)', fontStyle: notes ? 'normal' : 'italic' }}>
              {notes || 'No notes yet. Add preferences, allergies, or reminders for staff.'}
            </p>
          )}
        </div>

        {/* Booking history */}
        <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Booking History ({bookings.length})
        </h3>
        {bookings.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-grey)' }}>No bookings yet.</p>
        ) : (
          <div className="staff-list">
            {bookings.map(booking => (
              <div key={booking.id} className="staff-card card">
                <div className="staff-info">
                  <div className="staff-name">{formatDate(booking.start_time)}</div>
                  <div className="staff-email">{typeof booking.service === 'object' ? booking.service.name : 'Appointment'}</div>
                </div>
                <div className="staff-meta">
                  <span className={`badge ${getStatusColor(booking.status)}`}>{booking.status}</span>
                </div>
                {booking.status === 'completed' && typeof booking.service === 'object' && (
                  <div className="staff-actions">
                    <a href={`/admin/new-booking?service=${booking.service.id}&customer=${customer.first_name}+${customer.last_name}&phone=${customer.phone || ''}&email=${customer.email || ''}`} className="btn-small btn-activate" style={{ textDecoration: 'none' }}>
                      Book Again
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomerDetailPage;
