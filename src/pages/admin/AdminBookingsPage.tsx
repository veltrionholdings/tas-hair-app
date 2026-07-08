import { useState, useEffect } from 'react';
import { api, Booking } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('confirmed');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'noshow' | 'cancel' | null>(null);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      setLoading(true);
      const result = await api.getBookings(filter ? { status: filter } : undefined);
      setBookings(result.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(isoString: string): string {
    try {
      return new Date(isoString).toLocaleDateString('en-ZA', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch { return isoString; }
  }

  function formatTime(isoString: string | undefined): string {
    if (!isoString) return '';
    if (isoString.includes('T')) {
      return isoString.split('T')[1]?.substring(0, 5) || '';
    }
    return isoString.substring(0, 5);
  }

  function getCustomerName(booking: Booking): string {
    if (typeof booking.customer === 'object' && booking.customer) {
      return `${booking.customer.first_name} ${booking.customer.last_name}`;
    }
    return 'Customer';
  }

  async function handleAction() {
    if (!actionId || !actionType) return;
    try {
      if (actionType === 'complete') await api.completeBooking(actionId);
      else if (actionType === 'noshow') await api.noShowBooking(actionId);
      else if (actionType === 'cancel') await api.cancelBooking(actionId, 'Cancelled by admin');
    } catch { /* ignore */ }
    setActionId(null);
    setActionType(null);
    await loadBookings();
  }

  async function handleReschedule() {
    if (!rescheduleId || !newDateTime) return;
    try {
      await api.rescheduleBooking(rescheduleId, newDateTime);
      setRescheduleId(null);
      setNewDateTime('');
      await loadBookings();
    } catch { /* ignore */ }
  }

  const todayBookings = bookings.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.start_time.startsWith(today);
  });

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Bookings</h1>
        </div>

        {/* Today's summary */}
        {filter === 'confirmed' && todayBookings.length > 0 && (
          <div className="today-summary card">
            <h3>Today — {todayBookings.length} appointment{todayBookings.length > 1 ? 's' : ''}</h3>
            <div className="today-list">
              {todayBookings.map(b => (
                <div key={b.id} className="today-item">
                  <span className="today-time">{formatTime(b.start_time_local || b.start_time)}</span>
                  <span className="today-detail">
                    {typeof b.service === 'object' ? b.service.name : 'Appointment'} — {getCustomerName(b)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="filter-tabs">
          {['confirmed', 'pending', 'completed', 'cancelled', 'no_show', ''].map(s => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Reschedule modal */}
        {rescheduleId && (
          <div className="modal-backdrop" onClick={() => setRescheduleId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Reschedule Booking</h3>
              <p className="modal-message">Select a new date and time:</p>
              <div className="form-group">
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newDateTime}
                  onChange={e => setNewDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary modal-btn" onClick={() => setRescheduleId(null)}>Cancel</button>
                <button className="btn btn-primary modal-btn" onClick={handleReschedule} disabled={!newDateTime}>Reschedule</button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings list */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-shimmer" style={{ height: 100 }} />
            <div className="loading-shimmer" style={{ height: 100 }} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>No {filter || ''} bookings</p>
          </div>
        ) : (
          <div className="admin-bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="admin-booking-card card">
                <div className="admin-booking-header">
                  <span className="admin-booking-service">
                    {typeof booking.service === 'object' ? booking.service.name : 'Appointment'}
                  </span>
                  <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                </div>
                <div className="admin-booking-details">
                  <span>📅 {formatDate(booking.start_time)} at {formatTime(booking.start_time_local || booking.start_time)}</span>
                  {booking.resource && typeof booking.resource === 'object' && (
                    <span>💇‍♀️ {booking.resource.name}</span>
                  )}
                </div>
                <div className="admin-booking-customer">
                  <span>👤 {getCustomerName(booking)}</span>
                  {typeof booking.customer === 'object' && booking.customer && (
                    <span className="customer-contact">
                      {(booking.customer as any).phone || (booking.customer as any).email || ''}
                    </span>
                  )}
                </div>
                {booking.status === 'confirmed' && (
                  <div className="admin-booking-actions">
                    <button className="btn-small btn-complete" onClick={() => { setActionId(booking.id); setActionType('complete'); }}>Complete</button>
                    <button className="btn-small btn-noshow" onClick={() => { setActionId(booking.id); setActionType('noshow'); }}>No Show</button>
                    <button className="btn-small btn-reschedule" onClick={() => setRescheduleId(booking.id)}>Reschedule</button>
                    <button className="btn-small btn-delete" onClick={() => { setActionId(booking.id); setActionType('cancel'); }}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={actionId !== null}
        title={actionType === 'complete' ? 'Complete Booking' : actionType === 'noshow' ? 'Mark No Show' : 'Cancel Booking'}
        message={actionType === 'cancel' ? 'Are you sure you want to cancel this booking?' : `Mark this booking as ${actionType}?`}
        confirmLabel={actionType === 'cancel' ? 'Cancel Booking' : 'Confirm'}
        cancelLabel="Go Back"
        onConfirm={handleAction}
        onCancel={() => { setActionId(null); setActionType(null); }}
      />
    </div>
  );
}

export default AdminBookingsPage;
