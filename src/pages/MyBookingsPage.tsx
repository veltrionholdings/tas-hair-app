import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Booking, isAuthenticated } from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import './MyBookingsPage.css';

function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnTo: '/my-bookings' } });
      return;
    }
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      const result = await api.getBookings();
      setBookings(result.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancellingId) return;
    try {
      await api.cancelBooking(cancellingId, 'Customer requested cancellation');
      setBookings(prev => prev.map(b =>
        b.id === cancellingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch {
      // Could show an error toast here
    } finally {
      setCancellingId(null);
    }
  }

  function formatBookingDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-ZA', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoString;
    }
  }

  function formatBookingTime(localTime: string | undefined): string {
    if (!localTime) return '';
    if (localTime.includes('T')) {
      return localTime.split('T')[1]?.substring(0, 5) || localTime;
    }
    return localTime.substring(0, 5);
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'badge-confirmed';
      case 'pending': return 'badge-pending';
      case 'completed': return 'badge-completed';
      case 'cancelled': return 'badge-cancelled';
      case 'no_show': return 'badge-cancelled';
      default: return '';
    }
  }

  if (loading) {
    return (
      <div className="page my-bookings-page">
        <div className="container">
          <div className="page-header">
            <h1>My Bookings</h1>
            <p>Your upcoming appointments</p>
          </div>
          <div className="loading-state">
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page my-bookings-page">
      <div className="container">
        <div className="page-header">
          <h1>My Bookings</h1>
          <p>Your upcoming appointments</p>
        </div>

        {bookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No bookings yet</h3>
            <p>Book your first appointment to get started.</p>
            <Link to="/book" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Book Now
            </Link>
          </div>
        )}

        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card card">
              <div className="booking-card-header">
                <h3>{typeof booking.service === 'object' ? booking.service?.name : 'Appointment'}</h3>
                <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <div className="booking-card-details">
                <div className="booking-detail">
                  <span className="detail-icon">📅</span>
                  <span>{formatBookingDate(booking.start_time)}</span>
                </div>
                <div className="booking-detail">
                  <span className="detail-icon">🕐</span>
                  <span>
                    {formatBookingTime(booking.start_time_local || booking.start_time)}
                    {(booking.end_time_local || booking.end_time) && ` – ${formatBookingTime(booking.end_time_local || booking.end_time)}`}
                  </span>
                </div>
                {booking.resource && typeof booking.resource === 'object' && (
                  <div className="booking-detail">
                    <span className="detail-icon">💇‍♀️</span>
                    <span>{booking.resource.name}</span>
                  </div>
                )}
              </div>
              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <button
                  className="btn-cancel"
                  onClick={() => setCancellingId(booking.id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={cancellingId !== null}
        title="Cancel Booking"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Booking"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingId(null)}
      />
    </div>
  );
}

export default MyBookingsPage;
