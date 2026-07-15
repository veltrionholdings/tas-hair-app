import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Booking, isAuthenticated } from '../api/client';
import './MyBookingsPage.css';

function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login', { state: { returnTo: '/my-bookings' } }); return; }
    loadBookings();
  }, []);

  async function loadBookings() {
    try { setLoading(true); const result = await api.getBookings(); setBookings(result.data); }
    catch { setBookings([]); }
    finally { setLoading(false); }
  }

  async function handleConfirmCancel() {
    if (!cancellingId) return;
    try {
      await api.cancelBooking(cancellingId, cancelReason || 'Customer cancelled');
      setBookings(prev => prev.map(b => b.id === cancellingId ? { ...b, status: 'cancelled' } : b));
    } catch (err: any) {
      // Show the actual error to the user
      const msg = err?.message || 'Unable to cancel. Please contact the salon.';
      alert(msg);
    }
    finally { setCancellingId(null); setCancelReason(''); }
  }

  function formatBookingDate(isoString: string): string {
    try { return new Date(isoString).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch { return isoString; }
  }

  function formatBookingTime(localTime: string | undefined): string {
    if (!localTime) return '';
    if (localTime.includes('T')) return localTime.split('T')[1]?.substring(0, 5) || localTime;
    return localTime.substring(0, 5);
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'badge-confirmed';
      case 'pending': return 'badge-pending';
      case 'completed': return 'badge-completed';
      case 'cancelled': case 'no_show': return 'badge-cancelled';
      default: return '';
    }
  }

  function getServiceId(booking: Booking): string {
    if (typeof booking.service === 'object' && booking.service) return booking.service.id;
    return booking.service_id || '';
  }

  function getServiceName(booking: Booking): string {
    if (typeof booking.service === 'object' && booking.service) return booking.service.name;
    return 'Appointment';
  }

  // Split into upcoming and past
  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show');

  if (loading) {
    return (
      <div className="page my-bookings-page"><div className="container">
        <div className="page-header"><h1>My Bookings</h1><p>Your appointments</p></div>
        <div className="loading-state"><div className="loading-shimmer" /><div className="loading-shimmer" /></div>
      </div></div>
    );
  }

  return (
    <div className="page my-bookings-page">
      <div className="container">
        <div className="page-header"><h1>My Bookings</h1></div>

        {bookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No bookings yet</h3>
            <p>Book your first appointment to get started.</p>
            <Link to="/book" className="btn btn-primary" style={{ marginTop: '1rem' }}>Book Now</Link>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <h3 className="section-title">Upcoming</h3>
            <div className="bookings-list">
              {upcoming.map(booking => (
                <div key={booking.id} className="booking-card card">
                  <div className="booking-card-header">
                    <h3>{getServiceName(booking)}</h3>
                    <span className={`badge ${getStatusBadgeClass(booking.status)}`}>{booking.status}</span>
                  </div>
                  <div className="booking-card-details">
                    <div className="booking-detail"><span className="detail-icon">📅</span><span>{formatBookingDate(booking.start_time)}</span></div>
                    <div className="booking-detail"><span className="detail-icon">🕐</span><span>{formatBookingTime(booking.start_time_local || booking.start_time)}{(booking.end_time_local || booking.end_time) && ` – ${formatBookingTime(booking.end_time_local || booking.end_time)}`}</span></div>
                    {booking.resource && typeof booking.resource === 'object' && <div className="booking-detail"><span className="detail-icon">💇‍♀️</span><span>{booking.resource.name}</span></div>}
                  </div>
                  <button className="btn-cancel" onClick={() => setCancellingId(booking.id)}>Cancel Booking</button>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Link to={`/book?service=${getServiceId(booking)}&reschedule=${booking.id}`} className="btn-rebook" style={{ flex: 1, textAlign: 'center' }}>Change Time</Link>
                    <Link to={`/book?reschedule=${booking.id}`} className="btn-rebook" style={{ flex: 1, textAlign: 'center' }}>Change Service</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Past</h3>
            <div className="bookings-list">
              {past.map(booking => (
                <div key={booking.id} className="booking-card card">
                  <div className="booking-card-header">
                    <h3>{getServiceName(booking)}</h3>
                    <span className={`badge ${getStatusBadgeClass(booking.status)}`}>{booking.status}</span>
                  </div>
                  <div className="booking-card-details">
                    <div className="booking-detail"><span className="detail-icon">📅</span><span>{formatBookingDate(booking.start_time)}</span></div>
                    {booking.resource && typeof booking.resource === 'object' && <div className="booking-detail"><span className="detail-icon">💇‍♀️</span><span>{booking.resource.name}</span></div>}
                  </div>
                  {booking.status === 'completed' && getServiceId(booking) && (
                    <Link to={`/book?service=${getServiceId(booking)}`} className="btn-rebook">Book Again</Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cancel Modal with Reason */}
      {cancellingId && (
        <div className="modal-backdrop" onClick={() => setCancellingId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Cancel Booking</h3>
            <p className="modal-message">Are you sure you want to cancel this appointment?</p>
            <div className="form-group">
              <label>Reason (optional)</label>
              <select className="form-input" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                <option value="">Select a reason...</option>
                <option value="Schedule conflict">Schedule conflict</option>
                <option value="Feeling unwell">Feeling unwell</option>
                <option value="Found alternative">Found alternative</option>
                <option value="Change of plans">Change of plans</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary modal-btn" onClick={() => { setCancellingId(null); setCancelReason(''); }}>Keep Booking</button>
              <button className="btn btn-primary modal-btn modal-btn-danger" onClick={handleConfirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookingsPage;
